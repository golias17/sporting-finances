import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { PlaygroundTab } from "../../src/features/tabs/PlaygroundTab.js";
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

describe("PlaygroundTab", () => {
  beforeEach(() => {
    state.annual = [mockSeason];
    state.isPt = true;
    state.setTheme("dark");
  });

  it("renders with subtabs and displays Macro CFO simulator by default", () => {
    render(<PlaygroundTab />);
    expect(
      screen.getByRole("button", {
        name: /pg_sub_macro|Simulador Orçamental Macro/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /pg_sub_transfers|Impacto de Contratações|Calculador/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Controlos de Simulação/i)).toBeInTheDocument();
  });

  it("switches to the UEFA Transfer Impact Calculator when subtab is clicked", () => {
    render(<PlaygroundTab />);
    const transferTabBtn = screen.getByRole("button", {
      name: /pg_sub_transfers|Impacto de Contratações|Calculador/i,
    });
    fireEvent.click(transferTabBtn);
    expect(
      screen.getByText(
        /Calculador de Impacto de Contratações \(UEFA Squad Cost Rule\)/i,
      ),
    ).toBeInTheDocument();
  });
});
