import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CompetitiveTab } from "../../src/features/tabs/CompetitiveTab";
import { useCompetitiveCharts } from "../../src/features/tabs/useCompetitiveCharts";
import { renderHook } from "@testing-library/react";
import { useAppState } from "../../src/core/state";

// Mock the hooks and child components
vi.mock("../../src/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    T: ({ as: Component = "span", children, i18nKey, ...props }: any) => (
      <Component {...props}>{children || i18nKey}</Component>
    ),
  }),
}));

vi.mock("../../src/components/ChartCard", () => ({
  ChartCard: ({ id, title, options, data, children }: any) => (
    <div data-testid={`chart-card-${id}`}>
      <span>{title}</span>
      {children}
    </div>
  ),
}));

describe("CompetitiveTab", () => {
  beforeEach(() => {
    useAppState.setState({
      annual: [
        {
          season: "2023/24",
          label: "2023/24",
          revenue_operating: 150000,
          personnel_costs: -75000,
          net_result: 15000,
          equity: 20000,
          non_current_liabilities: 100000,
          current_liabilities: 50000,
          squad_market_value: 300000,
          rev_tv_comp: 60000,
          rev_matchday: 30000,
          rev_commercial: 60000,
          player_transfer_income: 40000,
          player_transfer_cost: -20000,
        } as any,
      ],
      BENFICA_DATASET: {
        annual_data: [
          {
            season: "2023/24",
            revenue_operating: 180000,
            personnel_costs: -90000,
            net_result: 5000,
            equity: 100000,
            non_current_liabilities: 120000,
            current_liabilities: 60000,
            squad_market_value: 350000,
            rev_tv_comp: 70000,
            rev_matchday: 40000,
            rev_commercial: 70000,
            player_transfer_income: 50000,
            player_transfer_cost: -30000,
          },
        ],
      } as any,
      PORTO_DATASET: {
        annual_data: [
          {
            season: "2023/24",
            revenue_operating: 140000,
            personnel_costs: -80000,
            net_result: -10000,
            equity: -10000,
            non_current_liabilities: 150000,
            current_liabilities: 70000,
            squad_market_value: 280000,
            rev_tv_comp: 55000,
            rev_matchday: 25000,
            rev_commercial: 60000,
            player_transfer_income: 30000,
            player_transfer_cost: -25000,
          },
        ],
      } as any,
      theme: "light",
      COLORS: {
        muted: "#6a716e",
      } as any,
      baseOpts: {
        plugins: {},
        scales: {},
      } as any,
    });
  });

  it("renders the chapter header and all competitive chart cards", () => {
    render(<CompetitiveTab />);
    expect(screen.getByText("ch08-h2")).toBeInTheDocument();
    expect(
      screen.getByTestId("chart-card-competitiveRevenueSource"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("chart-card-competitivePersonnelRatio"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("chart-card-competitivePersonnel"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("chart-card-competitiveSquad"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("chart-card-competitiveTransferBalance"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("chart-card-competitiveNetResult"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("chart-card-competitiveEquity"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("chart-card-competitiveLiabilities"),
    ).toBeInTheDocument();
  });

  it("calculates totals per club in revenueBySourceOptions tooltip footer", () => {
    const { result } = renderHook(() => useCompetitiveCharts());
    const footerCallback = (
      result.current.revenueBySourceOptions.plugins as any
    ).tooltip.callbacks.footer;
    const labelCallback = (result.current.revenueBySourceOptions.plugins as any)
      .tooltip.callbacks.label;

    expect(footerCallback).toBeDefined();

    // Mock tooltip items for a season
    const mockTooltipItems = [
      {
        dataset: { label: "Sporting - TV & UEFA", stack: "sporting" },
        raw: 60000,
        parsed: { y: 60000 },
      },
      {
        dataset: { label: "Sporting - Bilheteira", stack: "sporting" },
        raw: 30000,
        parsed: { y: 30000 },
      },
      {
        dataset: { label: "Sporting - Comercial", stack: "sporting" },
        raw: 60000,
        parsed: { y: 60000 },
      },
      {
        dataset: { label: "Benfica - TV & UEFA", stack: "benfica" },
        raw: 70000,
        parsed: { y: 70000 },
      },
      {
        dataset: { label: "Benfica - Bilheteira", stack: "benfica" },
        raw: 40000,
        parsed: { y: 40000 },
      },
      {
        dataset: { label: "Benfica - Comercial", stack: "benfica" },
        raw: 70000,
        parsed: { y: 70000 },
      },
      {
        dataset: { label: "Porto - TV & UEFA", stack: "porto" },
        raw: 55000,
        parsed: { y: 55000 },
      },
      {
        dataset: { label: "Porto - Bilheteira", stack: "porto" },
        raw: 25000,
        parsed: { y: 25000 },
      },
      {
        dataset: { label: "Porto - Comercial", stack: "porto" },
        raw: 60000,
        parsed: { y: 60000 },
      },
    ];

    const lines = footerCallback(mockTooltipItems);
    expect(lines).toEqual([
      "Total Sporting: €150.0M",
      "Total Benfica: €180.0M",
      "Total Porto: €140.0M",
    ]);

    // Test label callback
    expect(
      labelCallback({
        dataset: { label: "Sporting - TV & UEFA" },
        parsed: { y: 60000 },
        raw: 60000,
      }),
    ).toBe(" Sporting - TV & UEFA: €60.0M");
    expect(
      labelCallback({
        dataset: { label: "Benfica - TV & UEFA" },
        parsed: { y: 0 },
        raw: null,
      }),
    ).toBe("");

    // Test empty items
    expect(footerCallback([])).toEqual([]);
    expect(footerCallback(null)).toEqual([]);

    // Test partial club items (e.g. only Sporting has data)
    const onlySportingItems = [
      {
        dataset: { label: "Sporting - TV & UEFA", stack: "sporting" },
        raw: 60000,
        parsed: { y: 60000 },
      },
      {
        dataset: { label: "Sporting - Bilheteira", stack: "sporting" },
        raw: 30000,
        parsed: { y: 30000 },
      },
    ];
    expect(footerCallback(onlySportingItems)).toEqual([
      "Total Sporting: €90.0M",
    ]);
  });

  it("updates time window and dynamic labels when timeframe buttons are clicked", async () => {
    const { fireEvent } = await import("@testing-library/react");

    // Test in Portuguese
    useAppState.setState({ isPt: true });
    const { unmount } = render(<CompetitiveTab />);

    // Default: 15 seasons tag
    expect(screen.getAllByText("2010/11 → 2024/25").length).toBeGreaterThan(0);

    // Click "Ciclo Amorim" button
    const last5Btn = screen.getByText("ch08-filter-last5");
    fireEvent.click(last5Btn);
    expect(
      screen.getAllByText("Ciclo 2020-2025 (5 Épocas)").length,
    ).toBeGreaterThan(0);

    // Click "Últimas 3 Épocas" button
    const last3Btn = screen.getByText("ch08-filter-last3");
    fireEvent.click(last3Btn);
    expect(screen.getAllByText("Últimas 3 Épocas").length).toBeGreaterThan(0);

    unmount();

    // Test in English
    useAppState.setState({ isPt: false });
    render(<CompetitiveTab />);
    const last5BtnEn = screen.getByText("ch08-filter-last5");
    fireEvent.click(last5BtnEn);
    expect(
      screen.getAllByText("2020-2025 Cycle (5 Seasons)").length,
    ).toBeGreaterThan(0);
  });
});
