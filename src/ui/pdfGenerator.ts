// PDF Generator — barrel file
// Re-exports all public symbols from the split modules so existing
// consumers (19 files across src/ and tests/) keep working unchanged.
export * from "./pdfTypes.js";
export {
  fmtM,
  signColorCell,
  thresholdColorCell,
  combineCellColorers,
  getBase64ImageFromUrl,
} from "./pdfHelpers.js";
export { buildPdfContext } from "./pdfLayout.js";
export { drawCoverPage } from "./pdfCoverPage.js";
export { drawFinancialTablesPage } from "./pdfFinancialTables.js";
export { drawTradingCashFlowPage } from "./pdfTradingCashFlow.js";
export { drawFinancingTimelinePage } from "./pdfFinancingTimeline.js";
export { drawTransfersLedgerPages } from "./pdfTransfersLedger.js";
export { generateCuratedPdf } from "./pdfGeneratorMain.js";
