import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { state } from "../../src/core/state";
import { UsppTerms } from "../../src/features/bonds/UsppTerms";
import { LionFinance } from "../../src/features/bonds/LionFinance";

describe("UsppTerms", () => {
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
          net_result: 5000,
          equity: 30000,
          cash: 10000,
          current_assets: 50000,
          current_liabilities: 30000,
          total_assets: 200000,
          borrowings_nc: 80000,
          borrowings_c: 30000,
          player_transfer_income: 25000,
          player_transfer_cost: -10000,
          financial_result: -3000,
        },
      ],
    });
  });

  it("renders USPP instrument label", () => {
    state.setIsPt(false);
    render(<UsppTerms />);
    expect(screen.getByText("USPP Bond")).toBeInTheDocument();
  });

  it("renders Portuguese terms when isPt is true", () => {
    state.setIsPt(true);
    render(<UsppTerms />);
    expect(screen.getByText("USPP Bond")).toBeInTheDocument();
  });
});

describe("LionFinance", () => {
  beforeEach(() => {
    state.setIsPt(false);
    state.setDataset({
      annual_data: [
        {
          label: "2024/25",
          revenue_operating: 150000,
          personnel_costs: -90000,
          external_supplies: -20000,
          da_excl_squad: -5000,
          squad_amortization_impairment: -15000,
          net_result: 5000,
          equity: 30000,
          cash: 10000,
          current_assets: 50000,
          current_liabilities: 30000,
          total_assets: 200000,
          borrowings_nc: 80000,
          borrowings_c: 30000,
          player_transfer_income: 25000,
          player_transfer_cost: -10000,
          financial_result: -3000,
        },
      ],
    });
  });

  it("renders Lion Finance tabs", () => {
    render(<LionFinance />);
    expect(screen.getAllByText(/Lion Finance/i).length).toBeGreaterThan(0);
  });
});
