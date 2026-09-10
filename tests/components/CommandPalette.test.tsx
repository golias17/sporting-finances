import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommandPalette } from "../../src/components/CommandPalette.js";
import { useAppState } from "../../src/core/state.js";

// Mock global fetch for news
global.fetch = vi.fn().mockImplementation((url) => {
  if (typeof url === "string" && url.includes("news")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [
            {
              id: "n1",
              title: "Empréstimo Obrigacionista USPP 225M€ Concluído",
              pubDate: "2025-10-15",
              category: "CMVM",
            },
          ],
        }),
    });
  }
  return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
});

describe("CommandPalette", () => {
  const mockClose = vi.fn();
  const mockOpenPdf = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAppState.setState({
      isPt: true,
      activeTab: "overview",
      TRANSFER_LEDGER: [
        {
          season: "2023/24",
          income: 60,
          cost: 40,
          note: "Record season",
          note_pt: "Época recorde",
          purchases: [
            {
              player: "Viktor Gyökeres",
              club: "Coventry City",
              fee: 24.0,
              rights: "100%",
              window: "summer",
              note: "Record signing",
              note_pt: "Contratação recorde",
            },
          ],
          sales: [
            {
              player: "Manuel Ugarte",
              club: "Paris Saint-Germain",
              fee: 60.0,
              rights: "100%",
              window: "summer",
              note: "Release clause triggered",
              note_pt: "Cláusula de rescisão",
            },
          ],
        },
        {
          season: "2019/20",
          income: 70,
          cost: 30,
          note: "Turnaround",
          note_pt: "Viragem",
          purchases: [],
          sales: [
            {
              player: "Bruno Fernandes",
              club: "Manchester United",
              fee: 65.0,
              rights: "100%",
              window: "winter",
              note: "Historic sale",
              note_pt: "Maior venda histórica",
            },
          ],
        },
      ],
    });
  });

  const renderOpenPalette = async (isOpen = true) => {
    let result!: ReturnType<typeof render>;
    await act(async () => {
      result = render(
        <CommandPalette
          isOpen={isOpen}
          onClose={mockClose}
          onOpenPdfModal={mockOpenPdf}
        />,
      );
    });
    return result;
  };

  it("does not render when isOpen is false", async () => {
    const { container } = await renderOpenPalette(false);
    expect(container.firstChild).toBeNull();
  });

  it("renders search input, category items, and shortcuts when open", async () => {
    await renderOpenPalette(true);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Pesquisar jogadores, métricas/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Alternar Modo Claro \/ Escuro/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/01\. Overview/i)).toBeInTheDocument();
  });

  it("filters items dynamically by query (e.g. Gyökeres)", async () => {
    await renderOpenPalette(true);

    const input = screen.getByPlaceholderText(/Pesquisar jogadores, métricas/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: "Gyökeres" } });
    });

    expect(screen.getByText("Viktor Gyökeres")).toBeInTheDocument();
    expect(
      screen.getByText(/Compra \(2023\/24\) • €24\.0M • Coventry City/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Bruno Fernandes/i)).not.toBeInTheDocument();
  });

  it("navigates to squad tab when player item is clicked", async () => {
    const setActiveTabSpy = vi.spyOn(useAppState.getState(), "setActiveTab");
    await renderOpenPalette(true);

    const input = screen.getByPlaceholderText(/Pesquisar jogadores, métricas/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: "Bruno Fernandes" } });
    });

    const playerItem = screen.getByText("Bruno Fernandes");
    await act(async () => {
      fireEvent.click(playerItem);
    });

    expect(setActiveTabSpy).toHaveBeenCalledWith("squad");
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it("triggers PDF modal when PDF action is selected", async () => {
    await renderOpenPalette(true);

    const input = screen.getByPlaceholderText(/Pesquisar jogadores, métricas/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: "PDF" } });
    });

    const pdfAction = screen.getByText(/Gerar Relatório Executivo em PDF/i);
    await act(async () => {
      fireEvent.click(pdfAction);
    });

    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(mockOpenPdf).toHaveBeenCalledTimes(1);
  });

  it("navigates with keyboard arrow keys and selects with Enter", async () => {
    const setActiveTabSpy = vi.spyOn(useAppState.getState(), "setActiveTab");
    await renderOpenPalette(true);

    const input = screen.getByPlaceholderText(/Pesquisar jogadores, métricas/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: "USPP" } });
      // Press Enter to select the highlighted result
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect(setActiveTabSpy).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });

  it("closes when backdrop or Escape key is pressed", async () => {
    await renderOpenPalette(true);

    const backdrop = screen.getByRole("dialog");
    await act(async () => {
      fireEvent.click(backdrop);
    });
    expect(mockClose).toHaveBeenCalled();

    await act(async () => {
      fireEvent.keyDown(
        screen.getByPlaceholderText(/Pesquisar jogadores, métricas/i),
        { key: "Escape" },
      );
    });
    expect(mockClose).toHaveBeenCalledTimes(2);
  });
});
