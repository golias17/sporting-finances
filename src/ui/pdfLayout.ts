import { jsPDF } from "jspdf";
import { state } from "../core/state.js";
import type { PdfContext, ColorPalette, AnnualData } from "./pdfTypes.js";
import { getBrandColors, hexToRgbArray } from "../charts/chartUtils.js";
import { getLatestH1Data } from "../features/financialMetrics.js";

export function buildPdfContext({
  doc,
  isPt,
  data,
  logoBase64,
  totalPages,
}: {
  doc: jsPDF;
  isPt: boolean;
  data: AnnualData[];
  logoBase64: string | null;
  totalPages: number;
}): PdfContext {
  const brand = getBrandColors(false);
  const colors: ColorPalette = {
    green: hexToRgbArray(brand.green) as [number, number, number],
    gold: hexToRgbArray(brand.gold) as [number, number, number],
    darkInk: hexToRgbArray(brand.ink) as [number, number, number],
    mutedText: hexToRgbArray(brand.muted) as [number, number, number],
    positive: hexToRgbArray(brand.pos) as [number, number, number],
    negative: hexToRgbArray(brand.neg) as [number, number, number],
    lightGreyBg: [248, 249, 250],
  };

  // Use the most recent *complete* season in annual_data (the in-progress
  // H1 snapshot lives separately in state.DATASET.h1_* and isn't a full FY).
  // Previously this searched for the literal label "2024/25" and fell back
  // to data[data.length - 2] — once a real 2025/26 full-season entry lands
  // in annual_data, that old logic would still find "2024/25" and pin the
  // report to a stale season forever instead of picking up the new one.
  const latestSeason = data[data.length - 1] || {};
  const firstSeason = data[0] || {};
  const h1Data = getLatestH1Data(state.DATASET);
  // The dossier's date range subtitle covers the full annual history plus
  // whatever in-progress H1 snapshot is available, computed instead of
  // hardcoded so it doesn't need a manual edit every season.
  const rangeEndLabel = h1Data?.label || latestSeason.label || "";

  // Header & Footer Helper across Pages
  const addHeader = (pageNum: number) => {
    doc.setFillColor(...colors.green);
    doc.rect(15, 12, 180, 4, "F");

    doc.setFillColor(...colors.gold);
    doc.rect(15, 16, 180, 1.5, "F");

    let textStartX = 15;
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", 15, 20, 10, 10);
      textStartX = 28;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(...colors.green);
    doc.text(
      isPt
        ? "SPORTING CLUBE DE PORTUGAL - FUTEBOL, SAD"
        : "SPORTING CLUBE DE PORTUGAL - FUTEBOL, SAD",
      textStartX,
      26,
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...colors.mutedText);
    doc.text(
      isPt
        ? `Relatório de Evolução Financeira · ${firstSeason.label || "2010/11"} a ${rangeEndLabel}`
        : `Financial Evolution Dossier · ${firstSeason.label || "2010/11"} to ${rangeEndLabel}`,
      textStartX,
      31,
    );

    doc.setDrawColor(220, 224, 222);
    doc.line(15, 34, 195, 34);

    // Running Footer
    doc.setDrawColor(220, 224, 222);
    doc.line(15, 283, 195, 283);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...colors.mutedText);
    doc.text(
      isPt
        ? "Documento Oficial de Análise Financeira · Sporting SAD (Euronext: SCP) · Fonte: CMVM"
        : "Official Financial Analysis Dossier · Sporting SAD (Euronext: SCP) · Source: CMVM Filings",
      15,
      287,
    );

    const pageStr = isPt
      ? `Página ${pageNum} de ${totalPages}`
      : `Page ${pageNum} of ${totalPages}`;
    doc.text(pageStr, 175, 287);
  };

  const pageCounter = { count: 0 };
  const startNewPage = () => {
    pageCounter.count++;
    if (pageCounter.count > 1) {
      doc.addPage();
    }
    addHeader(pageCounter.count);
  };

  return {
    doc,
    isPt,
    data,
    colors,
    firstSeason,
    latestSeason,
    startNewPage,
    pageCounter,
  };
}
