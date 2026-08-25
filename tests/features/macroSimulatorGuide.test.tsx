import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { MacroSimulatorGuide } from "../../src/features/MacroSimulatorGuide.js";
import { state } from "../../src/core/state.js";

describe("MacroSimulatorGuide", () => {
  beforeEach(() => {
    state.isPt = true;
  });

  it("renders the guide header and step-by-step instructions", () => {
    render(<MacroSimulatorGuide />);
    expect(
      screen.getByText(/Guia do Simulador Orçamental Macro \(CFO\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Como Usar o Simulador Macro/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Escolha um Cenário Estratégico/i),
    ).toBeInTheDocument();
  });

  it("allows switching to methodology tab", () => {
    render(<MacroSimulatorGuide />);
    const methodTabBtn = screen.getByText(/Metodologia & Nuances do Modelo/i);
    fireEvent.click(methodTabBtn);
    expect(
      screen.getByText(/1\. Linha de Base Auditada \(2024\/25\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/2\. Premiação UCL & Atrito Contratual/i),
    ).toBeInTheDocument();
  });

  it("allows minimizing and expanding the guide", () => {
    render(<MacroSimulatorGuide />);
    const toggleBtn = screen.getByText(/Minimizar Guia/i);
    fireEvent.click(toggleBtn);
    expect(screen.getByText(/Expandir Guia/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/Escolha um Cenário Estratégico/i),
    ).not.toBeInTheDocument();
  });
});
