import autoTable from "jspdf-autotable";
import { state } from "../core/state.js";
import type { PdfContext } from "./pdfTypes.js";

// ==========================================================
// PAGE V: STRATEGIC DEBT & FINANCING INSTRUMENTS
// ==========================================================
export function drawStrategicFinancingPage(ctx: PdfContext) {
  const { doc, isPt, colors, startNewPage } = ctx;
  startNewPage();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...colors.green);
  doc.text(
    isPt
      ? "V. Perfil dos Instrumentos de Dívida e Financiamento Estratégico"
      : "V. Strategic Debt & Financing Instruments Profile",
    15,
    44,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.mutedText);
  doc.text(
    isPt
      ? "Análise pormenorizada dos pilares de capital, reestruturação da dívida bancária e refinanciamento de longo prazo."
      : "Detailed breakdown of capital structure pillars, legacy debt restructuring and long-term USPP refinancing.",
    15,
    49,
  );

  // 3 Structured Instrument Cards
  const instruments = [
    {
      title: isPt
        ? "1. Emissão Obligacionista USPP — €225,0M (Grau de Investimento BBB-)"
        : "1. USPP Senior Private Placement — €225.0M (Investment Grade BBB-)",
      badge: isPt
        ? "Maturidade 28 Anos · Cupão 5.75% Fixo"
        : "28-Year Maturity · 5.75% Fixed Coupon",
      body: isPt
        ? "Concluída em outubro de 2025, a operação no mercado de colocações privadas norte-americano (USPP) representa um marco sem precedentes no desporto nacional. Com prazo até 2053 e notação de crédito BBB- atribuída pela Fitch Ratings e DBRS Morningstar, permitiu liquidar a quase totalidade do passivo bancário de curto/médio prazo e assegurar estabilidade financeira para a modernização do Estádio José Alvalade e Cidade Sporting."
        : "Finalised in October 2025 in the US Private Placement market, this landmark €225M financing represents an unprecedented milestone in Portuguese sports finance. Maturing in 2053 (28-year bullet profile) with investment-grade BBB- ratings from Fitch and DBRS, it fully refinanced volatile short-term bank borrowings and secured long-term funding for Alvalade stadium modernization.",
      color: colors.green,
    },
    {
      title: isPt
        ? "2. Conversão Integral de VMOCs — €135,0M de Dívida em Capital"
        : "2. Full VMOCs Conversion — €135.0M Debt-to-Equity Crossover",
      badge: isPt
        ? "Tranche 1: €83,6M (2022) · Tranche 2: €51,4M (2023)"
        : "Tranche 1: €83.6M (2022) · Tranche 2: €51.4M (2023)",
      body: isPt
        ? "Os Valores Mobiliários Obrigatoriamente Convertíveis emitidos em 2014 junto do Novo Banco e BCP foram convertidos em duas etapas ao valor nominal de €1,00/ação. A conversão de €135,0M extinguiu integralmente os encargos anuais com juros bancários legados e foi o mecanismo determinante que reverteu o passivo a descoberto, restabelecendo a solvência patrimonial positiva da SAD."
        : "Originally issued in 2014 to Novo Banco and BCP, the hybrid convertible bonds were fully converted in two tranches at €1.00 par value. This €135.0M debt-to-equity conversion eradicated recurring interest expenses on legacy debt and constituted the decisive catalyst restoring positive shareholders' equity (+€40.9M in 2024/25).",
      color: colors.gold,
    },
    {
      title: isPt
        ? "3. Titularizações Lion Finance & Dívida Comercial NOS"
        : "3. Lion Finance Securitizations & NOS Media Rights Discounting",
      badge: isPt
        ? "Lion Finance I & II (Veículos SPV)"
        : "Lion Finance I & II (SPV Securitization Vehicles)",
      body: isPt
        ? "Estruturadas através de sociedades de titularização de créditos para antecipar recebíveis do contrato de direitos audiovisuais celebrado com a NOS (2015 a 2026). Permitiram à SAD obter liquidez operacional para regularizar responsabilidades com fornecedores e clubes, mantendo o serviço da dívida indexado a fluxos contratuais garantidos."
        : "Special Purpose Vehicles established to securitize and discount future receivables from the 10-year NOS media rights contract. Provided structural medium-term liquidity to clear operational payables and transfer liabilities, matching debt service against predictable TV cash flows.",
      color: [44, 91, 138],
    },
  ];

  let startY = 55;
  const boxWidth = 180;

  instruments.forEach((inst) => {
    // Background fill
    doc.setFillColor(250, 251, 252);
    doc.rect(15, startY, boxWidth, 68, "F");

    // Left accent bar
    doc.setFillColor(...(inst.color as [number, number, number]));
    doc.rect(15, startY, 2.5, 68, "F");

    // Border
    doc.setDrawColor(220, 226, 230);
    doc.rect(15, startY, boxWidth, 68, "S");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...colors.darkInk);
    doc.text(inst.title, 21, startY + 8);

    // Badge
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...(inst.color as [number, number, number]));
    doc.text(inst.badge, 21, startY + 14);

    // Body
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    doc.setTextColor(...colors.darkInk);
    const splitBody = doc.splitTextToSize(inst.body, 168);
    doc.text(splitBody, 21, startY + 21);

    startY += 73;
  });
}

// ==========================================================
// PAGE VI: CHRONOLOGICAL TURNAROUND MILESTONES
// ==========================================================
export function drawTurnaroundMilestonesPage(ctx: PdfContext) {
  const { doc, isPt, colors, startNewPage } = ctx;
  startNewPage();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...colors.green);
  doc.text(
    isPt
      ? "VI. Marcos Financeiros Cronológicos e Recuperação Estrutural"
      : "VI. Chronological Turnaround Milestones",
    15,
    44,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.mutedText);
  doc.text(
    isPt
      ? "Linha temporal estratégica dos pontos de viragem de governação, reestruturação de capital e expansão de receitas."
      : "Strategic chronology of governance turning points, capital restructuring and recurring revenue expansion.",
    15,
    49,
  );

  const timelineHeaders = isPt
    ? [
        "Ano / Época",
        "Marco Estratégico",
        "Área",
        "Impacto Financeiro e Operacional",
      ]
    : [
        "Year / Season",
        "Strategic Milestone",
        "Domain",
        "Financial & Operational Impact",
      ];

  const timelineRows = [
    [
      "2011 - 2013",
      isPt
        ? "Pré-Insolvência & Défice Crónico"
        : "Pre-Insolvency & Chronic Deficits",
      isPt ? "Estrutural" : "Structural",
      isPt
        ? "Capitais Próprios atingem mínimo histórico de -€119,4M. Rácio salarial superior a 130% das receitas e tesouraria em rutura."
        : "Shareholders' equity plunges to historical trough of -€119.4M. Wage-to-revenue exceeds 130% with acute liquidity shortfalls.",
    ],
    [
      "2014",
      isPt
        ? "Acordo Quadro de Reestruturação"
        : "Financial Restructuring Framework",
      isPt ? "Bancário" : "Banking",
      isPt
        ? "Consolidação de dívida com BCP e Novo Banco. Emissão inicial de €135,0M em VMOCs para evitar liquidação imediata da SAD."
        : "Comprehensive debt restructuring with BCP/Novo Banco and initial €135.0M VMOCs issuance to avoid immediate liquidation.",
    ],
    [
      "2015",
      isPt
        ? "Contrato de Direitos Audiovisuais NOS"
        : "NOS Media Rights Agreement",
      isPt ? "Comercial" : "Commercial",
      isPt
        ? "Contrato de €446M a 10 anos (2015-2026). Criação do veículo SPV Lion Finance para titularização e liquidação de passivos correntes."
        : "10-year €446M broadcasting agreement (2015-2026). Creation of Lion Finance SPV to monetize receivables and clear payables.",
    ],
    [
      "2018",
      isPt
        ? "Crise de Alcochete & Rescisões"
        : "Alcochete Crisis & Squad Impairment",
      isPt ? "Desportivo" : "Sporting",
      isPt
        ? "Rescisões unilaterais e desvalorização forçada de ativos do plantel. Posterior recuperação judicial de verbas compensatórias."
        : "Unilateral player departures causing squad impairments; followed by gradual recovery of legal compensation settlements.",
    ],
    [
      "2020",
      isPt
        ? "Início do Ciclo Amorim & Título Nacional"
        : "Ruben Amorim Era & Championship",
      isPt ? "Desportivo" : "Sporting",
      isPt
        ? "Contratação de Rúben Amorim (€10M). Conquista do Campeonato Nacional e valorização rápida de ativos da formação."
        : "Signing of coach Ruben Amorim (€10M). League title triumph and rapid appraisal of youth academy player assets.",
    ],
    [
      "2022",
      isPt
        ? "Conversão da 1ª Tranche de VMOCs"
        : "First VMOCs Tranche Conversion",
      isPt ? "Capitais" : "Equity",
      isPt
        ? "Conversão de €83,6M de VMOCs em ações a €1,00, elevando a participação do Clube e reduzindo o endividamento bancário legado."
        : "Conversion of €83.6M VMOCs into share capital at €1.00, raising Club control and substantially reducing legacy bank debt.",
    ],
    [
      "2023",
      isPt ? "Conversão Total da 2ª Tranche VMOCs" : "Final VMOCs Conversion",
      isPt ? "Capitais" : "Equity",
      isPt
        ? "Conversão final de €51,4M de VMOCs. Extinção definitiva do passivo híbrido e retorno aos Capitais Próprios positivos (+€21,0M)."
        : "Final conversion of €51.4M VMOCs. Complete extinction of hybrid debt and permanent return to positive equity (+€21.0M).",
    ],
    [
      "2024",
      isPt
        ? "Balanço Consolidado e Recorde de Receitas"
        : "Record Revenue & Balance Consolidation",
      isPt ? "Operacional" : "Operational",
      isPt
        ? "Receita recorde de €148,1M (+116% em 5 anos), EBITDA de €43,7M e 4º ano consecutivo de lucro (+€20,0M). Capitais Próprios em +€40,9M."
        : "Record revenue of €148.1M (+116% 5-yr growth), EBITDA of €43.7M, 4th straight year of net profit (+€20.0M) and equity of +€40.9M.",
    ],
    [
      "2025",
      isPt
        ? "Emissão Obligacionista USPP (€225M)"
        : "Senior USPP Placement (€225M)",
      isPt ? "Financiamento" : "Financing",
      isPt
        ? "Colocação de €225M a 28 anos com cupão fixo de 5.75% e notação BBB- (Grau de Investimento). Reestruturação integral da dívida."
        : "Landmark €225M 28-year USPP bond placement with 5.75% fixed coupon and BBB- investment-grade rating, sealing financial stability.",
    ],
  ];

  autoTable(doc, {
    startY: 55,
    head: [timelineHeaders],
    body: timelineRows,
    margin: { left: 15, right: 15, bottom: 20 },
    theme: "striped",
    headStyles: {
      fillColor: colors.green,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    bodyStyles: { fontSize: 7, textColor: colors.darkInk, cellPadding: 2.2 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 20, textColor: colors.gold },
      1: { fontStyle: "bold", cellWidth: 42 },
      2: { cellWidth: 22 },
      3: { cellWidth: 96 },
    },
  });
}

// Keep backward compatible alias
export const drawFinancingTimelinePage = drawStrategicFinancingPage;
