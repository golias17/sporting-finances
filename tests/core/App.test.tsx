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

  it("renders without crashing and mounts the TopNav and Hero", async () => {
    initChartDefaults(); // ensure baseOpts are populated for theme toggler
    // Populate fake state just to be safe
    state.setDataset({
      currency: "EUR",
      company: "Sporting SAD",
      ticker: "SCP",
      fiscal_year_end: "June",
      annual_data: [],
    });

    await act(async () => {
      render(<App />);
    });

    // Check TopNav
    expect(screen.getByText("Sporting SAD · Euronext Lisbon")).not.toBeNull();

    // Check Hero
    expect(screen.getByText(/From insolvency to/)).not.toBeNull();

    // Check Skip Link
    expect(screen.getByText("Skip to content")).not.toBeNull();
  });
});
