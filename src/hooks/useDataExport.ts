import { useCallback } from "react";
import { useAppState } from "../core/state.js";
import { netDebt } from "../features/metrics.js";

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
      label: isPt
        ? "Passivo Não Corrente (Dívida L.P.)"
        : "Non-Current Debt",
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
        : "Squad Market Value",
    },
    {
      key: "cf_operating",
      label: isPt
        ? "Fluxo de Caixa Operacional"
        : "Cash Flow from Operations",
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
 * Replaces the imperative initDataExport() with a React-friendly hook.
 */
export function useDataExport() {
  const annual = useAppState((s) => s.annual);
  const isPt = useAppState((s) => s.isPt);

  const exportCsv = useCallback(() => {
    const fields = getFields(isPt);
    let csv =
      (isPt ? "Métrica," : "Metric,") +
      annual.map((d) => d.label).join(",") +
      "\n";

    fields.forEach((f) => {
      csv += `"${f.label}",`;
      const rowVals = annual.map((d) => {
        const v = f.compute ? f.compute(d) : d[f.key as keyof typeof d];
        return v;
      });
      csv += rowVals.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sporting_finances_annual_data.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }, [annual, isPt]);

  return { exportCsv };
}
