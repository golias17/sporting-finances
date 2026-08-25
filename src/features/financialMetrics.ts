import type {
  FinancialDataset,
  FinancialRecord,
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
  if (!d) return 0;
  if (d.net_debt !== undefined) return d.net_debt;
  const nc = d.borrowings_nc || 0;
  const c = d.borrowings_c || 0;
  const cash = d.cash || 0;
  return nc + c - cash;
}

/**
 * Total liabilities (current + non-current liabilities) for a single season.
 */
/**
 * Operating EBITDA (excluding player transfer gains/amortizations).
 */
/**
 * Total EBITDA (including operating result from player transfers).
 */
/**
 * Net transfer debt: total payables to clubs minus total receivables from clubs.
 */
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
  if (!d) return null;
  if (d.wage_ratio !== undefined) return d.wage_ratio / 100;
  const rev = d.revenue_operating;
  const payroll = d.personnel_costs;
  if (!Number.isFinite(rev) || rev === 0 || !Number.isFinite(payroll))
    return null;
  return Math.abs(payroll) / rev;
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
