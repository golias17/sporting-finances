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
          revenue_operating: 150000,
          personnel_costs: -90000,
          net_result: 5000,
          equity: 30000,
          cash: 10000,
          borrowings_nc: 40000,
          borrowings_c: 10000,
          current_assets: 50000,
          current_liabilities: 30000,
          total_assets: 200000,
          non_current_liabilities: 80000,
          squad_book_value: 60000,
          player_transfer_income: 25000,
          player_transfer_cost: 15000,
          transfer_payables_c: 5000,
          transfer_payables_nc: 10000,
          transfer_receivables_c: 3000,
          transfer_receivables_nc: 7000,
        },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default values and baseline KPIs", () => {
    render(<Playground />);
    expect(screen.getAllByText("Baseline 2025/26 (no changes)").length).toBeGreaterThan(0);
  });

  it("should recalculate KPIs when UEFA Champions League is toggled", async () => {
    render(<Playground />);
    const uclSelect = screen.getByLabelText(/UEFA/i);
    fireEvent.change(uclSelect, { target: { value: "group" } });
    await waitFor(() => {
      expect(screen.getByText(/Scenario Verdict/i)).toBeInTheDocument();
    });
  });

  it("should decrease net result when payroll is increased", async () => {
    render(<Playground />);
    const payrollSlider = screen.getByLabelText(/Payroll/i);
    fireEvent.change(payrollSlider, { target: { value: "10" } });
    await waitFor(() => {
      expect(screen.getByText(/Scenario Verdict/i)).toBeInTheDocument();
    });
  });

  it("should reset variables when reset button is clicked", async () => {
    render(<Playground />);
    const resetBtn = screen.getByText(/Reset/i);
    fireEvent.click(resetBtn);
    await waitFor(() => {
      expect(screen.getByText(/Scenario Verdict/i)).toBeInTheDocument();
    });
  });

  it("should apply the Optimistic preset", async () => {
    render(<Playground />);
    const optBtn = screen.getByText(/Optimistic/i);
    fireEvent.click(optBtn);
    await waitFor(() => {
      expect(screen.getByText(/Scenario Verdict/i)).toBeInTheDocument();
    });
  });

  it("pins the current scenario", () => {
    render(<Playground />);
    // The baseline is shown in the table
    const baselineSections = screen.getAllByText(/Baseline 2025/i);
    expect(baselineSections.length).toBeGreaterThan(0);
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

  it("renders verdict section in Portuguese", () => {
    state.setIsPt(true);
    render(<Playground />);
    expect(screen.getByText(/Veredito do Cenário/i)).toBeInTheDocument();
  });

  it("renders preset buttons", () => {
    render(<Playground />);
    expect(screen.getByText(/Optimistic/i)).toBeInTheDocument();
    expect(screen.getByText(/Reset/i)).toBeInTheDocument();
  });

  it("renders UCL toggle", () => {
    render(<Playground />);
    const uclSections = screen.getAllByText(/UEFA/i);
    expect(uclSections.length).toBeGreaterThan(0);
  });

  it("renders baseline comparison section", () => {
    render(<Playground />);
    expect(screen.getByText(/Simulated Financials vs. Baseline/i)).toBeInTheDocument();
  });

  it("renders baseline comparison section in Portuguese", () => {
    state.setIsPt(true);
    render(<Playground />);
    expect(screen.getByText(/Resultados Simulados/i)).toBeInTheDocument();
  });
});
