export interface StressTestInputs {
  uclShock: number; // in €M (0 to 60)
  transfersShock: number; // in €M (0 to 45)
  costInflation: number; // in % (0 to 25)
  rateShock: number; // in bps (0 to 300)
}

export const STRESS_PRESETS: Record<string, StressTestInputs> = {
  base: {
    uclShock: 0,
    transfersShock: 0,
    costInflation: 0,
    rateShock: 0,
  },
  no_ucl_1y: {
    uclShock: 35,
    transfersShock: 15,
    costInflation: 5,
    rateShock: 50,
  },
  winter_2y: {
    uclShock: 50,
    transfersShock: 30,
    costInflation: 10,
    rateShock: 150,
  },
  perfect_storm: {
    uclShock: 60,
    transfersShock: 45,
    costInflation: 20,
    rateShock: 250,
  },
};

export interface MonthlyCashPoint {
  month: number;
  label: string;
  cashBalance: number; // in €M
  netCashFlow: number; // in €M
  isDeficit: boolean;
}

export interface StressSimulationResult {
  monthlyTrajectory: MonthlyCashPoint[];
  cashRunwayMonths: number; // 1 to 24 (or 24 for >24)
  finalCashBalance: number; // in €M
  minCashBalance: number; // in €M
  projectedEquity24: number; // in €M
  requiredAssetSales: number; // in €M
  verdictType: "safe" | "warning" | "danger";
}

const MONTH_LABELS = [
  "M01 (Jul)", "M02 (Ago)", "M03 (Set)", "M04 (Out)", "M05 (Nov)", "M06 (Dez)",
  "M07 (Jan)", "M08 (Fev)", "M09 (Mar)", "M10 (Abr)", "M11 (Mai)", "M12 (Jun)",
  "M13 (Jul)", "M14 (Ago)", "M15 (Set)", "M16 (Out)", "M17 (Nov)", "M18 (Dez)",
  "M19 (Jan)", "M20 (Fev)", "M21 (Mar)", "M22 (Abr)", "M23 (Mai)", "M24 (Jun)"
];

export function runStressSimulation(
  inputs: StressTestInputs,
  initialCash = 33.3, // in €M (2024/25 actual)
  initialEquity = 40.9, // in €M (2024/25 actual)
): StressSimulationResult {
  const baseAnnualRevenue = 148.1; // in €M
  const baseAnnualCosts = 135.0; // in €M (Operating costs)
  const baseAnnualTransfers = 45.0; // in €M (Net player trading)
  const baseAnnualDebtService = 18.0; // in €M

  // Apply shocks
  const stressedAnnualRevenue = Math.max(70.0, baseAnnualRevenue - inputs.uclShock);
  const stressedAnnualCosts = baseAnnualCosts * (1 + inputs.costInflation / 100);
  const stressedAnnualTransfers = Math.max(0, baseAnnualTransfers - inputs.transfersShock);
  const rateImpact = (inputs.rateShock / 10000) * 55.0; // on ~€55M variable debt
  const stressedAnnualDebtService = baseAnnualDebtService + rateImpact;

  // Annual Net Operating result impact for Equity
  const annualNetResult =
    stressedAnnualRevenue + stressedAnnualTransfers - stressedAnnualCosts - stressedAnnualDebtService;
  const projectedEquity24 = initialEquity + (annualNetResult * 2);

  // Month-by-month cash trajectory
  const monthlyTrajectory: MonthlyCashPoint[] = [];
  let currentCash = initialCash;
  let minCash = initialCash;
  let runwayMonths = 24;
  let hasHitZero = false;

  for (let m = 0; m < 24; m++) {
    const monthIndex = m % 12;

    // Seasonality factors
    let revenueMultiplier = 1.0;
    let transferMultiplier = 0.5;

    if (monthIndex === 0 || monthIndex === 1) {
      // Jul/Aug: Season tickets & Summer transfer window
      revenueMultiplier = 1.3;
      transferMultiplier = 2.2;
    } else if (monthIndex === 6) {
      // Jan: Winter window
      transferMultiplier = 1.5;
    } else if (monthIndex === 10 || monthIndex === 11) {
      // May/Jun: Season closure
      revenueMultiplier = 0.8;
      transferMultiplier = 0.8;
    }

    const monthlyRev = (stressedAnnualRevenue / 12) * revenueMultiplier;
    const monthlyCost = stressedAnnualCosts / 12;
    const monthlyTransfers = (stressedAnnualTransfers / 12) * transferMultiplier;
    const monthlyDebt = stressedAnnualDebtService / 12;

    const netMonthlyCashFlow = (monthlyRev + monthlyTransfers) - (monthlyCost + monthlyDebt);
    currentCash += netMonthlyCashFlow;

    if (currentCash < minCash) minCash = currentCash;

    if (currentCash <= 0 && !hasHitZero) {
      runwayMonths = m + 1;
      hasHitZero = true;
    }

    monthlyTrajectory.push({
      month: m + 1,
      label: MONTH_LABELS[m] || `M${m + 1}`,
      cashBalance: currentCash,
      netCashFlow: netMonthlyCashFlow,
      isDeficit: currentCash < 0,
    });
  }

  const finalCashBalance = currentCash;
  const requiredAssetSales = Math.max(0, 10.0 - minCash); // Buffer to preserve €10M min liquidity

  let verdictType: "safe" | "warning" | "danger" = "safe";
  if (runwayMonths < 18 || finalCashBalance < 0 || projectedEquity24 < 0) {
    verdictType = "danger";
  } else if (minCash < 10.0 || runwayMonths < 24) {
    verdictType = "warning";
  }

  return {
    monthlyTrajectory,
    cashRunwayMonths: runwayMonths,
    finalCashBalance,
    minCashBalance: minCash,
    projectedEquity24,
    requiredAssetSales,
    verdictType,
  };
}

export function getStressSliderBackground(val: number, min: number, max: number): string {
  const pct = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
  const activeColor = val === 0 ? "var(--green, #0a5d3a)" : pct > 50 ? "var(--neg, #b8403a)" : "var(--gold, #c8a951)";
  return `linear-gradient(to right, ${activeColor} ${pct}%, var(--rule-2, #e5e5e5) ${pct}%)`;
}
