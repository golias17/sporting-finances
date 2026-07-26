import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { state } from "../core/state.js";
import { getBrandColors, hexToRgbArray } from "../charts/chartUtils.js";
import { getLatestH1Data, revenueGrowthPct, consecutiveProfitableYears, netDebt } from "../features/metrics.js";
import { fmtM, signColorCell, thresholdColorCell, combineCellColorers, getBase64ImageFromUrl } from "./pdfHelpers.js";
import { buildPdfContext } from "./pdfLayout.js";
import { drawCoverPage } from "./pdfCoverPage.js";
import { drawFinancialTablesPage } from "./pdfFinancialTables.js";
import { drawTradingCashFlowPage } from "./pdfTradingCashFlow.js";
import { drawFinancingTimelinePage } from "./pdfFinancingTimeline.js";
import { drawTransfersLedgerPages } from "./pdfTransfersLedger.js";
import type { AnnualData, SummaryLabels, GeneratePdfOptions, PdfContext, ColorPalette } from "./pdfTypes.js";
export async function generateCuratedPdf(options: GeneratePdfOptions = {}) {
  const {
    lang = state.isPt ? "pt" : "en",
    pages: requestedPages = [true, true, true, true, true],
    executiveNote = "",
  } = options;
  if (!state.DATASET) return;

  // pages[4] (transfers ledger) needs state.TRANSFER_LEDGER populated —
  // drawTransfersLedgerPages() below iterates it unconditionally and would
  // throw if it's unset. Force that page off here rather than letting it
  // throw partway through rendering (only state.DATASET is checked above),
  // and do it before totalPages is computed so the page-count/pagination
  // header ("Page X of Y") stays consistent with what's actually drawn —
  // copies the array rather than mutating the caller's `options.pages`.
  const hasTransferLedger =
    Array.isArray(state.TRANSFER_LEDGER) && state.TRANSFER_LEDGER.length > 0;
  const pages = [...requestedPages];
  if (pages[4] && !hasTransferLedger) {
    pages[4] = false;
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
    pages.slice(0, 4).filter(Boolean).length + (pages[4] ? 2 : 0);
  if (totalPages === 0) return;

  const ctx = buildPdfContext({ doc, isPt, data, logoBase64, totalPages });
  const { latestSeason } = ctx;

  // Same shared helper as the dashboard KPI strip (metrics.js), so the PDF
  // cover caption can never disagree with the on-screen number.
  const revGrowthPct = revenueGrowthPct(data, data.length - 1);
  const revGrowthLabel = isPt
    ? revGrowthPct !== null
      ? `Crescimento sustentável de ${revGrowthPct}%`
      : "Sem dados suficientes para calcular a tendência"
    : revGrowthPct !== null
      ? `Sustainable ${revGrowthPct}% growth trend`
      : "Not enough seasons to compute a trend";

  // Consecutive profitable seasons ending at the latest season — shared
  // helper, same reason as above.
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

  const equityLabel = isPt
    ? latestSeason.equity > 0
      ? "Balanço revertido a positivo"
      : `Ainda negativo — défice de ${fmtM(latestSeason.equity)}`
    : latestSeason.equity > 0
      ? "Balance sheet restored to positive"
      : `Still negative — deficit of ${fmtM(latestSeason.equity)}`;

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
    drawFinancingTimelinePage(ctx);
  }
  if (pages[4]) {
    drawTransfersLedgerPages(ctx);
  }

  // Save Document if any pages were rendered
  if (ctx.pageCounter.count > 0) {
    doc.save("Sporting_SAD_Financial_Dossier.pdf");
  }
}

