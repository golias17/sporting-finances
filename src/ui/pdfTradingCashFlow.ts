import autoTable from "jspdf-autotable";
import { state } from "../core/state.js";
import { getBrandColors, hexToRgbArray } from "../charts/chartUtils.js";
import { fmtM, signColorCell, thresholdColorCell, combineCellColorers } from "./pdfHelpers.js";
import type { PdfContext, ColorPalette } from "./pdfTypes.js";

// ==========================================================
// PAGE 3: TABLE 3 (PLAYER TRADING) & TABLE 4 (CASH FLOWS)
// ==========================================================
export function drawTradingCashFlowPage(ctx: PdfContext) {
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

  const t3Rows = data.map((d: AnnualData) => {
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

  const t4Rows = data.map((d: AnnualData) => {
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


