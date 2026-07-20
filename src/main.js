import { config } from "./config.js";
import { state } from "./state.js";
import { applyTranslations, loadTranslations } from "./translations.js";
import {
  initHealthBar,
  initKpiSeasonSelector,
  refreshHealthBarIfStale,
} from "./health.js";
import { renderVmocCost, renderLionFinance, renderUsppTerms } from "./bonds.js";
import { renderTransferLedger, initTransfersDetailTable } from "./transfers.js";
import { renderTable, initDataExport } from "./data-table.js";
import { initNewsFeed } from "./news.js";
import {
  startStory,
  exitStory,
  updateStoryStep,
  initStoryMode,
} from "./story.js";
import { initComparison } from "./compare.js";
import { syncEventsFilter, initEventFilter } from "./events.js";
import { applyUrlParams, syncStateToUrl } from "./urlSync.js";
import {
  chartHero,
  chartNetResult,
  chartEquity,
  chartRevenue,
  chartRevStreams,
  chartRevVsPayroll,
  chartOpResult,
  chartPayrollBurden,
  chartTransferReliance,
  chartDebtLoad,
  chartCurrentRatio,
  chartDebt,
  chartAssetsLiab,
  chartDebtMaturity,
  chartSquadBook,
  chartTransfers,
  chartNetTrading,
  chartCashFlow,
  chartCash,
  chartAnnualNet,
} from "./charts.js";
import { initChartDefaults, chartRegistry } from "./chartUtils.js";
import { renderKpis } from "./kpi.js";
import { drawManagerEras, drawCommissions } from "./squadAnalytics.js";
import { initPlayground, drawPlaygroundCharts } from "./playground.js";
import { initPWA } from "./pwa.js";
import { debounce } from "./utils.js";
import { initJornalModal } from "./jornalModal.js";
import { initImageLightbox, initKitCardFlip } from "./imageLightbox.js";
import { initPdfExport } from "./pdfExportModal.js";
import { updateThemeUI, updateChartTheme } from "./themeToggle.js";

// =============================================================
// LANGUAGE DETECTION
// =============================================================

// Saved preference wins; otherwise fall back to the browser language.
// Shared by initApp() (to load the right translation file before first
// paint) and setupApp() (to set the UI language state) — previously the
// same logic was duplicated verbatim in both.
function detectActiveLang() {
  let lang = localStorage.getItem("lang");
  if (!lang && typeof navigator !== "undefined") {
    const browserLang = navigator.language || navigator.userLanguage || "en";
    lang = browserLang.startsWith("pt") ? "pt" : "en";
  }
  return lang || "en";
}

// =============================================================
// SCROLL ANIMATIONS
// =============================================================

function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -30px 0px" },
  );

  const targets = document.querySelectorAll(
    ".card, .kpi, .health-bar, .event, .cmp-card, .lf-card, .hb-title, .narrative, .chart-box, .reveal",
  );
  targets.forEach((el) => {
    el.classList.add("reveal");
    observer.observe(el);
  });
}

// =============================================================
// TAB INDICATOR
// =============================================================

function updateTabIndicator(activeBtn) {
  const tabsContainer = document.querySelector("nav.tabs");
  if (!tabsContainer) return;

  let indicator = tabsContainer.querySelector(".tab-indicator");
  if (!indicator) {
    indicator = document.createElement("div");
    indicator.className = "tab-indicator";
    tabsContainer.appendChild(indicator);
  }

  const btn = activeBtn || tabsContainer.querySelector("button.active");
  if (!btn) {
    indicator.style.width = "0px";
    return;
  }

  indicator.style.left = `${btn.offsetLeft}px`;
  indicator.style.width = `${btn.offsetWidth}px`;

  // Scroll active tab into horizontal view center smoothly inside the container
  const containerWidth = tabsContainer.offsetWidth;
  const btnLeft = btn.offsetLeft;
  const btnWidth = btn.offsetWidth;
  tabsContainer.scrollTo({
    left: btnLeft - containerWidth / 2 + btnWidth / 2,
    behavior: "smooth",
  });
}

// =============================================================
// TAB SWITCHING
// =============================================================

// Scroll to the top of the page after switching tabs, but only on mobile —
// on desktop the tab bar is already at the top of the viewport (or close
// to it), so forcing a scroll there would just be disorienting.
const MOBILE_BREAKPOINT = 768;
function scrollToTopOnMobile() {
  if (window.innerWidth <= MOBILE_BREAKPOINT) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

const TAB_CHART_IDS = {
  overview: ["chartHero", "chartNetResult", "chartEquity"],
  revenue: [
    "chartRevenue",
    "chartRevStreams",
    "chartRevVsPayroll",
    "chartOpResult",
  ],
  healthcheck: [
    "chartPayrollBurden",
    "chartTransferReliance",
    "chartDebtLoad",
    "chartCurrentRatio",
  ],
  debt: ["chartDebt", "chartAssetsLiab", "chartDebtMaturity"],
  squad: [
    "chartSquadBook",
    "chartTransfers",
    "chartNetTrading",
    "chartManagerEras",
    "chartCommissions",
  ],
  cash: ["chartCashFlow", "chartCash", "chartAnnualNet"],
  compare: ["compareBarChart"],
  playground: ["chartPlaygroundNet", "chartPlaygroundSolvency"],
};

const CHART_DRAWING_FUNCTIONS = {
  chartHero,
  chartNetResult,
  chartEquity,
  chartRevenue,
  chartRevStreams,
  chartRevVsPayroll,
  chartOpResult,
  chartPayrollBurden,
  chartTransferReliance,
  chartDebtLoad,
  chartCurrentRatio,
  chartDebt,
  chartAssetsLiab,
  chartDebtMaturity,
  chartSquadBook,
  chartTransfers,
  chartNetTrading,
  chartManagerEras: drawManagerEras,
  chartCommissions: drawCommissions,
  chartCashFlow,
  chartCash,
  chartAnnualNet,
  chartPlaygroundNet: drawPlaygroundCharts,
  chartPlaygroundSolvency: drawPlaygroundCharts,
  // initComparison (not renderComparison) is the runOnce-gated entry point
  // registered in TAB_CHARTS.compare below, so it's what must come back out
  // of state.renderedCharts when destroyInactiveCharts tears the chart down
  // on tab-away — otherwise runOnce would see it as "already run" and skip
  // rebuilding the chart the next time the Compare tab is revisited.
  compareBarChart: initComparison,
};

function destroyInactiveCharts(activeTab) {
  for (const tab in TAB_CHART_IDS) {
    if (tab !== activeTab) {
      TAB_CHART_IDS[tab].forEach((canvasId) => {
        if (chartRegistry.has(canvasId)) {
          const chart = chartRegistry.get(canvasId);
          chart.destroy();
          chartRegistry.delete(canvasId);
          const fn = CHART_DRAWING_FUNCTIONS[canvasId];
          if (fn) {
            state.renderedCharts.delete(fn);
          }
        }
      });
    }
  }
}

// Runs fn() at most once per state.renderedCharts.clear() cycle, using the
// function reference itself as the Set key (stable across minification,
// unlike fn.name which esbuild can collapse to ""). Shared by activateTab's
// per-tab chart loop and initSquadSubTabs' lazy subpanel chart draws so the
// same guard isn't hand-duplicated at every call site.
function runOnce(fn) {
  if (!state.renderedCharts.has(fn)) {
    fn();
    state.renderedCharts.add(fn);
  }
}

// Not exported — main.js is the app's entry point and nothing imports from
// it (there's no main.test.js; it's exercised indirectly through the DOM).
function activateTab(tab, pushHash = true) {
  if (!state.VALID_TABS.includes(tab)) tab = "overview";
  destroyInactiveCharts(tab);
  if (tab !== "overview") {
    exitStory();
  }
  let activeBtn = null;
  document.querySelectorAll("nav.tabs button").forEach((b) => {
    const isActive = b.dataset.tab === tab;
    b.classList.toggle("active", isActive);
    b.setAttribute("aria-selected", isActive ? "true" : "false");
    b.setAttribute("tabindex", isActive ? "0" : "-1");
    if (isActive) activeBtn = b;
  });
  updateTabIndicator(activeBtn);

  document
    .querySelectorAll("section.tab-panel")
    .forEach((p) => p.classList.remove("active"));
  const activePanel = document.getElementById("tab-" + tab);
  if (activePanel) activePanel.classList.add("active");

  if (pushHash) {
    history.replaceState(null, "", "#" + tab);
    syncStateToUrl();
  }

  if (state.TAB_CHARTS[tab]) {
    state.TAB_CHARTS[tab].forEach(runOnce);
  }

  if (tab === "events") {
    syncEventsFilter();
  }

  // initHealthBar() above only ever fully runs once (gated by
  // state.renderedCharts), so if the season was changed via the KPI-strip
  // selector on Overview while this tab was hidden, catch its signals and
  // sparklines up now that it's actually visible.
  if (tab === "healthcheck") {
    refreshHealthBarIfStale();
  }
}

// =============================================================
// APP SETUP
// =============================================================

function setupApp(initialTab) {
  // Initialise colour palette and chart base options before any chart is built.
  initChartDefaults();

  renderKpis();
  initStoryMode();
  initEventFilter();
  initScrollAnimations();
  initDataExport();
  initNewsFeed();
  initSquadSubTabs();
  // initPlayground() is intentionally NOT called here. It's listed in
  // TAB_CHARTS.playground below and runs lazily via runOnce() on first visit
  // to the tab, the same pattern every other tab's setup function (initHealthBar,
  // initComparison, initTransfersDetailTable, ...) already follows. Calling it
  // here too used to double-register every one of its event listeners
  // (uclSelect/sliders/reset/preset buttons) — since initPlayground() isn't
  // itself guarded by runOnce, this eager call and the later
  // runOnce(initPlayground) triggered by activateTab() both fired, wiring two
  // independent listeners on every control. That silently doubled the work on
  // every slider drag or button click for the rest of the session (duplicate
  // chart redraws, duplicate syncStateToUrl() calls) without corrupting the
  // displayed numbers, which made it easy to miss.

  state.TAB_CHARTS = {
    overview: [initKpiSeasonSelector, chartHero, chartNetResult, chartEquity],
    revenue: [chartRevenue, chartRevStreams, chartRevVsPayroll, chartOpResult],
    healthcheck: [
      initHealthBar,
      chartPayrollBurden,
      chartTransferReliance,
      chartDebtLoad,
      chartCurrentRatio,
    ],
    debt: [chartDebt, chartAssetsLiab, chartDebtMaturity],
    bonds: [renderVmocCost, renderLionFinance, renderUsppTerms],
    squad: [
      () => {
        const activeSubBtn = document.querySelector(
          ".sub-tabs-container .sub-tab-btn.active",
        );
        if (activeSubBtn) {
          activeSubBtn.click();
        }
      },
    ],
    cash: [chartCashFlow, chartCash, chartAnnualNet],
    compare: [initComparison],
    events: [],
    data: [renderTable, initTransfersDetailTable],
    club: [],
    playground: [initPlayground, drawPlaygroundCharts],
  };

  document.querySelectorAll("nav.tabs button").forEach((btn) => {
    btn.addEventListener("click", () => {
      activateTab(btn.dataset.tab);
      scrollToTopOnMobile();
    });
  });

  document.querySelector("nav.tabs").addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const tabs = [...document.querySelectorAll("nav.tabs button")];
    const idx = tabs.indexOf(document.activeElement);
    if (idx === -1) return;
    e.preventDefault();
    const next =
      e.key === "ArrowRight"
        ? tabs[(idx + 1) % tabs.length]
        : tabs[(idx - 1 + tabs.length) % tabs.length];
    next.focus();
    activateTab(next.dataset.tab);
    scrollToTopOnMobile();
  });

  document.querySelectorAll(".lang-link").forEach((link) => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const lang = link.dataset.lang;
      if ((lang === "pt") === state.isPt) return; // already active

      state.setIsPt(lang === "pt");
      document.documentElement.lang = lang;
      localStorage.setItem("lang", lang);

      // Update active link styling
      document
        .querySelectorAll(".lang-link")
        .forEach((l) => l.classList.toggle("active", l.dataset.lang === lang));

      // Load translations asynchronously first
      await loadTranslations(lang);

      // Update all static HTML strings
      applyTranslations(lang);
      syncStateToUrl();

      // Clear rendered set so charts re-run fn() and update gracefully when tabs are visited
      state.renderedCharts.clear();

      // Re-render the currently active tab
      const activeTabBtn = document.querySelector("nav.tabs button.active");
      if (activeTabBtn) activateTab(activeTabBtn.dataset.tab, false);

      // Re-render KPI strip
      renderKpis();

      // Re-render active story step if open
      const storyCard = document.getElementById("storyCard");
      if (storyCard && !storyCard.classList.contains("hidden")) {
        updateStoryStep();
      }
    });
  });

  // Theme Toggle listener
  const themeBtn = document.getElementById("themeToggleBtn");
  if (themeBtn) {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      document.body.classList.add("dark");
      updateThemeUI(true);
    } else {
      document.body.classList.remove("dark");
      updateThemeUI(false);
    }

    themeBtn.addEventListener("click", () => {
      themeBtn.classList.add("animating");
      themeBtn.addEventListener(
        "animationend",
        () => {
          themeBtn.classList.remove("animating");
        },
        { once: true },
      );

      const isDark = document.body.classList.toggle("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      updateThemeUI(isDark);
      updateChartTheme();
      // Force re-rendering of active tab's charts (same pattern as the
      // language-switch handler above: clear the guard, then re-run
      // activateTab so every TAB_CHARTS entry redraws with the new theme).
      state.renderedCharts.clear();
      const activeTabBtn = document.querySelector("nav.tabs button.active");
      if (activeTabBtn) activateTab(activeTabBtn.dataset.tab, false);
    });
  }

  // Restore saved language preference or auto-detect browser language
  const activeLang = detectActiveLang();

  state.setIsPt(activeLang === "pt");
  document.documentElement.lang = activeLang;
  document
    .querySelectorAll(".lang-link")
    .forEach((l) =>
      l.classList.toggle("active", l.dataset.lang === activeLang),
    );

  // Apply translations for active language
  applyTranslations(activeLang);

  // Initial chart theme setup on load
  updateChartTheme();

  // Initial tab activation — initialTab was resolved by applyUrlParams() in
  // initApp(), *before* translations were loaded, so a ?lang= deep link
  // affects which translation file is fetched rather than being applied
  // after the wrong one already loaded.
  activateTab(initialTab, false);

  if (initialTab === "overview" && state.urlStoryActive) {
    // Pass the step applyUrlParams() restored — startStory() defaults to
    // step 0, which used to discard the ?story=N deep link.
    startStory(state.storyIndex);
  }

  // updateTabIndicator() does forced-synchronous layout reads (offsetLeft/
  // offsetWidth) plus a smooth-scroll call — resize can fire dozens of times
  // a second while a window is actively being dragged, and only the value
  // after it settles actually matters, so debounce rather than run on every
  // single event.
  window.addEventListener(
    "resize",
    debounce(() => updateTabIndicator(), 120),
  );

  // Floating Scroll to Top button logic
  const scrollToTopBtn = document.getElementById("scrollToTopBtn");
  if (scrollToTopBtn) {
    // { passive: true } tells the browser this handler will never call
    // preventDefault(), so it doesn't have to wait for it to finish before
    // proceeding with the scroll — meaningful for a listener that fires on
    // every scroll frame.
    window.addEventListener(
      "scroll",
      () => {
        if (window.scrollY > 300) {
          scrollToTopBtn.classList.add("visible");
        } else {
          scrollToTopBtn.classList.remove("visible");
        }
      },
      { passive: true },
    );

    scrollToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  initPdfExport();
}

function initSquadSubTabs() {
  const container = document.querySelector(".sub-tabs-container");
  if (!container) return;

  const buttons = container.querySelectorAll(".sub-tab-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const sub = btn.dataset.squadSub;

      // Update sub-tabs active styling
      buttons.forEach((b) => b.classList.toggle("active", b === btn));

      // Toggle panels visibility
      document.querySelectorAll(".sub-panel-squad").forEach((panel) => {
        const isTarget = panel.id === `squad-subpanel-${sub}`;
        panel.classList.toggle("hidden", !isTarget);
      });

      // Lazy draw matching subpanel charts
      if (sub === "financials") {
        runOnce(chartSquadBook);
        runOnce(chartTransfers);
        runOnce(chartNetTrading);
      } else if (sub === "analytics") {
        runOnce(drawManagerEras);
        runOnce(drawCommissions);
      } else if (sub === "ledger") {
        renderTransferLedger();
      }
    });
  });
}

// =============================================================
// APP ENTRY POINT
// =============================================================

async function initApp() {
  try {
    // Read URL params first: applyUrlParams() persists a ?lang= override to
    // localStorage, which detectActiveLang() below picks up — so a shared
    // PT link loads pt.json directly instead of applying the language after
    // the wrong translation file was already fetched. It also stashes the
    // era-filter range and other view state for setupApp to restore.
    const initialTab = applyUrlParams();

    // The three startup fetches (financials, transfers, translations) are
    // independent of each other — load them in parallel instead of
    // serialising three network round-trips.
    const [finRes, trRes] = await Promise.all([
      fetch(config.financialsPath),
      fetch(config.transfersPath),
      loadTranslations(detectActiveLang()),
    ]);
    if (!finRes.ok) {
      throw new Error(
        `Failed to load ${config.financialsPath}: HTTP ${finRes.status} ${finRes.statusText}`,
      );
    }
    if (!trRes.ok) {
      throw new Error(
        `Failed to load ${config.transfersPath}: HTTP ${trRes.status} ${trRes.statusText}`,
      );
    }
    const [dataset, transferLedger] = await Promise.all([
      finRes.json(),
      trRes.json(),
    ]);
    state.setDataset(dataset);
    state.setTransferLedger(transferLedger);

    // Once data is loaded, populate KPIs and setup UI
    setupApp(initialTab);
    initJornalModal();
    initImageLightbox();
    initKitCardFlip();
  } catch (e) {
    console.error("Failed to load application data", e);
    // Build the error UI programmatically so error text is set via textContent,
    // not injected into innerHTML (avoids XSS from stack trace strings).
    const wrap = document.createElement("div");
    wrap.style.cssText =
      "padding: 2rem; color: #ff4444; font-family: sans-serif; text-align: center; max-width: 800px; margin: 0 auto;";
    wrap.innerHTML =
      "<h2>Failed to load application data.</h2>" +
      "<p>Please ensure you are running the application through a local web server, not opening the HTML file directly.</p>";
    const pre = document.createElement("pre");
    pre.style.cssText =
      "margin-top: 2rem; padding: 1rem; background: rgba(255,0,0,0.05); border: 1px dashed #ff4444; border-radius: 4px; text-align: left; font-family: monospace; overflow-x: auto; white-space: pre-wrap;";
    pre.textContent = `Error Details:\n${e.stack || e.message || String(e)}`;
    wrap.appendChild(pre);
    document.body.innerHTML = "";
    document.body.appendChild(wrap);
  } finally {
    document.body.classList.remove("app-loading");
  }
}

// Start application
initApp();

// Initialize PWA service worker and updates notification
initPWA();
