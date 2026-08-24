import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { FinancialEfficiencyModule } from "../../src/features/efficiency/FinancialEfficiencyModule.js";
import {
  computeFootballSpending,
  computeEfficiencySeries,
  computeCycleEfficiencySummary,
  SPORTING_PERFORMANCE,
} from "../../src/features/efficiency/financialEfficiencyData.js";
import { useAppState } from "../../src/core/state.js";
import { loadTranslations } from "../../src/ui/translations.js";
import type { FinancialRecord } from "../../src/core/types.js";

const mockRecord = (season: string, wages = -60000, amort = -25000, agent = -5000): FinancialRecord => ({
  season,
  label: season,
  year_end: "2024-06-30",
  revenue_operating: 140000,
  player_transfer_income: 60000,
  player_transfer_cost: 30000,
  personnel_costs: wages,
  external_supplies: -35000,
  da_excl_squad: -5000,
  operating_result_excl_players: 20000,
  squad_amortization_impairment: amort,
  operating_result_total: 25000,
  financial_result: -12000,
  net_result: 15000,
  total_assets: 350000,
  non_current_assets: 230000,
  current_assets: 120000,
  current_liabilities: 110000,
  non_current_liabilities: 150000,
  equity: 90000,
  borrowings_nc: 100000,
  borrowings_c: 20000,
  cash: 30000,
  squad_book_value: 80000,
  squad_market_value: 400000,
  rev_tv_comp: 70000,
  rev_matchday: 35000,
  rev_commercial: 35000,
  cf_operating: 30000,
  cf_investing: -20000,
  cf_financing: -5000,
  ebitda_total: 55000,
  agent_commissions: agent,
  source: "CMVM",
});

describe("financialEfficiencyData calculations", () => {
  it("computes football spending accurately from personnel, amortizations, and agent fees", () => {
    const rec = mockRecord("2023/24", -70000, -30000, -8000);
    const spending = computeFootballSpending(rec);
    expect(spending).toBe(108000);
  });

  it("handles undefined record safely", () => {
    expect(computeFootballSpending(undefined)).toBe(0);
  });

  it("computes 15-season efficiency series for all three clubs", () => {
    const scp = [mockRecord("2023/24", -60000, -25000, -5000)];
    const slb = [mockRecord("2023/24", -90000, -45000, -5000)];
    const fcp = [mockRecord("2023/24", -75000, -35000, -5000)];

    const series = computeEfficiencySeries(scp, slb, fcp);
    expect(series).toHaveLength(1);
    expect(series[0].sportingSpend).toBe(90);
    expect(series[0].sportingPoints).toBe(90);
    expect(series[0].sportingCpp).toBeCloseTo((90 * 1000) / 90, 1);
    expect(series[0].benficaCpp).toBeGreaterThan(series[0].sportingCpp);
  });

  it("computes cycle efficiency summary for 'last5', 'last3', and 'all' windows", () => {
    const scpFin = SPORTING_PERFORMANCE.sporting.map((p) => mockRecord(p.season, -60000, -20000));
    const slbFin = SPORTING_PERFORMANCE.benfica.map((p) => mockRecord(p.season, -90000, -35000));
    const fcpFin = SPORTING_PERFORMANCE.porto.map((p) => mockRecord(p.season, -80000, -30000));

    const summary5 = computeCycleEfficiencySummary(scpFin, slbFin, fcpFin, "last5");
    expect(summary5.sporting.totalTitles).toBeGreaterThan(0);
    expect(summary5.sporting.costPerPoint).toBeLessThan(summary5.benfica.costPerPoint);

    const summary3 = computeCycleEfficiencySummary(scpFin, slbFin, fcpFin, "last3");
    expect(summary3.sporting.totalPoints).toBeGreaterThan(200);

    const summaryAll = computeCycleEfficiencySummary(scpFin, slbFin, fcpFin, "all");
    expect(summaryAll.sporting.totalPoints).toBeGreaterThan(1000);
  });
});

describe("FinancialEfficiencyModule Component", () => {
  beforeEach(async () => {
    useAppState.setState({
      isPt: true,
      annual: SPORTING_PERFORMANCE.sporting.map((p) => mockRecord(p.season, -60000, -20000)),
      BENFICA_DATASET: {
        annual_data: SPORTING_PERFORMANCE.benfica.map((p) => mockRecord(p.season, -90000, -35000)),
      } as any,
      PORTO_DATASET: {
        annual_data: SPORTING_PERFORMANCE.porto.map((p) => mockRecord(p.season, -80000, -30000)),
      } as any,
    });
    await loadTranslations("pt");
  });

  it("renders headers, verdict, KPI cards, chart, and efficiency ROI table in Portuguese", () => {
    render(<FinancialEfficiencyModule timeWindow="all" />);

    expect(
      screen.getByText(/Índice de Eficiência: Custo por Ponto/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Avaliação de Eficiência Desportiva/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Custo por Ponto \(Sporting CP\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Custo por Ponto \(SL Benfica\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Custo por Ponto \(FC Porto\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Poupança vs Benfica no Ciclo/i)).toBeInTheDocument();
  });

  it("switches chart view modes when clicked", () => {
    render(<FinancialEfficiencyModule timeWindow="all" />);

    const spendVsPtsBtn = screen.getByRole("button", {
      name: /Despesa Plantel vs Pontos/i,
    });
    fireEvent.click(spendVsPtsBtn);
    expect(spendVsPtsBtn).toHaveClass("active");

    const costPerTitleBtn = screen.getByRole("button", {
      name: /Custo Médio \/ Título Oficial/i,
    });
    fireEvent.click(costPerTitleBtn);
    expect(costPerTitleBtn).toHaveClass("active");
  });

  it("toggles structural insights accordion", () => {
    render(<FinancialEfficiencyModule timeWindow="all" />);

    const toggle = screen.getByText(/Ver Pilares de Eficiência do Futebol/i);
    fireEvent.click(toggle);

    expect(screen.getByText(/1\. Academia & Formação de Elite/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Recrutamento Cirúrgico/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Disciplina Salarial/i)).toBeInTheDocument();
  });

  it("renders in English when isPt is false", async () => {
    useAppState.setState({ isPt: false });
    await loadTranslations("en");
    render(<FinancialEfficiencyModule timeWindow="last5" />);

    expect(
      screen.getByText(/Financial Efficiency Index: Cost per Point/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Cost per Point \(Sporting CP\)/i),
    ).toBeInTheDocument();
  });
});
