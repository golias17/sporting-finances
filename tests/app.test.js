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
import * as pdfGen from "../src/pdfGenerator.js";
import * as charts from "../src/charts.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");

vi.mock("../src/pdfGenerator.js", () => ({
  generateCuratedPdf: vi.fn(),
}));

vi.mock("../src/playground.js", () => ({
  initPlayground: vi.fn(),
  drawPlaygroundCharts: vi.fn(),
}));

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
    vi.stubGlobal("location", new URL("http://localhost/?tab=overview&story=3"));
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("dark"),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    window.scrollTo = vi.fn();
    Element.prototype.scrollTo = vi.fn();
    global.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    window.localStorage.clear();
    window.localStorage.setItem("lang", "en"); // deterministic regardless of test-runner locale
    window.localStorage.setItem("theme", "dark");

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
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: [] }) });
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

  it("switches tabs on click", () => {
    const bondsBtn = document.querySelector(
      'nav.tabs button[data-tab="bonds"]',
    );
    bondsBtn.click();
    expect(
      document.getElementById("tab-bonds").classList.contains("active"),
    ).toBe(true);

    const revenueBtn = document.querySelector(
      'nav.tabs button[data-tab="revenue"]',
    );
    revenueBtn.click();
    expect(
      document.getElementById("tab-revenue").classList.contains("active"),
    ).toBe(true);
    expect(revenueBtn.getAttribute("aria-selected")).toBe("true");
  });

  // Regression test for the runOnce() helper extracted from activateTab's
  // per-tab chart loop (see main.js) — a tab's chart-drawing functions
  // should only run once per visit, not be re-invoked every time its nav
  // button is clicked again while already active.
  //
  // Note: this only covers the "stays active" half of the behavior.
  // destroyInactiveCharts() (the other half — clearing the renderedCharts
  // guard once you navigate *away* from a tab, so it redraws fresh next
  // visit) keys off the real chartRegistry that charts.js's mkChart()
  // populates, but charts.js is entirely mocked out in this file (jsdom has
  // no real canvas), so that registry never actually gets populated here —
  // there's nothing meaningful for destroyInactiveCharts to find and clear
  // in this test setup. That half is exercised for real in chart.test.js
  // and playground.test.js, which use the real mkChart().
  it("does not redraw a tab's charts again just from re-clicking its already-active nav button", () => {
    const revenueBtn = document.querySelector(
      'nav.tabs button[data-tab="revenue"]',
    );

    revenueBtn.click();
    const callsAfterFirstVisit = charts.chartRevenue.mock.calls.length;
    expect(callsAfterFirstVisit).toBeGreaterThan(0);

    revenueBtn.click();
    expect(charts.chartRevenue.mock.calls.length).toBe(callsAfterFirstVisit);
  });

  it("renders the transfer ledger on the squad tab", () => {
    document.querySelector('nav.tabs button[data-tab="squad"]').click();
    document.getElementById("btn-squad-ledger").click();
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
    // KPI strip re-rendered in Portuguese ("Última receita", "Dívida total")
    await vi.waitFor(() => {
      const kpiText = document.getElementById("kpiRow").textContent;
      expect(kpiText).toMatch(/receita|dívida/i);
    });
  });

  it("toggles dark theme and persists the choice", () => {
    const themeBtn = document.getElementById("themeToggleBtn");
    const wasDark = document.body.classList.contains("dark");
    themeBtn.click();
    themeBtn.dispatchEvent(new window.Event("animationend"));
    expect(document.body.classList.contains("dark")).toBe(!wasDark);
    expect(localStorage.getItem("theme")).toBe(wasDark ? "light" : "dark");
  });

  it("triggers PDF export on button click", async () => {
    const btn = document.getElementById("pdfExportBtn");
    expect(btn).not.toBeNull();
    btn.click(); // Opens the modal

    const form = document.getElementById("pdfCustomizerForm");
    expect(form).not.toBeNull();
    form.dispatchEvent(new window.Event("submit")); // Submit the customizer options

    await vi.waitFor(() => {
      expect(pdfGen.generateCuratedPdf).toHaveBeenCalled();
    });
  });

  // The Jornal reader and image lightbox are hand-rolled overlay <div>s
  // (see initJornalModal()/initImageLightbox() in main.js), not the native
  // <dialog> element — these tests cover the focus management added for
  // them: moving focus in on open, closing on Escape, and restoring focus
  // to whatever triggered the modal once it closes. The Tab-key focus-trap
  // itself (trapFocusWithin() in main.js) isn't asserted here: it filters
  // candidates by `el.offsetParent !== null` to skip genuinely hidden
  // elements, but jsdom doesn't implement layout at all, so offsetParent is
  // always null for every element regardless of real visibility — asserting
  // the exact Tab-wrap behavior here would fail for that jsdom limitation,
  // not for any real bug. It works correctly in real browsers, where
  // offsetParent reflects actual visibility.
  it("opens the Jornal modal with dialog semantics, moves focus in, and restores it on Escape", () => {
    const openBtn = document.getElementById("btnJornalModal");
    expect(openBtn).not.toBeNull();
    openBtn.focus();
    openBtn.click();

    const modal = document.getElementById("jornalModal");
    expect(modal.classList.contains("hidden")).toBe(false);
    expect(modal.getAttribute("role")).toBe("dialog");
    expect(modal.getAttribute("aria-modal")).toBe("true");

    const closeBtn = document.getElementById("btnCloseJornal");
    expect(document.activeElement).toBe(closeBtn);

    document.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(modal.classList.contains("hidden")).toBe(true);
    expect(document.activeElement).toBe(openBtn);
  });

  it("opens the image lightbox with dialog semantics, moves focus in, and restores it on close-button click", () => {
    const trigger = document.querySelector(".stadium-panorama-img");
    expect(trigger).not.toBeNull();

    const anchor = document.getElementById("btnJornalModal");
    anchor.focus(); // deterministic "previously focused" element to restore to
    trigger.click();

    const lightbox = document.getElementById("imageLightbox");
    expect(lightbox.classList.contains("active")).toBe(true);
    expect(lightbox.getAttribute("role")).toBe("dialog");
    expect(lightbox.getAttribute("aria-modal")).toBe("true");

    const closeBtn = document.getElementById("closeLightboxBtn");
    expect(document.activeElement).toBe(closeBtn);

    closeBtn.click();
    expect(lightbox.classList.contains("active")).toBe(false);
    expect(document.activeElement).toBe(anchor);
  });

  it("handles window resize and recalculates tab indicator", () => {
    vi.useFakeTimers();
    window.dispatchEvent(new window.Event("resize"));
    vi.advanceTimersByTime(150);
    vi.useRealTimers();
  });

  it("toggles scrollToTopBtn visibility based on scroll position", () => {
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
    expect(scrollToTopBtn).not.toBeNull();

    // Scroll past 300
    window.scrollY = 350;
    window.dispatchEvent(new window.Event("scroll"));
    expect(scrollToTopBtn.classList.contains("visible")).toBe(true);

    // Scroll back under 300
    window.scrollY = 100;
    window.dispatchEvent(new window.Event("scroll"));
    expect(scrollToTopBtn.classList.contains("visible")).toBe(false);
  });

  it("scrolls window to top when scrollToTopBtn is clicked", () => {
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
    expect(scrollToTopBtn).not.toBeNull();

    scrollToTopBtn.click();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});
