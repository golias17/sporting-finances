import autoTable from "jspdf-autotable";
import { state } from "../core/state.js";
import { getBrandColors, hexToRgbArray } from "../charts/chartUtils.js";
import { fmtM, signColorCell, thresholdColorCell, combineCellColorers } from "./pdfHelpers.js";
import type { PdfContext, ColorPalette } from "./pdfTypes.js";

// ==========================================================
// PAGE 2: TABLE 1 (REVENUES & WAGES) & TABLE 2 (BALANCE SHEET)
// ==========================================================
export function drawFinancialTablesPage(ctx: PdfContext) {
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

  const t1Rows = data.map((d: AnnualData) => {
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
        { negativeIf: (v: number) => v > 70, positiveIf: (v: number) => v <= 60 },
        colors,
      ),
      // EBITDA margin (col 8): higher is better.
      thresholdColorCell(
        8,
        { negativeIf: (v: number) => v < 10, positiveIf: (v: number) => v >= 20 },
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

  const t2Rows = data.map((d: AnnualData) => {
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
        { negativeIf: (v: number) => v < 0, positiveIf: (v: number) => v >= 15 },
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

    const maxEquityAbs = Math.max(
      ...data.map((d: AnnualData) => Math.abs(d.equity || 0)),
    );
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


