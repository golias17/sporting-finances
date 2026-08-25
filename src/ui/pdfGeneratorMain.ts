import { jsPDF } from "jspdf";
import { state } from "../core/state.js";
import {
  revenueGrowthPct,
  consecutiveProfitableYears,
  } from "../features/financialMetrics.js";
import {
  fmtM,
  getBase64ImageFromUrl,
} from "./pdfHelpers.js";
import { buildPdfContext } from "./pdfLayout.js";
import { drawCoverPage } from "./pdfCoverPage.js";
import { drawFinancialTablesPage } from "./pdfFinancialTables.js";
import { drawTradingCashFlowPage } from "./pdfTradingCashFlow.js";
import {
  drawStrategicFinancingPage,
  drawTurnaroundMilestonesPage,
} from "./pdfFinancingTimeline.js";
import { drawCompetitiveBenchmarkPage } from "./pdfCompetitive.js";
import { drawTransfersLedgerPages } from "./pdfTransfersLedger.js";
import type {
  GeneratePdfOptions,
  } from "./pdfTypes.js";

export async function generateCuratedPdf(options: GeneratePdfOptions = {}) {
  const {
    lang = state.isPt ? "pt" : "en",
    pages: requestedPages = [true, true, true, true, true, true, true],
    executiveNote = "",
  } = options;
  if (!state.DATASET) return;

  const hasTransferLedger =
    Array.isArray(state.TRANSFER_LEDGER) && state.TRANSFER_LEDGER.length > 0;
  const pages = [...requestedPages];

  // Adjust transfer ledger page flag if ledger data is unavailable
  const transferLedgerIndex = pages.length > 6 ? 6 : pages.length - 1;
  if (pages[transferLedgerIndex] && !hasTransferLedger) {
    pages[transferLedgerIndex] = false;
  }

  // Load the brand logo
  let logoBase64 = null;
  try {
    logoBase64 = await getBase64ImageFromUrl("./assets/LOGO.png");
  } catch (e) {
    console.error("Failed to load logo image", e);
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const isPt = lang === "pt";
  const data = state.fullAnnual;
  if (!data) return;

  const totalPages =
    pages.slice(0, 6).filter(Boolean).length + (pages[6] ? 2 : 0);
  if (totalPages === 0) return;

  const ctx = buildPdfContext({
    doc,
    isPt,
    data,
    logoBase64: logoBase64 as string | null,
    totalPages,
  });
  const { latestSeason } = ctx;

  const revGrowthPct = revenueGrowthPct(data, data.length - 1);
  const revGrowthLabel = isPt
    ? revGrowthPct !== null
      ? `Crescimento sustentável de ${revGrowthPct}%`
      : "Sem dados suficientes para calcular a tendência"
    : revGrowthPct !== null
      ? `Sustainable ${revGrowthPct}% growth trend`
      : "Not enough seasons to compute a trend";

  const consecutiveProfitable = consecutiveProfitableYears(
    data,
    data.length - 1,
  );
  const netResultLabel = isPt
    ? consecutiveProfitable > 1
      ? `${consecutiveProfitable}º ano consecutivo com lucros`
      : consecutiveProfitable === 1
        ? "Ano com lucros"
        : "Ano de prejuízo"
    : consecutiveProfitable > 1
      ? `${consecutiveProfitable} consecutive profitable years`
      : consecutiveProfitable === 1
        ? "Profitable year"
        : "Loss-making year";

  const equityVal = latestSeason.equity || 0;
  const equityLabel = isPt
    ? equityVal > 0
      ? "Balanço revertido a positivo"
      : `Ainda negativo — défice de ${fmtM(equityVal)}`
    : equityVal > 0
      ? "Balance sheet restored to positive"
      : `Still negative — deficit of ${fmtM(equityVal)}`;

  if (pages[0]) {
    drawCoverPage(ctx, {
      revGrowthLabel,
      netResultLabel,
      equityLabel,
      executiveNote,
    });
  }
  if (pages[1]) {
    drawFinancialTablesPage(ctx);
  }
  if (pages[2]) {
    drawTradingCashFlowPage(ctx);
  }
  if (pages[3]) {
    drawStrategicFinancingPage(ctx);
  }
  if (pages[4]) {
    drawTurnaroundMilestonesPage(ctx);
  }
  if (pages[5]) {
    drawCompetitiveBenchmarkPage(ctx);
  }
  if (pages[6]) {
    drawTransfersLedgerPages(ctx);
  }

  // Save Document if any pages were rendered
  if (ctx.pageCounter.count > 0) {
    doc.save("Sporting_SAD_Financial_Dossier.pdf");
  }
}
