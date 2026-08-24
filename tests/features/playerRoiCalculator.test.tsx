import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PlayerRoiCalculator } from "../../src/features/squad/PlayerRoiCalculator.js";
import { PlayerValuationTable } from "../../src/features/squad/PlayerValuationTable.js";
import {
  SQUAD_VALUATION_PROFILES,
  calculatePlayerSaleRoi,
} from "../../src/features/squad/playerValuationData.js";
import { useAppState } from "../../src/core/state.js";
import { loadTranslations } from "../../src/ui/translations.js";

describe("playerValuationData Calculations", () => {
  it("calculates accurate waterfall for Gyökeres at €100M release clause", () => {
    const gyokeres = SQUAD_VALUATION_PROFILES.find((p) => p.id === "gyokeres")!;
    const res = calculatePlayerSaleRoi(gyokeres, 100.0, 0.05);

    expect(res.grossFee).toBe(100.0);
    expect(res.bookValueDeduction).toBe(14.4);
    expect(res.sellOnFee).toBe(7.6);
    expect(res.fifaSolidarity).toBe(5.0);
    expect(res.agentFee).toBe(5.0);
    expect(res.netAccountingGain).toBeCloseTo(68.0, 1);
    expect(res.netCashInflow).toBeCloseTo(82.4, 1);
    expect(res.annualAmortizationRelief).toBe(4.8);
    expect(res.uefaSquadCostRelief).toBeCloseTo(8.6, 1);
  });

  it("calculates 100% margin for Homegrown Academy player (Gonçalo Inácio)", () => {
    const inacio = SQUAD_VALUATION_PROFILES.find((p) => p.id === "inacio")!;
    const res = calculatePlayerSaleRoi(inacio, 60.0, 0.05);

    expect(res.bookValueDeduction).toBe(0);
    expect(res.sellOnFee).toBe(0);
    expect(res.fifaSolidarity).toBe(0); // Homegrown
    expect(res.agentFee).toBe(3.0);
    expect(res.netAccountingGain).toBe(57.0);
    expect(res.roiMultiple).toBe(999.0);
  });

  it("handles total basis sell-on fee for Franco Israel", () => {
    const israel = SQUAD_VALUATION_PROFILES.find((p) => p.id === "israel")!;
    const res = calculatePlayerSaleRoi(israel, 20.0, 0.05);

    expect(res.sellOnFee).toBe(8.0); // 40% of €20M
    expect(res.fifaSolidarity).toBe(1.0);
  });
});

describe("PlayerRoiCalculator Component", () => {
  beforeEach(async () => {
    useAppState.setState({ isPt: true });
    await loadTranslations("pt");
  });

  it("renders player ROI title, player chips, KPIs, and matrix table in Portuguese", () => {
    render(<PlayerRoiCalculator />);

    expect(
      screen.getByText(/Ficha Contabilística de Ativos & Simulador de Mais-Valias de Venda/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Proposta de Transferência/i)).toBeInTheDocument();
    expect(screen.getByText(/Mais-Valia Contabilística Líquida/i)).toBeInTheDocument();
    expect(screen.getByText(/Alívio Anual UEFA FSR/i)).toBeInTheDocument();
  });

  it("switches active player when clicking a player chip", () => {
    render(<PlayerRoiCalculator />);

    const hjulmandBtn = screen.getByRole("button", { name: /Hjulmand/i });
    fireEvent.click(hjulmandBtn);

    expect(screen.getAllByText(/Morten Hjulmand/i)[0]).toBeInTheDocument();
  });

  it("filters players by position and academy", () => {
    render(<PlayerRoiCalculator />);

    const fwdBtn = screen.getByRole("button", { name: /Avançados/i });
    fireEvent.click(fwdBtn);
    expect(fwdBtn).toHaveClass("active");

    const midBtn = screen.getByRole("button", { name: /Médios/i });
    fireEvent.click(midBtn);
    expect(midBtn).toHaveClass("active");

    const defBtn = screen.getByRole("button", { name: /Defesas/i });
    fireEvent.click(defBtn);
    expect(defBtn).toHaveClass("active");

    const acadBtn = screen.getByRole("button", { name: /Formação \(Alcochete\)/i });
    fireEvent.click(acadBtn);
    expect(acadBtn).toHaveClass("active");
  });

  it("applies release clause, market value and conservative preset fees", () => {
    render(<PlayerRoiCalculator />);

    const clauseBtn = screen.getByRole("button", {
      name: /Cláusula de Rescisão/i,
    });
    fireEvent.click(clauseBtn);
    expect(screen.getByText(/€100.0M/i)).toBeInTheDocument();

    const marketBtn = screen.getByRole("button", {
      name: /Valor de Mercado/i,
    });
    fireEvent.click(marketBtn);
    expect(screen.getAllByText(/€75.0M/i)[0]).toBeInTheDocument();

    const consBtn = screen.getByRole("button", {
      name: /Oferta Mínima/i,
    });
    fireEvent.click(consBtn);
    expect(screen.getByText(/€60.0M/i)).toBeInTheDocument();
  });

  it("allows dragging proposed fee and agent commission sliders", () => {
    render(<PlayerRoiCalculator />);

    const feeSlider = screen.getByLabelText(/Valor Proposto de Transferência/i);
    fireEvent.change(feeSlider, { target: { value: "90" } });
    expect(screen.getByText(/€90.0M/i)).toBeInTheDocument();

    const agentSlider = screen.getByLabelText(/Comissão de Intermediação/i);
    fireEvent.change(agentSlider, { target: { value: "0.08" } });
    expect(screen.getByText(/8%/i)).toBeInTheDocument();
  });

  it("renders in English when isPt is false", async () => {
    useAppState.setState({ isPt: false });
    await loadTranslations("en");
    render(<PlayerRoiCalculator />);

    expect(
      screen.getByText(/Player Net Book Value & Sale ROI Calculator/i),
    ).toBeInTheDocument();
  });
});

describe("PlayerValuationTable Component", () => {
  beforeEach(async () => {
    useAppState.setState({ isPt: true });
    await loadTranslations("pt");
  });

  it("filters table items by search query and allows sorting", () => {
    const onSelect = vi.fn();
    render(<PlayerValuationTable onSelectPlayer={onSelect} selectedPlayerId="debast" />);

    const searchInput = screen.getByPlaceholderText(/Pesquisar jogador/i);
    fireEvent.change(searchInput, { target: { value: "Debast" } });

    expect(screen.getByText(/Zeno Debast/i)).toBeInTheDocument();
    expect(screen.queryByText(/Viktor Gyökeres/i)).not.toBeInTheDocument();

    const row = screen.getByText(/Zeno Debast/i).closest("tr");
    if (row) fireEvent.click(row);
    expect(onSelect).toHaveBeenCalled();

    // Sort by name
    const nameHeader = screen.getByText(/Jogador/i);
    fireEvent.click(nameHeader);
    fireEvent.click(nameHeader);

    // Sort by cost
    const costHeader = screen.getByText(/Custo Aquisição/i);
    fireEvent.click(costHeader);

    // Sort by amort
    const amortHeader = screen.getByText(/Amort. Anual/i);
    fireEvent.click(amortHeader);

    // Sort by book value
    const bookHeader = screen.getByText(/Valor Contab. Residual/i);
    fireEvent.click(bookHeader);

    // Sort by market value
    const marketHeader = screen.getByText(/Valor Mercado/i);
    fireEvent.click(marketHeader);

    // Sort by clause
    const clauseHeaders = screen.getAllByText(/Cláusula/i);
    fireEvent.click(clauseHeaders[0]);

    // Sort by expiry
    const expHeader = screen.getByText(/Fim Contrato/i);
    fireEvent.click(expHeader);
  });
});
