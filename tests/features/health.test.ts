import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { state, useAppState } from "../../src/core/state.ts";
import { HealthSignals } from "../../src/features/HealthSignals.tsx";
import { KPIBar } from "../../src/features/KPIBar.tsx";

vi.mock("chart.js", () => {
  class Chart {
    constructor() {}
    static register() {}
    destroy() {}
  }
  return {
    Chart,
    BarController: {},
    LineController: {},
    BarElement: {},
    LineElement: {},
    PointElement: {},
    CategoryScale: {},
    LinearScale: {},
    Legend: {},
    Tooltip: {},
    Filler: {},
    ArcElement: {},
    DoughnutController: {},
    Title: {},
  };
});

describe("health.test.ts", () => {
  beforeEach(() => {
    state.setDataset({
      annual_data: [
        {
          label: "2010/11",
          financial_result: 10,
          total_revenue: 100,
          revenue_operating: 100,
          current_assets: 50,
          current_liabilities: 20,
          equity: 10,
          personnel_costs: -50,
          net_result: 8,
          borrowings_nc: 15,
          borrowings_c: 5,
          cash: 10,
          player_transfer_income: 20,
          operating_result_excl_players: 5,
          squad_market_value: 50000,
        },
        {
          label: "2011/12",
          financial_result: -10,
          total_revenue: 90,
          revenue_operating: 90,
          current_assets: 40,
          current_liabilities: 60,
          equity: -10,
          personnel_costs: -60,
          net_result: -15,
          borrowings_nc: 30,
          borrowings_c: 10,
          cash: 5,
          player_transfer_income: 30,
          operating_result_excl_players: -8,
          squad_market_value: 40000,
        },
        {
          label: "2012/13",
          financial_result: 20,
          total_revenue: 120,
          revenue_operating: 120,
          current_assets: 80,
          current_liabilities: 40,
          equity: 50,
          personnel_costs: -70,
          net_result: 12,
          borrowings_nc: 20,
          borrowings_c: 5,
          cash: 15,
          player_transfer_income: 25,
          operating_result_excl_players: 10,
          squad_market_value: 60000,
        },
      ],
    });
    // Patch useAppState to ensure s.annual resolves correctly in RTL
    useAppState.setState({
      annual: state.annual,
    } as any);
    state.setHealthBarIdx(2);
    state.setUrlHealthSeason(null);
    state.setIsPt(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("HealthSignals", () => {
    it("should initialize health bar with pills for each season", () => {
      render(React.createElement(HealthSignals));
      const pills = screen.getAllByRole("button");
      expect(pills.length).toBe(3);
      expect(pills[2].textContent).toBe("2012/13");
      expect(pills[2]).toHaveAttribute("aria-pressed", "true");
    });

    it("should render health signals correctly", () => {
      render(React.createElement(HealthSignals));
      expect(
        screen.getByText("Club Financial Health — 2012/13"),
      ).toBeInTheDocument();
      const images = screen.getAllByTestId("mock-chart-bar");
      expect(images.length).toBeGreaterThan(0);
    });

    it("should update language strings based on state.isPt", () => {
      state.setIsPt(true);
      render(React.createElement(HealthSignals));
      expect(
        screen.getByText("Saúde Financeira do Clube — 2012/13"),
      ).toBeInTheDocument();
    });

    it("should respond to click events on season pills", () => {
      render(React.createElement(HealthSignals));
      const pills = screen.getAllByRole("button");
      fireEvent.click(pills[0]);
      expect(state.healthBarIdx).toBe(0);
      expect(pills[0]).toHaveAttribute("aria-pressed", "true");
    });

    it("should initialize health bar with custom idx", () => {
      state.setHealthBarIdx(1);
      render(React.createElement(HealthSignals));
      const pills = screen.getAllByRole("button");
      expect(pills[1]).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("KPIBar", () => {
    it("builds pills and defaults to the latest season", () => {
      render(React.createElement(KPIBar));
      const pills = screen.getAllByRole("button");
      expect(pills.length).toBe(3);
      expect(pills[2]).toHaveAttribute("aria-pressed", "true");
    });

    it("clicking a pill updates the shared index", () => {
      render(React.createElement(KPIBar));
      const kpiPills = screen.getAllByRole("button");
      fireEvent.click(kpiPills[0]);
      expect(state.healthBarIdx).toBe(0);
      expect(kpiPills[0]).toHaveAttribute("aria-pressed", "true");
    });

    it("renders KPI elements properly", () => {
      render(React.createElement(KPIBar));
      expect(screen.getByText("Club Overview — 2012/13")).toBeInTheDocument();
      const kpiGroups = screen.getAllByRole("group");
      expect(kpiGroups.length).toBeGreaterThan(0);
    });
  });
});
