import { state } from "./state.js";
import { renderKpis } from "./main.js";
import { fmtMillions } from "./charts.js";

// Keep track of sparkline chart instances to destroy them before re-rendering
const sparklineRegistry = {};

// HEALTH BAR  (season-interactive)
// =============================================================
export function initHealthBar() {
  const selector = document.getElementById("seasonSelector");
  selector.innerHTML = state.annual
    .map(
      (a, i) =>
        `<button class="season-pill" data-idx="${i}" aria-pressed="false">${a.label}</button>`,
    )
    .join("");
  if (!selector.dataset.listenerAttached) {
    selector.addEventListener("click", (e) => {
      const btn = e.target.closest(".season-pill");
      if (btn) renderHealthBar(parseInt(btn.dataset.idx));
    });
    selector.dataset.listenerAttached = "true";
  }
  // Default to latest season on first initialization
  if (state.healthBarIdx === null) {
    state.healthBarIdx = state.annual.length - 1;
  }
  renderHealthBar(state.healthBarIdx);
}

export function renderHealthBar(idx) {
  if (idx === undefined) idx = state.healthBarIdx;
  state.healthBarIdx = idx;

  const d = state.annual[idx];
  const prev5 = idx >= 5 ? state.annual[idx - 5] : null;

  // Historical data for sparklines (up to 5 years ending at current idx)
  const histStartIdx = Math.max(0, idx - 4);
  const histData = state.annual.slice(histStartIdx, idx + 1);
  const histLabels = histData.map((y) => y.label);

  // Update active pill
  document
    .querySelectorAll("#seasonSelector .season-pill")
    .forEach((btn, i) => {
      const isActive = i === idx;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

  // Title
  document.getElementById("healthBarTitle").textContent = state.isPt
    ? `Saúde Financeira do Clube — ${d.label}`
    : `Club Financial Health — ${d.label}`;

  // Compute signals
  const payrollRatio = Math.abs(d.personnel_costs) / d.revenue_operating;
  const netDebt = d.borrowings_nc + d.borrowings_c - d.cash;
  const netDebtRatio = netDebt / d.revenue_operating;
  const transferReliance =
    d.player_transfer_income / (d.revenue_operating + d.player_transfer_income);
  const revenueGrowth5y = prev5
    ? (d.revenue_operating - prev5.revenue_operating) / prev5.revenue_operating
    : null;
  const currentRatio = d.current_assets / d.current_liabilities;
  const recurringOpProfit = d.operating_result_excl_players;

  // Contextual notes
  const payrollNotes = {
    low:
      payrollRatio < 0.5
        ? state.isPt
          ? "Excecionalmente baixo"
          : "Exceptionally lean"
        : state.isPt
          ? "Nível saudável"
          : "Healthy level",
    mid: state.isPt ? "Atenção recomendada" : "Worth watching",
    high: state.isPt
      ? "Encargo salarial problemático"
      : "Wage burden is a problem",
  };
  const equityNote =
    d.equity > 20000
      ? state.isPt
        ? "Capital próprio positivo e sólido"
        : "Solid positive equity"
      : d.equity > 0
        ? state.isPt
          ? "Tornou-se positivo recentemente"
          : "Just turned positive"
        : d.equity > -20000
          ? state.isPt
            ? "Ligeiramente negativo"
            : "Mildly negative"
          : d.equity > -50000
            ? state.isPt
              ? "Muito negativo"
              : "Deeply negative"
            : state.isPt
              ? "Insolvência técnica"
              : "Technically insolvent";

  const signals = [
    {
      id: "sigRevGrowth",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>`,
      label: state.isPt ? "Receitas (cresc. 5 anos)" : "Revenue (5yr growth)",
      value:
        revenueGrowth5y !== null
          ? (revenueGrowth5y >= 0 ? "+" : "") +
            (revenueGrowth5y * 100).toFixed(0) +
            "%"
          : "—",
      status:
        revenueGrowth5y === null
          ? "amber"
          : revenueGrowth5y > 0.5
            ? "green"
            : revenueGrowth5y > 0
              ? "amber"
              : "red",
      note:
        revenueGrowth5y !== null
          ? state.isPt
            ? `face a ${state.annual[idx - 5].label}`
            : `vs ${state.annual[idx - 5].label}`
          : state.isPt
            ? "Menos de 5 épocas de dados"
            : "Less than 5 seasons of data",
      history: histData.map((y) => y.revenue_operating),
    },
    {
      id: "sigWage",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
      label: state.isPt ? "Custos com pessoal" : "Wage bill",
      value:
        (payrollRatio * 100).toFixed(0) +
        "% " +
        (state.isPt ? "da receita" : "of revenue"),
      status:
        payrollRatio < 0.6 ? "green" : payrollRatio < 0.7 ? "amber" : "red",
      note:
        payrollRatio < 0.6
          ? payrollNotes.low
          : payrollRatio < 0.7
            ? payrollNotes.mid
            : payrollNotes.high,
      history: histData.map(
        (y) => Math.abs(y.personnel_costs) / y.revenue_operating,
      ),
    },
    {
      id: "sigDebt",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
      label: state.isPt ? "Dívida líquida / receita" : "Net debt vs revenue",
      value:
        netDebtRatio.toFixed(1) + "× " + (state.isPt ? "receita" : "revenue"),
      status: netDebtRatio < 1 ? "green" : netDebtRatio < 2 ? "amber" : "red",
      note:
        netDebtRatio < 1
          ? state.isPt
            ? "Controlável"
            : "Manageable"
          : netDebtRatio < 2
            ? state.isPt
              ? "Elevada — atenção"
              : "Elevated — watch it"
            : netDebtRatio < 4
              ? state.isPt
                ? "Endividamento pesado"
                : "Heavy debt load"
              : state.isPt
                ? "Muito elevada — crise"
                : "Very high — crisis territory",
      history: histData.map(
        (y) =>
          (y.borrowings_nc + y.borrowings_c - y.cash) / y.revenue_operating,
      ),
    },
    {
      id: "sigTransfer",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
      label: state.isPt ? "Dependência de passes" : "Transfer reliance",
      value:
        (transferReliance * 100).toFixed(0) +
        "% " +
        (state.isPt ? "do rendimento total" : "of total income"),
      status:
        transferReliance < 0.35
          ? "green"
          : transferReliance < 0.5
            ? "amber"
            : "red",
      note:
        transferReliance < 0.35
          ? state.isPt
            ? "Rendimentos diversificados"
            : "Diversified income"
          : transferReliance < 0.5
            ? state.isPt
              ? "Dependente de venda de jogadores"
              : "Reliant on player sales"
            : state.isPt
              ? "Altamente dependente de transferências"
              : "Very dependent on transfers",
      history: histData.map(
        (y) =>
          y.player_transfer_income /
          (y.revenue_operating + y.player_transfer_income),
      ),
    },
    {
      id: "sigEquity",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
      label: state.isPt ? "Capital próprio" : "Equity",
      value: fmtMillions(d.equity),
      status: d.equity > 10000 ? "green" : d.equity > 0 ? "amber" : "red",
      note: equityNote,
      history: histData.map((y) => y.equity),
    },
    {
      id: "sigCash",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>`,
      label: state.isPt ? "Saldo de caixa" : "Cash on hand",
      value: fmtMillions(d.cash),
      status: d.cash > 20000 ? "green" : d.cash > 5000 ? "amber" : "red",
      note:
        d.cash > 20000
          ? state.isPt
            ? "Margem confortável"
            : "Comfortable buffer"
          : d.cash > 5000
            ? state.isPt
              ? "Reduzido — risco mensal"
              : "Thin — one bad month matters"
            : state.isPt
              ? "Criticamente baixo"
              : "Critically low",
      history: histData.map((y) => y.cash),
    },
    {
      id: "sigOpProfit",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
      label: state.isPt ? "Resultado Oper. Recorrente" : "Recurring Op. Profit",
      value: fmtMillions(recurringOpProfit),
      status:
        recurringOpProfit > 0
          ? "green"
          : recurringOpProfit > -5000
            ? "amber"
            : "red",
      note:
        recurringOpProfit > 0
          ? state.isPt
            ? "Lucro na atividade base"
            : "Profitable without transfers"
          : recurringOpProfit > -5000
            ? state.isPt
              ? "Pequeno défice estrutural"
              : "Small structural deficit"
            : state.isPt
              ? "Défice estrutural acentuado"
              : "Deep structural deficit",
      history: histData.map((y) => y.operating_result_excl_players),
    },
    {
      id: "sigCurrentRatio",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
      label: state.isPt ? "Rácio de Solvência" : "Current Ratio",
      value: currentRatio.toFixed(2) + "×",
      status:
        currentRatio >= 1.0 ? "green" : currentRatio >= 0.5 ? "amber" : "red",
      note:
        currentRatio >= 1.0
          ? state.isPt
            ? "Cobre passivos correntes"
            : "Covers short-term liabilities"
          : currentRatio >= 0.5
            ? state.isPt
              ? "Atenção à liquidez"
              : "Watch short-term liquidity"
            : state.isPt
              ? "Risco de liquidez alto"
              : "High short-term liquidity risk",
      history: histData.map((y) => y.current_assets / y.current_liabilities),
    },
  ];

  const el = document.getElementById("healthSignals");
  el.classList.add("fading");

  setTimeout(() => {
    el.innerHTML = signals
      .map(
        (s) =>
          `<div class="health-signal ${s.status}">
            <div class="sig-header">
              <div class="sig-icon">${s.icon}</div>
              <div class="sig-label">${s.label}</div>
              <div class="status-dot"></div>
            </div>
            <div class="sig-value">${s.value}</div>
            <div class="sig-note">${s.note}</div>
            <div class="sparkline-wrap">
              <canvas id="${s.id}"></canvas>
            </div>
          </div>`,
      )
      .join("");

    // Render sparklines
    signals.forEach((s) => {
      if (sparklineRegistry[s.id]) {
        sparklineRegistry[s.id].destroy();
      }

      const ctx = document.getElementById(s.id);
      if (!ctx) return;

      const colorMap = {
        green: state.COLORS.pos,
        amber: state.COLORS.warn,
        red: state.COLORS.neg,
      };
      const color = colorMap[s.status] || state.COLORS.ink;

      sparklineRegistry[s.id] = new Chart(ctx, {
        type: "line",
        data: {
          labels: histLabels,
          datasets: [
            {
              data: s.history,
              borderColor: color,
              borderWidth: 2,
              tension: 0.3,
              pointRadius: 0,
              pointHoverRadius: 0,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 0 },
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: {
            x: { display: false },
            y: { display: false },
          },
          layout: { padding: 0 },
        },
      });
    });

    el.classList.remove("fading");
  }, 120);

  // Keep headline KPIs in sync with the selected season
  renderKpis(idx);
}

// =============================================================
