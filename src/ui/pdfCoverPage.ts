import autoTable from "jspdf-autotable";
import { state } from "../core/state.js";
import { getBrandColors, hexToRgbArray } from "../charts/chartUtils.js";
import { fmtM, signColorCell, thresholdColorCell, combineCellColorers } from "./pdfHelpers.js";
import type { PdfContext, ColorPalette, SummaryLabels } from "./pdfTypes.js";
import { getLatestH1Data, revenueGrowthPct, consecutiveProfitableYears, netDebt } from "../features/financialMetrics.js";

// ==========================================================
// PAGE 1: TITLE, SUMMARY, AND EXECUTIVE KPI GRID
// ==========================================================
export function drawCoverPage(
  ctx: PdfContext,
  { revGrowthLabel, netResultLabel, equityLabel, executiveNote }: SummaryLabels,
) {
  const { doc, isPt, colors, firstSeason, latestSeason, startNewPage } = ctx;
  startNewPage();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(...colors.darkInk);
  doc.text(
    isPt
      ? "DOSSIER ANUAL DE ANÁLISE FINANCEIRA"
      : "ANNUAL FINANCIAL ANALYSIS DOSSIER",
    15,
    48,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...colors.gold);
  doc.text(
    isPt
      ? "Turnaround Estrutural, Reestruturação de Dívida e Avaliação de Ativos"
      : "Structural Turnaround, Debt Restructuring & Asset Appraisals",
    15,
    54,
  );

  // Narrative Background Box
  doc.setFillColor(...colors.lightGreyBg);
  doc.rect(15, 60, 180, 43, "F");
  doc.setDrawColor(...colors.green);
  doc.line(15, 60, 15, 103);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...colors.green);
  doc.text(
    isPt
      ? "ENQUADRAMENTO FINANCEIRO E HISTÓRICO"
      : "HISTORICAL & FINANCIAL CONTEXT",
    20,
    66,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.darkInk);

  const introText = isPt
    ? "Este dossier apresenta uma análise exaustiva da transformação financeira operada na Sporting SAD durante a última década. Em 2013, o clube enfrentava uma das piores crises da sua história, caracterizada por insolvência técnica, incapacidade estrutural de gerar fluxos de caixa recorrentes e um passivo de curto prazo asfixiante. Através da implementação de um rigoroso plano de reestruturação — com especial destaque para a emissão e posterior conversão de €135M em obrigações convertíveis (VMOCs), bem como a valorização do talento desportivo proveniente da Academia de Alcochete —, a SAD alcançou a auto-suficiência e estabilidade. A emissão obrigacionista USPP de €225M a 28 anos conclui esta reabilitação, dotando a instituição de uma de maturidade de passivo sem precedentes no desporto nacional."
    : "This dossier presents a detailed analysis of the financial transformation executed by Sporting SAD over the past decade. In 2013, the club stood on the brink of liquidation, characterized by negative shareholders' equity, chronic operating deficits, and a suffocating current debt burden. By executing a rigorous turnaround plan—anchored by the issuance and subsequent conversion of €135M convertible bonds (VMOCs) and the commercial exploitation of home-grown academy players—the SAD secured a sustainable financial footing. The historic €225M 28-year USPP bond placement seals this rehabilitation, extending the average maturity profile to levels unprecedented in national sports finance.";

  const splitIntro = doc.splitTextToSize(introText, 170);
  doc.text(splitIntro, 20, 72);

  // KPI Grid
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...colors.green);
  doc.text(
    isPt
      ? `Indicadores Financeiros Chave (Consolidado ${latestSeason.label || ""})`
      : `Key Financial Indicators (Consolidated ${latestSeason.label || ""})`,
    15,
    112,
  );

  const drawKpi = (
    x: number,
    y: number,
    w: number,
    h: number,
    labelText: string,
    value: string | number,
    trendText: string,
  ) => {
    doc.setFillColor(...colors.lightGreyBg);
    doc.rect(x, y, w, h, "F");
    doc.setDrawColor(220, 222, 221);
    doc.rect(x, y, w, h, "D");
    doc.setFillColor(...colors.green);
    doc.rect(x, y, w, 2, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.mutedText);
    doc.text(labelText, x + 4, y + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...colors.darkInk);
    doc.text(value, x + 4, y + 15);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(...colors.green);
    doc.text(trendText, x + 4, y + 21);
  };

  const kw = 86;
  const kh = 25;
  drawKpi(
    15,
    118,
    kw,
    kh,
    isPt ? "RECEITAS OPERACIONAIS RECORRENTES" : "RECURRING OPERATING REVENUE",
    fmtM(latestSeason.revenue_operating),
    revGrowthLabel,
  );
  drawKpi(
    109,
    118,
    kw,
    kh,
    isPt ? "RESULTADO LÍQUIDO DO EXERCÍCIO" : "NET PROFIT / LOSS",
    fmtM(latestSeason.net_result),
    netResultLabel,
  );
  drawKpi(
    15,
    148,
    kw,
    kh,
    isPt ? "CAPITAIS PRÓPRIOS DO BALANÇO" : "SHAREHOLDERS' EQUITY",
    fmtM(latestSeason.equity),
    equityLabel,
  );

  const nd = netDebt(latestSeason);
  // revenue_operating is the divisor here — if it's ever 0/null/undefined
  // (e.g. an in-progress season with no revenue booked yet), nd / 0 is NaN
  // or Infinity, which used to print literally as "NaN x"/"Infinity x" in
  // the exported PDF, and worse, every ndRatio < N comparison below is
  // false for NaN, so it fell through to the red "risk zone" label — an
  // actively wrong claim for missing data, not just a cosmetic glitch.
  const hasRevenue = !!latestSeason.revenue_operating;
  const ndRatio = hasRevenue ? nd / latestSeason.revenue_operating : null;
  const ratioStr = hasRevenue ? ndRatio!.toFixed(2) + " x" : "—";
  // Same thresholds used by chartDebtLoad()/calculateHealthSignals() in the
  // dashboard (green < 1x, amber < 2x, red >= 2x) so the PDF caption always
  // agrees with what the app itself is showing for the same season.
  const ndRatioLabel = !hasRevenue
    ? isPt
      ? "Receita operacional indisponível"
      : "Operating revenue unavailable"
    : isPt
      ? ndRatio! < 1
        ? "Métrica de alavancagem saudável"
        : ndRatio! < 2
          ? "Alavancagem elevada — a acompanhar"
          : "Alavancagem em zona de risco"
      : ndRatio! < 1
        ? "Leverage below safety threshold"
        : ndRatio! < 2
          ? "Elevated leverage — worth watching"
          : "Leverage in the risk zone";
  drawKpi(
    109,
    148,
    kw,
    kh,
    isPt ? "DÍVIDA LÍQUIDA / RECEITAS" : "NET DEBT / REVENUE RATIO",
    ratioStr,
    ndRatioLabel,
  );

  // Editorial Analysis
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...colors.darkInk);

  // Equity figures are interpolated from the actual first/latest seasons
  // (rather than hardcoded "-119.4 M€ / +40.9 M€") so this paragraph stays
  // accurate as new seasons of data are added.
  const firstEquityStr = fmtM(firstSeason.equity);
  const latestEquityStr = fmtM(latestSeason.equity);
  let notesP1 = isPt
    ? `Análise de Turnaround:\nA inversão dos capitais próprios de ${firstEquityStr} para ${latestEquityStr} constitui o principal marco de segurança financeira. Esta variação foi viabilizada pelas sucessivas conversões de dívida em capital promovidas em parceria com os bancos credores, as quais extinguiram passivos passados sem consumo de tesouraria. Com as receitas comerciais em rota ascendente, a SAD apresenta uma capacidade acrescida de investimento no plantel e infraestruturas.`
    : `Turnaround Analysis:\nThe transition of shareholders' equity from ${firstEquityStr} to ${latestEquityStr} is the cornerstone of the club's financial recovery. This correction was achieved through negotiated debt conversions, which cleared liabilities without drawing down cash. Driven by growing commercial income, the SAD possesses solid cash generation capabilities, allowing it to invest independently in squad value and infrastructure development.`;

  if (executiveNote) {
    notesP1 += isPt
      ? `\n\nNota Executiva:\n${executiveNote}`
      : `\n\nExecutive Annotation:\n${executiveNote}`;
  }

  const splitNotesP1 = doc.splitTextToSize(notesP1, 180);
  doc.text(splitNotesP1, 15, 182);

  // Footer Accent Line
  doc.setFillColor(...colors.green);
  doc.rect(15, 220, 180, 0.5, "F");
}


