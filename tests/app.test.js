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
import * as playground from "../src/playground.js";
import { chartRegistry } from "../src/chartUtils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");

// Captured by the IntersectionObserver stub in beforeAll below so
// initScrollAnimations()'s callback (main.js) can be invoked directly —
// jsdom doesn't implement real intersection detection, so nothing would
// ever call it otherwise.
let capturedIntersectionCallback = null;

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
    vi.stubGlobal(
      "location",
      new URL("http://localhost/?tab=overview&story=3"),
    );
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("dark"),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    window.scrollTo = vi.fn();
    Element.prototype.scrollTo = vi.fn();
    global.IntersectionObserver = class {
      constructor(callback) {
        capturedIntersectionCallback = callback;
      }
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
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });
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

  // initScrollAnimations() wires every .reveal target to an
  // IntersectionObserver; jsdom never actually fires one, so the captured
  // callback (see the IntersectionObserver stub in beforeAll) has to be
  // invoked directly to exercise its body.
  it("reveals a scroll-animation target and stops observing it once it intersects", () => {
    expect(capturedIntersectionCallback).toBeTypeOf("function");
    const target = document.querySelector(".reveal");
    expect(target).not.toBeNull();
    target.classList.remove("visible");

    const unobserve = vi.fn();
    capturedIntersectionCallback(
      [{ isIntersecting: false, target }],
      { unobserve },
    );
    expect(target.classList.contains("visible")).toBe(false);
    expect(unobserve).not.toHaveBeenCalled();

    capturedIntersectionCallback(
      [{ isIntersecting: true, target }],
      { unobserve },
    );
    expect(target.classList.contains("visible")).toBe(true);
    expect(unobserve).toHaveBeenCalledWith(target);
  });

  // scrollToTopOnMobile() (main.js) only scrolls below the mobile breakpoint —
  // every other test in this file runs at jsdom's default (desktop-width)
  // innerWidth, so that branch is otherwise never taken.
  it("scrolls to top after a tab switch on mobile-width viewports, but not on desktop", () => {
    // Uses debt/bonds (not revenue) so it doesn't interfere with the
    // "does not redraw..." test below, which specifically checks
    // chartRevenue's *first*-visit call count.
    const debtBtn = document.querySelector('nav.tabs button[data-tab="debt"]');
    const bondsBtn = document.querySelector(
      'nav.tabs button[data-tab="bonds"]',
    );

    window.scrollTo.mockClear();
    debtBtn.click(); // desktop width (jsdom default) — no scroll
    expect(window.scrollTo).not.toHaveBeenCalled();

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });
    bondsBtn.click();
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  // updateTabIndicator() (main.js) defaults to whatever nav button currently
  // has .active when called with no argument (the debounced resize
  // listener's call pattern) — if none does, it zeroes the indicator's width
  // instead of reading offsetLeft/offsetWidth off a null button.
  it("zeroes the tab indicator's width when no nav button is active", () => {
    const tabsContainer = document.querySelector("nav.tabs");
    const activeBtn = tabsContainer.querySelector("button.active");
    expect(activeBtn).not.toBeNull();
    activeBtn.classList.remove("active");

    vi.useFakeTimers();
    window.dispatchEvent(new window.Event("resize"));
    vi.advanceTimersByTime(150);
    vi.useRealTimers();

    const indicator = tabsContainer.querySelector(".tab-indicator");
    expect(indicator.style.width).toBe("0px");

    // Restore so later tests relying on an active tab aren't affected.
    activeBtn.classList.add("active");
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

  // destroyInactiveCharts() (main.js) is what makes runOnce() draw a tab's
  // charts fresh on a *later* revisit instead of leaving it permanently
  // skipped: on navigating away from a tab it destroys any chart still in
  // chartRegistry for that tab's canvases and clears the matching draw
  // function back out of state.renderedCharts. charts.js is mocked in this
  // file, so mkChart() never actually populates chartRegistry itself —
  // populate it by hand here to exercise the teardown branch directly.
  it("destroys and forgets a tab's chart when navigating away, so it redraws on the next visit", () => {
    const revenueBtn = document.querySelector(
      'nav.tabs button[data-tab="revenue"]',
    );
    const bondsBtn = document.querySelector(
      'nav.tabs button[data-tab="bonds"]',
    );

    revenueBtn.click(); // revenue is the active tab
    const destroy = vi.fn();
    chartRegistry.set("chartRevenue", { destroy });

    bondsBtn.click(); // navigate away — should tear the revenue chart down
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(chartRegistry.has("chartRevenue")).toBe(false);

    const callsBeforeRevisit = charts.chartRevenue.mock.calls.length;
    revenueBtn.click(); // runOnce's guard was cleared — redraws
    expect(charts.chartRevenue.mock.calls.length).toBeGreaterThan(
      callsBeforeRevisit,
    );
  });

  // activateTab() only calls refreshHealthBarIfStale() (health.js) when the
  // tab being activated is "healthcheck" — a plain visit to that tab is
  // enough to exercise that line; the staleness/no-op logic inside
  // refreshHealthBarIfStale() itself is covered separately in health tests.
  it("visits the healthcheck tab without throwing and marks it active", () => {
    const healthBtn = document.querySelector(
      'nav.tabs button[data-tab="healthcheck"]',
    );
    expect(() => healthBtn.click()).not.toThrow();
    expect(
      document.getElementById("tab-healthcheck").classList.contains("active"),
    ).toBe(true);
  });

  // Keyboard tab navigation: ArrowLeft/ArrowRight on nav.tabs moves focus to
  // the adjacent button (wrapping at either end) and activates it — but only
  // when focus is already on one of the tab buttons; a stray arrow keypress
  // elsewhere, or any other key, is a no-op.
  it("moves to the next/previous tab with ArrowRight/ArrowLeft, wrapping at the ends, and ignores other keys/targets", () => {
    const tabsNav = document.querySelector("nav.tabs");
    const tabs = [...tabsNav.querySelectorAll("button")];
    const first = tabs[0];
    const second = tabs[1];
    const last = tabs[tabs.length - 1];

    first.focus();
    tabsNav.dispatchEvent(
      new window.KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
      }),
    );
    expect(document.activeElement).toBe(second);
    expect(second.classList.contains("active")).toBe(true);

    second.focus();
    tabsNav.dispatchEvent(
      new window.KeyboardEvent("keydown", {
        key: "ArrowLeft",
        bubbles: true,
      }),
    );
    expect(document.activeElement).toBe(first);
    expect(first.classList.contains("active")).toBe(true);

    // Wraps from the first tab back to the last one.
    first.focus();
    tabsNav.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
    );
    expect(document.activeElement).toBe(last);

    // A non-arrow key is ignored.
    last.focus();
    tabsNav.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    expect(document.activeElement).toBe(last);

    // Focus outside the nav buttons entirely (idx === -1) — the listener is
    // on nav.tabs itself but must ignore this since document.activeElement
    // isn't one of its buttons.
    const themeBtn = document.getElementById("themeToggleBtn");
    themeBtn.focus();
    tabsNav.dispatchEvent(
      new window.KeyboardEvent("keydown", {
        key: "ArrowRight",
        bubbles: true,
      }),
    );
    expect(document.activeElement).toBe(themeBtn);

    // Restore to overview for tests that assume it.
    document.querySelector('nav.tabs button[data-tab="overview"]').click();
  });

  // The analytics squad sub-tab lazily draws drawManagerEras/drawCommissions
  // (squadAnalytics.js) via the same runOnce() guard as every TAB_CHARTS
  // entry — squadAnalytics.js isn't mocked in this file, but it only calls
  // through to charts.js's mkChart(), which is.
  it("draws the manager-eras and commissions charts on first visit to the squad analytics sub-tab", () => {
    document.querySelector('nav.tabs button[data-tab="squad"]').click();
    const analyticsSubBtn = document.querySelector(
      '.sub-tab-btn[data-squad-sub="analytics"]',
    );
    expect(analyticsSubBtn).not.toBeNull();

    expect(() => analyticsSubBtn.click()).not.toThrow();
    expect(analyticsSubBtn.classList.contains("active")).toBe(true);
    expect(
      document
        .getElementById("squad-subpanel-analytics")
        .classList.contains("hidden"),
    ).toBe(false);
    // mkChart is the mocked entry point both drawing functions funnel
    // through — two calls confirms both actually ran.
    expect(charts.mkChart).toHaveBeenCalledWith(
      "chartManagerEras",
      expect.anything(),
    );
    expect(charts.mkChart).toHaveBeenCalledWith(
      "chartCommissions",
      expect.anything(),
    );
  });

  // Regression test: initPlayground() used to be called eagerly in
  // setupApp() *and* again via runOnce(initPlayground) the first time the
  // user visited the Playground tab (it's listed in TAB_CHARTS.playground —
  // see main.js), since the eager call wasn't itself guarded by runOnce.
  // That silently double-registered every one of its event listeners
  // (uclSelect/sliders/reset/preset buttons), doubling the work on every
  // interaction for the rest of the session without corrupting the displayed
  // numbers — see the comment above initPlayground()'s TAB_CHARTS entry in
  // main.js. initPlayground/drawPlaygroundCharts are mocked at the top of
  // this file, so their call counts are directly observable here.
  it("calls initPlayground() exactly once across boot and the first visit to the Playground tab", () => {
    const playgroundBtn = document.querySelector(
      'nav.tabs button[data-tab="playground"]',
    );
    playgroundBtn.click();
    expect(
      document.getElementById("tab-playground").classList.contains("active"),
    ).toBe(true);
    expect(playground.initPlayground).toHaveBeenCalledTimes(1);

    // Re-clicking the already-active tab shouldn't call it again either
    // (same runOnce guard every other tab's setup function relies on).
    playgroundBtn.click();
    expect(playground.initPlayground).toHaveBeenCalledTimes(1);
  });

  // Regression test: previously the only PT-language-switch coverage
  // happened to run while story mode was closed, so the
  // `if (storyCard && !storyCard.classList.contains("hidden"))` branch in
  // the language-link handler (main.js) — which re-renders the open story
  // step's text after switching languages — was never exercised. Runs after
  // the initPlayground test above (not before) since the language-switch
  // handler calls state.renderedCharts.clear(), which would otherwise let a
  // later tab visit re-trigger a runOnce-guarded function a second time.
  it("re-renders the open story step's text when the language is switched while story mode is open", async () => {
    document.querySelector('nav.tabs button[data-tab="overview"]').click();
    const startBtn = document.getElementById("btnStartStory");
    expect(startBtn).not.toBeNull();
    startBtn.click();

    const storyCard = document.getElementById("storyCard");
    expect(storyCard.classList.contains("hidden")).toBe(false);

    const ptLink = document.querySelector('.lang-link[data-lang="pt"]');
    ptLink.click();
    await vi.waitFor(() => expect(state.isPt).toBe(true));
    // Story card should still be open and re-rendered, not closed.
    expect(storyCard.classList.contains("hidden")).toBe(false);

    // Switch back to English and close story mode so later tests aren't
    // affected by either state change.
    const enLink = document.querySelector('.lang-link[data-lang="en"]');
    enLink.click();
    await vi.waitFor(() => expect(state.isPt).toBe(false));
    const exitBtn = document.getElementById("btnExitStory");
    if (exitBtn) exitBtn.click();
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
  // (see initJornalModal() in jornalModal.js / initImageLightbox() in
  // imageLightbox.js), not the native <dialog> element — these tests cover
  // the focus management added for them: moving focus in on open, closing
  // on Escape, and restoring focus to whatever triggered the modal once it
  // closes. The Tab-key focus-trap itself (trapFocusWithin() in
  // focusTrap.js) isn't asserted here: it filters
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

  // Regression test: gallery images used to be openable by mouse/touch
  // only (plain <img>, no tabindex or keydown handling), so a keyboard
  // user had no way to reach the lightbox at all.
  it("makes gallery images keyboard-operable (Tab-reachable, Enter/Space opens the lightbox)", () => {
    const trigger = document.querySelector(".stadium-panorama-img");
    expect(trigger.getAttribute("tabindex")).toBe("0");
    expect(trigger.getAttribute("role")).toBe("button");
    expect(trigger.getAttribute("aria-label")).toBeTruthy();

    const lightbox = document.getElementById("imageLightbox");
    expect(lightbox.classList.contains("active")).toBe(false);

    trigger.focus();
    trigger.dispatchEvent(
      new window.KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(lightbox.classList.contains("active")).toBe(true);
  });

  // Regression test: kit flip-cards keep both faces in the DOM at all times
  // (CSS rotates the back face away, it isn't display:none'd), and the flip
  // itself only triggers on mouse :hover. Giving the back face the same
  // tabindex/role as the front would make it a real Tab stop with no
  // visible focus indicator, since it's rotated out of view. Only the
  // currently-visible face should be keyboard/screen-reader-reachable.
  it("does not make the hidden back face of a kit flip-card an invisible Tab stop", () => {
    const frontImg = document.querySelector(".kit-card-front .kit-img");
    const backImg = document.querySelector(".kit-card-back .kit-img");
    expect(frontImg).not.toBeNull();
    expect(backImg).not.toBeNull();

    expect(frontImg.getAttribute("tabindex")).toBe("0");
    expect(frontImg.getAttribute("role")).toBe("button");
    expect(frontImg.hasAttribute("aria-hidden")).toBe(false);
    // tabindex="-1" (not simply absent) keeps it out of Tab order;
    // aria-hidden="true" is what actually removes it from a screen
    // reader's browse-mode virtual cursor, independent of tab order.
    expect(backImg.getAttribute("tabindex")).toBe("-1");
    expect(backImg.hasAttribute("role")).toBe(false);
    expect(backImg.getAttribute("aria-hidden")).toBe("true");

    // Mouse users can still open the lightbox on the back face by clicking
    // it directly (e.g. after hovering to flip the card).
    backImg.click();
    const lightbox = document.getElementById("imageLightbox");
    expect(lightbox.classList.contains("active")).toBe(true);
    expect(document.getElementById("lightboxImg").src).toBe(backImg.src);

    document.getElementById("closeLightboxBtn").click();
    expect(lightbox.classList.contains("active")).toBe(false);
  });

  // Regression test: the CSS flip animation itself used to only trigger on
  // mouse :hover, with no keyboard equivalent — a keyboard user could never
  // see the back face on the card itself, only via the lightbox's own
  // toggle button after opening the front. initKitCardFlip() makes the
  // card container a focusable control so Enter/Space flips it, matching
  // what :hover already does visually for mouse users.
  it("makes the kit card itself keyboard-focusable and flips it on Enter, swapping which face is reachable", () => {
    const card = document.querySelector(".kit-card-container:not(.no-flip)");
    const frontImg = card.querySelector(".kit-card-front .kit-img");
    const backImg = card.querySelector(".kit-card-back .kit-img");

    expect(card.getAttribute("tabindex")).toBe("0");
    expect(card.getAttribute("role")).toBe("button");
    expect(card.getAttribute("aria-pressed")).toBe("false");
    expect(card.classList.contains("flipped")).toBe(false);

    card.dispatchEvent(
      new window.KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(card.classList.contains("flipped")).toBe(true);
    expect(card.getAttribute("aria-pressed")).toBe("true");
    // Reachability flips along with the visual state.
    expect(backImg.getAttribute("tabindex")).toBe("0");
    expect(backImg.getAttribute("aria-hidden")).toBe(null);
    expect(frontImg.getAttribute("tabindex")).toBe("-1");
    expect(frontImg.getAttribute("aria-hidden")).toBe("true");

    // Pressing Enter again flips it back.
    card.dispatchEvent(
      new window.KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(card.classList.contains("flipped")).toBe(false);
  });

  it("does not flip the card when Enter is pressed while a descendant image has focus", () => {
    // Guards against the flip and the lightbox-open both firing off the
    // same keypress — the image's own keydown handler (initImageLightbox())
    // should be the only thing that responds when focus is on the image
    // itself, not the card's keydown handler.
    const card = document.querySelector(".kit-card-container:not(.no-flip)");
    const frontImg = card.querySelector(".kit-card-front .kit-img");

    frontImg.dispatchEvent(
      new window.KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(card.classList.contains("flipped")).toBe(false);
    // It did open the lightbox, though — that's the image's own handler.
    expect(
      document.getElementById("imageLightbox").classList.contains("active"),
    ).toBe(true);
    document.getElementById("closeLightboxBtn").click();
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
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
  });

  // Regression test: activateTab() looks up "tab-" + tab and immediately
  // called .classList.add() on the result — safe only as long as
  // state.VALID_TABS and index.html's tab-* sections never drift apart. If
  // they ever did (a typo, a tab added to one but not the other), this would
  // throw instead of degrading gracefully, unlike every other DOM write in
  // the app. These two tests run last in this file since they permanently
  // remove elements from the shared booted-app DOM.
  it("does not throw when a tab's panel section is missing from the DOM", () => {
    document.getElementById("tab-events")?.remove();
    const eventsBtn = document.querySelector(
      'nav.tabs button[data-tab="events"]',
    );
    expect(() => eventsBtn.click()).not.toThrow();
  });

  // Regression test: the PDF customizer form's submit handler read
  // pdfLanguageSelect/chkPage1-5/pdfNotesText directly off getElementById()
  // with no guard, unlike openModal() right above it in pdfExportModal.js
  // (which already treats langSelect/notesText as optional) — an
  // inconsistency that would throw if any customizer field were ever
  // removed/renamed.
  it("does not throw when a PDF customizer field is missing from the DOM", () => {
    document.getElementById("chkPage3")?.remove();
    const form = document.getElementById("pdfCustomizerForm");
    expect(() => form.dispatchEvent(new window.Event("submit"))).not.toThrow();
  });
});
