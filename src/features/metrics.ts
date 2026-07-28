// metrics.ts — barrel file
// Re-exports from the split modules for backward compatibility.
export { netDebt, wageBillRatio, revenueGrowthPct, consecutiveProfitableYears, getLatestH1Data } from "./financialMetrics.js";
export { calculateKpis, calculateHealthSignals } from "./kpiCalculations.js";
