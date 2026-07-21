import { state } from "./state.js";
import { chartRegistry } from "../charts/chartUtils.js";
import { exitStory } from "../features/story.js";
import { syncStateToUrl } from "../utils/urlSync.js";
import { syncEventsFilter } from "../features/events.js";
import {
  initHealthBar,
  initKpiSeasonSelector,
  refreshHealthBarIfStale,
} from "../features/health.js";
import {
  renderVmocCost,
  renderLionFinance,
  renderUsppTerms,
} from "../features/bonds.js";
import {
  renderTransferLedger,
  initTransfersDetailTable,
} from "../features/transfers.js";
import { renderTable } from "../features/data-table.js";
import { initComparison } from "../features/compare.js";
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
} from "../charts/charts.js";
import {
  drawManagerEras,
  drawCommissions,
} from "../features/squadAnalytics.js";
import {
  initPlayground,
  drawPlaygroundCharts,
} from "../features/playground.js";

// =============================================================
// TAB INDICATOR
// =============================================================

export function updateTabIndicator(activeBtn) {
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

  const containerWidth = tabsContainer.offsetWidth;
  const btnLeft = btn.offsetLeft;
  const btnWidth = btn.offsetWidth;
  tabsContainer.scrollTo({
    left: btnLeft - containerWidth / 2 + btnWidth / 2,
    behavior: "smooth",
  });
}

// =============================================================
// TAB SWITCHING & ROUTING
// =============================================================

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

function runOnce(fn) {
  if (!state.renderedCharts.has(fn)) {
    fn();
    state.renderedCharts.add(fn);
  }
}

export function activateTab(tab, pushHash = true) {
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

  if (tab === "healthcheck") {
    refreshHealthBarIfStale();
  }
}

function initSquadSubTabs() {
  const container = document.querySelector(".sub-tabs-container");
  if (!container) return;

  const buttons = container.querySelectorAll(".sub-tab-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const sub = btn.dataset.squadSub;

      buttons.forEach((b) => b.classList.toggle("active", b === btn));

      document.querySelectorAll(".sub-panel-squad").forEach((panel) => {
        const isTarget = panel.id === `squad-subpanel-${sub}`;
        panel.classList.toggle("hidden", !isTarget);
      });

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

export function initRouter(initialTab) {
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

  initSquadSubTabs();
  activateTab(initialTab, false);
}
