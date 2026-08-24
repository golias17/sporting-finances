import { useCallback } from "react";
import { useAppState } from "../core/state.js";
import { netDebt } from "../features/financialMetrics.js";
import { exportToCsv } from "../utils/exportCsv.js";

interface FieldDef {
  key?: string;
  label: string;
  compute?: (d: any) => number;
}

function getFields(isPt: boolean): FieldDef[] {
  return [
    {
      key: "revenue_operating",
      label: isPt ? "Receita Operacional" : "Operating Revenue",
    },
    {
      key: "player_transfer_income",
      label: isPt ? "Receitas de Passes (Proveitos)" : "Transfer Income",
    },
    {
      key: "player_transfer_cost",
      label: isPt ? "Custos com Passes (Custos)" : "Transfer Cost",
    },
    {
      key: "personnel_costs",
      label: isPt ? "Custos com Pessoal" : "Personnel Costs",
    },
    {
      key: "operating_result_total",
      label: isPt ? "Resultado Operacional" : "Operating Result",
    },
    {
      key: "financial_result",
      label: isPt ? "Resultado Financeiro" : "Financial Result",
    },
    { key: "net_result", label: isPt ? "Resultado Líquido" : "Net Result" },
    { key: "total_assets", label: isPt ? "Ativo Total" : "Total Assets" },
    {
      key: "equity",
      label: isPt ? "Capital Próprio" : "Shareholders' Equity",
    },
    {
      key: "borrowings_nc",
      label: isPt ? "Passivo Não Corrente (Dívida L.P.)" : "Non-Current Debt",
    },
    {
      key: "borrowings_c",
      label: isPt ? "Passivo Corrente (Dívida C.P.)" : "Current Debt",
    },
    {
      key: "cash",
      label: isPt ? "Caixa e Equivalentes" : "Cash & Equivalents",
    },
    {
      compute: (d) => netDebt(d),
      label: isPt ? "Dívida Líquida" : "Net Debt",
    },
    {
      key: "squad_book_value",
      label: isPt ? "Valor Contabilístico do Plantel" : "Squad Book Value",
    },
    {
      key: "squad_market_value",
      label: isPt
        ? "Valor de Mercado (Transfermarkt)"
        : "Squad Market Value (Transfermarkt)",
    },
    {
      key: "cf_operating",
      label: isPt ? "Fluxo de Caixa Operacional" : "Cash Flow from Operations",
    },
    {
      key: "cf_investing",
      label: isPt
        ? "Fluxo de Caixa de Investimento"
        : "Cash Flow from Investing",
    },
    {
      key: "cf_financing",
      label: isPt
        ? "Fluxo de Caixa de Financiamento"
        : "Cash Flow from Financing",
    },
  ];
}

/**
 * Provides the CSV data export functionality for the financial data table.
 */
export function useDataExport() {
  const annual = useAppState((s) => s.annual);
  const isPt = useAppState((s) => s.isPt);

  const exportCsv = useCallback(() => {
    const fields = getFields(isPt);
    const delimiter = isPt ? ";" : ",";
    const headers = [
      isPt ? "Métrica (€M)" : "Metric (€M)",
      ...annual.map((d) => d.label),
    ];

    const rows = fields.map((f) => {
      const rowVals = annual.map((d) => {
        const rawVal = f.compute
          ? f.compute(d)
          : (d[f.key as keyof typeof d] as number);
        if (rawVal === null || rawVal === undefined) return "—";
        const inMillions = rawVal / 1000;
        return inMillions.toFixed(1);
      });
      return [f.label, ...rowVals];
    });

    exportToCsv("sporting_finances_annual_data.csv", headers, rows, {
      delimiter,
    });
  }, [annual, isPt]);

  return { exportCsv };
}
