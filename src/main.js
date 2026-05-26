import { state } from "./state.js";
import { applyTranslations } from "./translations.js";
import { initHealthBar } from "./health.js";
import { renderVmocCost, renderLionFinance, renderUsppTerms } from "./bonds.js";
import { renderTransferLedger, initTransfersDetailTable } from "./transfers.js";
import { renderTable, initDataExport } from "./data-table.js";
import { initNewsFeed } from "./news.js";
import { exitStory, updateStoryStep, initStoryMode } from "./story.js";
import { initComparison } from "./compare.js";
import { syncEventsFilter, initEventFilter } from "./events.js";
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
  chartRegistry,
  fmtMillions,
} from "./charts.js";
import { initChartDefaults, ZONE_COLORS } from "./chartUtils.js";
import { renderKpis } from "./kpi.js";

async function initApp() {
  try {
    const finRes = await fetch("./data/financials.json");
    state.DATASET = await finRes.json();
    const trRes = await fetch("./data/transfers.json");
    state.TRANSFER_LEDGER = await trRes.json();

    // Pin endSeasonIndex to the real last index so the filter UI is correct.
    state.setEndSeasonIndex(state.DATASET.annual_data.length - 1);

    // Once data is loaded, populate KPIs and setup UI
    setupApp();
    initJornalModal();
  } catch (e) {
    console.error("Failed to load application data", e);
    document.body.innerHTML = `<div style="padding: 2rem; color: #ff4444; font-family: sans-serif; text-align: center; max-width: 800px; margin: 0 auto;">
      <h2>Failed to load application data.</h2>
      <p>Please ensure you are running the application through a local web server, not opening the HTML file directly.</p>
      <div style="margin-top: 2rem; padding: 1rem; background: rgba(255,0,0,0.05); border: 1px dashed #ff4444; border-radius: 4px; text-align: left; font-family: monospace; overflow-x: auto; white-space: pre-wrap;">
Error Details:
${e.stack || e.message || e}
      </div>
    </div>`;
  } finally {
    document.body.classList.remove("app-loading");
  }
}

function setupApp() {
  // Initialise colour palette and chart base options before any chart is built.
  initChartDefaults();
  initGlobalFilters();
  renderKpis();
  initStoryMode();
  initEventFilter();
  initScrollAnimations();
  initDataExport();
  initNewsFeed();

  // =============================================================
  // TAB SWITCHING
  // =============================================================
  state.TAB_CHARTS = {
    overview: [chartHero, chartNetResult, chartEquity],
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
      chartSquadBook,
      chartTransfers,
      chartNetTrading,
      renderTransferLedger,
    ],
    cash: [chartCashFlow, chartCash, chartAnnualNet],
    compare: [initComparison],
    events: [],
    data: [renderTable, initTransfersDetailTable],
  };

  document.querySelectorAll("nav.tabs button").forEach((btn) => {
    btn.addEventListener("click", () => activateTab(btn.dataset.tab));
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
  });

  // Language switcher — intercept EN/PT links, no page reload
  document.querySelectorAll(".lang-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const lang = link.dataset.lang;
      if ((lang === "pt") === state.isPt) return; // already active

      state.isPt = lang === "pt";
      document.documentElement.lang = lang;
      localStorage.setItem("lang", lang);

      // Update active link styling
      document
        .querySelectorAll(".lang-link")
        .forEach((l) => l.classList.toggle("active", l.dataset.lang === lang));

      // Update all static HTML strings
      applyTranslations(lang);

      // Clear all cached charts so they rebuild with new language
      state.renderedCharts.clear();
      chartRegistry.forEach((chart) => chart.destroy());
      chartRegistry.clear();

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
      // Force re-rendering of active tab's charts
      state.renderedCharts.clear();
      const activeTabBtn = document.querySelector("nav.tabs button.active");
      if (activeTabBtn) {
        const tab = activeTabBtn.dataset.tab;
        if (state.TAB_CHARTS[tab]) {
          state.TAB_CHARTS[tab].forEach((fn) => {
            if (chartRegistry.has(fn.name)) {
              chartRegistry.get(fn.name).destroy();
              chartRegistry.delete(fn.name);
            }
            fn();
            state.renderedCharts.add(fn.name);
          });
        }
      }
    });
  }

  // Restore saved language preference or auto-detect browser language
  let activeLang = localStorage.getItem("lang");
  if (!activeLang && typeof navigator !== "undefined") {
    const browserLang = navigator.language || navigator.userLanguage || "en";
    activeLang = browserLang.startsWith("pt") ? "pt" : "en";
  } else if (!activeLang) {
    activeLang = "en";
  }

  state.isPt = activeLang === "pt";
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

  // Initial tab activation
  const initialTab = location.hash.replace("#", "") || "overview";
  activateTab(initialTab, false);

  window.addEventListener("resize", () => updateTabIndicator());

  // Floating Scroll to Top button logic
  const scrollToTopBtn = document.getElementById("scrollToTopBtn");
  if (scrollToTopBtn) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        scrollToTopBtn.classList.add("visible");
      } else {
        scrollToTopBtn.classList.remove("visible");
      }
    });

    scrollToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}

export function activateTab(tab, pushHash = true) {
  if (!state.VALID_TABS.includes(tab)) tab = "overview";
  if (tab !== "overview") {
    exitStory();
  }
  let activeBtn = null;
  document.querySelectorAll("nav.tabs button").forEach((b) => {
    const isActive = b.dataset.tab === tab;
    b.classList.toggle("active", isActive);
    b.setAttribute("aria-selected", isActive ? "true" : "false");
    if (isActive) activeBtn = b;
  });
  updateTabIndicator(activeBtn);

  document
    .querySelectorAll("section.tab-panel")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("tab-" + tab).classList.add("active");
  if (pushHash) history.replaceState(null, "", "#" + tab);

  if (state.TAB_CHARTS[tab]) {
    state.TAB_CHARTS[tab].forEach((fn) => {
      if (!state.renderedCharts.has(fn.name)) {
        fn();
        state.renderedCharts.add(fn.name);
      }
    });
  }

  if (tab === "events") {
    syncEventsFilter();
  }
}

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

function updateThemeUI(isDark) {
  const themeBtn = document.getElementById("themeToggleBtn");
  if (!themeBtn) return;
  const btnText = themeBtn.querySelector("span");
  const btnIcon = themeBtn.querySelector("svg");
  if (isDark) {
    if (btnText) btnText.textContent = state.isPt ? "Modo Claro" : "Light Mode";
    if (btnIcon)
      btnIcon.innerHTML =
        '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
  } else {
    if (btnText) btnText.textContent = state.isPt ? "Modo Escuro" : "Dark Mode";
    if (btnIcon)
      btnIcon.innerHTML =
        '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
  }
}

function updateChartTheme() {
  const isDark = document.body.classList.contains("dark");
  state.COLORS.ink = isDark ? "#eaeaea" : "#18221d";
  state.COLORS.muted = isDark ? "#8c938f" : "#5a6a62";
  state.COLORS.chartBg = isDark ? "#121513" : "#ffffff";

  // Dynamic brand and status colors for charts/sparklines in dark mode
  state.COLORS.green = isDark ? "#2e9e6c" : "#0a5d3a";
  state.COLORS.greenLight = isDark ? "#3de080" : "#2e9e6c";
  state.COLORS.greenSoft = isDark
    ? "rgba(46, 158, 105, 0.2)"
    : "rgba(10,93,58,0.15)";
  state.COLORS.gold = isDark ? "#ffd54f" : "#c8a951";
  state.COLORS.goldSoft = isDark
    ? "rgba(255, 213, 79, 0.25)"
    : "rgba(200,169,81,0.4)";
  state.COLORS.pos = isDark ? "#3de080" : "#2e8a55";
  state.COLORS.posSoft = isDark
    ? "rgba(61, 224, 128, 0.35)"
    : "rgba(46, 138, 85, 0.7)";
  state.COLORS.neg = isDark ? "#ff6b6b" : "#c6404f";
  state.COLORS.negSoft = isDark
    ? "rgba(255, 107, 107, 0.35)"
    : "rgba(198, 64, 79, 0.7)";
  state.COLORS.warn = isDark ? "#ffb300" : "#d99c2b";
  state.COLORS.info = isDark ? "#52a3ff" : "#3a72b8";
  state.COLORS.infoSoft = isDark
    ? "rgba(82, 163, 255, 0.35)"
    : "rgba(58,114,184,0.7)";

  // Dynamic connection line color for health ratios
  state.COLORS.lineBorder = isDark
    ? "rgba(255, 255, 255, 0.3)"
    : "rgba(0, 0, 0, 0.12)";

  // Dynamic zone backgrounds for health ratios
  ZONE_COLORS.red = isDark
    ? "rgba(255, 107, 107, 0.15)"
    : "rgba(198,64,79,0.07)";
  ZONE_COLORS.amber = isDark
    ? "rgba(255, 179, 0, 0.15)"
    : "rgba(217,156,43,0.08)";
  ZONE_COLORS.green = isDark
    ? "rgba(61, 224, 128, 0.08)"
    : "rgba(46,138,85,0.06)";

  state.baseOpts.scales.x.ticks.color = state.COLORS.muted;
  state.baseOpts.scales.y.ticks.color = state.COLORS.muted;
  if (state.baseOpts.scales.y.grid) {
    state.baseOpts.scales.y.grid.color = isDark
      ? "rgba(255,255,255,0.12)"
      : "rgba(0,0,0,0.05)";
  }
  if (state.baseOpts.plugins && state.baseOpts.plugins.tooltip) {
    state.baseOpts.plugins.tooltip.backgroundColor = isDark
      ? "rgba(24, 29, 26, 0.95)"
      : "rgba(250, 248, 243, 0.95)";
    state.baseOpts.plugins.tooltip.titleColor = isDark ? "#eaeaea" : "#14181a";
    state.baseOpts.plugins.tooltip.bodyColor = isDark ? "#cccccc" : "#2c3437";
    state.baseOpts.plugins.tooltip.borderColor = isDark ? "#2a332f" : "#e6e1d4";
  }
}

function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
  );

  const targets = document.querySelectorAll(
    ".card, .kpi, .health-bar, .event, .cmp-card, .lf-card, .hb-title, .disclaimer-banner, .social-hub, .news-grid",
  );
  targets.forEach((el) => {
    el.classList.add("anim-up");
    observer.observe(el);
  });
}

// Jornal Modal Logic
function initJornalModal() {
  const btnOpen = document.getElementById("btnJornalModal");
  const btnClose = document.getElementById("btnCloseJornal");
  const modal = document.getElementById("jornalModal");
  const container = document.getElementById("jornalIframeContainer");

  if (!btnOpen || !btnClose || !modal || !container) return;

  const iframeSrc =
    "https://e.issuu.com/embed.html?backgroundColor=%23008057&backgroundColorFullscreen=%23008057&d=jornal_sporting_n._4077&hideIssuuLogo=true&hideShareButton=true&showOtherPublicationsAsSuggestions=true&u=sporting-digitalpaper";

  function openModal() {
    // Inject iframe only on first open
    if (container.innerHTML === "") {
      container.innerHTML = `<iframe src="${iframeSrc}" allow="clipboard-write; autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen="true"></iframe>`;
    }
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  }

  function closeModal() {
    modal.classList.add("hidden");
    document.body.style.overflow = ""; // Restore background scrolling
  }

  btnOpen.addEventListener("click", openModal);
  btnClose.addEventListener("click", closeModal);

  // Close on outside click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Close on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });
}

// Start application
initApp();

function initGlobalFilters() {
  const startSelect = document.getElementById("globalStartSeason");
  const endSelect = document.getElementById("globalEndSeason");
  if (!startSelect || !endSelect) return;

  const seasons = state.fullAnnual.map((d) => d.label);

  const renderOptions = () => {
    startSelect.innerHTML = "";
    endSelect.innerHTML = "";
    seasons.forEach((season, index) => {
      // Start Select
      const optStart = document.createElement("option");
      optStart.value = index;
      optStart.textContent = season;
      if (index === state.startSeasonIndex) optStart.selected = true;
      if (index > state.endSeasonIndex) optStart.disabled = true;
      startSelect.appendChild(optStart);

      // End Select
      const optEnd = document.createElement("option");
      optEnd.value = index;
      optEnd.textContent = season;
      if (index === state.endSeasonIndex) optEnd.selected = true;
      if (index < state.startSeasonIndex) optEnd.disabled = true;
      endSelect.appendChild(optEnd);
    });
  };

  const onChange = () => {
    state.setStartSeasonIndex(parseInt(startSelect.value, 10));
    state.setEndSeasonIndex(parseInt(endSelect.value, 10));
    renderOptions();

    // Clear all charts and force re-render of active tab
    state.renderedCharts.clear();
    const activeTab = document.querySelector(".tabs button.active");
    if (activeTab) {
      activateTab(activeTab.dataset.tab);
    }
    updateActivePreset();
  };

  const presets = document.querySelectorAll("#eraPresets .season-pill");

  const updateActivePreset = () => {
    presets.forEach((btn) => {
      const s = parseInt(btn.dataset.start, 10);
      const e =
        btn.dataset.end === "latest"
          ? seasons.length - 1
          : parseInt(btn.dataset.end, 10);
      const isActive =
        state.startSeasonIndex === s && state.endSeasonIndex === e;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  presets.forEach((btn) => {
    btn.addEventListener("click", () => {
      const s = parseInt(btn.dataset.start, 10);
      const e =
        btn.dataset.end === "latest"
          ? seasons.length - 1
          : parseInt(btn.dataset.end, 10);
      startSelect.value = s;
      endSelect.value = e;
      onChange();
    });
  });

  startSelect.addEventListener("change", onChange);
  endSelect.addEventListener("change", onChange);
  renderOptions();
  updateActivePreset();
}

// -------------------------------------------------------------
// PWA SERVICE WORKER PROMPT & TOAST
// -------------------------------------------------------------

function showUpdateToast(onConfirm) {
  let toast = document.getElementById("pwa-update-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "pwa-update-toast";
    toast.className = "pwa-toast";
    document.body.appendChild(toast);
  }

  const isPt = state.isPt;
  const msg = isPt
    ? "Nova versão disponível! Atualize para obter as últimas novidades."
    : "New version available! Refresh to get the latest features.";
  const btnTxt = isPt ? "Atualizar" : "Update";

  toast.innerHTML = `
    <div class="toast-body">
      <span>${msg}</span>
      <button id="pwa-update-btn" class="toast-btn">${btnTxt}</button>
    </div>
  `;

  // Entrance slide animation
  setTimeout(() => toast.classList.add("visible"), 100);

  document.getElementById("pwa-update-btn").addEventListener("click", () => {
    toast.classList.remove("visible");
    onConfirm();
  });
}

// Register service worker if supported and not in test mode
if (
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  import.meta.env.MODE !== "test"
) {
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      const updateSW = registerSW({
        onNeedRefresh() {
          showUpdateToast(() => updateSW(true));
        },
        onOfflineReady() {
          console.log("App ready to work offline.");
        },
      });
    })
    .catch((err) => {
      console.error("Failed to load virtual:pwa-register", err);
    });
}
