import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { state } from "../src/state.js";
import { initHealthBar, renderHealthBar } from "../src/health.js";
import { calculateHealthSignals } from "../src/metrics.js";

// Mock Chart to avoid jsdom canvas issues
vi.mock("chart.js/auto", () => {
  return {
    default: class Chart {
      constructor() {}
      destroy() {}
    }
  };
});

describe("health.js", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="seasonSelector"></div>
      <h3 id="healthBarTitle"></h3>
      <div id="healthSignals" data-rendered-idx="-1"></div>
      <div id="kpiRow"></div>
    `;

    state.DATASET = {
      annual_data: [
        { label: "2010/11", financial_result: 10, total_revenue: 100, revenue_operating: 100, current_assets: 50, current_liabilities: 20, equity: 10, personnel_costs: 50, net_debt: 20 },
        { label: "2011/12", financial_result: -10, total_revenue: 90, revenue_operating: 90, current_assets: 40, current_liabilities: 60, equity: -10, personnel_costs: 60, net_debt: 50 },
        { label: "2012/13", financial_result: 20, total_revenue: 120, revenue_operating: 120, current_assets: 80, current_liabilities: 40, equity: 50, personnel_costs: 70, net_debt: 30 }
      ]
    };
    state.healthBarIdx = null;
    state.isPt = false;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("should initialize health bar with pills for each season", () => {
    initHealthBar();
    const pills = document.querySelectorAll(".season-pill");
    expect(pills.length).toBe(3);
    expect(pills[2].textContent).toBe("2012/13");
    
    // By default selects latest
    expect(state.healthBarIdx).toBe(2);
    expect(pills[2].classList.contains("active")).toBe(true);
  });

  it("should render health signals correctly", () => {
    initHealthBar(); // This calls renderHealthBar(2) internally
    vi.runAllTimers(); // Ensure any rendering timeout completes

    const title = document.getElementById("healthBarTitle");
    expect(title.textContent).toBe("Club Financial Health — 2012/13");

    const signals = document.querySelectorAll(".health-signal");
    expect(signals.length).toBeGreaterThan(0);
    
    const sig = signals[0];
    // With our mock data, we should have generated some signals based on metrics.js
    expect(sig.classList.contains("health-signal")).toBe(true);
  });

  it("should update language strings based on state.isPt", () => {
    state.isPt = true;
    initHealthBar();

    const title = document.getElementById("healthBarTitle");
    expect(title.textContent).toBe("Saúde Financeira do Clube — 2012/13");
  });

  it("should respond to click events on season pills", () => {
    initHealthBar();
    vi.runAllTimers();
    
    const pills = document.querySelectorAll(".season-pill");
    pills[0].click(); // click on 2010/11
    vi.runAllTimers();
    
    expect(state.healthBarIdx).toBe(0);
    expect(pills[0].classList.contains("active")).toBe(true);
    expect(pills[2].classList.contains("active")).toBe(false);
  });
});
