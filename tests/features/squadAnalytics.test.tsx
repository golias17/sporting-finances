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
});
