import { state } from "./state.js";
import { fmtMillions, mkChart } from "./charts.js";

// SEASON COMPARISON
// =============================================================
export function initComparison() {
  const selA = document.getElementById("compareSeasonA");
  const selB = document.getElementById("compareSeasonB");
  if (selA.options.length > 0) {
    renderComparison();
    return;
  } // already built
  state.annual.forEach((d, i) => {
    [selA, selB].forEach((sel) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = d.label;
      sel.appendChild(opt);
    });
  });
  selA.value = 0; // default: 2012/13
  selB.value = state.annual.length - 1; // default: 2024/25
  selA.addEventListener("change", renderComparison);
  selB.addEventListener("change", renderComparison);
  renderComparison();
}

export function renderComparison() {
  const idxA = parseInt(document.getElementById("compareSeasonA").value);
  const idxB = parseInt(document.getElementById("compareSeasonB").value);
  const a = state.annual[idxA];
  const b = state.annual[idxB];
  const baseOpts = state.baseOpts;

  document.getElementById("cmpHeadA").textContent = a.label;
  document.getElementById("cmpHeadB").textContent = b.label;

  const netDebtA = a.borrowings_nc + a.borrowings_c - a.cash;
  const netDebtB = b.borrowings_nc + b.borrowings_c - b.cash;

  // Auto-narrative
  const revGrowth =
    ((b.revenue_operating - a.revenue_operating) /
      Math.abs(a.revenue_operating)) *
    100;
  const wageBillA = (
    (Math.abs(a.personnel_costs) / a.revenue_operating) *
    100
  ).toFixed(0);
  const wageBillB = (
    (Math.abs(b.personnel_costs) / b.revenue_operating) *
    100
  ).toFixed(0);
  const equityFlip = a.equity < 0 && b.equity >= 0;
  const parts = [];

  if (state.isPt) {
    parts.push(
      `A receita ${revGrowth >= 0 ? "cresceu" : "caiu"} ${Math.abs(revGrowth).toFixed(0)}% — de ${fmtMillions(a.revenue_operating)} para ${fmtMillions(b.revenue_operating)}.`,
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
      `Custos com pessoal: de ${wageBillA}% para ${wageBillB}% da receita. Dívida líquida: de ${fmtMillions(netDebtA)} para ${fmtMillions(netDebtB)}.`,
    );
  } else {
    parts.push(
      `Revenue ${revGrowth >= 0 ? "grew" : "fell"} ${Math.abs(revGrowth).toFixed(0)}% — from ${fmtMillions(a.revenue_operating)} to ${fmtMillions(b.revenue_operating)}.`,
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
      `Wage bill: ${wageBillA}% → ${wageBillB}% of revenue. Net debt: ${fmtMillions(netDebtA)} → ${fmtMillions(netDebtB)}.`,
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
          a: (Math.abs(a.personnel_costs) / a.revenue_operating) * 100,
          b: (Math.abs(b.personnel_costs) / b.revenue_operating) * 100,
          fmt: (v) =>
            v.toFixed(0) + "% " + (state.isPt ? "da receita" : "of revenue"),
          better: "low",
          monetary: false,
        },
        {
          icon: "🔗",
          label: state.isPt ? "Dívida Líquida / Receita" : "Net Debt / Revenue",
          a: netDebtA / a.revenue_operating,
          b: netDebtB / b.revenue_operating,
          fmt: (v) => v.toFixed(1) + "×",
          better: "low",
          monetary: false,
        },
        {
          icon: "🔄",
          label: state.isPt ? "Dependência de Passes" : "Transfer Reliance",
          a:
            (a.player_transfer_income /
              (a.revenue_operating + a.player_transfer_income)) *
            100,
          b:
            (b.player_transfer_income /
              (b.revenue_operating + b.player_transfer_income)) *
            100,
          fmt: (v) =>
            v.toFixed(0) +
            "% " +
            (state.isPt ? "do rendimento total" : "of total income"),
          better: "low",
          monetary: false,
        },
        {
          icon: "⚡",
          label: state.isPt ? "Rácio de Solvência" : "Current Ratio",
          a: a.current_assets / a.current_liabilities,
          b: b.current_assets / b.current_liabilities,
          fmt: (v) => v.toFixed(2) + "×",
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
    const improved = m.better === "high" ? m.b > m.a : m.b < m.a;
    const same = m.a === m.b;
    const pct = m.a !== 0 ? ((m.b - m.a) / Math.abs(m.a)) * 100 : null;
    const absDelta = m.b - m.a;
    const arrow = same ? "—" : improved ? "▲" : "▼";
    const pctStr =
      pct !== null ? (pct >= 0 ? "+" : "") + pct.toFixed(0) + "%" : "";
    const cls = same ? "neu" : improved ? "pos" : "neg";
    const absStr = m.monetary
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
}

// =============================================================
