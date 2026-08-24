import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { calculateUefaRadar } from "../../src/features/uefaRadarCalculations.js";
import { UefaRadar } from "../../src/features/UefaRadar.js";
import { state } from "../../src/core/state.js";
import type { FinancialRecord } from "../../src/core/types.js";

const mockRecord2024: FinancialRecord = {
  season: "2024/25",
  label: "2024/25",
  year_end: "2025-06-30",
  revenue_operating: 140000,
  player_transfer_income: 60000,
  player_transfer_cost: 30000,
  personnel_costs: -80000,
  external_supplies: -35000,
  da_excl_squad: -5000,
  operating_result_excl_players: 20000,
  squad_amortization_impairment: -25000,
  operating_result_total: 25000,
  financial_result: -12000,
  net_result: 15000,
  total_assets: 350000,
  current_assets: 120000,
  current_liabilities: 110000,
  non_current_liabilities: 150000,
  equity: 90000,
  borrowings_nc: 100000,
  borrowings_c: 20000,
  cash: 30000,
  squad_book_value: 80000,
  squad_market_value: 400000,
  ebitda_total: 55000,
};

const mockRecordCrisis2013: FinancialRecord = {
  season: "2012/13",
  label: "2012/13",
  year_end: "2013-06-30",
  revenue_operating: 45000,
  player_transfer_income: 15000,
  player_transfer_cost: 10000,
  personnel_costs: -55000,
  external_supplies: -25000,
  da_excl_squad: -4000,
  operating_result_excl_players: -39000,
  squad_amortization_impairment: -18000,
  operating_result_total: -42000,
  financial_result: -18000,
  net_result: -60000,
  total_assets: 180000,
  current_assets: 30000,
  current_liabilities: 95000,
  non_current_liabilities: 180000,
  equity: -95000,
  borrowings_nc: 120000,
  borrowings_c: 50000,
  cash: 5000,
  squad_book_value: 35000,
  ebitda_total: -20000,
};

describe("calculateUefaRadar", () => {
  it("calculates compliant FSR scores for healthy seasons", () => {
    const result = calculateUefaRadar(mockRecord2024, false);
    expect(result.seasonLabel).toBe("2024/25");
    expect(result.pillars).toHaveLength(5);
    expect(result.overallScore).toBeGreaterThanOrEqual(70);
    expect(result.overallStatus).toBe("green");

    const scrPillar = result.pillars.find((p) => p.id === "scr");
    expect(scrPillar?.status).toBe("green");
    expect(scrPillar?.actualValueStr).toBe("52.5%"); // (80000+25000)/(140000+60000) = 105k/200k = 52.5%

    const solvencyPillar = result.pillars.find((p) => p.id === "solvency");
    expect(solvencyPillar?.status).toBe("green");
  });

  it("calculates non-compliant scores for crisis seasons", () => {
    const result = calculateUefaRadar(mockRecordCrisis2013, true);
    expect(result.overallStatus).toBe("red");
    expect(result.overallScore).toBeLessThan(50);

    const solvencyPillar = result.pillars.find((p) => p.id === "solvency");
    expect(solvencyPillar?.status).toBe("red");
  });

  it("gracefully handles null/empty input", () => {
    const result = calculateUefaRadar(null as any, false);
    expect(result.overallScore).toBe(0);
    expect(result.pillars).toHaveLength(0);
  });
});

describe("UefaRadar Component", () => {
  beforeEach(() => {
    state.annual = [mockRecordCrisis2013, mockRecord2024];
    state.isPt = true;
  });

  it("renders the radar chart and 5 pillar summary cards", () => {
    render(<UefaRadar />);
    expect(
      screen.getByText(
        /Radar de Sustentabilidade Financeira & Conformidade UEFA FSR/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Rácio Custos com Plantel \(UEFA FSR\)/i).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByText(/Solvabilidade e Autonomia Financeira/i).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("allows switching active season and comparative era", () => {
    render(<UefaRadar />);
    const seasonButtons = screen.getAllByRole("button");
    const crisisBtn = seasonButtons.find((b) =>
      b.textContent?.includes("2012/13"),
    );
    if (crisisBtn) {
      fireEvent.click(crisisBtn);
      expect(crisisBtn.className).toContain("active");
    }
  });
});
