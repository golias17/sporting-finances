import { state } from "./state.js";
import { mkChart } from "./charts.js";
import { fmtMillions } from "./chartUtils.js";
import { syncStateToUrl } from "./urlSync.js";

// SEASON COMPARISON
// =============================================================

// AbortController for the change listeners — replaced each time initComparison
// is called so we never accumulate duplicate listeners on rebuilt DOM elements.
// This mirrors the pattern used in health.js.
let comparisonAbortController = null;

export function initComparison() {
  const selA = document.getElementById("compareSeasonA");
  const selB = document.getElementById("compareSeasonB");

  // Always use the full dataset so any two seasons can be compared regardless of
  // whatever the global date-range filter is currently set to.
  const data = state.fullAnnual;

  // Preserve the previously selected seasons (by label) across rebuilds so that
  // a global-filter change doesn't silently reset the user's choice.
  const prevLabelA = selA.options[selA.selectedIndex]?.textContent ?? null;
  const prevLabelB = selB.options[selB.selectedIndex]?.textContent ?? null;

  // Always rebuild the option lists so indices stay valid.
  [selA, selB].forEach((sel) => (sel.innerHTML = ""));
  data.forEach((d, i) => {
    [selA, selB].forEach((sel) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = d.label;
      sel.appendChild(opt);
    });
  });

  // Restore previous selection by label, or fall back to sensible defaults.
  const idxOf = (label) => data.findIndex((d) => d.label === label);
  let restoreA = prevLabelA ? idxOf(prevLabelA) : -1;
  let restoreB = prevLabelB ? idxOf(prevLabelB) : -1;

  if (restoreA === -1 && state.urlCmpA) {
    restoreA = idxOf(state.urlCmpA);
  }
  if (restoreB === -1 && state.urlCmpB) {
    restoreB = idxOf(state.urlCmpB);
  }

  selA.value = restoreA >= 0 ? restoreA : 0;
  selB.value = restoreB >= 0 ? restoreB : data.length - 1;

  // Tear down previous listeners before attaching fresh ones so that re-calls
  // (e.g. after a global date-range change) never accumulate duplicates.
  if (comparisonAbortController) {
    comparisonAbortController.abort();
  }
  comparisonAbortController = new AbortController();
  const { signal } = comparisonAbortController;
  selA.addEventListener("change", renderComparison, { signal });
  selB.addEventListener("change", renderComparison, { signal });

  renderComparison();
}

// Not exported — only called internally (initComparison's own change
// listeners and initial render). Nothing outside this file imports it.
function renderComparison() {
  const idxA = parseInt(document.getElementById("compareSeasonA").value, 10);
  const idxB = parseInt(document.getElementById("compareSeasonB").value, 10);
  const a = state.fullAnnual[idxA];
  const b = state.fullAnnual[idxB];
  const baseOpts = state.baseOpts;

  document.getElementById("cmpHeadA").textContent = a.label;
  document.getElementById("cmpHeadB").textContent = b.label;

  const netDebtA = a.borrowings_nc + a.borrowings_c - a.cash;
  const netDebtB = b.borrowings_nc + b.borrowings_c - b.cash;

  // Auto-narrative
  const revGrowth =
    Number.isFinite(a.revenue_operating) && a.revenue_operating !== 0
      ? ((b.revenue_operating - a.revenue_operating) /
          Math.abs(a.revenue_operating)) *
        100
      : null;
  const wageBillA =
    Number.isFinite(a.revenue_operating) && a.revenue_operating !== 0
      ? ((Math.abs(a.personnel_costs) / a.revenue_operating) * 100).toFixed(0)
      : null;
  const wageBillB =
    Number.isFinite(b.revenue_operating) && b.revenue_operating !== 0
      ? ((Math.abs(b.personnel_costs) / b.revenue_operating) * 100).toFixed(0)
      : null;
  const equityFlip = a.equity < 0 && b.equity >= 0;
  const parts = [];

  if (state.isPt) {
    parts.push(
      revGrowth !== null
        ? `A receita ${revGrowth >= 0 ? "cresceu" : "caiu"} ${Math.abs(revGrowth).toFixed(0)}% — de ${fmtMillions(a.revenue_operating)} para ${fmtMillions(b.revenue_operating)}.`
        : `A receita passou de ${fmtMillions(a.revenue_operating)} para ${fmtMillions(b.revenue_operating)}.`,
    );
    if (equityFlip) {
      parts.push(
        `O capital próprio passou a ser positivo (${fmtMillions(a.equity)} → ${fmtMillions(b.equity)}), um marco estrutural.`,
      );
    } else {
      parts.push(
        `O capital próprio passou de ${fmtMillions(a.equity)} para ${fmtMillions(b.equity)}.`,
      );
    }
    parts.push(
      wageBillA !== null && wageBillB !== null
        ? `Custos com pessoal: de ${wageBillA}% para ${wageBillB}% da receita. Dívida líquida: de ${fmtMillions(netDebtA)} para ${fmtMillions(netDebtB)}.`
        : `Dívida líquida: de ${fmtMillions(netDebtA)} para ${fmtMillions(netDebtB)}.`,
    );
  } else {
    parts.push(
      revGrowth !== null
        ? `Revenue ${revGrowth >= 0 ? "grew" : "fell"} ${Math.abs(revGrowth).toFixed(0)}% — from ${fmtMillions(a.revenue_operating)} to ${fmtMillions(b.revenue_operating)}.`
        : `Revenue moved from ${fmtMillions(a.revenue_operating)} to ${fmtMillions(b.revenue_operating)}.`,
    );
    if (equityFlip) {
      parts.push(
        `Equity crossed zero (${fmtMillions(a.equity)} → ${fmtMillions(b.equity)}), a structural milestone.`,
      );
    } else {
      parts.push(
        `Equity moved from ${fmtMillions(a.equity)} to ${fmtMillions(b.equity)}.`,
      );
    }
    parts.push(
      wageBillA !== null && wageBillB !== null
        ? `Wage bill: ${wageBillA}% → ${wageBillB}% of revenue. Net debt: ${fmtMillions(netDebtA)} → ${fmtMillions(netDebtB)}.`
        : `Net debt: ${fmtMillions(netDebtA)} → ${fmtMillions(netDebtB)}.`,
    );
  }

  const narEl = document.getElementById("cmpNarrative");
  narEl.textContent = parts.join(" ");
  narEl.style.display = "block";

  // Grouped bar chart
  const barKeys = [
    {
      label: state.isPt ? "Receitas" : "Revenue",
      a: a.revenue_operating,
      b: b.revenue_operating,
    },
    {
      label: state.isPt ? "Transferências" : "Transfers",
      a: a.player_transfer_income,
      b: b.player_transfer_income,
    },
    {
      label: state.isPt ? "Res. Líquido" : "Net result",
      a: a.net_result,
      b: b.net_result,
    },
    { label: state.isPt ? "Cap. Próprio" : "Equity", a: a.equity, b: b.equity },
    {
      label: state.isPt ? "Dívida Líq." : "Net debt",
      a: netDebtA,
      b: netDebtB,
    },
    { label: state.isPt ? "Caixa" : "Cash", a: a.cash, b: b.cash },
  ];
  mkChart("compareBarChart", {
    type: "bar",
    data: {
      labels: barKeys.map((k) => k.label),
      datasets: [
        {
          label: a.label,
          data: barKeys.map((k) => k.a),
          backgroundColor: "rgba(10,93,58,0.75)",
          borderColor: state.COLORS.green,
          borderWidth: 1,
          borderRadius: 3,
        },
        {
          label: b.label,
          data: barKeys.map((k) => k.b),
          backgroundColor: "rgba(200,169,81,0.75)",
          borderColor: state.COLORS.gold,
          borderWidth: 1,
          borderRadius: 3,
        },
      ],
    },
    options: {
      ...baseOpts,
      scales: {
        ...baseOpts.scales,
        y: { ...baseOpts.scales.y, beginAtZero: false },
      },
    },
  });

  // Safe division helper — returns null instead of ±Infinity / NaN when the
  // denominator is zero or non-finite.
  const safeDiv = (n, d) => (Number.isFinite(d) && d !== 0 ? n / d : null);

  // Grouped metric cards
  const groups = [
    {
      title: state.isPt
        ? "Rentabilidade & Demonstração de Resultados"
        : "Profitability & P&L",
      metrics: [
        {
          icon: "💰",
          label: state.isPt ? "Receita Operacional" : "Operating Revenue",
          a: a.revenue_operating,
          b: b.revenue_operating,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "📈",
          label: state.isPt ? "Resultado Líquido" : "Net Result",
          a: a.net_result,
          b: b.net_result,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "⚙️",
          label: state.isPt
            ? "Resultado Oper. Recorrente"
            : "Recurring Op. Result",
          a: a.operating_result_excl_players,
          b: b.operating_result_excl_players,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "💸",
          label: state.isPt ? "Resultado Financeiro" : "Financial Result",
          a: a.financial_result,
          b: b.financial_result,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
      ],
    },
    {
      title: state.isPt ? "Balanço" : "Balance Sheet",
      metrics: [
        {
          icon: "⚖️",
          label: state.isPt ? "Capital Próprio" : "Shareholders' Equity",
          a: a.equity,
          b: b.equity,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "📊",
          label: state.isPt ? "Ativo Total" : "Total Assets",
          a: a.total_assets,
          b: b.total_assets,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "💳",
          label: state.isPt ? "Dívida Líquida" : "Net Debt",
          a: netDebtA,
          b: netDebtB,
          fmt: fmtMillions,
          better: "low",
          monetary: true,
        },
        {
          icon: "🏧",
          label: state.isPt ? "Caixa e Equivalentes" : "Cash on Hand",
          a: a.cash,
          b: b.cash,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
      ],
    },
    {
      title: state.isPt ? "Rácios de Eficiência" : "Efficiency Ratios",
      metrics: [
        {
          icon: "💼",
          label: state.isPt ? "Custos com Pessoal" : "Wage Bill",
          a: safeDiv(Math.abs(a.personnel_costs) * 100, a.revenue_operating),
          b: safeDiv(Math.abs(b.personnel_costs) * 100, b.revenue_operating),
          fmt: (v) =>
            v === null
              ? "—"
              : v.toFixed(0) +
                "% " +
                (state.isPt ? "da receita" : "of revenue"),
          better: "low",
          monetary: false,
        },
        {
          icon: "🔗",
          label: state.isPt ? "Dívida Líquida / Receita" : "Net Debt / Revenue",
          a: safeDiv(netDebtA, a.revenue_operating),
          b: safeDiv(netDebtB, b.revenue_operating),
          fmt: (v) => (v === null ? "—" : v.toFixed(1) + "×"),
          better: "low",
          monetary: false,
        },
        {
          icon: "🔄",
          label: state.isPt ? "Dependência de Passes" : "Transfer Reliance",
          a: safeDiv(
            a.player_transfer_income * 100,
            a.revenue_operating + a.player_transfer_income,
          ),
          b: safeDiv(
            b.player_transfer_income * 100,
            b.revenue_operating + b.player_transfer_income,
          ),
          fmt: (v) =>
            v === null
              ? "—"
              : v.toFixed(0) +
                "% " +
                (state.isPt ? "do rendimento total" : "of total income"),
          better: "low",
          monetary: false,
        },
        {
          icon: "⚡",
          label: state.isPt ? "Rácio de Solvência" : "Current Ratio",
          a: safeDiv(a.current_assets, a.current_liabilities),
          b: safeDiv(b.current_assets, b.current_liabilities),
          fmt: (v) => (v === null ? "—" : v.toFixed(2) + "×"),
          better: "high",
          monetary: false,
        },
      ],
    },
    {
      title: state.isPt ? "Plantel & Transferências" : "Squad & Transfers",
      metrics: [
        {
          icon: "💵",
          label: state.isPt ? "Receitas de Passes" : "Transfer Income",
          a: a.player_transfer_income,
          b: b.player_transfer_income,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "🏆",
          label: state.isPt
            ? "Saldo de Transf. + Amort."
            : "Net Player Trading",
          a:
            a.player_transfer_income +
            a.player_transfer_cost +
            a.squad_amortization_impairment,
          b:
            b.player_transfer_income +
            b.player_transfer_cost +
            b.squad_amortization_impairment,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "📋",
          label: state.isPt ? "Valor Contabilístico" : "Squad Book Value",
          a: a.squad_book_value,
          b: b.squad_book_value,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
        {
          icon: "📉",
          label: state.isPt ? "Amortização do Plantel" : "Squad Amortization",
          a: a.squad_amortization_impairment,
          b: b.squad_amortization_impairment,
          fmt: fmtMillions,
          better: "high",
          monetary: true,
        },
      ],
    },
  ];

  const renderCard = (m) => {
    const hasValues =
      m.a !== null &&
      m.b !== null &&
      Number.isFinite(m.a) &&
      Number.isFinite(m.b);
    const improved = hasValues && (m.better === "high" ? m.b > m.a : m.b < m.a);
    const same = hasValues && m.a === m.b;
    const pct =
      hasValues && m.a !== 0 ? ((m.b - m.a) / Math.abs(m.a)) * 100 : null;
    const absDelta = hasValues ? m.b - m.a : null;
    const arrow = !hasValues ? "" : same ? "—" : improved ? "▲" : "▼";
    const pctStr =
      pct !== null ? (pct >= 0 ? "+" : "") + pct.toFixed(0) + "%" : "";
    const cls = !hasValues ? "neu" : same ? "neu" : improved ? "pos" : "neg";
    const absStr =
      m.monetary && absDelta !== null
        ? `${absDelta >= 0 ? "+" : ""}${fmtMillions(absDelta)} ${state.isPt ? "variação absoluta" : "absolute change"}`
        : null;
    return `<div class="cmp-card">
      <div class="cmp-icon">${m.icon}</div>
      <div class="cmp-label">${m.label}</div>
      <div class="cmp-row">
        <div class="cmp-val">${m.fmt(m.a)}</div>
        <div class="cmp-delta ${cls}">${arrow} ${pctStr}</div>
        <div class="cmp-val b">${m.fmt(m.b)}</div>
      </div>
      ${absStr ? `<div class="cmp-abs-delta ${cls}">${absStr}</div>` : ""}
    </div>`;
  };

  document.getElementById("comparisonGrid").innerHTML = groups
    .map(
      (g) =>
        `<div class="cmp-group">
      <div class="cmp-group-title">${g.title}</div>
      <div class="cmp-group-grid">${g.metrics.map(renderCard).join("")}</div>
    </div>`,
    )
    .join("");

  syncStateToUrl();
}

// =============================================================
