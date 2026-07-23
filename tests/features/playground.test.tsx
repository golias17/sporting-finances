import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { state } from "../../src/core/state";
import { Playground } from "../../src/features/Playground";
import * as urlSync from "../../src/utils/urlSync";

vi.mock("../../src/charts/charts", () => ({
  mkChart: vi.fn(),
}));

vi.mock("../../src/utils/urlSync", () => ({
  syncStateToUrl: vi.fn(),
}));

describe("Playground", () => {
  beforeEach(() => {
    state.setIsPt(false);
    state.COLORS = {
      ink: "#1a1a1a",
      muted: "#6a716e",
      rule: "rgba(0, 0, 0, 0.05)",
      greenSoft: "rgba(10, 93, 58, 0.4)",
      green: "#0a5d3a",
      goldSoft: "rgba(176, 137, 35, 0.4)",
      gold: "#b08923",
      pos: "#2e8a55",
      neg: "#b8403a",
      chartBg: "#ffffff",
    };
    state.baseOpts = {
      scales: {
        x: { ticks: { color: "#6a716e" }, grid: { display: false } },
        y: {
          ticks: { color: "#6a716e" },
          grid: { color: "rgba(0,0,0,0.05)" },
          beginAtZero: true,
        },
      },
      plugins: {
        legend: { position: "bottom" },
        tooltip: { enabled: false },
      },
    };
    state.setUrlPlayground(null);
    state.setPinnedPlaygroundInputs(null);

    state.setDataset({
      annual_data: [
        {
          label: "2024/25",
          revenue_operating: 148149,
          personnel_costs: -87736,
          external_supplies: -48196,
          da_excl_squad: -7235,
          squad_amortization_impairment: -50218,
          player_transfer_cost: -14615,
          player_transfer_income: 116830,
          financial_result: -25246,
          net_result: 20023,
          equity: 40928,
          current_assets: 102909,
          current_liabilities: 165071,
          total_assets: 420747,
          cash: 15581,
        },
      ],
    });

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should initialize with default values and baseline KPIs", () => {
    render(<Playground />);
    expect(screen.getAllByText("€203.1M").length).toBeGreaterThan(0); // pgKpiRev
    expect(screen.getAllByText("€68.0M").length).toBeGreaterThan(0); // pgKpiNet
    expect(screen.getAllByText("€108.9M").length).toBeGreaterThan(0); // pgKpiEq
    expect(screen.getAllByText("€63.5M").length).toBeGreaterThan(0); // pgKpiCash

    const diffs = screen.getAllByText("no change");
    expect(diffs.length).toBeGreaterThanOrEqual(4);
  });

  it("should recalculate KPIs when UEFA Champions League is toggled", async () => {
    render(<Playground />);
    const uclSelect = screen.getByRole("combobox");

    fireEvent.change(uclSelect, { target: { value: "36" } });
    vi.runAllTimers();
    expect(screen.getByText("-11.0M vs baseline")).toBeInTheDocument();
  });

  it("should decrease net result when payroll is increased", async () => {
    render(<Playground />);
    const sliders = screen.getAllByRole("slider");
    const payrollSlider = sliders[1]; // assuming 2nd slider is payroll

    fireEvent.change(payrollSlider, { target: { value: "10" } });
    vi.runAllTimers();

    expect(screen.getAllByText("-8.8M vs baseline").length).toBeGreaterThan(0);
  });

  it("should reset variables when reset button is clicked", async () => {
    render(<Playground />);
    const uclSelect = screen.getByRole("combobox");
    fireEvent.change(uclSelect, { target: { value: "36" } });
    vi.runAllTimers();

    expect(screen.getByText("-11.0M vs baseline")).toBeInTheDocument();

    const btnReset = screen.getAllByRole("button", { name: /Reset/i })[0];
    fireEvent.click(btnReset);

    expect(screen.queryByText("-11.0M vs baseline")).not.toBeInTheDocument();
  });

  it("should apply the Optimistic preset", async () => {
    render(<Playground />);
    const optimisticBtn = screen.getByRole("button", { name: /Optimistic/i });
    fireEvent.click(optimisticBtn);
    vi.runAllTimers();

    const uclSelect = screen.getByRole("combobox") as HTMLSelectElement;
    expect(uclSelect.value).toBe("60");
  });

  it("pins the current scenario", async () => {
    render(<Playground />);
    const btnPin = screen.getByRole("button", { name: /Pin This Scenario/i });
    fireEvent.click(btnPin);

    expect(screen.getByText(/Unpin Scenario/i)).toBeInTheDocument();
  });

  it("does not accumulate duplicate listeners when called a second time", () => {
    const spy = vi
      .spyOn(urlSync, "syncStateToUrl")
      .mockImplementation(() => {});
    const { unmount } = render(<Playground />);
    unmount();
    render(<Playground />);

    const btnReset = screen.getAllByRole("button", { name: /Reset/i })[0];
    fireEvent.click(btnReset);

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
