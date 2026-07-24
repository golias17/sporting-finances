import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AccessibleTable } from "../../src/components/AccessibleTable";

vi.mock("../../src/core/state", () => ({
  useAppState: vi.fn(() => false),
}));

const mockData = {
  labels: ["2022/23", "2023/24"],
  datasets: [
    {
      label: "Revenue",
      data: [50000, 60000],
    },
    {
      label: "Costs",
      data: [-30000, -35000],
    },
  ],
};

describe("AccessibleTable", () => {
  it("renders nothing when data is null", () => {
    const { container } = render(
      <AccessibleTable data={null as any} chartId="test" />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when data has no labels", () => {
    const { container } = render(
      <AccessibleTable data={{ labels: undefined, datasets: [] } as any} chartId="test" />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders the toggle button with English text", () => {
    render(<AccessibleTable data={mockData} chartId="test" />);
    expect(screen.getByText("View raw table data")).toBeInTheDocument();
  });

  it("toggles table visibility when button is clicked", () => {
    render(<AccessibleTable data={mockData} chartId="test" />);
    const btn = screen.getByText("View raw table data");

    fireEvent.click(btn);
    expect(screen.getByText("Hide table data")).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Hide table data"));
    expect(screen.getByText("View raw table data")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(<AccessibleTable data={mockData} chartId="test" />);
    fireEvent.click(screen.getByText("View raw table data"));

    expect(screen.getByText("Year")).toBeInTheDocument();
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("Costs")).toBeInTheDocument();
  });

  it("formats currency values correctly", () => {
    render(<AccessibleTable data={mockData} chartId="test" />);
    fireEvent.click(screen.getByText("View raw table data"));

    expect(screen.getByText("€50000.0k")).toBeInTheDocument();
    expect(screen.getByText("€−30000.0k")).toBeInTheDocument();
  });

  it("adds neg class to negative values", () => {
    render(<AccessibleTable data={mockData} chartId="test" />);
    fireEvent.click(screen.getByText("View raw table data"));

    const negCells = document.querySelectorAll("td.neg");
    expect(negCells.length).toBeGreaterThan(0);
  });

  it("calls onToggle when table is toggled", () => {
    const onToggle = vi.fn();
    render(<AccessibleTable data={mockData} chartId="test" onToggle={onToggle} />);
    fireEvent.click(screen.getByText("View raw table data"));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("formats ratio values correctly", () => {
    const ratioData = {
      labels: ["2023"],
      datasets: [{ label: "Ratio", data: [2.5] }],
    };
    render(<AccessibleTable data={ratioData} chartId="test" valueType="ratio" />);
    fireEvent.click(screen.getByText("View raw table data"));
    expect(screen.getByText("2.5×")).toBeInTheDocument();
  });

  it("formats percentage values correctly", () => {
    const pctData = {
      labels: ["2023"],
      datasets: [{ label: "Margin", data: [15.5] }],
    };
    render(<AccessibleTable data={pctData} chartId="test" valueType="percentage" />);
    fireEvent.click(screen.getByText("View raw table data"));
    expect(screen.getByText("15.5%")).toBeInTheDocument();
  });

  it("formats currency-millions values correctly", () => {
    const mlnData = {
      labels: ["2023"],
      datasets: [{ label: "Value", data: [123.4] }],
    };
    render(<AccessibleTable data={mlnData} chartId="test" valueType="currency-millions" />);
    fireEvent.click(screen.getByText("View raw table data"));
    expect(screen.getByText("€123.4M")).toBeInTheDocument();
  });

  it("handles null values with em dash", () => {
    const nullData = {
      labels: ["2023"],
      datasets: [{ label: "Value", data: [null] }],
    };
    render(<AccessibleTable data={nullData} chartId="test" />);
    fireEvent.click(screen.getByText("View raw table data"));
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("adds pos class to positive net result values", () => {
    const profitData = {
      labels: ["2023"],
      datasets: [{ label: "Net Result", data: [5000] }],
    };
    render(<AccessibleTable data={profitData} chartId="netresult" />);
    fireEvent.click(screen.getByText("View raw table data"));
    expect(document.querySelectorAll("td.pos").length).toBeGreaterThan(0);
  });

  it("renders caption with chart ID", () => {
    render(<AccessibleTable data={mockData} chartId="revenue" />);
    fireEvent.click(screen.getByText("View raw table data"));
    expect(screen.getByText(/revenue/)).toBeInTheDocument();
  });
});
