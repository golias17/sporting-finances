import autoTable from "jspdf-autotable";
import { state } from "../core/state.js";
import { getBrandColors, hexToRgbArray } from "../charts/chartUtils.js";
import { fmtM, signColorCell, thresholdColorCell, combineCellColorers } from "./pdfHelpers.js";
import type { PdfContext, ColorPalette } from "./pdfTypes.js";

// ==========================================================
// PAGE 4: TIMELINE & FINANCING DETAIL (OVERLAP FREE)
// ==========================================================
export function drawFinancingTimelinePage(ctx: PdfContext) {
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


