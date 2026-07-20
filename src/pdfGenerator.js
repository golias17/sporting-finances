import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { state } from "./state.js";
import {
  getLatestH1Data,
  revenueGrowthPct,
  consecutiveProfitableYears,
  netDebt,
} from "./metrics.js";
import { getBrandColors, hexToRgbArray } from "./chartUtils.js";

/**
 * Helper: Converts a relative image path to a Base64 data URL using a temporary canvas.
 */
function getBase64ImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      resolve(dataURL);
    };
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

// Format Helper: Millions with spaces before units. Shared by every page —
// a plain function (not a closure) so it doesn't need to be threaded
// through the page-drawing functions' context object. Exported (along with
// the three cell-colorer helpers below) purely so they're unit-testable in
// isolation — they're pure functions with no jsPDF/canvas dependency,
// unlike the page-drawing functions around them.
export function fmtM(val) {
  if (val === null || val === undefined) return "—";
  const sign = val < 0 ? "-" : "";
  return `${sign}${Math.abs(val / 1000).toFixed(1)} M€`;
}

// autoTable didParseCell helpers — each table below colors one or two
// "is this good or bad" columns red/green. These two shapes (fmtM's
// "-"-prefixed M€ strings, and parseInt'd percentage/multiple strings)
// used to be hand-copied at every call site (identically, in the "-"-prefix
// case) instead of shared, which is how the sign-based block ended up
// pasted verbatim at three different column indices.

// Colors a column red if its fmtM()-formatted value starts with "-",
// green if it's a genuine positive non-zero value, and leaves zero/"—"
// unstyled.
export function signColorCell(colIndex, colors) {
  return (cellData) => {
    if (cellData.section !== "body" || cellData.column.index !== colIndex)
      return;
    const val = cellData.cell.text[0];
    if (val && val.startsWith("-")) {
      cellData.cell.styles.textColor = colors.negative;
      cellData.cell.styles.fontStyle = "bold";
    } else if (val && val !== "—" && val !== "0.0 M€" && !val.startsWith("0")) {
      cellData.cell.styles.textColor = colors.positive;
      cellData.cell.styles.fontStyle = "bold";
    }
  };
}

// Colors a column based on a parseInt'd numeric threshold (a percentage or
// a "2.0x"-style multiple) — the caller supplies the red/green predicates,
// since the thresholds and their direction (higher-is-worse vs
// higher-is-better) differ per column.
export function thresholdColorCell(
  colIndex,
  { negativeIf, positiveIf },
  colors,
) {
  return (cellData) => {
    if (cellData.section !== "body" || cellData.column.index !== colIndex)
      return;
    const str = cellData.cell.text[0];
    if (!str || str === "—") return;
    const val = parseInt(str, 10);
    if (negativeIf(val)) {
      cellData.cell.styles.textColor = colors.negative;
      cellData.cell.styles.fontStyle = "bold";
    } else if (positiveIf(val)) {
      cellData.cell.styles.textColor = colors.positive;
      cellData.cell.styles.fontStyle = "bold";
    }
  };
}

// Combines several column-colorers (each already bound to a `colors`
// palette) into the single didParseCell callback autoTable expects.
export function combineCellColorers(...colorers) {
  return (cellData) => colorers.forEach((c) => c(cellData));
}

/**
 * Builds the shared context (doc handle, colors, formatted labels, and the
 * page-header/pagination helpers) passed to every drawPage*() function
 * below. Centralizing this avoids each page re-deriving the same "current
 * page number" state or re-declaring the same color constants.
 */
function buildPdfContext({ doc, isPt, data, logoBase64, totalPages }) {
  const brand = getBrandColors(false);
  // Colors matching corporate green/gold guidelines — derived from the same
  // canonical light-mode palette the live dashboard uses (chartUtils.js's
  // getBrandColors()), rather than a separate hand-picked RGB set. That
  // second copy had drifted from the app's actual palette (stale gold
  // #c8a951 vs the app's #b08923, and a "negative" red that didn't match
  // --neg at all) — this PDF export can no longer disagree with the
  // dashboard's colors.
  const colors = {
    green: hexToRgbArray(brand.green),
    gold: hexToRgbArray(brand.gold),
    darkInk: hexToRgbArray(brand.ink),
    mutedText: hexToRgbArray(brand.muted),
    positive: hexToRgbArray(brand.pos),
    negative: hexToRgbArray(brand.neg),
    lightGreyBg: [248, 249, 250], // #f8f9fa — PDF-only background tint, no app equivalent
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

  // Header Helper across Pages
  const addHeader = (pageNum) => {
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
    doc.setFontSize(11);
    doc.setTextColor(...colors.green);
    doc.text("SPORTING CLUBE DE PORTUGAL — FUTEBOL, SAD", textStartX, 26);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...colors.mutedText);
    doc.text(
      isPt
        ? `Relatório de Evolução Financeira · ${firstSeason.label || "2012/13"} a ${rangeEndLabel}`
        : `Financial Evolution Dossier · ${firstSeason.label || "2012/13"} to ${rangeEndLabel}`,
      textStartX,
      31,
    );

    const pageStr = isPt
      ? `Página ${pageNum} de ${totalPages}`
      : `Page ${pageNum} of ${totalPages}`;
    doc.setFontSize(8);
    doc.text(pageStr, 178, 31);

    doc.setDrawColor(220, 224, 222);
    doc.line(15, 34, 195, 34);
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

// ==========================================================
// PAGE 1: TITLE, SUMMARY, AND EXECUTIVE KPI GRID
// ==========================================================
function drawCoverPage(
  ctx,
  { revGrowthLabel, netResultLabel, equityLabel, executiveNote },
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

  const drawKpi = (x, y, w, h, labelText, value, trendText) => {
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
  const ratioStr = hasRevenue ? ndRatio.toFixed(2) + " x" : "—";
  // Same thresholds used by chartDebtLoad()/calculateHealthSignals() in the
  // dashboard (green < 1x, amber < 2x, red >= 2x) so the PDF caption always
  // agrees with what the app itself is showing for the same season.
  const ndRatioLabel = !hasRevenue
    ? isPt
      ? "Receita operacional indisponível"
      : "Operating revenue unavailable"
    : isPt
      ? ndRatio < 1
        ? "Métrica de alavancagem saudável"
        : ndRatio < 2
          ? "Alavancagem elevada — a acompanhar"
          : "Alavancagem em zona de risco"
      : ndRatio < 1
        ? "Leverage below safety threshold"
        : ndRatio < 2
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

// ==========================================================
// PAGE 2: TABLE 1 (REVENUES & WAGES) & TABLE 2 (BALANCE SHEET)
// ==========================================================
function drawFinancialTablesPage(ctx) {
  const { doc, isPt, data, colors, startNewPage } = ctx;
  startNewPage();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...colors.green);
  doc.text(
    isPt
      ? "I. Demonstração de Resultados Operacionais Recorrentes"
      : "I. Recurring Operating Revenues & Payroll Burden",
    15,
    44,
  );

  const t1Headers = isPt
    ? [
        "Época",
        "Bilheteira",
        "TV / Comp.",
        "Comercial",
        "Total Rec.",
        "Pessoal",
        "Rácio Sal.",
        "EBITDA",
        "Margem EBIT.",
      ]
    : [
        "Season",
        "Matchday",
        "TV/Comp.",
        "Commercial",
        "Rec. Rev",
        "Payroll",
        "Wage %",
        "EBITDA",
        "EBITDA %",
      ];

  const t1Rows = data.map((d) => {
    const ratioVal =
      d.revenue_operating > 0
        ? `${Math.round((Math.abs(d.personnel_costs) / d.revenue_operating) * 100)}%`
        : "—";
    const ebitda =
      d.operating_result_excl_players - d.squad_amortization_impairment;
    const ebitdaMargin =
      d.revenue_operating > 0
        ? `${Math.round((ebitda / d.revenue_operating) * 100)}%`
        : "—";
    return [
      d.label,
      fmtM(d.rev_matchday),
      fmtM(d.rev_tv_comp),
      fmtM(d.rev_commercial),
      fmtM(d.revenue_operating),
      fmtM(d.personnel_costs),
      ratioVal,
      fmtM(ebitda),
      ebitdaMargin,
    ];
  });

  autoTable(doc, {
    startY: 48,
    head: [t1Headers],
    body: t1Rows,
    margin: { left: 15, right: 15 },
    theme: "striped",
    headStyles: {
      fillColor: colors.green,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 7.5, textColor: colors.darkInk },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 15 },
      6: { halign: "center", cellWidth: 16 },
      8: { halign: "center", cellWidth: 20 },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      7: { halign: "right" },
    },
    didParseCell: combineCellColorers(
      // Wage ratio (col 6): higher is worse.
      thresholdColorCell(
        6,
        { negativeIf: (v) => v > 70, positiveIf: (v) => v <= 60 },
        colors,
      ),
      // EBITDA margin (col 8): higher is better.
      thresholdColorCell(
        8,
        { negativeIf: (v) => v < 10, positiveIf: (v) => v >= 20 },
        colors,
      ),
    ),
  });

  // Table 2 (Balance Sheet)
  const table1EndY = doc.lastAutoTable.finalY || 140;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...colors.green);
  doc.text(
    isPt
      ? "II. Estrutura do Balanço e Rácio de Alavancagem"
      : "II. Balance Sheet Structure & Leverage Metrics",
    15,
    table1EndY + 8,
  );

  const t2Headers = isPt
    ? [
        "Época",
        "Ativo Total",
        "Passivo Total",
        "Capitais Próp.",
        "Dívida Bruta",
        "Caixa",
        "Dívida Líq.",
        "Solvência",
        "Dív. Líq. / EBITDA",
      ]
    : [
        "Season",
        "Total Assets",
        "Total Liab.",
        "Equity",
        "Gross Debt",
        "Cash",
        "Net Debt",
        "Solvency",
        "Net Debt / EBITDA",
      ];

  const t2Rows = data.map((d) => {
    const grossDebt = d.borrowings_nc + d.borrowings_c;
    const netDebtVal = grossDebt - d.cash;
    const totalLiab = d.non_current_liabilities + d.current_liabilities;
    const solvency =
      d.total_assets > 0
        ? `${Math.round((d.equity / d.total_assets) * 100)}%`
        : "—";
    const ebitda =
      d.operating_result_excl_players - d.squad_amortization_impairment;
    const netDebtEbitda =
      ebitda > 0 ? `${(netDebtVal / ebitda).toFixed(1)}x` : "—";
    return [
      d.label,
      fmtM(d.total_assets),
      fmtM(totalLiab),
      fmtM(d.equity),
      fmtM(grossDebt),
      fmtM(d.cash),
      fmtM(netDebtVal),
      solvency,
      netDebtEbitda,
    ];
  });

  autoTable(doc, {
    startY: table1EndY + 12,
    head: [t2Headers],
    body: t2Rows,
    margin: { left: 15, right: 15 },
    theme: "striped",
    headStyles: {
      fillColor: colors.green,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 7.5, textColor: colors.darkInk },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 15 },
      7: { halign: "center", cellWidth: 16 },
      8: { halign: "center", cellWidth: 26 },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
    },
    didParseCell: combineCellColorers(
      signColorCell(3, colors),
      thresholdColorCell(
        7,
        { negativeIf: (v) => v < 0, positiveIf: (v) => v >= 15 },
        colors,
      ),
    ),
  });

  const table2EndY = doc.lastAutoTable.finalY || 220;

  // Render Vector-Drawn Shareholders' Equity Evolution Chart
  if (table2EndY <= 235) {
    const chartYStart = 236;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...colors.green);
    doc.text(
      isPt
        ? "Evolução do Capital Próprio do Balanço (M€)"
        : "Shareholders' Equity Evolution Trend (M€)",
      15,
      chartYStart,
    );

    const maxEquityAbs = Math.max(...data.map((d) => Math.abs(d.equity || 0)));
    const yZero = chartYStart + 32; // baseline for Y=0

    // Draw grid bounds
    doc.setFillColor(248, 249, 250);
    doc.rect(15, chartYStart + 4, 180, 42, "F");
    doc.setDrawColor(220, 222, 221);
    doc.rect(15, chartYStart + 4, 180, 42, "D");

    const barWidth = 8;
    const chartWidth = 170;
    // data.length - 1 is 0 (division by zero -> Infinity) if there's ever
    // exactly one season on record; that Infinity then multiplies by i=0
    // in the loop below (0 * Infinity = NaN), so even the single bar would
    // be drawn at a NaN x-position. Fall back to 0 spacing — with one bar
    // there's nothing to space out anyway.
    const barSpacing =
      data.length > 1
        ? (chartWidth - data.length * barWidth) / (data.length - 1)
        : 0;
    // maxEquityAbs is 0 if every season's equity is exactly 0 (or data is
    // empty) - val / 0 is NaN/Infinity for any nonzero val, or NaN for 0/0.
    // Guard so an all-zero dataset draws flat (zero-height) bars instead of
    // silently producing NaN rect() calls.
    const hasEquitySpread = maxEquityAbs > 0;

    for (let i = 0; i < data.length; i++) {
      const barX = 15 + 5 + i * (barWidth + barSpacing);
      const val = data[i].equity || 0;
      const barHeight = hasEquitySpread ? (val / maxEquityAbs) * 26 : 0; // max scale 26mm

      if (val >= 0) {
        const barY = yZero - barHeight;
        doc.setFillColor(...colors.positive);
        doc.rect(barX, barY, barWidth, barHeight, "F");
      } else {
        const absHeight = Math.abs(barHeight);
        doc.setFillColor(...colors.negative);
        doc.rect(barX, yZero, barWidth, absHeight, "F");
      }

      // Draw abbreviated year label
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...colors.mutedText);
      const yrShort = data[i].label.split("/")[0].slice(2);
      doc.text("'" + yrShort, barX + barWidth / 2, chartYStart + 40, {
        align: "center",
      });
    }

    // Gold zero line
    doc.setDrawColor(...colors.gold);
    doc.setLineWidth(0.4);
    doc.line(15, yZero, 195, yZero);
    doc.setLineWidth(0.2); // reset
  }
}

// ==========================================================
// PAGE 3: TABLE 3 (PLAYER TRADING) & TABLE 4 (CASH FLOWS)
// ==========================================================
function drawTradingCashFlowPage(ctx) {
  const { doc, isPt, data, colors, startNewPage } = ctx;
  startNewPage();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...colors.green);
  doc.text(
    isPt
      ? "III. Trading de Passes de Jogadores e Valorização do Plantel"
      : "III. Player Transfer Operations & Squad Appraisals",
    15,
    44,
  );

  const t3Headers = isPt
    ? [
        "Época",
        "Receitas Venda",
        "Investimento",
        "Resultado Líquido Trading",
        "V. Contabilístico",
        "V. Mercado",
      ]
    : [
        "Season",
        "Sales Income",
        "Investments",
        "Net Trading Result",
        "Book Value",
        "Market Value",
      ];

  const t3Rows = data.map((d) => {
    const netTradingVal = d.player_transfer_income + d.player_transfer_cost;
    return [
      d.label,
      fmtM(d.player_transfer_income),
      fmtM(d.player_transfer_cost),
      fmtM(netTradingVal),
      fmtM(d.squad_book_value),
      fmtM(d.squad_market_value),
    ];
  });

  autoTable(doc, {
    startY: 48,
    head: [t3Headers],
    body: t3Rows,
    margin: { left: 15, right: 15 },
    theme: "striped",
    headStyles: {
      fillColor: colors.green,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 7.5, textColor: colors.darkInk },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 16 },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
    didParseCell: signColorCell(3, colors),
  });

  // Table 4: Cash Flows
  const table3EndY = doc.lastAutoTable.finalY || 140;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...colors.green);
  doc.text(
    isPt
      ? "IV. Demonstração Histórica de Fluxos de Caixa"
      : "IV. Historical Cash Flow Statement",
    15,
    table3EndY + 10,
  );

  const t4Headers = isPt
    ? [
        "Época",
        "F.C. Operacional",
        "F.C. Investimento",
        "F.C. Financiamento",
        "Variação Líquida de Caixa",
      ]
    : [
        "Season",
        "Operating C.F.",
        "Investing C.F.",
        "Financing C.F.",
        "Net Cash Change",
      ];

  const t4Rows = data.map((d) => {
    const netChange = d.cf_operating + d.cf_investing + d.cf_financing;
    return [
      d.label,
      fmtM(d.cf_operating),
      fmtM(d.cf_investing),
      fmtM(d.cf_financing),
      fmtM(netChange),
    ];
  });

  autoTable(doc, {
    startY: table3EndY + 14,
    head: [t4Headers],
    body: t4Rows,
    margin: { left: 15, right: 15 },
    theme: "striped",
    headStyles: {
      fillColor: colors.green,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 7.5, textColor: colors.darkInk },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 20 },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    didParseCell: signColorCell(4, colors),
  });
}

// ==========================================================
// PAGE 4: TIMELINE & FINANCING DETAIL (OVERLAP FREE)
// ==========================================================
function drawFinancingTimelinePage(ctx) {
  const { doc, isPt, colors, startNewPage } = ctx;
  startNewPage();

  // Section: Strategic Financing Profile
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...colors.green);
  doc.text(
    isPt
      ? "V. Perfil dos Instrumentos de Financiamento Estratégico"
      : "V. Strategic Debt & Financing Instruments Profile",
    15,
    44,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.darkInk);

  const notesText = isPt
    ? "• VMOCs (Valores Mobiliários Obrigatoriamente Convertíveis): Emitidos na reestruturação de 2014 para adiar obrigações urgentes com o Novo Banco e o BCP. Em agosto de 2022 (83.6 M€) e dezembro de 2023 (51.4 M€), a quase totalidade foi convertida em ações da Sporting SAD pelo valor nominal de €1.00. Esta conversão de 135.0 M€ de dívida em capital anulou encargos com juros e extinguiu o passivo bancário legado bancário.\n\n• Lion Finance Securitizações: Operações Lion Finance I e II estruturadas para titularização e desconto de recebíveis futuros da NOS (direitos de transmissão de jogos). Funcionaram como principal fonte de liquidez de médio prazo na amortização de contas de curto prazo com fornecedores.\n\n• USPP Bond Placement (225.0 M€): Emitido em outubro de 2025 com maturidade a 28 anos e taxa fixa de 5.75%. Garantiu notação de grau de investimento (Investment Grade) inédita pela Fitch e DBRS. Os fundos destinam-se a reestruturar a dívida bancária sob juros variáveis e a financiar o desenvolvimento de infraestruturas no estádio Alvalade."
    : "• VMOCs (Mandatorily Convertible Bonds): Originally issued in 2014 as hybrid instruments to restructure heavy bank debt with BCP and Novo Banco. Under contractual parameters, 83.6 M€ converted to share capital in August 2022 and 51.4 M€ in December 2023 at €1.00 face value. This total 135.0 M€ debt-to-equity conversion deleted interest charges and restored positive equity.\n\n• Lion Finance Securitizations: Structured via special purpose vehicles (Lion Finance I and II) to discount future receivables from the long-term NOS broadcasting rights agreement, providing a regular liquidity stream to clear trade liabilities.\n• USPP Private Bond Placement (225.0 M€): Finalised in October 2025 with an unprecedented 28-year maturity and a 5.75% fixed coupon. Awarded BBB- investment-grade ratings by Fitch and DBRS, successfully refinancing bank debt and securing stable funding for infrastructural modernization at the Alvalade stadium.";

  const splitNotes = doc.splitTextToSize(notesText, 180);
  doc.text(splitNotes, 15, 50);

  // Dynamic Y offset for Timeline heading to prevent overlapping layout
  const notesHeight = splitNotes.length * 4.5;
  const timelineHeadingY = 54 + notesHeight;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...colors.green);
  doc.text(
    isPt
      ? "VI. Marcos Financeiros Cronológicos"
      : "VI. Chronological Turnaround Milestones",
    15,
    timelineHeadingY,
  );

  const timelineEvents = [
    {
      year: "2014",
      title: isPt
        ? "Acordo de Reestruturação Financeira"
        : "Financial Restructuring Agreement",
      desc: isPt
        ? "Consolidação de dívida urgente, securitização de contratos de TV e emissão inicial de VMOCs de 135.0 M€."
        : "Urgent debt consolidation, TV contract securitizations, and initial 135.0 M€ VMOC issuance to avoid default.",
    },
    {
      year: "2018",
      title: isPt
        ? "Crise de Alcochete e Perda de Ativos"
        : "Alcochete Crisis & Team Devaluation",
      desc: isPt
        ? "Desvalorização forçada do plantel motivada por saídas unilaterais de passes de jogadores."
        : "Unilateral player departures causing squad devaluations and significant asset impairment losses.",
    },
    {
      year: "2022-23",
      title: isPt
        ? "Conversão Financeira Completa"
        : "Full Equity Capital Crossover",
      desc: isPt
        ? "As duas tranches de VMOCs foram inteiramente convertidas, eliminando a insolvência técnica histórica."
        : "The conversion of the two tranches of VMOCs completed, permanently resolving the negative equity state.",
    },
    {
      year: "2025",
      title: isPt
        ? "Emissão Obligacionista USPP (225.0 M€)"
        : "Senior USPP Placement (225.0 M€)",
      desc: isPt
        ? "Notação de crédito BBB- (Grau de Investimento) a 28 anos, consolidando a estabilidade de passivos."
        : "Landmark 28-year private placement bond at 5.75% fixed coupon with BBB- investment-grade ratings.",
    },
  ];

  let currentY = timelineHeadingY + 7;
  timelineEvents.forEach((ev) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...colors.gold);
    doc.text(`[${ev.year}]`, 15, currentY);

    doc.setTextColor(...colors.darkInk);
    doc.text(ev.title, 35, currentY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...colors.mutedText);
    const splitDesc = doc.splitTextToSize(ev.desc, 155);
    doc.text(splitDesc, 35, currentY + 3.5);

    // Calculate height of description line dynamically to prevent overlaps
    currentY += 8 + splitDesc.length * 4;
  });
}

// ==========================================================
// PAGES 5-6: LANDMARK PLAYER TRANSFERS LEDGER (SALES & PURCHASES)
// ==========================================================
function drawTransfersLedgerPages(ctx) {
  const { doc, isPt, colors, startNewPage } = ctx;

  const cleanText = (str) => {
    if (!str) return "—";
    return str.replace(/≈/g, "~").replace(/≥/g, ">=").replace(/≤/g, "<=");
  };

  // Extract transfers >= 8M
  const salesLedger = [];
  const purchasesLedger = [];

  state.TRANSFER_LEDGER.forEach((seasonObj) => {
    const sLabel = seasonObj.season;
    if (seasonObj.sales) {
      seasonObj.sales.forEach((p) => {
        if (p.fee >= 10.0) {
          const rawNote = isPt ? p.note_pt || p.note : p.note;
          salesLedger.push({
            season: sLabel,
            player: p.player,
            club: p.club,
            fee: p.fee,
            commission: p.commission || 0,
            note: cleanText(rawNote),
          });
        }
      });
    }
    if (seasonObj.purchases) {
      seasonObj.purchases.forEach((p) => {
        if (p.fee >= 8.0) {
          const rawNote = isPt ? p.note_pt || p.note : p.note;
          purchasesLedger.push({
            season: sLabel,
            player: p.player,
            club: p.club,
            fee: p.fee,
            note: cleanText(rawNote),
          });
        }
      });
    }
  });

  // Sort Descending by Fee
  salesLedger.sort((a, b) => b.fee - a.fee);
  purchasesLedger.sort((a, b) => b.fee - a.fee);

  const topSales = salesLedger;
  const topPurchases = purchasesLedger;

  // PAGE 5: SALES
  startNewPage();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...colors.green);
  doc.text(
    isPt
      ? "VII-A. Livro de Transferências Históricas — Recordes de Saídas (Taxa Principal >= 10.0 M€)"
      : "VII-A. Landmark Player Transfers Ledger — Record Departures (Fee >= 10.0 M€)",
    15,
    44,
  );

  const t5SalesHeaders = isPt
    ? [
        "Época",
        "Jogador",
        "Clube de Destino",
        "Taxa Fixa",
        "Comissão",
        "Detalhes / Cláusulas",
      ]
    : [
        "Season",
        "Player",
        "Destination Club",
        "Fixed Fee",
        "Commission",
        "Notes & Clauses",
      ];

  const t5SalesRows = topSales.map((s) => [
    s.season,
    s.player,
    s.club,
    `${s.fee.toFixed(1)} M€`,
    s.commission > 0 ? `${s.commission.toFixed(1)} M€` : "—",
    s.note,
  ]);

  autoTable(doc, {
    startY: 48,
    head: [t5SalesHeaders],
    body: t5SalesRows,
    margin: { left: 15, right: 15 },
    theme: "striped",
    headStyles: {
      fillColor: colors.green,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    bodyStyles: { fontSize: 7, textColor: colors.darkInk, cellPadding: 1.5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 16 },
      1: { fontStyle: "bold", cellWidth: 26 },
      2: { cellWidth: 28 },
      3: { halign: "right", cellWidth: 18 },
      4: { halign: "right", cellWidth: 18 },
      5: { cellWidth: 74 },
    },
  });

  // PAGE 6: PURCHASES
  startNewPage();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...colors.green);
  doc.text(
    isPt
      ? "VII-B. Livro de Transferências Históricas — Recordes de Entradas (Taxa Principal >= 8.0 M€)"
      : "VII-B. Landmark Player Transfers Ledger — Record Arrivals (Fee >= 8.0 M€)",
    15,
    44,
  );

  const t5PurchHeaders = isPt
    ? [
        "Época",
        "Jogador",
        "Clube de Origem",
        "Taxa de Aquisição",
        "Notas de Compra",
      ]
    : [
        "Season",
        "Player",
        "Former Club",
        "Acquisition Fee",
        "Purchase Details",
      ];

  const t5PurchRows = topPurchases.map((p) => [
    p.season,
    p.player,
    p.club,
    `${p.fee.toFixed(1)} M€`,
    p.note,
  ]);

  autoTable(doc, {
    startY: 48,
    head: [t5PurchHeaders],
    body: t5PurchRows,
    margin: { left: 15, right: 15 },
    theme: "striped",
    headStyles: {
      fillColor: colors.green,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    bodyStyles: { fontSize: 7, textColor: colors.darkInk, cellPadding: 1.5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 16 },
      1: { fontStyle: "bold", cellWidth: 28 },
      2: { cellWidth: 32 },
      3: { halign: "right", cellWidth: 26 },
      4: { cellWidth: 78 },
    },
  });

  // Footer page 6
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(...colors.mutedText);
  doc.text(
    isPt
      ? "Nota: Informação compilada para fins informativos. Dados extraídos dos relatórios auditados da Sporting SAD."
      : "Disclaimer: Prepared for information purposes only. Source data compiled from audited Sporting SAD annual reports.",
    15,
    283,
  );
}

/**
 * Generates an exhaustive, premium 5-page financial analysis report.
 * Contains localized analysis, a cover page with a 2x2 KPI dashboard,
 * five distinct tables (Operating P&L, Balance Sheet, Player Trading, Cash Flows, and Landmark Transfers),
 * and dynamic overlap-free spacing for timelines.
 */
export async function generateCuratedPdf(options = {}) {
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
