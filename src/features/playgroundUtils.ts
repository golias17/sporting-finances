import { state } from "../core/state";
import { UCL_BONUS_COST_RATE } from "./playgroundTypes.js";
import type { PlaygroundInputs, BaselineData, ProjectionData, PinnedData } from "./playgroundTypes.js";

function getBaseline() {
  const season = state.annual?.find((s: { label: string }) => s.label === "2024/25");
  if (!season) return null;
  return {
    revenue_operating: season.revenue_operating,
    personnel_costs: season.personnel_costs,
    external_supplies: season.external_supplies,
    da_excl_squad: season.da_excl_squad,
    squad_amortization: season.squad_amortization_impairment,
    player_transfer_cost: season.player_transfer_cost,
    player_transfer_income: season.player_transfer_income,
    financial_result: season.financial_result,
    net_result: season.net_result,
    equity: season.equity,
    current_assets: season.current_assets,
    current_liabilities: season.current_liabilities,
    total_assets: season.total_assets,
    cash: season.cash,
  };
}

function computeProjection(
  BASELINE: BaselineData,
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
  const uclBonusCost = uclPrize > 0 ? uclPrize * 1000 * UCL_BONUS_COST_RATE : 0;
  const payroll =
    BASELINE.personnel_costs * (1 + payrollAdj / 100) - uclBonusCost;
  const overhead = BASELINE.external_supplies * (1 + capexAdj / 100);

  const sales =
    salesTarget === 117
      ? BASELINE.player_transfer_income
      : salesTarget * 1000;
  const amortization =
    BASELINE.squad_amortization -
    (purchasesTarget - 30) * 1000 * 0.2;
  const netTrading = sales + amortization + BASELINE.player_transfer_cost;

  const interestSavings = debtRepayTarget * 1000 * 0.02;
  const financialResult = BASELINE.financial_result + interestSavings;

  const modeledBaselineNet =
    BASELINE.revenue_operating +
    BASELINE.personnel_costs +
    BASELINE.external_supplies +
    BASELINE.da_excl_squad +
    (BASELINE.player_transfer_income +
      BASELINE.squad_amortization +
      BASELINE.player_transfer_cost) +
    BASELINE.financial_result;
  const unmodeledCostsAdjustment = BASELINE.net_result - modeledBaselineNet;

  const netResult =
    revenue +
    payroll +
    overhead +
    BASELINE.da_excl_squad +
    netTrading +
    financialResult +
    unmodeledCostsAdjustment;
  const equity = BASELINE.equity + netResult - BASELINE.net_result;
  const cash = BASELINE.cash + netResult - BASELINE.net_result;
  const solvency =
    BASELINE.total_assets > 0
      ? (equity / BASELINE.total_assets) * 100
      : 0;
  const personnelCostRatio = revenue > 0 ? (Math.abs(payroll) / revenue) * 100 : 0;

  return {
    revenue,
    payroll,
    overhead,
    financialResult,
    netTrading,
    netResult,
    equity,
    cash,
    solvency,
    personnelCostRatio,
  };
}

function equityZoneInfo(equity: number, isPt: boolean) {
  if (equity < 0)
    return { label: isPt ? "Negativo (Insolvência)" : "Negative (Insolvency)", cls: "neg" };
  if (equity < 20000)
    return { label: isPt ? "Zona de Risco" : "Risk Zone", cls: "warn" };
  return { label: isPt ? "Saudável" : "Healthy", cls: "pos" };
}

function cashZoneInfo(cash: number, isPt: boolean) {
  if (cash < 0)
    return { label: isPt ? "Negativo" : "Negative", cls: "neg" };
  if (cash < 10000)
    return { label: isPt ? "Baixo (Risco)" : "Low (Risk)", cls: "warn" };
  return { label: isPt ? "Confortável" : "Comfortable", cls: "pos" };
}

function buildVerdict(
  baseline: ProjectionData,
  proj: ProjectionData,
  isPt: boolean,
) {
  const improvements: string[] = [];
  const warnings: string[] = [];

  if (proj.netResult > 0) improvements.push(isPt ? "lucro" : "profit");
  else if (proj.netResult <= 0) warnings.push(isPt ? "prejuízo" : "loss");

  if (proj.equity > baseline.equity) improvements.push(isPt ? "capital próprio" : "equity");
  else if (proj.equity < baseline.equity) warnings.push(isPt ? "capital próprio" : "equity");

  if (proj.cash > baseline.cash) improvements.push(isPt ? "liquidez" : "liquidity");
  else if (proj.cash < baseline.cash) warnings.push(isPt ? "liquidez" : "liquidity");

  const revDir = baseline.revenue > 0 ? ((proj.revenue - baseline.revenue) / Math.abs(baseline.revenue)) * 100 : 0;
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

function scenarioLabels(isPt: boolean) {
  return {
    baseline: isPt
      ? "Linha de Base 2025/26 (sem alterações)"
      : "Baseline 2025/26 (no changes)",
    projected: isPt ? "A Sua Projeção 2025/26" : "Your Projection 2025/26",
    pinned: isPt ? "Cenário Fixado" : "Pinned Scenario",
  };
}

function getSliderBackground(val: number, min: number, max: number) {
  const percentage = ((val - min) / (max - min)) * 100;
  return `linear-gradient(to right, var(--green, #0a5d3a) ${percentage}%, var(--rule-2, #e5e5e5) ${percentage}%)`;
}

export { getBaseline, computeProjection, equityZoneInfo, cashZoneInfo, buildVerdict, scenarioLabels, getSliderBackground };
