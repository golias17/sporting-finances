import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { App } from "../../src/App.js";
import { state } from "../../src/core/state.js";

import { initChartDefaults } from "../../src/charts/chartUtils.js";

// Mock chart wrappers so we don't try to load canvas and dynamic imports in jsdom
vi.mock("../../src/components/VanillaChart.js", () => ({
  VanillaChart: ({ id }: { id: string }) => (
    <div data-testid={`vanilla-chart-${id}`} />
  ),
}));

describe("<App />", () => {
  beforeAll(() => {
    // Mock IntersectionObserver for JSDOM
    if (!window.IntersectionObserver) {
      window.IntersectionObserver = class IntersectionObserver {
        constructor() {}
        observe() {}
        unobserve() {}
        disconnect() {}
      } as unknown as typeof IntersectionObserver;
    }
  });

  function renderApp() {
    initChartDefaults();
    state.setDataset({
      currency: "EUR",
      company: "Sporting SAD",
      ticker: "SCP",
      fiscal_year_end: "June",
      annual_data: [],
    });
  }

  it("renders without crashing and mounts the TopNav and Hero", async () => {
    renderApp();
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText("Sporting SAD · Euronext Lisbon")).not.toBeNull();
    expect(screen.getByText(/From insolvency to/)).not.toBeNull();
    expect(screen.getByText("Skip to content")).not.toBeNull();
  });

  it("renders the skip link in Portuguese when isPt is true", async () => {
    state.setIsPt(true);
    renderApp();
    await act(async () => {
      render(<App />);
    });
    expect(screen.getByText("Saltar para o conteúdo")).not.toBeNull();
  });
});
