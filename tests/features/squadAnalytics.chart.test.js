import { describe, it, expect, beforeAll, beforeEach, afterEach } from "vitest";
import { state } from "../../src/core/state.js";
import {
  initChartDefaults,
  chartRegistry,
  getBrandColors,
} from "../../src/charts/chartUtils.js";
import {
  drawManagerEras,
  drawCommissions,
} from "../../src/features/squadAnalytics.js";
import { mockChartEnvironment } from "../charts/chartTestUtils.js";

// Same palette squadAnalytics.js's own FALLBACK constant is derived from
// (getBrandColors(false), light mode) — used below to assert against it
// without importing the module's un-exported FALLBACK directly.
const FALLBACK = getBrandColors(false);

// drawManagerEras/drawCommissions build their charts via charts.js's
// mkChart() helper, same as every other chart in the app — that needs the
// *real* Chart.js with jsdom's canvas 2D context mocked out. See
// chartTestUtils.js.
describe("squadAnalytics.js - drawManagerEras / drawCommissions", () => {
  beforeAll(() => {
    mockChartEnvironment();
  });

  beforeEach(() => {
    chartRegistry.forEach((chart) => chart.destroy());
    chartRegistry.clear();

    // Mirrors index.html's real markup for these two cards closely enough
    // that mkChart()'s generateAccessibleTable()/addChartDownloadButton()
    // can find their expected .card/.card-head/.tag insertion points.
    document.body.innerHTML = `
      <div class="card">
        <div class="card-head">
          <h3>Net Earnings by Managerial Era</h3>
          <span class="tag">Purchases vs. Sales</span>
        </div>
        <div class="chart-box tall">
          <canvas id="chartManagerEras" role="img" aria-label="Transfer Net Earnings by Managerial Era"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-head">
          <h3>Agent Commissions Trend</h3>
          <span class="tag">Sales vs Acquisitions</span>
        </div>
        <div class="chart-box tall">
          <canvas id="chartCommissions" role="img" aria-label="Agent commissions trend chart"></canvas>
        </div>
      </div>
    `;

    state.setIsPt(false);
    state.setTransferLedger([
      {
        season: "2013/14",
        purchases: [{ player: "Player A", fee: 10, commission: 1 }],
        sales: [{ player: "Player B", fee: 4, commission: 0.5 }],
      },
      {
        season: "2021/22",
        purchases: [{ player: "Player C", fee: 20, commission: 2 }],
        sales: [{ player: "Player D", fee: 30, commission: 3 }],
      },
    ]);

    initChartDefaults();
  });

  afterEach(() => {
    // Destroy (not just drop) charts left over from this test — mirrors
    // chart.test.js/playground.test.js: leaving a Chart instance's internal
    // MutationObserver alive past teardown makes it fire asynchronously
    // against an already-torn-down jsdom `window`, throwing during the next
    // test file's setup.
    chartRegistry.forEach((chart) => chart.destroy());
    chartRegistry.clear();
  });

  describe("drawManagerEras", () => {
    it("does nothing when the canvas is missing", () => {
      document.getElementById("chartManagerEras").remove();
      expect(() => drawManagerEras()).not.toThrow();
      expect(chartRegistry.has("chartManagerEras")).toBe(false);
    });

    it("builds a bar+line chart bucketing sales/purchases into each ledger season's manager era", () => {
      drawManagerEras();
      const chart = chartRegistry.get("chartManagerEras");
      expect(chart).toBeDefined();

      // 2013/14 -> Leonardo Jardim era; 2021/22 -> Rúben Amorim era.
      expect(chart.data.labels).toContain("Leonardo Jardim (13/14)");
      expect(chart.data.labels).toContain("Rúben Amorim (20/21 - 23/24)");

      const [salesDs, purchasesDs, netDs] = chart.data.datasets;
      expect(salesDs.label).toBe("Sales (M€)");
      expect(purchasesDs.label).toBe("Purchases (M€)");
      expect(netDs.label).toBe("Net Earnings (M€)");

      const jardimIdx = chart.data.labels.indexOf("Leonardo Jardim (13/14)");
      expect(salesDs.data[jardimIdx]).toBe(4);
      expect(purchasesDs.data[jardimIdx]).toBe(10);
      expect(netDs.data[jardimIdx]).toBe(4 - 10);
    });

    it("uses the soft-fill + solid-border style matching Net Result (posSoft/pos sales, negSoft/neg purchases)", () => {
      drawManagerEras();
      const chart = chartRegistry.get("chartManagerEras");
      const [salesDs, purchasesDs] = chart.data.datasets;

      expect(salesDs.backgroundColor).toBe(state.COLORS.posSoft);
      expect(salesDs.borderColor).toBe(state.COLORS.pos);
      expect(salesDs.borderWidth).toBe(1);

      expect(purchasesDs.backgroundColor).toBe(state.COLORS.negSoft);
      expect(purchasesDs.borderColor).toBe(state.COLORS.neg);
      expect(purchasesDs.borderWidth).toBe(1);
    });

    it("localizes dataset labels when state.isPt is true", () => {
      state.setIsPt(true);
      drawManagerEras();
      const chart = chartRegistry.get("chartManagerEras");
      const [salesDs, purchasesDs, netDs] = chart.data.datasets;
      expect(salesDs.label).toBe("Vendas (M€)");
      expect(purchasesDs.label).toBe("Compras (M€)");
      expect(netDs.label).toBe("Ganho Líquido (M€)");
    });

    it("formats tooltip labels as '<dataset>: <value> M€'", () => {
      drawManagerEras();
      const chart = chartRegistry.get("chartManagerEras");
      const label = chart.config.options.plugins.tooltip.callbacks.label({
        dataset: { label: "Sales (M€)" },
        raw: 12.34,
      });
      expect(label).toBe("Sales (M€): 12.3 M€");
    });
  });

  describe("drawCommissions", () => {
    it("does nothing when the canvas is missing", () => {
      document.getElementById("chartCommissions").remove();
      expect(() => drawCommissions()).not.toThrow();
      expect(chartRegistry.has("chartCommissions")).toBe(false);
    });

    it("builds a stacked bar chart of per-season sales/purchase commissions", () => {
      drawCommissions();
      const chart = chartRegistry.get("chartCommissions");
      expect(chart).toBeDefined();

      expect(chart.data.labels).toEqual(["2013/14", "2021/22"]);
      const [salesCommDs, purchasesCommDs] = chart.data.datasets;
      expect(salesCommDs.data).toEqual([0.5, 3]);
      expect(purchasesCommDs.data).toEqual([1, 2]);
      expect(salesCommDs.stack).toBe("Stack 0");
      expect(purchasesCommDs.stack).toBe("Stack 0");
    });

    it("uses the soft-fill + solid-border style matching drawManagerEras (posSoft/pos sales, negSoft/neg purchases)", () => {
      drawCommissions();
      const chart = chartRegistry.get("chartCommissions");
      const [salesCommDs, purchasesCommDs] = chart.data.datasets;

      expect(salesCommDs.backgroundColor).toBe(state.COLORS.posSoft);
      expect(salesCommDs.borderColor).toBe(state.COLORS.pos);
      expect(purchasesCommDs.backgroundColor).toBe(state.COLORS.negSoft);
      expect(purchasesCommDs.borderColor).toBe(state.COLORS.neg);
    });

    it("stacks the x/y scales (unlike drawManagerEras, which is unstacked)", () => {
      drawCommissions();
      const chart = chartRegistry.get("chartCommissions");
      expect(chart.config.options.scales.x.stacked).toBe(true);
      expect(chart.config.options.scales.y.stacked).toBe(true);
    });
  });

  // Every ledger season in the shared beforeEach mock has both `sales` and
  // `purchases` arrays present, so the `if (seasonObj.sales)`/
  // `if (seasonObj.purchases)` guards in both draw functions only ever took
  // their true branch. Real ledger seasons can be purchase-only or
  // sale-only (see data/transfers.json), so the false branch — treating a
  // missing array as zero rather than throwing — needs its own coverage.
  it("treats a season missing its sales or purchases array as zero, not a crash, in both charts", () => {
    state.setTransferLedger([
      {
        season: "2013/14",
        purchases: [{ player: "Only Buy", fee: 10, commission: 1 }],
      },
      {
        season: "2021/22",
        sales: [{ player: "Only Sell", fee: 30, commission: 3 }],
      },
    ]);

    expect(() => drawManagerEras()).not.toThrow();
    const erasChart = chartRegistry.get("chartManagerEras");
    const [salesDs, purchasesDs] = erasChart.data.datasets;
    const jardimIdx = erasChart.data.labels.indexOf("Leonardo Jardim (13/14)");
    const amorimIdx = erasChart.data.labels.indexOf(
      "Rúben Amorim (20/21 - 23/24)",
    );
    expect(salesDs.data[jardimIdx]).toBe(0); // no sales array that season
    expect(purchasesDs.data[jardimIdx]).toBe(10);
    expect(salesDs.data[amorimIdx]).toBe(30);
    expect(purchasesDs.data[amorimIdx]).toBe(0); // no purchases array that season

    expect(() => drawCommissions()).not.toThrow();
    const commChart = chartRegistry.get("chartCommissions");
    const [salesCommDs, purchasesCommDs] = commChart.data.datasets;
    expect(salesCommDs.data).toEqual([0, 3]);
    expect(purchasesCommDs.data).toEqual([1, 0]);
  });

  // FALLBACK (derived from getBrandColors(false)) exists specifically for
  // the case where a chart is drawn before initChartDefaults() has
  // populated state.COLORS — see the comment on FALLBACK's definition in
  // squadAnalytics.js. That branch of every `state.COLORS.x || FALLBACK.x`
  // pair never runs in any other test here since beforeEach always calls
  // initChartDefaults() first. state.COLORS is a live Proxy over a plain
  // object (see state.js), so deleting keys off it and restoring them
  // afterward is enough to exercise the fallback without needing any
  // export change to state.js.
  it("falls back to the canonical light palette for legend/dataset colors when state.COLORS isn't populated yet", () => {
    const keys = [
      "ink",
      "posSoft",
      "pos",
      "negSoft",
      "neg",
      "gold",
      "goldSoft",
    ];
    const saved = {};
    keys.forEach((k) => {
      saved[k] = state.COLORS[k];
      delete state.COLORS[k];
    });

    try {
      drawManagerEras();
      const erasChart = chartRegistry.get("chartManagerEras");
      expect(erasChart.config.options.plugins.legend.labels.color).toBe(
        FALLBACK.ink,
      );
      const [salesDs, purchasesDs, netDs] = erasChart.data.datasets;
      expect(salesDs.backgroundColor).toBe(FALLBACK.posSoft);
      expect(salesDs.borderColor).toBe(FALLBACK.pos);
      expect(purchasesDs.backgroundColor).toBe(FALLBACK.negSoft);
      expect(purchasesDs.borderColor).toBe(FALLBACK.neg);
      expect(netDs.borderColor).toBe(FALLBACK.gold);
      expect(netDs.backgroundColor).toBe(FALLBACK.goldSoft);

      drawCommissions();
      const commChart = chartRegistry.get("chartCommissions");
      const [salesCommDs, purchasesCommDs] = commChart.data.datasets;
      expect(salesCommDs.backgroundColor).toBe(FALLBACK.posSoft);
      expect(salesCommDs.borderColor).toBe(FALLBACK.pos);
      expect(purchasesCommDs.backgroundColor).toBe(FALLBACK.negSoft);
      expect(purchasesCommDs.borderColor).toBe(FALLBACK.neg);
    } finally {
      keys.forEach((k) => {
        state.COLORS[k] = saved[k];
      });
    }
  });
});
