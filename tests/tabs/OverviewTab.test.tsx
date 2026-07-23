import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { OverviewTab } from "../../src/features/tabs/OverviewTab";

// Mock the hooks and child components
vi.mock("../../src/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    T: ({ as: Component = "span", children, i18nKey, ...props }: any) => (
      <Component {...props}>{children || i18nKey}</Component>
    ),
  }),
}));

vi.mock("../../src/features/tabs/useOverviewCharts", () => ({
  useOverviewCharts: () => ({
    heroData: { labels: ["2023"], datasets: [{ label: "Revenue", data: [100] }] },
    heroOptions: {},
    netResult: { data: { labels: ["2023"], datasets: [{ label: "Net", data: [10] }] }, options: {} },
    equity: { data: { labels: ["2023"], datasets: [{ label: "Equity", data: [50] }] }, options: {} },
  }),
}));

vi.mock("../../src/features/Story", () => ({
  Story: () => <div data-testid="story">Story</div>,
}));

vi.mock("../../src/features/KPIBar", () => ({
  KPIBar: () => <div data-testid="kpi-bar">KPIBar</div>,
}));

vi.mock("../../src/components/ChartCard", () => ({
  ChartCard: ({ id, title }: any) => (
    <div data-testid={`chart-card-${id}`}>{title}</div>
  ),
}));

describe("OverviewTab", () => {
  it("renders the chapter heading", () => {
    render(<OverviewTab />);
    expect(screen.getByText("ch01-h2")).toBeInTheDocument();
  });

  it("renders the Story component", () => {
    render(<OverviewTab />);
    expect(screen.getByTestId("story")).toBeInTheDocument();
  });

  it("renders the KPIBar component", () => {
    render(<OverviewTab />);
    expect(screen.getByTestId("kpi-bar")).toBeInTheDocument();
  });

  it("renders all three chart cards", () => {
    render(<OverviewTab />);
    expect(screen.getByTestId("chart-card-chartHero")).toBeInTheDocument();
    expect(screen.getByTestId("chart-card-chartNetResult")).toBeInTheDocument();
    expect(screen.getByTestId("chart-card-chartEquity")).toBeInTheDocument();
  });

  it("renders the narrative section", () => {
    render(<OverviewTab />);
    expect(screen.getByText("ch01-narrative-h4")).toBeInTheDocument();
    expect(screen.getByText("ch01-narrative-p1")).toBeInTheDocument();
    expect(screen.getByText("ch01-narrative-p2")).toBeInTheDocument();
  });
});
