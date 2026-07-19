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
import {
  initChartDefaults,
  ZONE_COLORS,
  chartRegistry,
  getBrandColors,
  getZoneColors,
} from "./chartUtils.js";
import { renderKpis } from "./kpi.js";
import { drawManagerEras, drawCommissions } from "./squadAnalytics.js";
import { initPlayground, drawPlaygroundCharts } from "./playground.js";
import { initPWA } from "./pwa.js";
import { debounce } from "./utils.js";

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
// MODAL ACCESSIBILITY HELPER
// =============================================================

// Both modals below (the Jornal reader and the image lightbox) are
// hand-rolled overlay <div>s, not the native <dialog> element, so neither
// gets keyboard focus management for free from the browser: trapping
// Tab/Shift+Tab within the modal's own focusable elements while it's open,
// so a keyboard user can't tab out into the page hidden behind it. Shared
// here so both implement it identically instead of drifting. Each modal's
// own open/close functions are still responsible for moving focus in on
// open and restoring it to whatever triggered the modal on close — that
// part depends on which element they call .focus() on, which differs
// between the two.
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, iframe, [tabindex]:not([tabindex="-1"])';

function trapFocusWithin(container) {
  const handler = (e) => {
    if (e.key !== "Tab") return;
    const focusable = Array.from(
      container.querySelectorAll(FOCUSABLE_SELECTOR),
    ).filter((el) => el.offsetParent !== null); // visible only
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  container.addEventListener("keydown", handler);
  return () => container.removeEventListener("keydown", handler);
}

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

  // Restores focus to whatever triggered the modal once it closes, and
  // releases the Tab focus trap — see trapFocusWithin() above.
  let previouslyFocused = null;
  let releaseFocusTrap = null;

  function openModal() {
    // Inject iframe only on first open
    if (container.innerHTML === "") {
      container.innerHTML = `<iframe src="${iframeSrc}" allow="clipboard-write; autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen="true"></iframe>`;
    }
    previouslyFocused = document.activeElement;
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden"; // Prevent background scrolling
    releaseFocusTrap = trapFocusWithin(modal);
    btnClose.focus();
  }

  function closeModal() {
    modal.classList.add("hidden");
    document.body.style.overflow = ""; // Restore background scrolling
    if (releaseFocusTrap) {
      releaseFocusTrap();
      releaseFocusTrap = null;
    }
    if (previouslyFocused instanceof HTMLElement) {
      previouslyFocused.focus();
    }
    previouslyFocused = null;
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

  // Restores focus to whatever triggered the lightbox once it closes, and
  // releases the Tab focus trap — see trapFocusWithin() above.
  let previouslyFocused = null;
  let releaseFocusTrap = null;

  targets.forEach((img) => {
    // Plain <img> elements aren't keyboard-focusable or operable by
    // default — without this, there was no way to reach or open the
    // lightbox except by mouse/touch. tabindex makes it Tab-reachable;
    // role="button" + the keydown handler below make Enter/Space behave
    // like a click, matching native <button> semantics.
    img.setAttribute("tabindex", "0");
    img.setAttribute("role", "button");
    if (!img.hasAttribute("aria-label")) {
      img.setAttribute(
        "aria-label",
        `${img.alt || "Sporting CP asset"} — view enlarged`,
      );
    }

    const openLightboxFor = () => {
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
      previouslyFocused = document.activeElement;
      lightbox.classList.add("active");
      document.body.style.overflow = "hidden";
      releaseFocusTrap = trapFocusWithin(lightbox);
      btnClose.focus();
    };

    img.addEventListener("click", openLightboxFor);
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightboxFor();
      }
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
    if (releaseFocusTrap) {
      releaseFocusTrap();
      releaseFocusTrap = null;
    }
    if (previouslyFocused instanceof HTMLElement) {
      previouslyFocused.focus();
    }
    previouslyFocused = null;
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
  // Palette + zone colors come from chartUtils.js's canonical getBrandColors()/
  // getZoneColors() — see the PALETTE comment there for why this must stay
  // the single source of truth (both light and dark mode) rather than a
  // second hand-copied set of values here.
  Object.assign(state.COLORS, getBrandColors(isDark));
  Object.assign(ZONE_COLORS, getZoneColors(isDark));

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

const TAB_CHART_IDS = {
  overview: ["chartHero", "chartNetResult", "chartEquity"],
  revenue: ["chartRevenue", "chartRevStreams", "chartRevVsPayroll", "chartOpResult"],
  healthcheck: ["chartPayrollBurden", "chartTransferReliance", "chartDebtLoad", "chartCurrentRatio"],
  debt: ["chartDebt", "chartAssetsLiab", "chartDebtMaturity"],
  squad: ["chartSquadBook", "chartTransfers", "chartNetTrading", "chartManagerEras", "chartCommissions"],
  cash: ["chartCashFlow", "chartCash", "chartAnnualNet"],
  compare: ["chartCompare"],
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
  activePanel.classList.add("active");

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
  initPlayground();

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
        const activeSubBtn = document.querySelector(".sub-tabs-container .sub-tab-btn.active");
        if (activeSubBtn) {
          activeSubBtn.click();
        }
      }
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

let pdfAbortController = null;

function initPdfExport() {
  const btn = document.getElementById("pdfExportBtn");
  const modal = document.getElementById("pdfModal");
  const btnClose = document.getElementById("btnClosePdf");
  const form = document.getElementById("pdfCustomizerForm");

  if (!btn || !modal || !btnClose || !form) return;

  if (pdfAbortController) {
    pdfAbortController.abort();
  }
  pdfAbortController = new AbortController();
  const { signal } = pdfAbortController;

  function openModal() {
    // Sync active UI language to modal language selector
    const langSelect = document.getElementById("pdfLanguageSelect");
    if (langSelect) {
      langSelect.value = state.isPt ? "pt" : "en";
    }
    // Check all pages by default
    for (let i = 1; i <= 5; i++) {
      const chk = document.getElementById(`chkPage${i}`);
      if (chk) chk.checked = true;
    }
    // Clear custom note
    const notesText = document.getElementById("pdfNotesText");
    if (notesText) notesText.value = "";

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  btn.addEventListener("click", openModal, { signal });
  btnClose.addEventListener("click", closeModal, { signal });

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  }, { signal });

  // Close on ESC key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  }, { signal });

  // Handle form submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const lang = document.getElementById("pdfLanguageSelect").value;
    const pages = [
      document.getElementById("chkPage1").checked,
      document.getElementById("chkPage2").checked,
      document.getElementById("chkPage3").checked,
      document.getElementById("chkPage4").checked,
      document.getElementById("chkPage5").checked,
    ];
    const executiveNote = document.getElementById("pdfNotesText").value;

    closeModal();
    import("./pdfGenerator.js")
      .then((m) => m.generateCuratedPdf({ lang, pages, executiveNote }))
      .catch((err) => {
        // generateCuratedPdf() is async and was previously fired-and-forgotten
        // here — a failure inside it (or in the dynamic import itself) became
        // a silent unhandled rejection with no user-facing signal at all.
        console.error("Failed to generate PDF export", err);
        showPdfExportErrorToast();
      });
  }, { signal });
}

// Minimal reuse of the .pwa-toast/.toast-body/.toast-btn styling already
// used by pwa.js's update/offline toasts — this is the only other failure
// in the app (besides the initial data-load error screen) that previously
// had no user-facing indicator at all beyond a console.error.
function showPdfExportErrorToast() {
  let toast = document.getElementById("pdf-export-error-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "pdf-export-error-toast";
    toast.className = "pwa-toast";
    document.body.appendChild(toast);
  }
  const msg = state.isPt
    ? "Não foi possível gerar o PDF. Tente novamente."
    : "Couldn't generate the PDF. Please try again.";
  const btnTxt = state.isPt ? "Ok" : "Dismiss";
  toast.innerHTML = `
    <div class="toast-body">
      <span>${msg}</span>
      <button id="pdf-export-error-btn" class="toast-btn">${btnTxt}</button>
    </div>
  `;
  setTimeout(() => toast.classList.add("visible"), 10);
  document.getElementById("pdf-export-error-btn").addEventListener(
    "click",
    () => toast.classList.remove("visible"),
    { once: true },
  );
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
      throw new Error(`Failed to load ${config.financialsPath}: HTTP ${finRes.status} ${finRes.statusText}`);
    }
    if (!trRes.ok) {
      throw new Error(`Failed to load ${config.transfersPath}: HTTP ${trRes.status} ${trRes.statusText}`);
    }
    const [dataset, transferLedger] = await Promise.all([
      finRes.json(),
      trRes.json(),
    ]);
    state.setDataset(dataset);
    state.setTransferLedger(transferLedger);

    // Pin endSeasonIndex to the real last index so the filter UI is correct.
    state.setEndSeasonIndex(state.DATASET.annual_data.length - 1);

    // Once data is loaded, populate KPIs and setup UI
    setupApp(initialTab);
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
