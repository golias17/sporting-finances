import { state } from "../core/state";
import {
  getLatestH1Data,
  netDebt,
  revenueGrowthPct,
  consecutiveProfitableYears,
} from "./metrics.js";
import { UCL_BONUS_COST_RATE } from "./playgroundTypes.js";
import type { PlaygroundInputs, ZoneInfo } from "./playgroundTypes.js";

export function getBaseline() {
  const season = state.annual?.find((s: { label: string }) => s.label === "2024/25");
  if (!season) return null;
  const h1Data = getLatestH1Data(state.DATASET);
  const halfYearBonus = h1Data
    ? (h1Data?.player_transfer_income || 0) -
      (h1Data?.player_transfer_cost || 0)
    : 0;

  return {
    revenue_operating: season.revenue_operating,
    personnel_costs: Math.abs(season.personnel_costs),
    net_result: season.net_result,
    equity: season.equity,
    cash: season.cash,
  };
}

export function computeProjection(
  BASELINE: { revenue_operating: number; personnel_costs: number; net_result: number; equity: number; cash: number },
  {
    uclPrize,
    payrollAdj,
    salesTarget,
    purchasesTarget,
    capexAdj,
    debtRepayTarget,
    revGrowthAdj,
  }: PlaygroundInputs,
) {
  const revenue =
    BASELINE.revenue_operating * (1 + (revGrowthAdj || 0) / 100) +
    uclPrize * 1000 +
    (uclPrize > 0 ? 8000 : 0);
  const wages = BASELINE.personnel_costs * (1 + (payrollAdj || 0) / 100);
  const modelTransfer =
    ((salesTarget || 0) - (purchasesTarget || 0) - (salesTarget || 0) * UCL_BONUS_COST_RATE) * 1000;
  const modeledBaselineNet =
    BASELINE.revenue_operating - BASELINE.personnel_costs;
  const unmodeledCostsAdjustment = BASELINE.net_result - modeledBaselineNet;
  const capex = (capexAdj || 0) * 1000;
  const netResult =
    revenue - wages + modelTransfer + unmodeledCostsAdjustment - capex;
  const eqChange = netResult - BASELINE.net_result;
  const equity = BASELINE.equity + eqChange;
  const debtRepay = (debtRepayTarget || 0) * 1000;
  const cashChange = netResult - (capex + debtRepay);
  const personnelCostRatio = revenue > 0 ? (wages / revenue) * 100 : 0;
  const cash_ = BASELINE.cash + cashChange;
  return { revenue, wages, netResult, equity, cash: cash_, personnelCostRatio };
}

export function equityZoneInfo(equity: number, isPt: boolean): ZoneInfo {
  if (equity < 0)
    return { label: isPt ? "Negativo (Insolvência)" : "Negative (Insolvency)", cls: "neg" };
  if (equity < 20000)
    return { label: isPt ? "Zona de Risco" : "Risk Zone", cls: "warn" };
  return { label: isPt ? "Saudável" : "Healthy", cls: "pos" };
}

export function cashZoneInfo(cash: number, isPt: boolean): ZoneInfo {
  if (cash < 0)
    return { label: isPt ? "Negativo" : "Negative", cls: "neg" };
  if (cash < 10000)
    return { label: isPt ? "Baixo (Risco)" : "Low (Risk)", cls: "warn" };
  return { label: isPt ? "Confortável" : "Comfortable", cls: "pos" };
}

export function buildVerdict(
  baseline: { revenue_operating: number; personnel_costs: number; net_result: number; equity: number; cash: number },
  proj: { revenue_operating: number; personnel_costs: number; net_result: number; equity: number; cash: number },
  isPt: boolean,
) {
  const diff = (key: "net_result" | "equity" | "cash") => proj[key] - baseline[key];
  const pct = (key: "revenue_operating" | "personnel_costs") =>
    baseline[key] !== 0 ? ((proj[key] - baseline[key]) / Math.abs(baseline[key])) * 100 : 0;

  const improvements: string[] = [];
  const warnings: string[] = [];

  if (proj.net_result > 0) improvements.push(isPt ? "lucro" : "profit");
  else if (proj.net_result <= 0) warnings.push(isPt ? "prejuízo" : "loss");

  if (diff("equity") > 0) improvements.push(isPt ? "capital próprio" : "equity");
  else if (diff("equity") < 0) warnings.push(isPt ? "capital próprio" : "equity");

  if (diff("cash") > 0) improvements.push(isPt ? "liquidez" : "liquidity");
  else if (diff("cash") < 0) warnings.push(isPt ? "liquidez" : "liquidity");

  const revDir = pct("revenue_operating");
  const isRevUp = revDir > 1;
  const revenueNote = isRevUp
    ? isPt
      ? `Receita +${revDir.toFixed(0)}%`
      : `Revenue +${revDir.toFixed(0)}%`
    : isPt
      ? `Receita ${revDir.toFixed(0)}%`
      : `Revenue ${revDir.toFixed(0)}%`;

  const textParts: string[] = [];
  if (improvements.length > 0) {
    textParts.push(
      isPt
        ? `Este cenário melhora ${improvements.join(", ")}.`
        : `This scenario improves ${improvements.join(", ")}.`,
    );
  }
  if (warnings.length > 0) {
    textParts.push(
      isPt
        ? `Atenção ao impacto negativo em ${warnings.join(", ")}.`
        : `Watch for negative impact on ${warnings.join(", ")}.`,
    );
  }
  textParts.push(revenueNote + ".");

  const text = textParts.join(" ");
  const warn = warnings.length > improvements.length;

  return { text, warn };
}

export function scenarioLabels(isPt: boolean) {
  return {
    baseline: isPt
      ? "Linha de Base 2025/26 (sem alterações)"
      : "Baseline 2025/26 (no changes)",
    projected: isPt ? "A Sua Projeção 2025/26" : "Your Projection 2025/26",
    pinned: isPt ? "Cenário Fixado" : "Pinned Scenario",
  };
}

export function getSliderBackground(val: number, min: number, max: number) {
  const pct = ((val - min) / (max - min)) * 100;
  return pct;
}
