import React from "react";
import { useAppState } from "../core/state.ts";
import { fmtMillions } from "../charts/chartUtils.js";
import { netDebt } from "./metrics.js";
import type { FinancialRecord } from "../core/types.ts";

const getFields = (isPt: boolean) => [
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
    compute: (d: any) => netDebt(d),
    label: isPt ? "Dívida Líquida" : "Net Debt",
  },
  {
    key: "squad_book_value",
    label: isPt ? "Valor Contabilístico do Plantel" : "Squad Book Value",
  },
  {
    key: "squad_market_value",
    label: isPt ? "Valor de Mercado (Transfermarkt)" : "Squad Market Value (Transfermarkt)",
  },
  {
    key: "cf_operating",
    label: isPt ? "Fluxo de Caixa Operacional" : "Cash Flow from Operations",
  },
  {
    key: "cf_investing",
    label: isPt ? "Fluxo de Caixa de Investimento" : "Cash Flow from Investing",
  },
  {
    key: "cf_financing",
    label: isPt
      ? "Fluxo de Caixa de Financiamento"
      : "Cash Flow from Financing",
  },
];

export function DataTable({ data }: { data: FinancialRecord[] }) {
  const isPt = useAppState((s) => s.isPt);
  if (!data) return null;
  const fields = getFields(isPt);

  return (
    <table className="data">
      <thead>
        <tr>
          <th>{isPt ? "Métrica" : "Metric"}</th>
          {data.map((d, idx) => (
            <th key={idx}>{d.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {fields.map((f, i) => (
          <tr key={i}>
            <td>{f.label}</td>
            {data.map((d, j) => {
              const v = f.compute ? f.compute(d) : (d as any)[f.key!];
              const cls = v < 0 ? "neg" : "";
              return (
                <td key={j} className={cls}>
                  {fmtMillions(v)}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
