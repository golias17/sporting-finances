import { describe, it, expect, vi } from "vitest";
import { state } from "../src/state.js";
import { initKpiSeasonSelector } from "../src/health.js";
import { initGlobalFilters } from "../src/globalFilters.js";

vi.mock("chart.js/auto", () => ({
  default: class Chart {
    constructor() {}
    destroy() {}
  },
}));

// Regression test: narrowing the "Explore Era" filter on Overview used to
// silently stop updating the charts. Root cause was state.healthBarIdx — an
// index into the currently-filtered state.annual, set by the KPI-strip
// season selector — going stale once the range shrank. health.js/kpi.js did
// state.annual[healthBarIdx].label without a bounds check, so once the
// filtered array got shorter than the old index, that threw inside
// initKpiSeasonSelector(). Since main.js's global-filter callback runs
// Overview's chart list in one forEach (initKpiSeasonSelector, chartHero,
// chartNetResult, chartEquity), that uncaught throw aborted the loop before
// the charts ever re-rendered — so the era pills/selects visibly updated but
// the charts underneath just... didn't.
describe("regression: Explore Era filter on Overview", () => {
  it("re-renders Overview's charts without throwing when the era is narrowed after a season was already selected", () => {
    document.body.innerHTML = `
      <div class="season-selector" id="seasonSelector"></div>
      <h3 id="healthBarTitle"></h3>
      <div id="healthSignals" data-rendered-idx="-1"></div>
      <div id="kpiRow"></div>
      <div class="season-selector" id="kpiSeasonSelector"></div>
      <h3 id="kpiBarTitle"></h3>
      <select id="globalStartSeason"></select>
      <select id="globalEndSeason"></select>
      <div id="eraPresets"></div>
    `;
    const seasons = [
      "2012/13",
      "2013/14",
      "2014/15",
      "2015/16",
      "2016/17",
      "2017/18",
      "2018/19",
      "2019/20",
      "2020/21",
      "2021/22",
      "2022/23",
      "2023/24",
      "2024/25",
      "2025/26",
    ];
    state.DATASET = {
      annual_data: seasons.map((label) => ({
        label,
        financial_result: 10,
        total_revenue: 100,
        revenue_operating: 100,
        current_assets: 50,
        current_liabilities: 20,
        equity: 10,
        personnel_costs: -50,
        net_result: 8,
        borrowings_nc: 15,
        borrowings_c: 5,
        cash: 10,
        player_transfer_income: 20,
        operating_result_excl_players: 5,
        squad_market_value: 50000,
      })),
    };
    state.startSeasonIndex = 0;
    state.endSeasonIndex = seasons.length - 1;
    state.healthBarIdx = null;

    let rerenderCount = 0;
    initGlobalFilters(() => {
      rerenderCount++;
      // Mirrors main.js's TAB_CHARTS.overview forEach for the "overview" tab.
      expect(() => initKpiSeasonSelector()).not.toThrow();
    });

    // User was viewing the latest season (index 13, "2025/26") before
    // narrowing the range — this is what used to go stale.
    state.setHealthBarIdx(seasons.length - 1);

    const startSelect = document.getElementById("globalStartSeason");
    const endSelect = document.getElementById("globalEndSeason");
    startSelect.value = String(seasons.indexOf("2020/21"));
    endSelect.value = String(seasons.indexOf("2024/25"));
    startSelect.dispatchEvent(new window.Event("change"));
    endSelect.dispatchEvent(new window.Event("change"));

    expect(rerenderCount).toBe(2);
    expect(state.annual.map((d) => d.label)).toEqual([
      "2020/21",
      "2021/22",
      "2022/23",
      "2023/24",
      "2024/25",
    ]);
    expect(state.healthBarIdx).toBeLessThanOrEqual(state.annual.length - 1);
    expect(state.annual[state.healthBarIdx]).toBeDefined();

    state.DATASET = null;
    state.startSeasonIndex = 0;
    state.endSeasonIndex = null;
    state.healthBarIdx = null;
  });
});
