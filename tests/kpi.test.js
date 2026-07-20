import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderKpis } from "../src/kpi.js";
import { state } from "../src/state.js";

// Mock the metrics module
vi.mock("../src/metrics.js", () => ({
  calculateKpis: vi.fn(() => [
    { label: "Revenue", value: "€50M", change: "+10%", cls: "pos" },
    { label: "Debt", value: "€10M", change: "-5%", cls: "neg" },
  ]),
}));

describe("kpi.js", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="kpiRow"></div>';
    state.DATASET = { annual_data: [{}, {}, {}] }; // Mock some data length
    state.healthBarIdx = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders KPIs correctly using calculateKpis data", () => {
    renderKpis();

    const row = document.getElementById("kpiRow");
    expect(row).not.toBeNull();

    const kpis = row.querySelectorAll(".kpi");
    expect(kpis.length).toBe(2);

    expect(kpis[0].querySelector(".label").textContent).toBe("Revenue");
    expect(kpis[0].querySelector(".value").textContent).toBe("€50M");
    expect(kpis[0].querySelector(".change.pos").textContent).toBe("+10%");
    // The card itself also carries the pos/neg class (not just the change
    // pill) so CSS can give it a health-bar-style status border.
    expect(kpis[0].classList.contains("pos")).toBe(true);

    expect(kpis[1].querySelector(".label").textContent).toBe("Debt");
    expect(kpis[1].querySelector(".value").textContent).toBe("€10M");
    expect(kpis[1].querySelector(".change.neg").textContent).toBe("-5%");
    expect(kpis[1].classList.contains("neg")).toBe(true);
  });

  it("uses state.healthBarIdx if no index is passed", () => {
    state.healthBarIdx = 1;
    renderKpis();
    // This is mostly to ensure no crash happens and it runs through
    const kpis = document.querySelectorAll(".kpi");
    expect(kpis.length).toBe(2);
  });

  it("does nothing (no throw) when #kpiRow is missing from the page", () => {
    document.body.innerHTML = "";
    expect(() => renderKpis()).not.toThrow();
  });
});
