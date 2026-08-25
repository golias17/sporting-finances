import writeXlsx from "write-excel-file/browser";
import { state } from "../core/state.js";
import type { FinancialRecord } from "../core/types.js";

interface CellData {
  value?: string | number | boolean | Date | null;
  type?: typeof String | typeof Number | typeof Boolean | typeof Date;
  format?: string;
  fontWeight?: "bold";
  fontStyle?: "italic";
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  align?: "left" | "center" | "right";
  borderColor?: string;
  borderStyle?: "thin" | "medium" | "thick";
}

type RowData = CellData[];

interface SheetConfig {
  name: string;
  data: RowData[];
  columns?: Array<{ width: number }>;
}

const BRAND_GREEN = "#0a5d3a";
const BG_HEADER = "#0a5d3a";
const TEXT_WHITE = "#ffffff";
const BG_ZEBRA = "#f7faf8";
const BORDER_COLOR = "#d0ded5";

function makeTitleRow(text: string): RowData {
  return [
    {
      value: text,
      fontWeight: "bold",
      fontSize: 13,
      color: BRAND_GREEN,
      align: "left",
    },
  ];
}

function makeHeaderRow(headers: string[]): RowData {
  return headers.map((h) => ({
    value: h,
    fontWeight: "bold",
    fontSize: 10,
    backgroundColor: BG_HEADER,
    color: TEXT_WHITE,
    align: "center",
    borderColor: BORDER_COLOR,
    borderStyle: "thin",
  }));
}

export async function exportFinancialsExcel(isPt = true): Promise<void> {
  const annual = state.annual || state.DATASET?.annual_data || [];
  const rawLedger = state.TRANSFER_LEDGER || [];
  const benfica = state.BENFICA_DATASET?.annual_data || [];
  const porto = state.PORTO_DATASET?.annual_data || [];

  const sheets: SheetConfig[] = [];

  // ==========================================
  // SHEET 1: DEMONSTRAÇÃO DE RESULTADOS (INCOME STATEMENT)
  // ==========================================
  const isTitle = isPt
    ? "Sporting Clube de Portugal - Futebol, SAD | Demonstração de Resultados (2010/11 a 2024/25)"
    : "Sporting Clube de Portugal - Futebol, SAD | Consolidated Income Statement (2010/11 to 2024/25)";

  const isHeaders = isPt
    ? [
        "Época",
        "Receitas Operacionais (€k)",
        "Direitos TV (€k)",
        "Bilhética (€k)",
        "Comercial / Sponsor (€k)",
        "Gastos com Pessoal (€k)",
        "FSEs (€k)",
        "Amortizações (€k)",
        "Mais-Valias Passes (€k)",
        "Gastos com Passes (€k)",
        "Amortização Plantel (€k)",
        "Resultado Operacional (€k)",
        "Resultados Financeiros (€k)",
        "Resultado Líquido (€k)",
        "EBITDA Total (€k)",
      ]
    : [
        "Season",
        "Operating Revenue (€k)",
        "Broadcasting TV (€k)",
        "Matchday / Gate (€k)",
        "Commercial / Sponsor (€k)",
        "Personnel Expenses (€k)",
        "External Supplies (€k)",
        "Operating D&A (€k)",
        "Player Transfer Gains (€k)",
        "Player Transfer Costs (€k)",
        "Squad Amortization (€k)",
        "Operating Result (€k)",
        "Financial Result (€k)",
        "Net Profit / Loss (€k)",
        "Total EBITDA (€k)",
      ];

  const isRows: RowData[] = [
    makeTitleRow(isTitle),
    [],
    makeHeaderRow(isHeaders),
  ];

  annual.forEach((r: FinancialRecord, idx: number) => {
    const isEven = idx % 2 === 0;
    const bg = isEven ? undefined : BG_ZEBRA;
    isRows.push([
      { value: r.season || r.label, fontWeight: "bold", align: "center", backgroundColor: bg },
      { value: r.revenue_operating || 0, type: Number, format: "#,##0", backgroundColor: bg },
      { value: r.rev_tv_comp || 0, type: Number, format: "#,##0", backgroundColor: bg },
      { value: r.rev_matchday || 0, type: Number, format: "#,##0", backgroundColor: bg },
      { value: r.rev_commercial || 0, type: Number, format: "#,##0", backgroundColor: bg },
      { value: r.personnel_costs || 0, type: Number, format: "#,##0", backgroundColor: bg },
      { value: r.external_supplies || 0, type: Number, format: "#,##0", backgroundColor: bg },
      { value: r.da_excl_squad || 0, type: Number, format: "#,##0", backgroundColor: bg },
      { value: r.player_transfer_income || 0, type: Number, format: "#,##0", backgroundColor: bg },
      { value: r.player_transfer_cost || 0, type: Number, format: "#,##0", backgroundColor: bg },
      { value: r.squad_amortization_impairment || 0, type: Number, format: "#,##0", backgroundColor: bg },
      { value: r.operating_result_total || 0, type: Number, format: "#,##0", backgroundColor: bg },
      { value: r.financial_result || 0, type: Number, format: "#,##0", backgroundColor: bg },
      { value: r.net_result || 0, type: Number, format: "#,##0", fontWeight: "bold", backgroundColor: bg },
      { value: r.ebitda_total || 0, type: Number, format: "#,##0", backgroundColor: bg },
    ]);
  });

  sheets.push({
    name: isPt ? "Resultados" : "Income Statement",
    data: isRows,
    columns: [
      { width: 14 },
      { width: 22 },
      { width: 18 },
      { width: 18 },
      { width: 22 },
      { width: 22 },
      { width: 18 },
      { width: 18 },
      { width: 22 },
      { width: 20 },
      { width: 22 },
      { width: 22 },
      { width: 22 },
      { width: 22 },
      { width: 18 },
    ],
  });

  // ==========================================
  // SHEET 2: BALANÇO & DÍVIDA (BALANCE SHEET & DEBT)
  // ==========================================
  const bsTitle = isPt
    ? "Sporting Clube de Portugal - Futebol, SAD | Balanço & Posição Financeira (2010/11 a 2024/25)"
    : "Sporting Clube de Portugal - Futebol, SAD | Consolidated Balance Sheet & Debt (2010/11 to 2024/25)";

  const bsHeaders = isPt
    ? [
        "Época",
        "Ativo Total (€k)",
        "Ativo Não Corrente (€k)",
        "Ativo Corrente (€k)",
        "Plantel - Balanço (€k)",
        "Plantel - Mercado (€k)",
        "Passivo Total (€k)",
        "Passivo Não Corrente (€k)",
        "Passivo Corrente (€k)",
        "Dívida Financeira (€k)",
        "Caixa (€k)",
        "Dívida Líquida (€k)",
        "Capitais Próprios (€k)",
      ]
    : [
        "Season",
        "Total Assets (€k)",
        "Non-Current Assets (€k)",
        "Current Assets (€k)",
        "Squad Book Value (€k)",
        "Squad Market Value (€k)",
        "Total Liabilities (€k)",
        "Non-Current Liabilities (€k)",
        "Current Liabilities (€k)",
        "Total Borrowings (€k)",
        "Cash & Equiv. (€k)",
        "Net Financial Debt (€k)",
        "Shareholders' Equity (€k)",
      ];

  const bsRows: RowData[] = [
    makeTitleRow(bsTitle),
    [],
    makeHeaderRow(bsHeaders),
  ];

  annual.forEach((r: FinancialRecord, idx: number) => {
    const isEven = idx % 2 === 0;
    const bg = isEven ? undefined : BG_ZEBRA;
    const totalBorrowings = (r.borrowings_nc || 0) + (r.borrowings_c || 0);
    const netDebt = totalBorrowings - (r.cash || 0);

    bsRows.push([
      { value: r.season || r.label, fontWeight: "bold", align: "center", backgroundColor: bg },
      { value: r.total_assets || 0, type: Number, format: "#,##0", backgroundColor: bg },
      { value: r.non_current_assets || 0, type: Number, format: "#,##0", backgroundColor: bg },
      { value: r.current_assets || 0, type: Number, format: "#,##0", backgroundColor: bg },
      { value: r.squad_book_value || 0, type: Number, format: "#,##0", backgroundColor: bg },
      { value: r.squad_market_value || 0, type: Number, format: "#,##0", backgroundColor: bg },
      { value: (r.current_liabilities || 0) + (r.non_current_liabilities || 0), type: Number, format: "#,##0", backgroundColor: bg },
      { value: r.non_current_liabilities || 0, type: Number, format: "#,##0", backgroundColor: bg },
      { value: r.current_liabilities || 0, type: Number, format: "#,##0", backgroundColor: bg },
      { value: totalBorrowings, type: Number, format: "#,##0", backgroundColor: bg },
      { value: r.cash || 0, type: Number, format: "#,##0", backgroundColor: bg },
      { value: netDebt, type: Number, format: "#,##0", backgroundColor: bg },
      { value: r.equity || 0, type: Number, format: "#,##0", fontWeight: "bold", backgroundColor: bg },
    ]);
  });

  sheets.push({
    name: isPt ? "Balanço e Dívida" : "Balance Sheet",
    data: bsRows,
    columns: [
      { width: 14 },
      { width: 18 },
      { width: 20 },
      { width: 18 },
      { width: 20 },
      { width: 20 },
      { width: 18 },
      { width: 22 },
      { width: 20 },
      { width: 20 },
      { width: 16 },
      { width: 20 },
      { width: 22 },
    ],
  });

  // ==========================================
  // SHEET 3: LIVRO DE TRANSFERÊNCIAS (TRANSFER LEDGER)
  // ==========================================
  const trTitle = isPt
    ? "Sporting Clube de Portugal - Futebol, SAD | Livro Histórico de Transferências de Jogadores"
    : "Sporting Clube de Portugal - Futebol, SAD | Historical Player Transfer Ledger";

  const trHeaders = isPt
    ? [
        "Jogador",
        "Época",
        "Tipo",
        "Clube Parceiro",
        "Valor do Passe (€M)",
        "Comissões / Encargos (€M)",
        "Valor Líquido (€M)",
        "Notas Oficiais CMVM",
      ]
    : [
        "Player",
        "Season",
        "Type",
        "Counterparty Club",
        "Gross Fee (€M)",
        "Commissions / Fees (€M)",
        "Net Value (€M)",
        "Official Notes",
      ];

  const trRows: RowData[] = [
    makeTitleRow(trTitle),
    [],
    makeHeaderRow(trHeaders),
  ];

  let rowIndex = 0;
  rawLedger.forEach((seasonObj) => {
    const seasonName = seasonObj.season;
    const purchases = seasonObj.purchases || [];
    const sales = seasonObj.sales || [];

    purchases.forEach((tx) => {
      const isEven = rowIndex % 2 === 0;
      rowIndex++;
      const bg = isEven ? undefined : BG_ZEBRA;
      const typeLabel = isPt ? "Entrada (Compra)" : "Incoming (Purchase)";
      const commission = tx.commission || 0;
      const net = tx.fee + commission;
      const notes = (isPt ? tx.note_pt || tx.note : tx.note || tx.note_pt) || "";

      trRows.push([
        { value: tx.player, fontWeight: "bold", backgroundColor: bg },
        { value: seasonName, align: "center", backgroundColor: bg },
        { value: typeLabel, align: "center", backgroundColor: bg },
        { value: tx.club || "N/A", backgroundColor: bg },
        { value: tx.fee || 0, type: Number, format: "€#,##0.00'M'", backgroundColor: bg },
        { value: commission, type: Number, format: "€#,##0.00'M'", backgroundColor: bg },
        { value: net, type: Number, format: "€#,##0.00'M'", fontWeight: "bold", backgroundColor: bg },
        { value: notes, backgroundColor: bg },
      ]);
    });

    sales.forEach((tx) => {
      const isEven = rowIndex % 2 === 0;
      rowIndex++;
      const bg = isEven ? undefined : BG_ZEBRA;
      const typeLabel = isPt ? "Saída (Venda)" : "Outgoing (Sale)";
      const commission = tx.commission || 0;
      const net = tx.fee - commission;
      const notes = (isPt ? tx.note_pt || tx.note : tx.note || tx.note_pt) || "";

      trRows.push([
        { value: tx.player, fontWeight: "bold", backgroundColor: bg },
        { value: seasonName, align: "center", backgroundColor: bg },
        { value: typeLabel, align: "center", backgroundColor: bg },
        { value: tx.club || "N/A", backgroundColor: bg },
        { value: tx.fee || 0, type: Number, format: "€#,##0.00'M'", backgroundColor: bg },
        { value: commission, type: Number, format: "€#,##0.00'M'", backgroundColor: bg },
        { value: net, type: Number, format: "€#,##0.00'M'", fontWeight: "bold", backgroundColor: bg },
        { value: notes, backgroundColor: bg },
      ]);
    });
  });

  sheets.push({
    name: isPt ? "Transferências" : "Transfers Ledger",
    data: trRows,
    columns: [
      { width: 24 },
      { width: 14 },
      { width: 18 },
      { width: 24 },
      { width: 18 },
      { width: 22 },
      { width: 18 },
      { width: 45 },
    ],
  });

  // ==========================================
  // SHEET 4: BENCHMARK DOS TRÊS GRANDES (RIVALS COMPARISON)
  // ==========================================
  const bmTitle = isPt
    ? "Benchmark Consolidado dos Três Grandes (15 Épocas: 2010/11 a 2024/25)"
    : "Consolidated Big Three Benchmark (15 Seasons: 2010/11 to 2024/25)";

  const bmHeaders = isPt
    ? [
        "Clube",
        "Receitas Operacionais Acumuladas (€M)",
        "Gastos com Pessoal Acumulados (€M)",
        "Saldo Trading Passes (€M)",
        "Resultado Líquido Acumulado (€M)",
        "Ativo Atual 2024/25 (€M)",
        "Passivo Atual 2024/25 (€M)",
        "Dívida Financeira 2024/25 (€M)",
        "Capitais Próprios 2024/25 (€M)",
      ]
    : [
        "Club",
        "Cumulative Operating Revenue (€M)",
        "Cumulative Wage Bill (€M)",
        "Cumulative Player Trading Net (€M)",
        "Cumulative Net Result (€M)",
        "Total Assets 2024/25 (€M)",
        "Total Liabilities 2024/25 (€M)",
        "Total Borrowings 2024/25 (€M)",
        "Shareholders' Equity 2024/25 (€M)",
      ];

  const calcClubTotals = (data: FinancialRecord[]) => {
    let rev = 0;
    let wages = 0;
    let trading = 0;
    let net = 0;
    data.forEach((r) => {
      rev += (r.revenue_operating || 0) / 1000;
      wages += Math.abs(r.personnel_costs || 0) / 1000;
      trading += (r.operating_result_players || (r.player_transfer_income || 0) - (r.player_transfer_cost || 0)) / 1000;
      net += (r.net_result || 0) / 1000;
    });
    const latest = data.length > 0 ? data[data.length - 1] : null;
    return {
      rev,
      wages,
      trading,
      net,
      assets: latest ? (latest.total_assets || 0) / 1000 : 0,
      liabilities: latest ? ((latest.current_liabilities || 0) + (latest.non_current_liabilities || 0)) / 1000 : 0,
      borrowings: latest ? ((latest.borrowings_nc || 0) + (latest.borrowings_c || 0)) / 1000 : 0,
      equity: latest ? (latest.equity || 0) / 1000 : 0,
    };
  };

  const scpTotals = calcClubTotals(annual);
  const slbTotals = calcClubTotals(benfica);
  const fcpTotals = calcClubTotals(porto);

  const bmRows: RowData[] = [
    makeTitleRow(bmTitle),
    [],
    makeHeaderRow(bmHeaders),
    [
      { value: "Sporting CP", fontWeight: "bold", backgroundColor: "rgba(10,93,58,0.1)" },
      { value: scpTotals.rev, type: Number, format: "€#,##0.0'M'" },
      { value: scpTotals.wages, type: Number, format: "€#,##0.0'M'" },
      { value: scpTotals.trading, type: Number, format: "€#,##0.0'M'" },
      { value: scpTotals.net, type: Number, format: "€#,##0.0'M'", fontWeight: "bold" },
      { value: scpTotals.assets, type: Number, format: "€#,##0.0'M'" },
      { value: scpTotals.liabilities, type: Number, format: "€#,##0.0'M'" },
      { value: scpTotals.borrowings, type: Number, format: "€#,##0.0'M'" },
      { value: scpTotals.equity, type: Number, format: "€#,##0.0'M'", fontWeight: "bold" },
    ],
    [
      { value: "SL Benfica", fontWeight: "bold", backgroundColor: "rgba(184,64,58,0.1)" },
      { value: slbTotals.rev, type: Number, format: "€#,##0.0'M'" },
      { value: slbTotals.wages, type: Number, format: "€#,##0.0'M'" },
      { value: slbTotals.trading, type: Number, format: "€#,##0.0'M'" },
      { value: slbTotals.net, type: Number, format: "€#,##0.0'M'", fontWeight: "bold" },
      { value: slbTotals.assets, type: Number, format: "€#,##0.0'M'" },
      { value: slbTotals.liabilities, type: Number, format: "€#,##0.0'M'" },
      { value: slbTotals.borrowings, type: Number, format: "€#,##0.0'M'" },
      { value: slbTotals.equity, type: Number, format: "€#,##0.0'M'", fontWeight: "bold" },
    ],
    [
      { value: "FC Porto", fontWeight: "bold", backgroundColor: "rgba(44,91,138,0.1)" },
      { value: fcpTotals.rev, type: Number, format: "€#,##0.0'M'" },
      { value: fcpTotals.wages, type: Number, format: "€#,##0.0'M'" },
      { value: fcpTotals.trading, type: Number, format: "€#,##0.0'M'" },
      { value: fcpTotals.net, type: Number, format: "€#,##0.0'M'", fontWeight: "bold" },
      { value: fcpTotals.assets, type: Number, format: "€#,##0.0'M'" },
      { value: fcpTotals.liabilities, type: Number, format: "€#,##0.0'M'" },
      { value: fcpTotals.borrowings, type: Number, format: "€#,##0.0'M'" },
      { value: fcpTotals.equity, type: Number, format: "€#,##0.0'M'", fontWeight: "bold" },
    ],
  ];

  sheets.push({
    name: isPt ? "Benchmark Rivais" : "Rivals Benchmark",
    data: bmRows,
    columns: [
      { width: 16 },
      { width: 25 },
      { width: 24 },
      { width: 22 },
      { width: 22 },
      { width: 18 },
      { width: 18 },
      { width: 20 },
      { width: 22 },
    ],
  });

  // ==========================================
  // SHEET 5: FINANCIAMENTO & USPP
  // ==========================================
  const finTitle = isPt
    ? "Sporting Clube de Portugal - Futebol, SAD | Instrumentos de Financiamento (USPP & VMOCs)"
    : "Sporting Clube de Portugal - Futebol, SAD | Financing Instruments (USPP & VMOCs)";

  const finHeaders = isPt
    ? ["Instrumento Financeiro", "Montante Emitido", "Taxa de Cupão", "Maturidade", "Rating DBRS / Fitch", "Finalidade Estrutural"]
    : ["Financial Instrument", "Principal Amount", "Coupon Rate", "Maturity", "Rating", "Use of Proceeds"];

  const finRows: RowData[] = [
    makeTitleRow(finTitle),
    [],
    makeHeaderRow(finHeaders),
    [
      { value: "USPP Senior Secured Notes (Tranche A - Euro)", fontWeight: "bold" },
      { value: "€160,000,000" },
      { value: "5.85% Fixa" },
      { value: "Outubro 2034 (10 anos)" },
      { value: "BBB- / BBB (low) Investment Grade" },
      { value: "Refinanciamento de dívida bancária de curto prazo e modernização do Estádio" },
    ],
    [
      { value: "USPP Senior Secured Notes (Tranche B - USD)", fontWeight: "bold" },
      { value: "$70,000,000 (€65,000,000)" },
      { value: "6.20% Fixa (com Cross-Currency Swap)" },
      { value: "Outubro 2034 (10 anos)" },
      { value: "BBB- / BBB (low) Investment Grade" },
      { value: "Colocação privada com investidores institucionais norte-americanos" },
    ],
    [
      { value: "VMOCs Valores Sporting 2010 (Millennium BCP)", fontWeight: "bold" },
      { value: "€55,000,000" },
      { value: "Convertíveis em Ações" },
      { value: "Convertido / Recomprado" },
      { value: "N/A" },
      { value: "Recompra com desconto que gerou mais de €40M de capitais próprios" },
    ],
    [
      { value: "VMOCs Valores Sporting 2014 (Novo Banco)", fontWeight: "bold" },
      { value: "€83,400,000" },
      { value: "Convertíveis em Ações" },
      { value: "Convertido / Recomprado" },
      { value: "N/A" },
      { value: "Extinção integral das VMOCs devolvendo a maioria do capital da SAD ao Clube (83.9%)" },
    ],
  ];

  sheets.push({
    name: isPt ? "Instrumentos Dívida" : "Debt Instruments",
    data: finRows,
    columns: [
      { width: 34 },
      { width: 22 },
      { width: 18 },
      { width: 20 },
      { width: 25 },
      { width: 45 },
    ],
  });

  const fileName = isPt
    ? "sporting_cp_financas_historico_2010_2025.xlsx"
    : "sporting_cp_financials_2010_2025.xlsx";

  const result = writeXlsx(sheets as unknown as Parameters<typeof writeXlsx>[0]);
  if (result && typeof (result as unknown as { toFile: (fn: string) => Promise<void> }).toFile === "function") {
    await (result as unknown as { toFile: (fn: string) => Promise<void> }).toFile(fileName);
  }
}
