// Integration test for main.js — boots the real app against the real
// index.html DOM and the real data files, exercising the wiring that unit
// tests can't reach: data loading, tab switching, language toggle, theme
// toggle, era filter and URL sync.
//
// The chart builders are mocked at the charts.js module boundary: jsdom has
// no real canvas, and every chart builder already has its own coverage in
// chart.test.js. Everything else (state, health KPIs, transfers, compare,
// data table, translations, url sync) runs for real.
import { describe, it, expect, beforeAll, vi } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { state } from "../src/state.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");

vi.mock("../src/charts.js", () => {
  const chartFnNames = [
    "chartHero",
    "chartNetResult",
    "chartEquity",
    "chartRevenue",
    "chartRevStreams",
    "chartRevVsPayroll",
    "chartOpResult",
    "chartPayrollBurden",
    "chartTransferReliance",
    "chartDebtLoad",
    "chartCurrentRatio",
    "chartDebt",
    "chartAssetsLiab",
    "chartDebtMaturity",
    "chartSquadBook",
    "chartTransfers",
    "chartNetTrading",
    "chartCashFlow",
    "chartCash",
    "chartAnnualNet",
  ];
  const mocks = Object.fromEntries(chartFnNames.map((n) => [n, vi.fn()]));
  return {
    ...mocks,
    mkChart: vi.fn(),
  };
});

function serveFile(rel) {
  const content = fs.readFileSync(path.resolve(publicDir, rel), "utf8");
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(JSON.parse(content)),
  });
}

describe("app boot (main.js)", () => {
  beforeAll(async () => {
    // Real markup from index.html (script tags in innerHTML don't execute).
    const html = fs.readFileSync(
      path.resolve(__dirname, "../index.html"),
      "utf8",
    );
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
    document.body.innerHTML = bodyMatch[1];
    document.body.classList.add("app-loading");

    // jsdom stubs for APIs main.js touches during boot.
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    window.scrollTo = vi.fn();
    Element.prototype.scrollTo = vi.fn();
    global.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    localStorage.clear();
    localStorage.setItem("lang", "en"); // deterministic regardless of test-runner locale

    global.fetch = vi.fn((url) => {
      const u = String(url);
      if (u.includes("data/financials.json"))
        return serveFile("data/financials.json");
      if (u.includes("data/transfers.json"))
        return serveFile("data/transfers.json");
      if (u.includes("locales/en.json")) return serveFile("locales/en.json");
      if (u.includes("locales/pt.json")) return serveFile("locales/pt.json");
      if (u.includes("data/news.json")) return Promise.resolve({ ok: false });
      // rss2json fallback queries from the news module
      return Promise.resolve({ json: () => Promise.resolve({ items: [] }) });
    });

    await import("../src/main.js");

    // initApp() removes app-loading in its finally block — boot complete.
    await vi.waitFor(() =>
      expect(document.body.classList.contains("app-loading")).toBe(false),
    );
  });

  it("loads both datasets into state", () => {
    expect(state.DATASET.annual_data.length).toBeGreaterThan(10);
    expect(state.TRANSFER_LEDGER.length).toBeGreaterThan(10);
    expect(state.endSeasonIndex).toBe(state.DATASET.annual_data.length - 1);
  });

  it("activates the overview tab and renders the KPI strip", () => {
    expect(
      document.getElementById("tab-overview").classList.contains("active"),
    ).toBe(true);
    const kpis = document.querySelectorAll("#kpiRow .kpi");
    expect(kpis.length).toBe(6);
    // KPI values are formatted euro-millions, not NaN
    expect(kpis[0].querySelector(".value").textContent).toMatch(/^€/);
  });

  it("populates the era filter with every season", () => {
    const start = document.getElementById("globalStartSeason");
    const end = document.getElementById("globalEndSeason");
    expect(start.options.length).toBe(state.DATASET.annual_data.length);
    expect(end.options.length).toBe(state.DATASET.annual_data.length);
    expect(Number(end.value)).toBe(state.DATASET.annual_data.length - 1);
  });

  it("switches tabs on click and hides the era filter where it doesn't apply", () => {
    const bondsBtn = document.querySelector(
      'nav.tabs button[data-tab="bonds"]',
    );
    bondsBtn.click();
    expect(
      document.getElementById("tab-bonds").classList.contains("active"),
    ).toBe(true);
    expect(
      document.querySelector(".global-filters").classList.contains("hidden"),
    ).toBe(true);

    const revenueBtn = document.querySelector(
      'nav.tabs button[data-tab="revenue"]',
    );
    revenueBtn.click();
    expect(
      document.getElementById("tab-revenue").classList.contains("active"),
    ).toBe(true);
    expect(
      document.querySelector(".global-filters").classList.contains("hidden"),
    ).toBe(false);
    expect(revenueBtn.getAttribute("aria-selected")).toBe("true");
  });

  it("renders the transfer ledger on the squad tab", () => {
    document.querySelector('nav.tabs button[data-tab="squad"]').click();
    const pills = document.querySelectorAll("#tlSeasonNav .season-pill");
    expect(pills.length).toBe(state.TRANSFER_LEDGER.length);
    expect(
      document.getElementById("tlBody").textContent.length,
    ).toBeGreaterThan(0);
  });

  it("switches language to PT and re-renders translated content", async () => {
    const ptLink = document.querySelector('.lang-link[data-lang="pt"]');
    ptLink.click();

    await vi.waitFor(() => expect(state.isPt).toBe(true));
    await vi.waitFor(() => expect(document.documentElement.lang).toBe("pt"));
    expect(localStorage.getItem("lang")).toBe("pt");
    // KPI strip re-rendered in Portuguese
    await vi.waitFor(() => {
      const kpiText = document.getElementById("kpiRow").textContent;
      expect(kpiText).toMatch(/Receita|Resultado/);
    });
  });

  it("toggles dark theme and persists the choice", () => {
    const themeBtn = document.getElementById("themeToggleBtn");
    const wasDark = document.body.classList.contains("dark");
    themeBtn.click();
    expect(document.body.classList.contains("dark")).toBe(!wasDark);
    expect(localStorage.getItem("theme")).toBe(wasDark ? "light" : "dark");
  });
});
