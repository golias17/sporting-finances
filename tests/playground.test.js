import { describe, it, expect, beforeEach, vi } from "vitest";
import { state } from "../src/state.js";
import { initPlayground } from "../src/playground.js";

// Mock Chart to avoid jsdom canvas issues
vi.mock("chart.js/auto", () => {
  return {
    default: class Chart {
      constructor() {}
      destroy() {}
    },
  };
});

describe("playground.js CFO Simulator", () => {
  beforeEach(() => {
    // Setup Mock DOM
    document.body.innerHTML = `
      <section id="tab-playground">
        <select id="uclSelect">
          <option value="0">None</option>
          <option value="40">UCL</option>
        </select>
        
        <span id="payrollVal">0%</span>
        <input type="range" id="payrollSlider" min="-30" max="30" value="0" />
        
        <span id="salesVal">117 M€</span>
        <input type="range" id="salesSlider" min="0" max="150" value="117" />

        <span id="purchasesVal">30 M€</span>
        <input type="range" id="purchasesSlider" min="0" max="100" value="30" />
        
        <span id="capexVal">0%</span>
        <input type="range" id="capexSlider" min="-30" max="30" value="0" />

        <span id="debtRepayVal">0 M€</span>
        <input type="range" id="debtRepaySlider" min="0" max="50" value="0" />
        
        <button id="btnResetPlayground">Reset</button>

        <div class="kpis">
          <div class="kpi" id="pgCardRev">
            <div class="value" id="pgKpiRev">€148.1M</div>
            <div class="change" id="pgKpiRevDiff">no change</div>
          </div>
          <div class="kpi" id="pgCardNet">
            <div class="value" id="pgKpiNet">€20.0M</div>
            <div class="change" id="pgKpiNetDiff">no change</div>
          </div>
          <div class="kpi" id="pgCardEq">
            <div class="value" id="pgKpiEq">€40.9M</div>
            <div class="change" id="pgKpiEqDiff">no change</div>
          </div>
        </div>

        <canvas id="chartPlaygroundNet"></canvas>
        <canvas id="chartPlaygroundSolvency"></canvas>
      </section>
    `;

    state.isPt = false;
    state.COLORS = {
      greenSoft: "rgba(10, 93, 58, 0.4)",
      green: "#0a5d3a",
      goldSoft: "rgba(176, 137, 35, 0.4)",
      gold: "#b08923",
      chartBg: "#ffffff",
    };
  });

  it("should initialize with default values and baseline KPIs", () => {
    initPlayground();
    expect(document.getElementById("pgKpiRev").textContent).toBe("€148.1M");
    expect(document.getElementById("pgKpiNet").textContent).toBe("€20.0M");
    expect(document.getElementById("pgKpiEq").textContent).toBe("€61.0M");
  });

  it("should recalculate KPIs when UEFA Champions League is toggled", () => {
    initPlayground();
    const uclSelect = document.getElementById("uclSelect");
    uclSelect.value = "40";
    uclSelect.dispatchEvent(new Event("change"));

    // Revenue should increase by €40M prize + €8M commercial growth (from €148.1M to €196.1M)
    expect(document.getElementById("pgKpiRev").textContent).toBe("€196.1M");
    expect(document.getElementById("pgKpiRevDiff").textContent).toBe("+48.0M vs actual");

    // Net Result and Equity should also increase by €48M
    expect(document.getElementById("pgKpiNet").textContent).toBe("€68.0M");
    expect(document.getElementById("pgKpiEq").textContent).toBe("€109.0M");
  });

  it("should decrease net result when payroll is increased", () => {
    initPlayground();
    const payrollSlider = document.getElementById("payrollSlider");
    payrollSlider.value = 10; // +10% payroll increase
    payrollSlider.dispatchEvent(new Event("input"));

    // Baseline payroll is -87,736. A 10% increase is +8,773.6 expense, so Net Result decreases
    expect(document.getElementById("pgKpiNet").textContent).not.toBe("€20.0M");
    const netVal = parseFloat(document.getElementById("pgKpiNet").textContent.replace("€", "").replace("M", ""));
    expect(netVal).toBeLessThan(20.0);
  });

  it("should reset variables when reset button is clicked", () => {
    initPlayground();
    const uclSelect = document.getElementById("uclSelect");
    uclSelect.value = "40";
    uclSelect.dispatchEvent(new Event("change"));
    expect(document.getElementById("pgKpiRev").textContent).toBe("€196.1M");

    document.getElementById("btnResetPlayground").click();
    expect(document.getElementById("pgKpiRev").textContent).toBe("€148.1M");
  });
});
