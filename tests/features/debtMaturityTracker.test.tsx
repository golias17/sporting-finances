import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { DebtMaturityTracker } from "../../src/features/bonds/DebtMaturityTracker.js";
import {
  computeDebtSchedule,
  computeDebtKPIs,
  getDebtMaturityChartOptions,
} from "../../src/features/bonds/debtMaturityCalculations.js";
import { useAppState } from "../../src/core/state.js";
import { loadTranslations } from "../../src/ui/translations.js";

describe("debtMaturityCalculations", () => {
  it("computes 10-year debt schedule for 'all' filter with positive debt service", () => {
    const schedule = computeDebtSchedule("all", "base");
    expect(schedule).toHaveLength(10);

    const firstYear = schedule[0];
    expect(firstYear.season).toBe("2025/26");
    expect(firstYear.totalPrincipal).toBe(12.0);
    expect(firstYear.totalInterest).toBeCloseTo(16.74, 2);
    expect(firstYear.totalDebtService).toBeCloseTo(28.74, 2);
    expect(firstYear.dscr).toBeGreaterThan(1.5);
    expect(firstYear.status).toBe("grade");
  });

  it("computes stress scenarios: rates_up and no_ucl", () => {
    const baseSchedule = computeDebtSchedule("all", "base");
    const stressedSchedule = computeDebtSchedule("all", "rates_up");
    const noUclSchedule = computeDebtSchedule("all", "no_ucl");

    expect(stressedSchedule[0].totalInterest).toBeGreaterThan(baseSchedule[0].totalInterest);
    expect(noUclSchedule[0].ebitda).toBeLessThan(baseSchedule[0].ebitda);
    expect(noUclSchedule[0].dscr).toBeLessThan(baseSchedule[0].dscr);
  });

  it("filters accurately for USPP and banking debt", () => {
    const usppSchedule = computeDebtSchedule("uspp");
    const bankingSchedule = computeDebtSchedule("banking");

    expect(usppSchedule[0].totalPrincipal).toBe(0);
    expect(usppSchedule[0].totalInterest).toBeCloseTo(12.94, 2);

    expect(bankingSchedule[0].totalPrincipal).toBe(12.0);
    expect(bankingSchedule[0].totalInterest).toBeCloseTo(3.8, 2);
  });

  it("calculates KPIs accurately (average debt service, DSCR, LT share, totals)", () => {
    const schedule = computeDebtSchedule("all");
    const kpis = computeDebtKPIs(schedule);

    expect(kpis.avgAnnualService).toBeGreaterThan(20);
    expect(kpis.avgDscr).toBeGreaterThan(1.3);
    expect(kpis.ltShare).toBeGreaterThan(70);
    expect(kpis.estimatedAnnualSavings).toBeGreaterThan(5);
    expect(kpis.totalPrincipal).toBeGreaterThan(200);
    expect(kpis.totalInterest).toBeGreaterThan(50);
  });

  it("computes KPIs correctly when schedule is empty", () => {
    const kpis = computeDebtKPIs([]);
    expect(kpis.avgAnnualService).toBe(0);
    expect(kpis.ltShare).toBe(78);
  });
});

describe("DebtMaturityTracker Component", () => {
  beforeEach(async () => {
    useAppState.setState({ isPt: true });
    await loadTranslations("pt");
  });

  it("renders headers, verdict card, KPI strip, and debt schedule table in Portuguese", () => {
    render(<DebtMaturityTracker />);

    expect(
      screen.getByText(/Calendário de Vencimentos & Serviço da Dívida/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Parecer Institucional de Estrutura de Capital/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Serviço Médio da Dívida/i)).toBeInTheDocument();
    expect(screen.getByText(/Rácio de Cobertura DSCR/i)).toBeInTheDocument();
    expect(screen.getByText(/% Dívida a Longo Prazo/i)).toBeInTheDocument();
    expect(screen.getByText(/Poupança em Refinanciamento/i)).toBeInTheDocument();
  });

  it("renders in English when isPt is false", async () => {
    useAppState.setState({ isPt: false });
    await loadTranslations("en");
    render(<DebtMaturityTracker />);

    expect(
      screen.getByText(/Debt Maturity Tracker & Repayment Schedule/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Average Annual Debt Service/i)).toBeInTheDocument();
    expect(screen.getByText(/DSCR Coverage Ratio/i)).toBeInTheDocument();
  });

  it("switches filter presets and sensitivity scenarios", () => {
    render(<DebtMaturityTracker />);

    const usppBtn = screen.getByRole("button", {
      name: /Obrigações USPP/i,
    });
    fireEvent.click(usppBtn);
    expect(usppBtn).toHaveClass("active");

    const bankingBtn = screen.getByRole("button", {
      name: /Banca & Papel Comercial/i,
    });
    fireEvent.click(bankingBtn);
    expect(bankingBtn).toHaveClass("active");
    expect(usppBtn).not.toHaveClass("active");

    const allBtn = screen.getByRole("button", {
      name: /Dívida Consolidada Total/i,
    });
    fireEvent.click(allBtn);
    expect(allBtn).toHaveClass("active");

    // Stress test scenarios
    const stressRatesBtn = screen.getByRole("button", {
      name: /Stress Taxas/i,
    });
    fireEvent.click(stressRatesBtn);
    expect(stressRatesBtn).toHaveClass("active");

    const noUclBtn = screen.getByRole("button", {
      name: /Choque UCL/i,
    });
    fireEvent.click(noUclBtn);
    expect(noUclBtn).toHaveClass("active");
    expect(stressRatesBtn).not.toHaveClass("active");
  });

  it("toggles collapsible methodology guide", () => {
    render(<DebtMaturityTracker />);

    const guideToggle = screen.getByText(/Compreender os Mecanismos do USPP/i);
    fireEvent.click(guideToggle);

    expect(screen.getByText(/1\. Estrutura de Ring-Fencing/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Proteção Cambial/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Rácio de Cobertura DSCR/i)).toBeInTheDocument();

    const hideToggle = screen.getByText(/Minimizar Detalhes Metodológicos/i);
    fireEvent.click(hideToggle);
    expect(screen.queryByText(/1\. Estrutura de Ring-Fencing/i)).not.toBeInTheDocument();
  });
});

describe("DebtMaturityTracker Callbacks", () => {
  it("formats chart tooltip labels and footer correctly", () => {
    const optsPt = getDebtMaturityChartOptions(true);
    expect(optsPt.scales.y.title.text).toBe("Milhões €");

    const labelFn = optsPt.plugins.tooltip.callbacks.label;
    expect(labelFn({ dataset: { label: "Capital" }, parsed: { y: 25.5 } })).toBe(" Capital: €25.50M");

    const footerFn = optsPt.plugins.tooltip.callbacks.footer;
    expect(footerFn([])).toBe("");
    expect(
      footerFn([
        { parsed: { y: 20 } },
        { parsed: { y: 12.5 } },
      ]),
    ).toEqual(["Total Serviço Dívida: €32.50M"]);

    const tickFn = optsPt.scales.y.ticks.callback;
    expect(tickFn(50)).toBe("50M€");

    const optsEn = getDebtMaturityChartOptions(false);
    expect(optsEn.scales.y.title.text).toBe("Millions €");
  });
});
