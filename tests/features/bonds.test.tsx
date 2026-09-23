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

describe("PublicBonds", () => {
  beforeEach(() => {
    state.setIsPt(true);
  });

  it("renders active retail bonds by default and switches filters", async () => {
    const { PublicBonds } = await import("../../src/features/bonds/PublicBonds.js");
    const { fireEvent } = await import("@testing-library/react");
    render(<PublicBonds />);

    // Check KPIs
    expect(screen.getByText("€90.0M")).toBeInTheDocument();
    expect(screen.getByText("5.53%")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();

    // Active issues present
    expect(screen.getByText("Sporting SAD 2024-2027")).toBeInTheDocument();
    expect(screen.getByText("Sporting SAD 2024-2028")).toBeInTheDocument();

    // Switch to repaid issues
    const repaidBtn = screen.getByText(/Emissões Reembolsadas/i);
    fireEvent.click(repaidBtn);
    expect(screen.getByText("Sporting SAD 2021-2024")).toBeInTheDocument();
    expect(screen.getByText("Sporting SAD 2018-2021")).toBeInTheDocument();

    // Switch to all issues
    const allBtn = screen.getByText(/Todas as Emissões/i);
    fireEvent.click(allBtn);
    expect(screen.getByText("Sporting SAD 2024-2028")).toBeInTheDocument();
    expect(screen.getByText("Sporting SAD 2014-2017")).toBeInTheDocument();
  });

  it("renders correctly in English", async () => {
    state.setIsPt(false);
    const { PublicBonds } = await import("../../src/features/bonds/PublicBonds.js");
    render(<PublicBonds />);

    expect(screen.getByText("Active Issues (€90.0M)")).toBeInTheDocument();
    expect(screen.getByText("Repaid Issues (€96.4M)")).toBeInTheDocument();
  });
});

describe("VmocCost", () => {
  beforeEach(() => {
    state.setIsPt(true);
    state.setDataset({
      annual_data: [
        {
          label: "2019/20",
          financial_result: -20000,
        },
        {
          label: "2024/25",
          financial_result: -25000,
        },
        {
          label: "2025/26",
          financial_result: -15000,
        },
      ] as any,
    });
  });

  it("renders VmocCost without error and includes dynamic caption and peak cost", async () => {
    const { VmocCost } = await import("../../src/features/bonds/VmocCost.js");
    render(<VmocCost />);

    expect(
      screen.getByText(/Custo finan\. líquido total · Era VMOC/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Custo de financiamento líquido por época/i),
    ).toBeInTheDocument();
  });

  it("renders VmocCost in English", async () => {
    state.setIsPt(false);
    const { VmocCost } = await import("../../src/features/bonds/VmocCost.js");
    render(<VmocCost />);

    expect(
      screen.getByText(/Total net financing cost · VMOC era/i),
    ).toBeInTheDocument();
  });
});
