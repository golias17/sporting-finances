import { state } from "./state.js";
import { fmtMillions } from "./charts.js";

// DATA TABLE RENDER
// =============================================================
const getFields = () => [
  {
    key: "revenue_operating",
    label: state.isPt ? "Receita Operacional" : "Operating Revenue",
  },
  {
    key: "player_transfer_income",
    label: state.isPt ? "Receitas de Passes (Proveitos)" : "Transfer Income",
  },
  {
    key: "player_transfer_cost",
    label: state.isPt ? "Custos com Passes (Custos)" : "Transfer Cost",
  },
  {
    key: "personnel_costs",
    label: state.isPt ? "Custos com Pessoal" : "Personnel Costs",
  },
  {
    key: "operating_result_total",
    label: state.isPt ? "Resultado Operacional" : "Operating Result",
  },
  {
    key: "financial_result",
    label: state.isPt ? "Resultado Financeiro" : "Financial Result",
  },
  { key: "net_result", label: state.isPt ? "Resultado Líquido" : "Net Result" },
  { key: "total_assets", label: state.isPt ? "Ativo Total" : "Total Assets" },
  {
    key: "equity",
    label: state.isPt ? "Capital Próprio" : "Shareholders' Equity",
  },
  {
    key: "borrowings_nc",
    label: state.isPt
      ? "Passivo Não Corrente (Dívida L.P.)"
      : "Non-Current Debt",
  },
  {
    key: "borrowings_c",
    label: state.isPt ? "Passivo Corrente (Dívida C.P.)" : "Current Debt",
  },
  {
    key: "cash",
    label: state.isPt ? "Caixa e Equivalentes" : "Cash & Equivalents",
  },
  {
    compute: (d) => d.borrowings_nc + d.borrowings_c - d.cash,
    label: state.isPt ? "Dívida Líquida" : "Net Debt",
  },
  {
    key: "squad_book_value",
    label: state.isPt ? "Valor Contabilístico do Plantel" : "Squad Book Value",
  },
  {
    key: "squad_market_value",
    label: state.isPt
      ? "Valor de Mercado (Transfermarkt)"
      : "Squad Market Value",
  },
  {
    key: "cf_operating",
    label: state.isPt
      ? "Fluxo de Caixa Operacional"
      : "Cash Flow from Operations",
  },
  {
    key: "cf_investing",
    label: state.isPt
      ? "Fluxo de Caixa de Investimento"
      : "Cash Flow from Investing",
  },
  {
    key: "cf_financing",
    label: state.isPt
      ? "Fluxo de Caixa de Financiamento"
      : "Cash Flow from Financing",
  },
];

export function renderTable() {
  const fields = getFields();
  let html = `<table class="data"><thead><tr><th>${state.isPt ? "Métrica" : "Metric"}</th>`;
  state.annual.forEach((d) => (html += `<th>${d.label}</th>`));
  html += "</tr></thead><tbody>";
  fields.forEach((f) => {
    html += `<tr><td>${f.label}</td>`;
    state.annual.forEach((d) => {
      const v = f.compute ? f.compute(d) : d[f.key];
      const cls = v < 0 ? "neg" : "";
      html += `<td class="${cls}">${fmtMillions(v)}</td>`;
    });
    html += "</tr>";
  });
  html += "</tbody></table>";
  document.getElementById("dataTable").innerHTML = html;
}

export function initDataExport() {
  const btn = document.getElementById("btnDownloadLedger");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const fields = getFields();
    let csv =
      (state.isPt ? "Métrica," : "Metric,") +
      state.annual.map((d) => d.label).join(",") +
      "\n";

    fields.forEach((f) => {
      // Wrap label in quotes in case it has commas
      csv += `"${f.label}",`;
      const rowVals = state.annual.map((d) => {
        const v = f.compute ? f.compute(d) : d[f.key];
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
  });
}

// =============================================================
