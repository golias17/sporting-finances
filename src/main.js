import { state } from "./state.js";
import { applyTranslations } from "./translations.js";
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
import { initChartDefaults, ZONE_COLORS } from "./chartUtils.js";
import { renderKpis } from "./kpi.js";
import { initGlobalFilters } from "./globalFilters.js";
import { initPWA } from "./pwa.js";

// =============================================================
// JORNAL MODAL
// =============================================================

// AbortController for modal listeners — replaced on each call so re-invoking
// initJornalModal never accumulates duplicate document-level keydown handlers.
let jornalAbortController = null;

function initJornalModal() {
  const btnOpen = document.getElementById("btnJornalModal");
  const btnClose = document.getElementById("btnCloseJornal");
  const modal = document.getElementById("jornalModal");
  const container = document.getElementById("jornalIframeContainer");

  if (!btnOpen || !btnClose || !modal || !container) return;

  if (jornalAbortController) {
    jornalAbortController.abort();
  }
  jornalAbortController = new AbortController();
  const { signal } = jornalAbortController;

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

  btnOpen.addEventListener("click", openModal, { signal });
  btnClose.addEventListener("click", closeModal, { signal });

  // Close on outside click
  modal.addEventListener(
    "click",
    (e) => {
      if (e.target === modal) closeModal();
    },
    { signal },
  );

  // Close on escape key
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) {
        closeModal();
      }
    },
    { signal },
  );
}

// IMAGE LIGHTBOX MODAL
// =============================================================
function initImageLightbox() {
  const lightbox = document.getElementById("imageLightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const btnClose = document.getElementById("closeLightboxBtn");
  const toggleBtn = document.getElementById("lightboxToggleKitBtn");

  if (!lightbox || !lightboxImg || !lightboxCaption || !btnClose || !toggleBtn)
    return;

  const targets = document.querySelectorAll(
    ".stadium-panorama-img, .court-panorama-img, .academy-panorama-img, .museum-panorama-img, .kit-img",
  );

  let currentFrontSrc = null;
  let currentBackSrc = null;
  let currentFrontAlt = "";
  let currentBackAlt = "";
  let isShowingBack = false;

  targets.forEach((img) => {
    img.addEventListener("click", () => {
      const src = img.src;
      const alt = img.alt || "Sporting CP Asset";

      // Reset
      toggleBtn.classList.add("hidden");
      currentFrontSrc = null;
      currentBackSrc = null;
      isShowingBack = false;

      // Detect if image is inside a kit flip card
      const kitInner = img.closest(".kit-card-inner");
      if (kitInner) {
        const frontImg = kitInner.querySelector(".kit-card-front img");
        const backImg = kitInner.querySelector(".kit-card-back img");
        if (frontImg && backImg) {
          currentFrontSrc = frontImg.src;
          currentBackSrc = backImg.src;
          currentFrontAlt = frontImg.alt || "Kit Front";
          currentBackAlt = backImg.alt || "Kit Back";
          isShowingBack = src === currentBackSrc;
          toggleBtn.classList.remove("hidden");
        }
      }

      lightboxImg.src = src;
      lightboxCaption.textContent = alt;
      lightbox.classList.add("active");
      document.body.style.overflow = "hidden";
    });
  });

  toggleBtn.addEventListener("click", () => {
    if (!currentFrontSrc || !currentBackSrc) return;
    isShowingBack = !isShowingBack;
    if (isShowingBack) {
      lightboxImg.src = currentBackSrc;
      lightboxCaption.textContent = currentBackAlt;
    } else {
      lightboxImg.src = currentFrontSrc;
      lightboxCaption.textContent = currentFrontAlt;
    }
  });

  function closeLightbox() {
    lightbox.classList.remove("active");
    document.body.style.overflow = "";
  }

  btnClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.id === "imageLightbox") {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("active")) {
      closeLightbox();
    }
  });
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
// THEME
// =============================================================

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
  // Light-mode values here match _variables.css's :root block exactly
  // (--ink, --muted, --gold, --neg, --warn, --info, --pos, --green) so
  // chart colors agree with the rest of the UI — see the comment in
  // chartUtils.js's initChartDefaults() for the same rationale.
  //
  // Dark-mode green/gold/info are intentionally brighter than their CSS
  // variables (which don't currently define dark-mode overrides for those
  // three): a chart line needs more contrast against a near-black canvas
  // than a button or badge does against a translucent dark surface, so
  // dimming these to match CSS would hurt legibility. Dark-mode ink/muted/
  // pos/neg/warn do have CSS overrides (body.dark in _variables.css) and
  // match those exactly.
  state.COLORS.ink = isDark ? "#eaeaea" : "#111814";
  state.COLORS.muted = isDark ? "#8c938f" : "#6a716e";
  state.COLORS.chartBg = isDark ? "#121513" : "#ffffff";

  // Dynamic brand and status colors for charts/sparklines in dark mode
  state.COLORS.green = isDark ? "#2e9e6c" : "#0a5d3a";
  state.COLORS.greenLight = isDark ? "#3de080" : "#2e9e6c";
  state.COLORS.greenSoft = isDark
    ? "rgba(46, 158, 105, 0.2)"
    : "rgba(10,93,58,0.15)";
  state.COLORS.gold = isDark ? "#ffd54f" : "#b08923";
  state.COLORS.goldSoft = isDark
    ? "rgba(255, 213, 79, 0.25)"
    : "rgba(176,137,35,0.4)";
  state.COLORS.pos = isDark ? "#3de080" : "#2e8a55";
  state.COLORS.posSoft = isDark
    ? "rgba(61, 224, 128, 0.35)"
    : "rgba(46, 138, 85, 0.7)";
  state.COLORS.neg = isDark ? "#ff6b6b" : "#b8403a";
  state.COLORS.negSoft = isDark
    ? "rgba(255, 107, 107, 0.35)"
    : "rgba(184, 64, 58, 0.7)";
  state.COLORS.warn = isDark ? "#ffb300" : "#c98c1f";
  state.COLORS.info = isDark ? "#52a3ff" : "#2c5b8a";
  state.COLORS.infoSoft = isDark
    ? "rgba(82, 163, 255, 0.35)"
    : "rgba(44,91,138,0.7)";

  // Dynamic connection line color for health ratios
  state.COLORS.lineBorder = isDark
    ? "rgba(255, 255, 255, 0.3)"
    : "rgba(0, 0, 0, 0.12)";

  // Dynamic zone backgrounds for health ratios
  ZONE_COLORS.red = isDark
    ? "rgba(255, 107, 107, 0.15)"
    : "rgba(184,64,58,0.07)";
  ZONE_COLORS.amber = isDark
    ? "rgba(255, 179, 0, 0.15)"
    : "rgba(201,140,31,0.08)";
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

// Not exported — main.js is the app's entry point and nothing imports from
// it (there's no main.test.js; it's exercised indirectly through the DOM).
function activateTab(tab, pushHash = true) {
  if (!state.VALID_TABS.includes(tab)) tab = "overview";
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
  activePanel.classList.add("active");

  // The global era filter is a single shared control (its selects/pills have
  // unique IDs, so it can't be duplicated per tab) — instead it's moved to
  // sit right after the active tab's chapter intro, and hidden entirely on
  // tabs where a date range doesn't apply or would be misleading (bonds has
  // its own fixed historical breakdown, and compare/events/club/news aren't
  // season-range driven).
  const globalFilters = document.querySelector(".global-filters");
  if (globalFilters) {
    if (state.TABS_WITHOUT_GLOBAL_FILTER.has(tab)) {
      globalFilters.classList.add("hidden");
    } else {
      const chapter = activePanel.querySelector(".chapter");
      if (chapter) chapter.insertAdjacentElement("afterend", globalFilters);
      globalFilters.classList.remove("hidden");
    }
  }

  if (pushHash) {
    history.replaceState(null, "", "#" + tab);
    syncStateToUrl();
  }

  if (state.TAB_CHARTS[tab]) {
    state.TAB_CHARTS[tab].forEach((fn) => {
      // Use the function reference itself as the Set key — stable across
      // minification (unlike fn.name, which esbuild can collapse to "").
      if (!state.renderedCharts.has(fn)) {
        fn();
        state.renderedCharts.add(fn);
      }
    });
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

function setupApp() {
  // Initialise colour palette and chart base options before any chart is built.
  initChartDefaults();
  initGlobalFilters(() => {
    // Clear all charts and force re-render of active tab
    state.renderedCharts.clear();
    const activeTab = document.querySelector(".tabs button.active");
    if (activeTab) {
      activateTab(activeTab.dataset.tab);
    }
  });
  renderKpis();
  initStoryMode();
  initEventFilter();
  initScrollAnimations();
  initDataExport();
  initNewsFeed();

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
      chartSquadBook,
      chartTransfers,
      chartNetTrading,
      renderTransferLedger,
    ],
    cash: [chartCashFlow, chartCash, chartAnnualNet],
    compare: [initComparison],
    events: [],
    data: [renderTable, initTransfersDetailTable],
    club: [],
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
      // Force re-rendering of active tab's charts
      state.renderedCharts.clear();
      const activeTabBtn = document.querySelector("nav.tabs button.active");
      if (activeTabBtn) {
        const tab = activeTabBtn.dataset.tab;
        if (state.TAB_CHARTS[tab]) {
          state.TAB_CHARTS[tab].forEach((fn) => {
            fn();
            state.renderedCharts.add(fn);
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
  const initialTab = applyUrlParams();
  activateTab(initialTab, false);

  if (initialTab === "overview" && state.urlStoryActive) {
    startStory();
  }

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

  initPdfExport();
}

function initPdfExport() {
  const btn = document.getElementById("pdfExportBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    import("./pdfGenerator.js").then((m) => {
      m.generateCuratedPdf();
    });
  });
}

// =============================================================
// APP ENTRY POINT
// =============================================================

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
    initImageLightbox();
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
