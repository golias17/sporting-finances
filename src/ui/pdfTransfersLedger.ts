import autoTable from "jspdf-autotable";
import { state } from "../core/state.js";
import {
  } from "./pdfHelpers.js";
import type { PdfContext } from "./pdfTypes.js";

// ==========================================================
// PAGES 5-6: LANDMARK PLAYER TRANSFERS LEDGER (SALES & PURCHASES)
// ==========================================================
export function drawTransfersLedgerPages(ctx: PdfContext) {
  const { doc, isPt, colors, startNewPage } = ctx;

  const cleanText = (str: string | undefined) => {
    if (!str) return "—";
    return str.replace(/≈/g, "~").replace(/≥/g, ">=").replace(/≤/g, "<=");
  };

  // Extract transfers >= 8M
  const salesLedger: Array<{
    season: string;
    player: string;
    club: string;
    fee: number;
    commission: number;
    note: string;
  }> = [];
  const purchasesLedger: Array<{
    season: string;
    player: string;
    club: string;
    fee: number;
    note: string;
  }> = [];

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

  // PAGE 6: SALES
  startNewPage();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...colors.green);
  doc.text(
    isPt
      ? "VIII-A. Livro de Transferências Históricas — Recordes de Saídas (Taxa Principal >= 10.0 M€)"
      : "VIII-A. Landmark Player Transfers Ledger — Record Departures (Fee >= 10.0 M€)",
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
        "Comm.",
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
    margin: { left: 15, right: 15, bottom: 20 },
    theme: "striped",
    headStyles: {
      fillColor: colors.green,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    bodyStyles: { fontSize: 7, textColor: colors.darkInk, cellPadding: 1.6 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 16 },
      1: { fontStyle: "bold", cellWidth: 26 },
      2: { cellWidth: 26 },
      3: { halign: "right", cellWidth: 18 },
      4: { halign: "right", cellWidth: 18 },
      5: { cellWidth: 76 },
    },
  });

  // PAGE 7: PURCHASES
  startNewPage();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...colors.green);
  doc.text(
    isPt
      ? "VIII-B. Livro de Transferências Históricas — Recordes de Entradas (Taxa Principal >= 8.0 M€)"
      : "VIII-B. Landmark Player Transfers Ledger — Record Arrivals (Fee >= 8.0 M€)",
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
    margin: { left: 15, right: 15, bottom: 20 },
    theme: "striped",
    headStyles: {
      fillColor: colors.green,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    bodyStyles: { fontSize: 7, textColor: colors.darkInk, cellPadding: 1.6 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 16 },
      1: { fontStyle: "bold", cellWidth: 26 },
      2: { cellWidth: 26 },
      3: { halign: "right", cellWidth: 20 },
      4: { cellWidth: 92 },
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
