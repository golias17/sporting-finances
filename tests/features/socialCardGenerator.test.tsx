import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import {
  generateSocialCardCanvas,
  downloadSocialCard,
  copySocialCardToClipboard,
  shareSocialCardNative,
} from "../../src/utils/socialCardGenerator.js";
import { SocialShareModal } from "../../src/components/SocialShareModal.js";
import { ChartDownloadButton } from "../../src/components/ChartDownloadButton.js";
import { useAppState } from "../../src/core/state.js";
import { loadTranslations } from "../../src/ui/translations.js";

beforeAll(() => {
  // Mock HTMLCanvasElement.prototype.getContext for jsdom
  const mockCtx = {
    createLinearGradient: () => ({
      addColorStop: vi.fn(),
    }),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    letterSpacing: "",
    shadowColor: "",
    shadowBlur: 0,
    shadowOffsetY: 0,
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: (text: string) => ({ width: text.length * 8 }),
    beginPath: vi.fn(),
    roundRect: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    drawImage: vi.fn(),
  };

  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((type) => {
    if (type === "2d") return mockCtx;
    return null;
  });

  HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue("data:image/png;base64,mocked");
  HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation((cb) => {
    cb(new Blob(["mock"], { type: "image/png" }));
  });
});

describe("socialCardGenerator", () => {
  it("generates 1:1 square canvas (1200x1200)", async () => {
    const mockChartRef = {
      current: {
        toBase64Image: () => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      },
    };

    const canvas = await generateSocialCardCanvas(mockChartRef, {
      title: "Demonstração de Resultados 2024/25",
      subtitle: "Receitas recorde de €179M e EBITDA positivo de €54M",
      format: "1:1",
      theme: "emerald",
      kpis: [{ label: "Receitas", value: "€179.3M" }],
      isPt: true,
    });

    expect(canvas).not.toBeNull();
    if (canvas) {
      expect(canvas.width).toBe(1200);
      expect(canvas.height).toBe(1200);
    }
  });

  it("generates 16:9 landscape canvas (1200x675)", async () => {
    const mockChartRef = {
      current: {
        toBase64Image: () => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      },
    };

    const canvas = await generateSocialCardCanvas(mockChartRef, {
      title: "UEFA Squad Cost Rule Radar",
      format: "16:9",
      theme: "dark",
      isPt: false,
    });

    expect(canvas).not.toBeNull();
    if (canvas) {
      expect(canvas.width).toBe(1200);
      expect(canvas.height).toBe(675);
    }
  });

  it("generates 9:16 story canvas (1080x1920)", async () => {
    const mockChartRef = {
      current: {
        toBase64Image: () => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      },
    };

    const canvas = await generateSocialCardCanvas(mockChartRef, {
      title: "Demonstração de Resultados 2024/25",
      subtitle: "Story Format",
      format: "9:16",
      theme: "light",
      customNote: "Destaque Histórico",
      kpis: [
        { label: "Receitas", value: "€179.3M" },
        { label: "EBITDA", value: "€54.2M" },
      ],
      isPt: true,
    });

    expect(canvas).not.toBeNull();
    if (canvas) {
      expect(canvas.width).toBe(1080);
      expect(canvas.height).toBe(1920);
    }
  });

  it("handles downloadSocialCard trigger", () => {
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;
    expect(() => downloadSocialCard(canvas, "test_chart")).not.toThrow();
  });

  it("handles copySocialCardToClipboard gracefully", async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;
    const res = await copySocialCardToClipboard(canvas);
    expect(typeof res).toBe("boolean");
  });

  it("handles shareSocialCardNative gracefully", async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;
    const res = await shareSocialCardNative(canvas, "Sporting Card");
    expect(typeof res).toBe("boolean");
  });
});

describe("SocialShareModal Component", () => {
  beforeEach(async () => {
    useAppState.setState({ isPt: true });
    await loadTranslations("pt");
  });

  it("renders modal with live preview, format buttons, theme buttons, note input and action buttons", async () => {
    const onClose = vi.fn();
    const mockChartRef = {
      current: {
        toBase64Image: () => "data:image/png;base64,fake",
      },
    };

    render(
      <SocialShareModal
        isOpen={true}
        onClose={onClose}
        chartRef={mockChartRef}
        title="Receitas vs Gastos"
        fileName="chart_revenue"
      />,
    );

    expect(
      screen.getByText(/Gerador de Cartão Infográfico para Redes Sociais/i),
    ).toBeInTheDocument();

    const storyBtn = screen.getByRole("button", { name: /9:16 Story/i });
    fireEvent.click(storyBtn);
    expect(storyBtn).toHaveClass("active");

    const darkThemeBtn = screen.getByRole("button", { name: /Carbono Escuro/i });
    fireEvent.click(darkThemeBtn);
    expect(darkThemeBtn).toHaveClass("active");

    const lightThemeBtn = screen.getByRole("button", { name: /Executivo Claro/i });
    fireEvent.click(lightThemeBtn);
    expect(lightThemeBtn).toHaveClass("active");

    const emeraldThemeBtn = screen.getByRole("button", { name: /Esmeralda/i });
    fireEvent.click(emeraldThemeBtn);
    expect(emeraldThemeBtn).toHaveClass("active");

    const noteInput = screen.getByPlaceholderText(/Adicione um comentário ou nota/i);
    fireEvent.change(noteInput, { target: { value: "Melhor época de sempre!" } });
    expect(noteInput).toHaveValue("Melhor época de sempre!");

    // Download & Copy action triggers
    await waitFor(() => {
      const downloadBtn = screen.getByRole("button", { name: /Descarregar Imagem PNG/i });
      fireEvent.click(downloadBtn);

      const copyBtn = screen.getByRole("button", { name: /Copiar para a Área de Transferência/i });
      fireEvent.click(copyBtn);
    });

    const closeBtn = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});

describe("ChartDownloadButton Component", () => {
  it("renders camera share button, direct download button and triggers export", () => {
    const mockChartRef = { current: { toBase64Image: vi.fn().mockReturnValue("data:image/png;base64,fake") } };
    render(
      <ChartDownloadButton
        chartRef={mockChartRef}
        fileName="chart_test"
        title="Teste de Gráfico"
      />,
    );

    expect(screen.getByText("📸")).toBeInTheDocument();
    const downloadBtn = screen.getByLabelText(/Download chart image/i);
    fireEvent.click(downloadBtn);
    expect(mockChartRef.current.toBase64Image).toHaveBeenCalled();

    const shareBtn = screen.getByText("📸").closest("button");
    if (shareBtn) {
      fireEvent.click(shareBtn);
      expect(
        screen.getByText(/Gerador de Cartão Infográfico/i),
      ).toBeInTheDocument();
    }
  });
});
