import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { PlaygroundTab } from "../../src/features/tabs/PlaygroundTab.js";
import { useAppState } from "../../src/core/state.js";
import { loadTranslations } from "../../src/ui/translations.js";

describe("PlaygroundTab Component", () => {
  beforeEach(async () => {
    useAppState.setState({ isPt: true });
    await loadTranslations("pt");
  });

  it("renders chapter header and navigates through all 4 sub-tabs", () => {
    render(<PlaygroundTab />);

    expect(
      screen.getAllByText(/Simulador Orçamental Macro/i)[0],
    ).toBeInTheDocument();

    // 1. Transfers sub-tab
    fireEvent.click(
      screen.getByRole("button", { name: /Impacto de Contratações/i }),
    );
    expect(
      screen.getByRole("button", { name: /Impacto de Contratações/i }),
    ).toHaveClass("active");

    // 2. Player ROI sub-tab
    fireEvent.click(
      screen.getByRole("button", { name: /Simulador de Mais-Valias de Jogadores/i }),
    );
    expect(
      screen.getByRole("button", { name: /Simulador de Mais-Valias de Jogadores/i }),
    ).toHaveClass("active");
    expect(
      screen.getByText(/Ficha Contabilística de Ativos/i),
    ).toBeInTheDocument();

    // 3. Stress testing sub-tab
    fireEvent.click(
      screen.getByRole("button", { name: /Testes de Esforço & Resiliência/i }),
    );
    expect(
      screen.getByRole("button", { name: /Testes de Esforço & Resiliência/i }),
    ).toHaveClass("active");
    expect(
      screen.getByText(/Simulador de Testes de Esforço & Autonomia/i),
    ).toBeInTheDocument();

    // 4. Back to Macro
    fireEvent.click(
      screen.getByRole("button", { name: /Simulador Orçamental Macro/i }),
    );
    expect(
      screen.getByRole("button", { name: /Simulador Orçamental Macro/i }),
    ).toHaveClass("active");
  });
});
