import { describe, it, expect, beforeEach } from "vitest";
import { state } from "../../src/core/state";
import {
  getBaseline,
  computeProjection,
  equityZoneInfo,
  cashZoneInfo,
  buildVerdict,
  scenarioLabels,
  getSliderBackground,
} from "../../src/features/playgroundUtils";

describe("playgroundUtils", () => {
  beforeEach(() => {
    state.setDataset({
      annual_data: [
        {
          label: "2024/25",
          revenue_operating: 150000,
          personnel_costs: -90000,
          external_supplies: -20000,
          da_excl_squad: -5000,
          squad_amortization_impairment: -15000,
          player_transfer_cost: -10000,
          player_transfer_income: 25000,
          financial_result: -3000,
          net_result: 5000,
          equity: 30000,
          current_assets: 50000,
          current_liabilities: 30000,
          total_assets: 200000,
          cash: 10000,
        },
      ],
    });
  });

  it("getBaseline returns correct values", () => {
    const baseline = getBaseline();
    expect(baseline).not.toBeNull();
    expect(baseline!.revenue_operating).toBe(150000);
    expect(baseline!.personnel_costs).toBe(-90000);
    expect(baseline!.net_result).toBe(5000);
  });

  it("getBaseline returns null when no 2024/25 season", () => {
    state.setDataset({
      annual_data: [
        {
          label: "2023/24",
          revenue_operating: 100000,
          net_result: 3000,
          equity: 20000,
          cash: 5000,
        },
      ],
    });
    const baseline = getBaseline();
    expect(baseline).toBeNull();
  });

  it("equityZoneInfo returns correct zones", () => {
    expect(equityZoneInfo(-1000, false).cls).toBe("neg");
    expect(equityZoneInfo(10000, false).cls).toBe("warn");
    expect(equityZoneInfo(50000, false).cls).toBe("pos");
  });

  it("equityZoneInfo returns Portuguese labels", () => {
    expect(equityZoneInfo(-1000, true).label).toContain("Negativo");
    expect(equityZoneInfo(10000, true).label).toContain("Risco");
    expect(equityZoneInfo(50000, true).label).toContain("Saudável");
  });

  it("cashZoneInfo returns correct zones", () => {
    expect(cashZoneInfo(-100, false).cls).toBe("neg");
    expect(cashZoneInfo(5000, false).cls).toBe("warn");
    expect(cashZoneInfo(50000, false).cls).toBe("pos");
  });

  it("scenarioLabels returns correct labels", () => {
    const en = scenarioLabels(false);
    expect(en.baseline).toContain("Baseline");
    expect(en.projected).toContain("Your Projection");
    const pt = scenarioLabels(true);
    expect(pt.baseline).toContain("Linha de Base");
  });

  it("getSliderBackground returns gradient string", () => {
    const result = getSliderBackground(50, 0, 100);
    expect(result).toBe(
      "linear-gradient(to right, var(--green, #0a5d3a) 50%, var(--rule-2, #e5e5e5) 50%)",
    );
  });

  it("buildVerdict generates text for improvement scenario", () => {
    const baseline = {
      revenue: 150000,
      payroll: 90000,
      netResult: 5000,
      equity: 30000,
      cash: 10000,
      solvency: 20,
      overhead: 20000,
      financialResult: -3000,
      netTrading: 5000,
      personnelCostRatio: 60,
    };
    const proj = {
      revenue: 180000,
      payroll: 95000,
      netResult: 15000,
      equity: 40000,
      cash: 15000,
      solvency: 25,
      overhead: 20000,
      financialResult: -3000,
      netTrading: 5000,
      personnelCostRatio: 53,
    };
    const verdict = buildVerdict(baseline, proj, false);
    expect(verdict.text).toContain("improves");
    expect(verdict.warn).toBe(false);
  });

  it("buildVerdict generates warning for worsening scenario", () => {
    const baseline = {
      revenue: 150000,
      payroll: 90000,
      netResult: 5000,
      equity: 30000,
      cash: 10000,
      solvency: 20,
      overhead: 20000,
      financialResult: -3000,
      netTrading: 5000,
      personnelCostRatio: 60,
    };
    const proj = {
      revenue: 140000,
      payroll: 95000,
      netResult: -10000,
      equity: 15000,
      cash: -5000,
      solvency: 10,
      overhead: 20000,
      financialResult: -3000,
      netTrading: 5000,
      personnelCostRatio: 68,
    };
    const verdict = buildVerdict(baseline, proj, false);
    expect(verdict.text).toContain("Watch");
    expect(verdict.warn).toBe(true);
  });

  it("buildVerdict uses Portuguese correctly", () => {
    const baseline = {
      revenue: 150000,
      payroll: 90000,
      netResult: 5000,
      equity: 30000,
      cash: 10000,
      solvency: 20,
      overhead: 20000,
      financialResult: -3000,
      netTrading: 5000,
      personnelCostRatio: 60,
    };
    const proj = {
      revenue: 180000,
      payroll: 95000,
      netResult: 15000,
      equity: 40000,
      cash: 15000,
      solvency: 25,
      overhead: 20000,
      financialResult: -3000,
      netTrading: 5000,
      personnelCostRatio: 53,
    };
    const verdict = buildVerdict(baseline, proj, true);
    expect(verdict.text).toContain("melhora");
  });

  it("computeProjection returns projected values with default inputs", () => {
    const baseline = {
      revenue_operating: 150000,
      personnel_costs: -90000,
      external_supplies: -20000,
      da_excl_squad: -5000,
      squad_amortization: -15000,
      player_transfer_cost: -10000,
      player_transfer_income: 25000,
      financial_result: -3000,
      net_result: 5000,
      equity: 30000,
      cash: 10000,
      total_assets: 200000,
    };
    const inputs = {
      uclPrize: 0,
      payrollAdj: 0,
      salesTarget: 117,
      purchasesTarget: 30,
      capexAdj: 0,
      debtRepayTarget: 0,
      revGrowthAdj: 0,
    };
    const result = computeProjection(baseline, inputs, false);
    expect(result).not.toBeNull();
    expect(result!.revenue).toBe(150000);
    expect(result!.netResult).toBeGreaterThan(0);
  });

  it("computeProjection applies revenue growth adjustment", () => {
    const baseline = {
      revenue_operating: 150000,
      personnel_costs: -90000,
      external_supplies: -20000,
      da_excl_squad: -5000,
      squad_amortization: -15000,
      player_transfer_cost: -10000,
      player_transfer_income: 25000,
      financial_result: -3000,
      net_result: 5000,
      equity: 30000,
      cash: 10000,
      total_assets: 200000,
    };
    const inputs = {
      uclPrize: 0,
      payrollAdj: 0,
      salesTarget: 117,
      purchasesTarget: 30,
      capexAdj: 0,
      debtRepayTarget: 0,
      revGrowthAdj: 10,
    };
    const result = computeProjection(baseline, inputs, false);
    expect(result).not.toBeNull();
    expect(result!.revenue).toBe(165000); // 150000 + 10% + 0 uclPrize // 150000 + 10%
    expect(result!.netResult).toBe(20000); // 5000 + 15000 revenue increase (roughly)
  });

  it("computeProjection uses Portuguese labels", () => {
    const baseline = {
      revenue_operating: 150000,
      personnel_costs: -90000,
      external_supplies: -20000,
      da_excl_squad: -5000,
      squad_amortization: -15000,
      player_transfer_cost: -10000,
      player_transfer_income: 25000,
      financial_result: -3000,
      net_result: 5000,
      equity: 30000,
      cash: 10000,
      total_assets: 200000,
    };
    const inputs = {
      uclPrize: 0,
      payrollAdj: 0,
      salesTarget: 117,
      purchasesTarget: 30,
      capexAdj: 0,
      debtRepayTarget: 0,
      revGrowthAdj: 0,
    };
    const result = computeProjection(baseline, inputs, true);
    expect(result).not.toBeNull();
    expect(result!.revenue).toBe(150000);
  });
});
