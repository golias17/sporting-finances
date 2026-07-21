import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { state } from "../../src/core/state.js";
import {
  initHealthBar,
  initKpiSeasonSelector,
  refreshHealthBarIfStale,
} from "../../src/features/health.js";

// Mock Chart to avoid jsdom canvas issues. health.js now imports named
// components from "chart.js" (not the default export from "chart.js/auto")
// so it can register only what it needs instead of every controller/scale/
// plugin Chart.js ships — see the comment in health.js/charts.js. It also
// calls Chart.register(...) itself at module load, so the mock needs a
// no-op static .register() or that call throws.
vi.mock("chart.js", () => {
  class Chart {
    constructor() {}
    static register() {}
    destroy() {}
  }
  return {
    Chart,
    BarController: {},
    LineController: {},
    BarElement: {},
    LineElement: {},
    PointElement: {},
    CategoryScale: {},
    LinearScale: {},
    Legend: {},
    Tooltip: {},
    Filler: {},
  };
});

describe("health.js", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="season-selector" id="seasonSelector"></div>
      <h3 id="healthBarTitle"></h3>
      <div id="healthSignals" data-rendered-idx="-1"></div>
      <div id="kpiRow"></div>
      <div class="season-selector" id="kpiSeasonSelector"></div>
    `;

    state.setDataset({
      annual_data: [
        {
          label: "2010/11",
          financial_result: 10,
          total_revenue: 100,
          revenue_operating: 100,
          current_assets: 50,
          current_liabilities: 20,
          equity: 10,
          personnel_costs: -50,
          net_result: 8,
          // Fields required by calculateHealthSignals / calculateKpis:
          borrowings_nc: 15,
          borrowings_c: 5,
          cash: 10,
          player_transfer_income: 20,
          operating_result_excl_players: 5,
          squad_market_value: 50000,
        },
        {
          label: "2011/12",
          financial_result: -10,
          total_revenue: 90,
          revenue_operating: 90,
          current_assets: 40,
          current_liabilities: 60,
          equity: -10,
          personnel_costs: -60,
          net_result: -15,
          borrowings_nc: 30,
          borrowings_c: 10,
          cash: 5,
          player_transfer_income: 30,
          operating_result_excl_players: -8,
          squad_market_value: 40000,
        },
        {
          label: "2012/13",
          financial_result: 20,
          total_revenue: 120,
          revenue_operating: 120,
          current_assets: 80,
          current_liabilities: 40,
          equity: 50,
          personnel_costs: -70,
          net_result: 12,
          borrowings_nc: 20,
          borrowings_c: 5,
          cash: 15,
          player_transfer_income: 25,
          operating_result_excl_players: 10,
          squad_market_value: 60000,
        },
      ],
    });
    state.setHealthBarIdx(null);
    state.setUrlHealthSeason(null);
    state.setIsPt(false);
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

  it("gives each sparkline canvas a role and aria-label so screen readers aren't served a blank canvas", () => {
    initHealthBar();
    vi.runAllTimers();

    const sparklineCanvases = document.querySelectorAll(
      ".sparkline-wrap canvas",
    );
    expect(sparklineCanvases.length).toBeGreaterThan(0);
    sparklineCanvases.forEach((canvas) => {
      expect(canvas.getAttribute("role")).toBe("img");
      expect(canvas.getAttribute("aria-label")).toBeTruthy();
    });
  });

  it("localizes the sparkline aria-label when state.isPt is true", () => {
    state.setIsPt(true);
    initHealthBar();
    vi.runAllTimers();

    const sparklineCanvases = document.querySelectorAll(
      ".sparkline-wrap canvas",
    );
    expect(sparklineCanvases.length).toBeGreaterThan(0);
    sparklineCanvases.forEach((canvas) => {
      expect(canvas.getAttribute("aria-label")).toMatch(/^Tendência de /);
    });
  });

  it("should update language strings based on state.isPt", () => {
    state.setIsPt(true);
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

  describe("initKpiSeasonSelector()", () => {
    it("builds pills and defaults to the latest season without touching health signals", () => {
      initKpiSeasonSelector();

      const pills = document.querySelectorAll(
        "#kpiSeasonSelector .season-pill",
      );
      expect(pills.length).toBe(3);
      expect(state.healthBarIdx).toBe(2);
      expect(pills[2].classList.contains("active")).toBe(true);

      // The Health tab's own content should be untouched — it's hidden
      // whenever Overview (where this selector lives) is active.
      expect(document.getElementById("healthSignals").innerHTML).toBe("");
    });

    it("clicking a pill updates the shared index, both selectors, and the KPI row — but not health signals", () => {
      initKpiSeasonSelector();

      const kpiPills = document.querySelectorAll(
        "#kpiSeasonSelector .season-pill",
      );
      kpiPills[0].click();

      expect(state.healthBarIdx).toBe(0);
      expect(kpiPills[0].classList.contains("active")).toBe(true);
      expect(document.getElementById("kpiRow").innerHTML).not.toBe("");
      expect(document.getElementById("healthSignals").innerHTML).toBe("");
    });

    it("keeps the Health tab's own selector in sync even while hidden", () => {
      // Populate the Health tab's own pills first, as an earlier visit to
      // that tab would have.
      initHealthBar();
      vi.runAllTimers();

      initKpiSeasonSelector();
      const kpiPills = document.querySelectorAll(
        "#kpiSeasonSelector .season-pill",
      );
      kpiPills[0].click();

      const healthPills = document.querySelectorAll(
        "#seasonSelector .season-pill",
      );
      expect(healthPills[0].classList.contains("active")).toBe(true);
      expect(healthPills[2].classList.contains("active")).toBe(false);
    });

    it("still selects the right season on the Health tab's FIRST ever visit, if the KPI selector was used first", () => {
      // Simulates: land on Overview (default tab), change season via the
      // KPI selector, THEN visit the Health tab for the first time this
      // session — #seasonSelector has no pills yet at that point.
      initKpiSeasonSelector();
      const kpiPills = document.querySelectorAll(
        "#kpiSeasonSelector .season-pill",
      );
      kpiPills[0].click(); // idx 0 — 2010/11

      expect(
        document.querySelectorAll("#seasonSelector .season-pill").length,
      ).toBe(0);

      // First-ever Health tab visit
      initHealthBar();
      vi.runAllTimers();

      const healthPills = document.querySelectorAll(
        "#seasonSelector .season-pill",
      );
      expect(healthPills[0].classList.contains("active")).toBe(true);
      expect(healthPills[2].classList.contains("active")).toBe(false);
      expect(document.getElementById("healthBarTitle").textContent).toContain(
        "2010/11",
      );
    });
  });

  describe("updateActivePills() across multiple selectors", () => {
    it("highlights the right pill in the Health tab's own selector even after the KPI selector already built its pills first", () => {
      // Regression test: in the real index.html, #kpiSeasonSelector (inside
      // tab-overview) sits BEFORE #seasonSelector (inside tab-healthcheck) in
      // document order. updateActivePills() used to treat every .season-pill
      // across both selectors as one flat, combined NodeList and compare by
      // position in THAT list — so once both selectors had pills, the second
      // selector's local index 0 landed at a combined index offset by the
      // first selector's pill count, and idx never matched there. Rebuild
      // the DOM in that exact order (unlike the other tests in this file,
      // which happen to put #seasonSelector first and mask the bug).
      document.body.innerHTML = `
        <div class="season-selector" id="kpiSeasonSelector"></div>
        <div id="kpiRow"></div>
        <div class="season-selector" id="seasonSelector"></div>
        <h3 id="healthBarTitle"></h3>
        <div id="healthSignals" data-rendered-idx="-1"></div>
      `;

      // Overview tab loads first — builds the KPI selector's pills.
      initKpiSeasonSelector();
      // User then switches to the Health tab for the first time.
      initHealthBar();
      vi.runAllTimers();

      const healthPills = document.querySelectorAll(
        "#seasonSelector .season-pill",
      );
      const activeHealthPills = document.querySelectorAll(
        "#seasonSelector .season-pill.active",
      );
      expect(activeHealthPills.length).toBe(1);
      expect(
        healthPills[healthPills.length - 1].classList.contains("active"),
      ).toBe(true); // defaults to the latest season
    });
  });

  describe("refreshHealthBarIfStale()", () => {
    it("does nothing if the Health tab has never been rendered", async () => {
      // health.js tracks "last rendered season" in module-level state, which
      // would carry over from other tests in this file — reset the module
      // so this genuinely exercises the fresh-page-load case.
      vi.resetModules();
      const fresh = await import("../../src/features/health.js");
      expect(() => fresh.refreshHealthBarIfStale()).not.toThrow();
      expect(document.getElementById("healthSignals").innerHTML).toBe("");
    });

    it("re-renders health signals if the season changed while the tab was hidden", () => {
      initHealthBar(); // renders for idx 2 (latest)
      vi.runAllTimers();

      initKpiSeasonSelector();
      const kpiPills = document.querySelectorAll(
        "#kpiSeasonSelector .season-pill",
      );
      kpiPills[0].click(); // idx 0 — health signals not touched yet

      const titleBefore = document.getElementById("healthBarTitle").textContent;
      expect(titleBefore).toContain("2012/13"); // stale — still shows old idx's season

      refreshHealthBarIfStale();
      vi.runAllTimers();

      const titleAfter = document.getElementById("healthBarTitle").textContent;
      expect(titleAfter).toContain("2010/11");
    });

    it("is a no-op if the season hasn't changed since the last render", () => {
      initHealthBar();
      vi.runAllTimers();
      const signalsBefore = document.getElementById("healthSignals").innerHTML;

      refreshHealthBarIfStale();

      expect(document.getElementById("healthSignals").innerHTML).toBe(
        signalsBefore,
      );
    });

    it("should initialize health bar with custom urlHealthSeason", () => {
      state.setUrlHealthSeason("2011/12");
      initHealthBar();
      expect(state.healthBarIdx).toBe(1);
    });

    it("should trigger immediate render when clicking the same year twice", () => {
      initHealthBar();
      vi.runAllTimers();

      const pills = document.querySelectorAll("#seasonSelector .season-pill");
      // Since urlHealthSeason is null, default index is 2 (latest season).
      // Clicking index 2 clicks the already active season.
      pills[2].click();
      expect(state.healthBarIdx).toBe(2);
    });
  });

  it("does nothing (no throw) when #seasonSelector is missing from the page", () => {
    document.body.innerHTML = "";
    expect(() => initHealthBar()).not.toThrow();
  });

  it("builds season pills but skips rendering signals when healthBarTitle is missing", () => {
    document.getElementById("healthBarTitle").remove();
    expect(() => initHealthBar()).not.toThrow();
    vi.runAllTimers();

    // Pills still get built (that part of initHealthBar runs before the
    // titleEl/el guard inside renderHealthBar).
    expect(document.querySelectorAll(".season-pill").length).toBe(3);
    // But signals were never written.
    expect(document.getElementById("healthSignals").innerHTML).toBe("");
  });
});
