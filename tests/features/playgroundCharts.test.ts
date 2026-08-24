import { describe, it, expect, vi } from "vitest";
import React from "react";

// Mock React.useMemo to just call the factory function
vi.spyOn(React, "useMemo").mockImplementation((fn: () => any) => fn());

// Import after mocking
import { usePlaygroundCharts } from "../../src/features/playgroundCharts";

describe("usePlaygroundCharts", () => {
  const baseline = {
    revenue: 150000,
    payroll: 90000,
    overhead: 20000,
    financialResult: -3000,
    netTrading: 5000,
    netResult: 5000,
    equity: 30000,
    cash: 10000,
    solvency: 20,
    personnelCostRatio: 60,
  };
  const proj = {
    revenue: 180000,
    payroll: 95000,
    overhead: 20000,
    financialResult: -3000,
    netTrading: 5000,
    netResult: 15000,
    equity: 40000,
    cash: 15000,
    solvency: 25,
    personnelCostRatio: 53,
  };

  it("returns null when baseline is null", () => {
    const result = usePlaygroundCharts(null as any, proj, null, false);
    expect(result).toBeNull();
  });

  it("returns null when proj is null", () => {
    const result = usePlaygroundCharts(baseline, null as any, null, false);
    expect(result).toBeNull();
  });

  it("returns chart data with netData, netOptions, solvencyData", () => {
    const result = usePlaygroundCharts(baseline, proj, null, false);
    expect(result).not.toBeNull();
    expect(result!.netData).toBeDefined();
    expect(result!.netOptions).toBeDefined();
    expect(result!.netPlugins).toBeDefined();
    expect(result!.solvencyData).toBeDefined();
    expect(result!.solvencyOptions).toBeDefined();
  });

  it("includes pinned scenario data when provided", () => {
    const pinned = {
      revenue: 160000,
      payroll: 92000,
      overhead: 20000,
      financialResult: -3000,
      netTrading: 5000,
      netResult: 8000,
      equity: 35000,
      solvency: 22,
    };
    const result = usePlaygroundCharts(baseline, proj, pinned, false);
    expect(result).not.toBeNull();
    // With pinned, solvency data has 3 labels (baseline, projected, pinned)
    expect(result!.solvencyData.labels.length).toBe(3);
  });

  it("uses Portuguese labels when isPt is true", () => {
    const result = usePlaygroundCharts(baseline, proj, null, true);
    expect(result).not.toBeNull();
    expect(result!.netData.labels[0]).toBe("Receita");
  });

  it("uses English labels when isPt is false", () => {
    const result = usePlaygroundCharts(baseline, proj, null, false);
    expect(result).not.toBeNull();
    expect(result!.netData.labels[0]).toBe("Revenue");
  });
});
