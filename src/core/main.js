import { config } from "./config.js";
import { state } from "./state.js";
import { applyTranslations, loadTranslations } from "../ui/translations.js";
import { initDataExport } from "../features/data-table.js";
import { initNewsFeed } from "../features/news.js";
import {
  startStory,
  updateStoryStep,
  initStoryMode,
} from "../features/story.js";
import { initEventFilter } from "../features/events.js";
import { applyUrlParams, syncStateToUrl } from "../utils/urlSync.js";
import { initChartDefaults } from "../charts/chartUtils.js";
import { renderKpis } from "../features/kpi.js";
import { initPWA } from "../utils/pwa.js";
import { debounce } from "../utils/utils.js";
import { initJornalModal } from "../ui/jornalModal.js";
import { initImageLightbox, initKitCardFlip } from "../ui/imageLightbox.js";
import { initPdfExport } from "../ui/pdfExportModal.js";
import { updateThemeUI, updateChartTheme } from "../ui/themeToggle.js";
import { initRouter, updateTabIndicator, activateTab } from "./router.js";

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
  initRouter(initialTab);

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
