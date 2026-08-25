import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import {
  calculateSquadCostImpact,
  DEFAULT_CALCULATOR_INPUTS,
  CALCULATOR_PRESETS,
} from "../../src/features/squadCostCalculatorCalculations.js";
import { SquadCostCalculator } from "../../src/features/SquadCostCalculator.js";
import { state } from "../../src/core/state.js";
import type { FinancialRecord } from "../../src/core/types.js";

const mockSeason: FinancialRecord = {
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

describe("calculateSquadCostImpact", () => {
  it("computes accurate amortization and annual squad cost impact", () => {
    // €20M fee + €2M agent = €22M over 5 years = €4.4M/yr amort + €3.2M wage = €7.6M/yr
    const result = calculateSquadCostImpact(
      {
        playerName: "Test Player",
        transferFee: 20.0,
        contractYears: 5,
        annualGrossWage: 3.2,
        agentFee: 2.0,
        transferWindow: "summer",
        targetSeason: "2025/26",
        offsetSaleFee: 0.0,
        offsetBookValue: 0.0,
        offsetWageSaved: 0.0,
      },
      mockSeason,
      true,
    );

    expect(result.annualAmortization).toBeCloseTo(4.4, 1);
    expect(result.annualSquadCostImpact).toBeCloseTo(7.6, 1);
    expect(result.baselineRatio).toBeCloseTo(52.5, 1);
    // baseline €105M squad cost + €7.6M = €112.6M / €200M revenue = 56.3%
    expect(result.projectedRatio).toBeCloseTo(56.3, 1);
    expect(result.status).toBe("green");
    expect(result.uefaHeadroom).toBeGreaterThan(0);
    expect(result.year1.ratio).toBeCloseTo(56.3, 1);
    expect(result.year2.ratio).toBeCloseTo(56.3, 1);
  });

  it("handles winter window with 6-month pro-rata impact in Year 1", () => {
    const result = calculateSquadCostImpact(
      {
        playerName: "Winter Signing",
        transferFee: 20.0,
        contractYears: 5,
        annualGrossWage: 4.0,
        agentFee: 0.0,
        transferWindow: "winter",
        targetSeason: "2025/26",
        offsetSaleFee: 0.0,
        offsetBookValue: 0.0,
        offsetWageSaved: 0.0,
      },
      mockSeason,
      true,
    );

    // Amortization = €4M/yr, Wage = €4M/yr -> in Year 1 (half year): €2M amort + €2M wage = +€4M
    expect(result.year1.squadCosts).toBeCloseTo(105 + 4, 1);
    expect(result.year2.squadCosts).toBeCloseTo(105 + 8, 1);
  });

  it("handles high fee signings pushing near or above UEFA 70% threshold", () => {
    const result = calculateSquadCostImpact(
      {
        playerName: "Super Star",
        transferFee: 50.0,
        contractYears: 5,
        annualGrossWage: 8.0,
        agentFee: 5.0,
        transferWindow: "summer",
        targetSeason: "2025/26",
        offsetSaleFee: 0.0,
        offsetBookValue: 0.0,
        offsetWageSaved: 0.0,
      },
      mockSeason,
      true,
    );

    expect(result.annualAmortization).toBe(11.0); // 55 / 5
    expect(result.annualSquadCostImpact).toBe(19.0); // 11 + 8
    expect(result.projectedRatio).toBeCloseTo(62.0, 1);
  });

  it("applies offset sales relief correctly and detects Year 2 post-sale dropoff", () => {
    const result = calculateSquadCostImpact(
      {
        playerName: "Replacement",
        transferFee: 25.0,
        contractYears: 5,
        annualGrossWage: 3.0,
        agentFee: 2.0,
        transferWindow: "summer",
        targetSeason: "2025/26",
        offsetSaleFee: 50.0,
        offsetBookValue: 10.0,
        offsetWageSaved: 2.5,
      },
      mockSeason,
      false,
    );

    // Year 1 revenue includes €40M gain (200 -> 240)
    expect(result.year1.totalRevenue).toBe(240.0);
    // Year 2 revenue reverts to €200M
    expect(result.year2.totalRevenue).toBe(200.0);
    expect(result.year1.status).toBe("green");
  });
});

describe("SquadCostCalculator Component", () => {
  beforeEach(() => {
    state.annual = [mockSeason];
    state.isPt = true;
  });

  it("renders the calculator controls, preset buttons and impact tiles", () => {
    render(<SquadCostCalculator />);
    expect(
      screen.getByText(
        /Calculador de Impacto de Contratações \(UEFA Squad Cost Rule\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Custo de Aquisição \(Passe\):/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Salário Bruto Anual:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Projeção Plurianual do Rácio UEFA/i),
    ).toBeInTheDocument();
  });

  it("allows selecting quick deal presets", () => {
    render(<SquadCostCalculator />);
    const starPresetBtn = screen.getByText(/Contratação Estrela/i);
    fireEvent.click(starPresetBtn);
    expect(starPresetBtn.className).toContain("active");
  });

  it("allows switching between Summer and Winter transfer windows", () => {
    render(<SquadCostCalculator />);
    const winterBtn = screen.getByRole("button", { name: /Inverno \(6m\)/i });
    fireEvent.click(winterBtn);
    expect(winterBtn.className).toContain("active");
  });
});
