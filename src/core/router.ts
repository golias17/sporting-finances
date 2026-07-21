import { state } from "./state.ts";
import { chartRegistry } from "../charts/chartUtils.ts";
import { exitStory } from "../features/story.ts";
import { syncStateToUrl } from "../utils/urlSync.ts";
import { syncEventsFilter } from "../features/events.ts";

// =============================================================
// TAB INDICATOR
// =============================================================

export function updateTabIndicator(activeBtn: HTMLElement | null) {
  const tabsContainer = document.querySelector("nav.tabs") as HTMLElement;
  if (!tabsContainer) return;

  let indicator = tabsContainer.querySelector(".tab-indicator") as HTMLElement;
  if (!indicator) {
    indicator = document.createElement("div");
    indicator.className = "tab-indicator";
    tabsContainer.appendChild(indicator);
  }

  const btn = activeBtn || tabsContainer.querySelector("button.active") as HTMLElement;
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

const TAB_CHART_IDS: Record<string, string[]> = {
  overview: ["chartHero", "chartNetResult", "chartEquity", "kpiSeasonSelector"],
  revenue: ["chartRevenue", "chartRevStreams", "chartRevVsPayroll", "chartOpResult"],
  healthcheck: ["chartPayrollBurden", "chartTransferReliance", "chartDebtLoad", "chartCurrentRatio", "healthBar"],
  debt: ["chartDebt", "chartAssetsLiab", "chartDebtMaturity"],
  squad: ["chartSquadBook", "chartTransfers", "chartNetTrading", "chartManagerEras", "chartCommissions"],
  cash: ["chartCashFlow", "chartCash", "chartAnnualNet"],
  compare: ["compareBarChart"],
  playground: ["chartPlaygroundNet", "chartPlaygroundSolvency", "playgroundInit"],
  bonds: ["renderVmocCost", "renderLionFinance", "renderUsppTerms"],
  data: ["renderTable", "initTransfersDetailTable"]
};

function destroyInactiveCharts(activeTab: string) {
  for (const tab in TAB_CHART_IDS) {
    if (tab !== activeTab) {
      TAB_CHART_IDS[tab].forEach((canvasId) => {
        if (chartRegistry.has(canvasId)) {
          const chart = chartRegistry.get(canvasId);
          if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
          }
          chartRegistry.delete(canvasId);
        }
        // Also remove from renderedCharts so it can be re-rendered when returning to the tab
        state.renderedCharts.delete(canvasId);
      });
    }
  }
}

function runOnceAsync(key: string, loader: () => Promise<void>) {
  if (!state.renderedCharts.has(key)) {
    state.renderedCharts.add(key);
    loader().catch(e => {
      console.error(`Failed to load ${key}:`, e);
      state.renderedCharts.delete(key);
    });
  }
}

export async function activateTab(tab: string, pushHash = true) {
  if (!state.VALID_TABS.includes(tab)) tab = "overview";
  destroyInactiveCharts(tab);
  if (tab !== "overview") {
    exitStory();
  }
  let activeBtn: HTMLElement | null = null;
  document.querySelectorAll("nav.tabs button").forEach((b) => {
    const btn = b as HTMLElement;
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-selected", isActive ? "true" : "false");
    btn.setAttribute("tabindex", isActive ? "0" : "-1");
    if (isActive) activeBtn = btn;
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

  if (state.TAB_CHARTS && state.TAB_CHARTS[tab]) {
    state.TAB_CHARTS[tab].forEach((item: { key: string, loader: () => Promise<void> }) => {
      runOnceAsync(item.key, item.loader);
    });
  }

  if (tab === "events") {
    syncEventsFilter();
  }

  if (tab === "healthcheck") {
    const { refreshHealthBarIfStale } = await import("../features/health.ts");
    refreshHealthBarIfStale();
  }
}

function initSquadSubTabs() {
  const container = document.querySelector(".sub-tabs-container");
  if (!container) return;

  const buttons = container.querySelectorAll(".sub-tab-btn");
  buttons.forEach((b) => {
    const btn = b as HTMLElement;
    btn.addEventListener("click", () => {
      const sub = btn.dataset.squadSub;

      buttons.forEach((b2) => b2.classList.toggle("active", b2 === btn));

      document.querySelectorAll(".sub-panel-squad").forEach((p) => {
        const panel = p as HTMLElement;
        const isTarget = panel.id === `squad-subpanel-${sub}`;
        panel.classList.toggle("hidden", !isTarget);
      });

      if (sub === "financials") {
        runOnceAsync("chartSquadBook", async () => { const m = await import("../charts/charts.ts"); m.chartSquadBook(); });
        runOnceAsync("chartTransfers", async () => { const m = await import("../charts/charts.ts"); m.chartTransfers(); });
        runOnceAsync("chartNetTrading", async () => { const m = await import("../charts/charts.ts"); m.chartNetTrading(); });
      } else if (sub === "analytics") {
        runOnceAsync("chartManagerEras", async () => { const m = await import("../features/squadAnalytics.ts"); m.drawManagerEras(); });
        runOnceAsync("chartCommissions", async () => { const m = await import("../features/squadAnalytics.ts"); m.drawCommissions(); });
      } else if (sub === "ledger") {
        runOnceAsync("renderTransferLedger", async () => { const m = await import("../features/transfers.ts"); m.renderTransferLedger(); });
      }
    });
  });
}

export function initRouter(initialTab: string) {
  // Define dynamic loaders
  state.TAB_CHARTS = {
    overview: [
      { key: "kpiSeasonSelector", loader: async () => { const m = await import("../features/health.ts"); m.initKpiSeasonSelector(); } },
      { key: "chartHero", loader: async () => { const m = await import("../charts/charts.ts"); m.chartHero(); } },
      { key: "chartNetResult", loader: async () => { const m = await import("../charts/charts.ts"); m.chartNetResult(); } },
      { key: "chartEquity", loader: async () => { const m = await import("../charts/charts.ts"); m.chartEquity(); } },
    ],
    revenue: [
      { key: "chartRevenue", loader: async () => { const m = await import("../charts/charts.ts"); m.chartRevenue(); } },
      { key: "chartRevStreams", loader: async () => { const m = await import("../charts/charts.ts"); m.chartRevStreams(); } },
      { key: "chartRevVsPayroll", loader: async () => { const m = await import("../charts/charts.ts"); m.chartRevVsPayroll(); } },
      { key: "chartOpResult", loader: async () => { const m = await import("../charts/charts.ts"); m.chartOpResult(); } },
    ],
    healthcheck: [
      { key: "healthBar", loader: async () => { const m = await import("../features/health.ts"); m.initHealthBar(); } },
      { key: "chartPayrollBurden", loader: async () => { const m = await import("../charts/charts.ts"); m.chartPayrollBurden(); } },
      { key: "chartTransferReliance", loader: async () => { const m = await import("../charts/charts.ts"); m.chartTransferReliance(); } },
      { key: "chartDebtLoad", loader: async () => { const m = await import("../charts/charts.ts"); m.chartDebtLoad(); } },
      { key: "chartCurrentRatio", loader: async () => { const m = await import("../charts/charts.ts"); m.chartCurrentRatio(); } },
    ],
    debt: [
      { key: "chartDebt", loader: async () => { const m = await import("../charts/charts.ts"); m.chartDebt(); } },
      { key: "chartAssetsLiab", loader: async () => { const m = await import("../charts/charts.ts"); m.chartAssetsLiab(); } },
      { key: "chartDebtMaturity", loader: async () => { const m = await import("../charts/charts.ts"); m.chartDebtMaturity(); } },
    ],
    bonds: [
      { key: "renderVmocCost", loader: async () => { const m = await import("../features/bonds.ts"); m.renderVmocCost(); } },
      { key: "renderLionFinance", loader: async () => { const m = await import("../features/bonds.ts"); m.renderLionFinance(); } },
      { key: "renderUsppTerms", loader: async () => { const m = await import("../features/bonds.ts"); m.renderUsppTerms(); } },
    ],
    squad: [
      { key: "squadSubTabs", loader: async () => {
        const activeSubBtn = document.querySelector(".sub-tabs-container .sub-tab-btn.active") as HTMLElement;
        if (activeSubBtn) activeSubBtn.click();
      }}
    ],
    cash: [
      { key: "chartCashFlow", loader: async () => { const m = await import("../charts/charts.ts"); m.chartCashFlow(); } },
      { key: "chartCash", loader: async () => { const m = await import("../charts/charts.ts"); m.chartCash(); } },
      { key: "chartAnnualNet", loader: async () => { const m = await import("../charts/charts.ts"); m.chartAnnualNet(); } },
    ],
    compare: [
      { key: "compareBarChart", loader: async () => { const m = await import("../features/compare.ts"); m.initComparison(); } }
    ],
    events: [],
    data: [
      { key: "renderTable", loader: async () => { const m = await import("../features/data-table.ts"); m.renderTable(); } },
      { key: "initTransfersDetailTable", loader: async () => { const m = await import("../features/transfers.ts"); m.initTransfersDetailTable(); } }
    ],
    club: [],
    playground: [
      { key: "playgroundInit", loader: async () => { const m = await import("../features/playground.ts"); m.initPlayground(); } },
      { key: "chartPlaygroundNet", loader: async () => { const m = await import("../features/playground.ts"); m.drawPlaygroundCharts(); } }
    ],
  };

  document.querySelectorAll("nav.tabs button").forEach((b) => {
    const btn = b as HTMLElement;
    btn.addEventListener("click", () => {
      activateTab(btn.dataset.tab || "overview");
      scrollToTopOnMobile();
    });
  });

  document.querySelector("nav.tabs")?.addEventListener("keydown", (e: Event) => {
    const keyEvent = e as KeyboardEvent;
    if (keyEvent.key !== "ArrowLeft" && keyEvent.key !== "ArrowRight") return;
    const tabs = [...document.querySelectorAll("nav.tabs button")] as HTMLElement[];
    const idx = tabs.indexOf(document.activeElement as HTMLElement);
    if (idx === -1) return;
    keyEvent.preventDefault();
    const next =
      keyEvent.key === "ArrowRight"
        ? tabs[(idx + 1) % tabs.length]
        : tabs[(idx - 1 + tabs.length) % tabs.length];
    next.focus();
    activateTab(next.dataset.tab || "overview");
    scrollToTopOnMobile();
  });

  initSquadSubTabs();
  activateTab(initialTab, false);
}
