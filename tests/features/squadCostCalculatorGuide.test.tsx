import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { SquadCostCalculatorGuide } from "../../src/features/SquadCostCalculatorGuide.js";
import { state } from "../../src/core/state.js";

describe("SquadCostCalculatorGuide", () => {
  beforeEach(() => {
    state.isPt = true;
  });

  it("renders the transfer guide header and step-by-step instructions", () => {
    render(<SquadCostCalculatorGuide />);
    expect(
      screen.getByText(
        /Guia do Calculador de Contratações \(UEFA Squad Cost Rule\)/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Como Usar o Calculador de Contratações/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Escolha a Época & Janela de Mercado/i),
    ).toBeInTheDocument();
  });

  it("allows switching to UEFA regulatory rules tab", () => {
    render(<SquadCostCalculatorGuide />);
    const methodTabBtn = screen.getByText(/Regras Regulamentares da UEFA FSR/i);
    fireEvent.click(methodTabBtn);
    expect(
      screen.getByText(/1\. Teto Regulamentar de 70%/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/2\. Teto de Amortização Máxima de 5 Anos/i),
    ).toBeInTheDocument();
  });

  it("allows minimizing and expanding the guide", () => {
    render(<SquadCostCalculatorGuide />);
    const toggleBtn = screen.getByText(/Minimizar Guia/i);
    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Expandir Guia/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/Escolha a Época & Janela de Mercado/i),
    ).not.toBeInTheDocument();
  });
});
