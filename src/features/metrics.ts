import { HEALTH_THRESHOLDS } from "./healthThresholds.js";
import type {
  FinancialDataset,
  FinancialRecord,
  AppState,
} from "../core/types.ts";

export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function getLatestH1Data(dataset: FinancialDataset | null) {
  if (!dataset) return null;
  const h1Key = Object.keys(dataset).find((k) => k.startsWith("h1_"));
  return h1Key ? (dataset as any)[h1Key] : null;
}

// -----------------------------------------------------------------
// Shared KPI primitives — consumed by calculateKpis() below AND by
// pdfGenerator.js, so the dashboard and the exported PDF can never
// disagree on how these headline numbers are derived.
// -----------------------------------------------------------------

/**
 * Net debt (non-current + current borrowings, minus cash) for a single
 * season entry. This exact formula used to be hand-copied inline in six
 * different places (compare.js, charts.js, data-table.js, pdfGenerator.js,
 * and twice within calculateHealthSignals() below) — the same kind of
 * independent-copy drift that caused this project's chartUtils.js palette
 * bug and bonds.js's saving-sign bug earlier on. One shared helper means
 * a future change to how net debt is defined only has to happen once.
 */
export function netDebt(d: FinancialRecord) {
  return d.borrowings_nc + d.borrowings_c - d.cash;
}

/**
 * Personnel costs as a fraction (0-1) of operating revenue for a single
 * season entry, or null when revenue is zero/missing/non-finite. Shared by
 * calculateHealthSignals() (current value + sparkline history) and
 * compare.js's wage-bill comparison instead of each hand-rolling
 * Math.abs(personnel_costs) / revenue_operating — compare.js's version
 * already checked Number.isFinite() in addition to !== 0 (metrics.js's own
 * copy didn't), so that's the contract this shared helper keeps.
 */
export function wageBillRatio(d: FinancialRecord) {
  return Number.isFinite(d.revenue_operating) && d.revenue_operating !== 0
    ? Math.abs(d.personnel_costs) / d.revenue_operating
    : null;
}

/**
 * Revenue growth of season `idx` vs `span` seasons prior, as a whole-percent
 * string (e.g. "131"), or null when there isn't enough history.
 */
export function revenueGrowthPct(
  annual: FinancialRecord[],
  idx: number,
  span = 5,
) {
  const compIdx = idx - span;
  const comp = compIdx >= 0 ? annual[compIdx] : null;
  if (!comp || !comp.revenue_operating) return null;
  return (
    ((annual[idx].revenue_operating - comp.revenue_operating) /
      Math.abs(comp.revenue_operating)) *
    100
  ).toFixed(0);
}

/**
 * Number of consecutive profitable seasons ending at (and including) `idx`.
 */
export function consecutiveProfitableYears(
  annual: FinancialRecord[],
  idx: number,
) {
  let count = 0;
  for (let i = idx; i >= 0; i--) {
    if (annual[i].net_result > 0) count++;
    else break;
  }
  return count;
}

export function calculateKpis(
  state: AppState,
  idx: number,
  fmtMillions: (n: number) => string,
) {
  const isLatest = idx === state.annual.length - 1;
  const curr = state.annual[idx];
  const first = state.annual[0];
  // slice(2) converts "2012/13" → "12/13" for compact axis labels
  const firstShort = first.label.slice(2);

  // Revenue growth vs 5 seasons prior — the same shared helper (and offset)
  // used by calculateHealthSignals() below and pdfGenerator.js, so every
  // "5-year growth" figure in the app agrees.
  const revGrowthPct = revenueGrowthPct(state.annual, idx);

  const consecutiveProfitable = consecutiveProfitableYears(state.annual, idx);

  // Squad market value
  let sqMv, sqMvLabel;
  const h1Data = getLatestH1Data(state.DATASET);

  if (isLatest && h1Data) {
    let h1PeriodLabel;
    // If period_end is missing or malformed, `new Date(...)` produces an
    // Invalid Date, and toLocaleDateString() on that silently returns the
    // literal string "Invalid Date" — which would otherwise flow straight
    // into a headline KPI label ("Squad market value (Invalid Date)")
    // instead of failing loudly. Fall back to the h1 entry's own `label`
    // field (every h1_* dataset entry carries one, e.g. "2025/26 H1").
    const parsedPeriodEnd = new Date(h1Data.period_end);
    const hasValidPeriodEnd = !isNaN(parsedPeriodEnd.getTime());
    if (!hasValidPeriodEnd) {
      h1PeriodLabel =
        h1Data.label || (state.isPt ? "período atual" : "current period");
    } else if (state.isPt) {
      const monthsPt: Record<string, string> = {
        Jan: "Jan",
        Feb: "Fev",
        Mar: "Mar",
        Apr: "Abr",
        May: "Mai",
        Jun: "Jun",
        Jul: "Jul",
        Aug: "Ago",
        Sep: "Set",
        Oct: "Out",
        Nov: "Nov",
        Dec: "Dez",
      };
      const rawLabel = parsedPeriodEnd.toLocaleDateString("en-GB", {
        month: "short",
        year: "2-digit",
      });
      const [m, y] = rawLabel.split(" ");
      h1PeriodLabel = `${monthsPt[m] || m} ${y}`;
    } else {
      h1PeriodLabel = parsedPeriodEnd.toLocaleDateString("en-GB", {
        month: "short",
        year: "2-digit",
      });
    }
    sqMv = h1Data.squad_market_value;
    sqMvLabel = state.isPt
      ? `Valor de mercado do plantel (${h1PeriodLabel})`
      : `Squad market value (${h1PeriodLabel})`;
  } else {
    sqMv = curr.squad_market_value;
    sqMvLabel = state.isPt
      ? `Valor de mercado do plantel (${curr.label})`
      : `Squad market value (${curr.label})`;
  }

  const sqMvMultiple = (sqMv / first.squad_market_value).toFixed(1);

  const kpis = [
    {
      label: state.isPt
        ? `${isLatest ? "Última receita" : "Receita"} (${curr.label})`
        : `${isLatest ? "Latest revenue" : "Revenue"} (${curr.label})`,
      value: fmtMillions(curr.revenue_operating),
      change:
        revGrowthPct !== null
          ? state.isPt
            ? `${Number(revGrowthPct) >= 0 ? "+" : ""}${revGrowthPct}% vs há 5 anos`
            : `${Number(revGrowthPct) >= 0 ? "+" : ""}${revGrowthPct}% vs 5y ago`
          : state.isPt
            ? "Menos de 5 épocas de dados"
            : "Less than 5 seasons of data",
      cls:
        revGrowthPct !== null && Number(revGrowthPct) >= 0
          ? "pos"
          : revGrowthPct !== null
            ? "neg"
            : "",
    },
    {
      label: state.isPt
        ? `${isLatest ? "Último resultado líquido" : "Resultado líquido"} (${curr.label})`
        : `${isLatest ? "Latest net result" : "Net result"} (${curr.label})`,
      value: fmtMillions(curr.net_result),
      change:
        consecutiveProfitable > 1
          ? state.isPt
            ? `${consecutiveProfitable}º ano consecutivo com lucros`
            : `${ordinal(consecutiveProfitable)} profitable year in a row`
          : consecutiveProfitable === 1
            ? state.isPt
              ? "Ano com lucros"
              : "Profitable year"
            : state.isPt
              ? "Ano de prejuízo"
              : "Loss-making year",
      cls: curr.net_result > 0 ? "pos" : "neg",
    },
    {
      label: state.isPt
        ? `${isLatest ? "Últimos capitais próprios" : "Capitais próprios"} (${curr.label})`
        : `${isLatest ? "Latest equity" : "Equity"} (${curr.label})`,
      value: fmtMillions(curr.equity),
      change: state.isPt
        ? `vs ${fmtMillions(first.equity)} em ${firstShort}`
        : `vs ${fmtMillions(first.equity)} in ${firstShort}`,
      cls:
        curr.equity > first.equity
          ? "pos"
          : curr.equity < first.equity
            ? "neg"
            : "",
    },
    {
      label: sqMvLabel,
      value: fmtMillions(sqMv),
      change: state.isPt
        ? `${sqMvMultiple}× o valor de mercado de ${firstShort} (${fmtMillions(first.squad_market_value)})`
        : `${sqMvMultiple}× the ${firstShort} market value (${fmtMillions(first.squad_market_value)})`,
      cls: sqMv > first.squad_market_value ? "pos" : "",
    },
    {
      label: state.isPt
        ? `Dívida total (${curr.label})`
        : `Total debt (${curr.label})`,
      value: fmtMillions(curr.borrowings_nc + curr.borrowings_c),
      change: state.isPt
        ? `vs ${fmtMillions(first.borrowings_nc + first.borrowings_c)} em ${firstShort}`
        : `vs ${fmtMillions(first.borrowings_nc + first.borrowings_c)} in ${firstShort}`,
      cls: "",
    },
  ];

  if (isLatest && h1Data) {
    kpis.push({
      label: state.isPt
        ? `Result. líquido 1º Sem. ${h1Data.label}`
        : `H1 ${h1Data.label} net result`,
      value: fmtMillions(h1Data.net_result),
      // The caption comes from the dataset (kpi_note / kpi_note_pt on the h1
      // snapshot) so a new half-year entry brings its own context instead of
      // inheriting a stale hardcoded transfer reference. Falls back to the
      // EN note when isPt is true but kpi_note_pt wasn't provided.
      change: (state.isPt && h1Data.kpi_note_pt) || h1Data.kpi_note || "",
      cls: h1Data.net_result >= 0 ? "pos" : "neg",
    });
  } else {
    kpis.push({
      label: state.isPt
        ? `Saldo de caixa (${curr.label})`
        : `Cash on hand (${curr.label})`,
      value: fmtMillions(curr.cash),
      change: state.isPt
        ? `vs ${fmtMillions(first.cash)} em ${firstShort}`
        : `vs ${fmtMillions(first.cash)} in ${firstShort}`,
      cls: curr.cash > first.cash ? "pos" : "neg",
    });
  }

  return kpis;
}

export function calculateHealthSignals(
  state: AppState,
  idx: number,
  fmtMillions: (n: number) => string,
) {
  const d = state.annual[idx];
  const prev5 = idx >= 5 ? state.annual[idx - 5] : null;

  const histStartIdx = Math.max(0, idx - 4);
  const histData = state.annual.slice(histStartIdx, idx + 1);

  const payrollRatio = wageBillRatio(d);
  const netDebtRatio =
    d.revenue_operating !== 0 ? netDebt(d) / d.revenue_operating : null;
  const transferReliance =
    d.revenue_operating + d.player_transfer_income !== 0
      ? d.player_transfer_income /
        (d.revenue_operating + d.player_transfer_income)
      : null;
  const revenueGrowth5y = prev5
    ? (d.revenue_operating - prev5.revenue_operating) / prev5.revenue_operating
    : null;
  const currentRatio =
    d.current_liabilities !== 0
      ? d.current_assets / d.current_liabilities
      : null;
  const recurringOpProfit = d.operating_result_excl_players;

  const payrollNotes = {
    low:
      (payrollRatio ?? 0) < 0.5
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

  const { strong, positive, mild, deep } = HEALTH_THRESHOLDS.equity;
  const equityNote =
    d.equity > strong
      ? state.isPt
        ? "Capital próprio positivo e sólido"
        : "Solid positive equity"
      : d.equity > positive
        ? state.isPt
          ? "Tornou-se positivo recentemente"
          : "Just turned positive"
        : d.equity > mild
          ? state.isPt
            ? "Ligeiramente negativo"
            : "Mildly negative"
          : d.equity > deep
            ? state.isPt
              ? "Muito negativo"
              : "Deeply negative"
            : state.isPt
              ? "Insolvência técnica"
              : "Technically insolvent";

  return [
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
      history: histData.map((y: FinancialRecord) => y.revenue_operating),
    },
    {
      id: "sigWage",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
      label: state.isPt ? "Custos com pessoal" : "Wage bill",
      value:
        payrollRatio !== null
          ? (payrollRatio * 100).toFixed(0) +
            "% " +
            (state.isPt ? "da receita" : "of revenue")
          : "—",
      status:
        payrollRatio === null
          ? "amber"
          : payrollRatio < HEALTH_THRESHOLDS.payrollRatio.warn
            ? "green"
            : payrollRatio < HEALTH_THRESHOLDS.payrollRatio.danger
              ? "amber"
              : "red",
      note:
        payrollRatio === null
          ? state.isPt
            ? "Sem receita registada"
            : "No revenue recorded"
          : payrollRatio < HEALTH_THRESHOLDS.payrollRatio.warn
            ? payrollNotes.low
            : payrollRatio < HEALTH_THRESHOLDS.payrollRatio.danger
              ? payrollNotes.mid
              : payrollNotes.high,
      history: histData.map((y: FinancialRecord) => wageBillRatio(y) || 0),
    },
    {
      id: "sigDebt",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
      label: state.isPt ? "Dívida líquida / receita" : "Net debt vs revenue",
      value:
        netDebtRatio !== null
          ? netDebtRatio.toFixed(1) +
            "× " +
            (state.isPt ? "receita" : "revenue")
          : "—",
      status:
        netDebtRatio === null
          ? "amber"
          : netDebtRatio < HEALTH_THRESHOLDS.netDebtRatio.warn
            ? "green"
            : netDebtRatio < HEALTH_THRESHOLDS.netDebtRatio.danger
              ? "amber"
              : "red",
      note:
        netDebtRatio === null
          ? state.isPt
            ? "Sem receita registada"
            : "No revenue recorded"
          : netDebtRatio < HEALTH_THRESHOLDS.netDebtRatio.warn
            ? state.isPt
              ? "Controlável"
              : "Manageable"
            : netDebtRatio < HEALTH_THRESHOLDS.netDebtRatio.danger
              ? state.isPt
                ? "Elevada — atenção"
                : "Elevated — watch it"
              : netDebtRatio < HEALTH_THRESHOLDS.netDebtRatio.crisis
                ? state.isPt
                  ? "Endividamento pesado"
                  : "Heavy debt load"
                : state.isPt
                  ? "Muito elevada — crise"
                  : "Very high — crisis territory",
      history: histData.map((y: FinancialRecord) =>
        y.revenue_operating !== 0 ? netDebt(y) / y.revenue_operating : 0,
      ),
    },
    {
      id: "sigTransfer",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
      label: state.isPt ? "Dependência de passes" : "Transfer reliance",
      value:
        transferReliance !== null
          ? (transferReliance * 100).toFixed(0) +
            "% " +
            (state.isPt ? "do rendimento total" : "of total income")
          : "—",
      status:
        transferReliance === null
          ? "amber"
          : transferReliance < HEALTH_THRESHOLDS.transferReliance.warn
            ? "green"
            : transferReliance < HEALTH_THRESHOLDS.transferReliance.danger
              ? "amber"
              : "red",
      note:
        transferReliance === null
          ? state.isPt
            ? "Sem receita registada"
            : "No revenue recorded"
          : transferReliance < HEALTH_THRESHOLDS.transferReliance.warn
            ? state.isPt
              ? "Rendimentos diversificados"
              : "Diversified income"
            : transferReliance < HEALTH_THRESHOLDS.transferReliance.danger
              ? state.isPt
                ? "Dependente de venda de jogadores"
                : "Reliant on player sales"
              : state.isPt
                ? "Altamente dependente de transferências"
                : "Very dependent on transfers",
      history: histData.map((y: FinancialRecord) =>
        y.revenue_operating + y.player_transfer_income !== 0
          ? y.player_transfer_income /
            (y.revenue_operating + y.player_transfer_income)
          : 0,
      ),
    },
    {
      id: "sigEquity",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
      label: state.isPt ? "Capital próprio" : "Equity",
      value: fmtMillions(d.equity),
      status:
        d.equity > strong ? "green" : d.equity > positive ? "amber" : "red",
      note: equityNote,
      history: histData.map((y: FinancialRecord) => y.equity),
    },
    {
      id: "sigCash",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>`,
      label: state.isPt ? "Saldo de caixa" : "Cash on hand",
      value: fmtMillions(d.cash),
      status:
        d.cash > HEALTH_THRESHOLDS.cash.warn
          ? "green"
          : d.cash > HEALTH_THRESHOLDS.cash.danger
            ? "amber"
            : "red",
      note:
        d.cash > HEALTH_THRESHOLDS.cash.warn
          ? state.isPt
            ? "Margem confortável"
            : "Comfortable buffer"
          : d.cash > HEALTH_THRESHOLDS.cash.danger
            ? state.isPt
              ? "Reduzido — risco mensal"
              : "Thin — one bad month matters"
            : state.isPt
              ? "Criticamente baixo"
              : "Critically low",
      history: histData.map((y: FinancialRecord) => y.cash),
    },
    {
      id: "sigOpProfit",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
      label: state.isPt ? "Resultado Oper. Recorrente" : "Recurring Op. Profit",
      value: fmtMillions(recurringOpProfit),
      status:
        recurringOpProfit > HEALTH_THRESHOLDS.recurringOpProfit.warn
          ? "green"
          : recurringOpProfit > HEALTH_THRESHOLDS.recurringOpProfit.danger
            ? "amber"
            : "red",
      note:
        recurringOpProfit > HEALTH_THRESHOLDS.recurringOpProfit.warn
          ? state.isPt
            ? "Lucro na atividade base"
            : "Profitable without transfers"
          : recurringOpProfit > HEALTH_THRESHOLDS.recurringOpProfit.danger
            ? state.isPt
              ? "Pequeno défice estrutural"
              : "Small structural deficit"
            : state.isPt
              ? "Défice estrutural acentuado"
              : "Deep structural deficit",
      history: histData.map(
        (y: FinancialRecord) => y.operating_result_excl_players,
      ),
    },
    {
      id: "sigCurrentRatio",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
      label: state.isPt ? "Rácio de Solvência" : "Current Ratio",
      value: currentRatio !== null ? currentRatio.toFixed(2) + "×" : "—",
      status:
        currentRatio === null
          ? "amber"
          : currentRatio >= HEALTH_THRESHOLDS.currentRatio.warn
            ? "green"
            : currentRatio >= HEALTH_THRESHOLDS.currentRatio.danger
              ? "amber"
              : "red",
      note:
        currentRatio === null
          ? state.isPt
            ? "Sem passivo corrente registado"
            : "No current liabilities recorded"
          : currentRatio >= HEALTH_THRESHOLDS.currentRatio.warn
            ? state.isPt
              ? "Cobre passivos correntes"
              : "Covers short-term liabilities"
            : currentRatio >= HEALTH_THRESHOLDS.currentRatio.danger
              ? state.isPt
                ? "Atenção à liquidez"
                : "Watch short-term liquidity"
              : state.isPt
                ? "Risco de liquidez alto"
                : "High short-term liquidity risk",
      history: histData.map((y: FinancialRecord) =>
        y.current_liabilities !== 0
          ? y.current_assets / y.current_liabilities
          : null,
      ),
    },
  ];
}
