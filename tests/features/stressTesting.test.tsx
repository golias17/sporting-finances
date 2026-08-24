import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { StressTestingSimulator } from "../../src/features/stress/StressTestingSimulator.js";
import { StressTestingGuide } from "../../src/features/stress/StressTestingGuide.js";
import {
  runStressSimulation,
  getStressSliderBackground,
  STRESS_PRESETS,
} from "../../src/features/stress/stressTestCalculations.js";
import { useAppState } from "../../src/core/state.js";
import { loadTranslations } from "../../src/ui/translations.js";

describe("stressTestCalculations", () => {
  it("calculates base scenario as fully resilient with 24-month runway and safe verdict", () => {
    const res = runStressSimulation(STRESS_PRESETS.base);
    expect(res.cashRunwayMonths).toBe(24);
    expect(res.verdictType).toBe("safe");
    expect(res.finalCashBalance).toBeGreaterThan(10);
    expect(res.requiredAssetSales).toBe(0);
    expect(res.monthlyTrajectory).toHaveLength(24);
  });

  it("calculates severe shock in 'perfect_storm' triggering danger verdict and asset sales", () => {
    const res = runStressSimulation(STRESS_PRESETS.perfect_storm);
    expect(res.verdictType).toBe("danger");
    expect(res.requiredAssetSales).toBeGreaterThan(0);
    expect(res.finalCashBalance).toBeLessThan(0);
  });

  it("handles custom partial shocks correctly", () => {
    const res = runStressSimulation({
      uclShock: 20,
      transfersShock: 10,
      costInflation: 3,
      rateShock: 50,
    });
    expect(res.monthlyTrajectory).toHaveLength(24);
    expect(res.finalCashBalance).toBeLessThan(runStressSimulation(STRESS_PRESETS.base).finalCashBalance);
  });

  it("computes dynamic slider background gradient string", () => {
    const bg0 = getStressSliderBackground(0, 0, 60);
    expect(bg0).toContain("linear-gradient");
    const bg60 = getStressSliderBackground(60, 0, 60);
    expect(bg60).toContain("linear-gradient");
  });
});

describe("StressTestingSimulator Component", () => {
  beforeEach(async () => {
    useAppState.setState({ isPt: true });
    await loadTranslations("pt");
  });

  it("renders headers, presets, KPIs, chart, and guide accordion in Portuguese", () => {
    render(<StressTestingSimulator />);

    expect(
      screen.getByText(/Simulador de Testes de Esforço & Autonomia de Tesouraria/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Autonomia de Caixa \(Runway\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Caixa Projetado no Mês 24/i)).toBeInTheDocument();
    expect(screen.getByText(/Capitais Próprios Projetados/i)).toBeInTheDocument();
  });

  it("applies presets when preset buttons are clicked", () => {
    render(<StressTestingSimulator />);

    const perfectStormBtn = screen.getByRole("button", {
      name: /Tempestade Perfeita/i,
    });
    fireEvent.click(perfectStormBtn);
    expect(perfectStormBtn).toHaveClass("active");
    expect(screen.getByText(/Alerta de Stress Crítico: Risco de Liquidez/i)).toBeInTheDocument();
  });

  it("toggles monthly breakdown table when button is clicked", () => {
    render(<StressTestingSimulator />);

    const toggleTableBtn = screen.getByText(/📊 Ver Tabela Mensal de Tesouraria/i);
    fireEvent.click(toggleTableBtn);

    expect(screen.getByText(/M01 \(Jul\)/i)).toBeInTheDocument();
    expect(screen.getByText(/M24 \(Jun\)/i)).toBeInTheDocument();
  });

  it("renders in English when isPt is false", async () => {
    useAppState.setState({ isPt: false });
    await loadTranslations("en");
    render(<StressTestingSimulator />);

    expect(
      screen.getByText(/Stress Testing & Cash Runway Simulator/i),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Cash Runway/i)[0]).toBeInTheDocument();
  });
});

describe("StressTestingGuide Component", () => {
  beforeEach(async () => {
    useAppState.setState({ isPt: true });
    await loadTranslations("pt");
  });

  it("renders guide header, expands/collapses and toggles tabs", () => {
    render(<StressTestingGuide />);

    expect(
      screen.getByText(/Guia de Testes de Esforço & Resiliência de Tesouraria/i),
    ).toBeInTheDocument();

    const methBtn = screen.getByRole("button", {
      name: /📐 Metodologia & Risco/i,
    });
    fireEvent.click(methBtn);
    expect(methBtn).toHaveClass("active");
    expect(screen.getByText(/Mecânica da Sazonalidade de Caixa/i)).toBeInTheDocument();
  });
});
