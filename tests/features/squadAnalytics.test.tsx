import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { state } from "../../src/core/state";
import { SquadAnalytics } from "../../src/features/SquadAnalytics";

describe("SquadAnalytics", () => {
  beforeEach(() => {
    state.setIsPt(false);
    state.setDataset({
      financials_per_season: [
        {
          season: "2013/14",
          transfer_profit: 10000,
          wages: -5000,
          amortisation: -2000,
        },
        {
          season: "2019/20",
          transfer_profit: 20000,
          wages: -15000,
          amortisation: -5000,
        },
        {
          season: "2023/24",
          transfer_profit: 50000,
          wages: -30000,
          amortisation: -10000,
        },
      ],
    });
    state.setTransferLedger([]);
  });

  it("renders the SquadAnalytics component successfully", () => {
    render(<SquadAnalytics />);
    const charts = screen.queryAllByTestId("mock-chart-bar");
    expect(charts.length).toBeGreaterThan(0);
  });

  it("handles Portuguese localization when state.isPt is true", () => {
    state.setIsPt(true);
    render(<SquadAnalytics />);
    const charts = screen.queryAllByTestId("mock-chart-bar");
    expect(charts.length).toBeGreaterThan(0);
  });

  it("renders eras data correctly with transfer ledger", () => {
    state.setTransferLedger([
      {
        season: "2013/14",
        sales: [{ player: "Test Player", fee: 5000, commission: 200 }],
        purchases: [{ player: "Test Buy", fee: 3000, commission: 100 }],
      },
    ]);

    render(<SquadAnalytics />);
    const charts = screen.queryAllByTestId("mock-chart-bar");
    expect(charts.length).toBeGreaterThan(0);
  });

  it("handles empty transfer ledger", () => {
    state.setTransferLedger([]);
    render(<SquadAnalytics />);
    const charts = screen.queryAllByTestId("mock-chart-bar");
    expect(charts.length).toBeGreaterThan(0);
  });

  it("handles missing annual data gracefully", () => {
    state.setDataset({
      annual_data: [
        {
          season: "2013/14",
          label: "2013/14",
          transfer_profit: 0,
          wages: 0,
          amortisation: 0,
          agent_commissions: 500,
        },
      ],
      financials_per_season: [],
    });
    state.setTransferLedger([
      {
        season: "2013/14",
        sales: [{ player: "Player", fee: 5000, commission: 0 }],
        purchases: [],
      },
    ]);

    render(<SquadAnalytics />);
    const charts = screen.queryAllByTestId("mock-chart-bar");
    expect(charts.length).toBeGreaterThan(0);
  });

  it("renders with transfer ledger data including commissions", () => {
    state.setTransferLedger([
      {
        season: "2013/14",
        sales: [
          { player: "Player A", fee: 10000, commission: 500 },
          { player: "Player B", fee: 5000, commission: 250 },
        ],
        purchases: [
          { player: "Player C", fee: 8000, commission: 400 },
        ],
      },
      {
        season: "2019/20",
        sales: [{ player: "Player D", fee: 20000, commission: 1000 }],
        purchases: [{ player: "Player E", fee: 15000, commission: 750 }],
      },
    ]);

    render(<SquadAnalytics />);
    const charts = screen.queryAllByTestId("mock-chart-bar");
    expect(charts.length).toBeGreaterThan(0);
  });

  it("renders with sales only (no purchases)", () => {
    state.setTransferLedger([
      {
        season: "2023/24",
        sales: [{ player: "Player F", fee: 30000, commission: 1500 }],
        purchases: [],
      },
    ]);

    render(<SquadAnalytics />);
    const charts = screen.queryAllByTestId("mock-chart-bar");
    expect(charts.length).toBeGreaterThan(0);
  });

  it("renders with purchases only (no sales)", () => {
    state.setTransferLedger([
      {
        season: "2023/24",
        sales: [],
        purchases: [{ player: "Player G", fee: 25000, commission: 1250 }],
      },
    ]);

    render(<SquadAnalytics />);
    const charts = screen.queryAllByTestId("mock-chart-bar");
    expect(charts.length).toBeGreaterThan(0);
  });

  it("handles multiple seasons with mixed data", () => {
    state.setTransferLedger([
      {
        season: "2013/14",
        sales: [{ player: "A", fee: 1000, commission: 50 }],
        purchases: [{ player: "B", fee: 2000, commission: 100 }],
      },
      {
        season: "2019/20",
        sales: [{ player: "C", fee: 3000, commission: 150 }],
        purchases: [],
      },
      {
        season: "2023/24",
        sales: [],
        purchases: [{ player: "D", fee: 4000, commission: 200 }],
      },
    ]);

    render(<SquadAnalytics />);
    const charts = screen.queryAllByTestId("mock-chart-bar");
    expect(charts.length).toBeGreaterThan(0);
  });
});
