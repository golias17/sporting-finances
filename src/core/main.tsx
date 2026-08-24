import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "../App.js";
import { config } from "./config.js";
import { state } from "./state.js";
import { loadTranslations } from "../ui/translations.js";
import { applyUrlParams } from "../utils/urlSync.js";
import { initChartDefaults } from "../charts/chartUtils.js";

// =============================================================
// LANGUAGE DETECTION
// =============================================================

function detectActiveLang() {
  let lang =
    typeof localStorage !== "undefined" ? localStorage.getItem("lang") : null;
  if (!lang && typeof navigator !== "undefined") {
    const browserLang =
      navigator.language || (navigator as any).userLanguage || "en";
    lang = browserLang.startsWith("pt") ? "pt" : "en";
  }
  return (lang || "en") as "en" | "pt";
}

// =============================================================
// THEME RESTORATION
// =============================================================

function applyStoredTheme() {
  if (typeof localStorage !== "undefined") {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.body.classList.add("dark");
      state.setTheme("dark");
    }
  }
}

applyStoredTheme();

// =============================================================
// APP ENTRY POINT
// =============================================================

// Retry helper for fetch operations
async function fetchWithRetry(
  url: string,
  maxRetries = 3,
  delay = 1000,
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, delay * Math.pow(2, attempt)),
        );
      }
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, attempt)),
      );
    }
  }
  throw new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}

async function initApp() {
  try {
    const initialTab = applyUrlParams();
    state.setActiveTab(initialTab || "overview");

    const [finRes, trRes] = await Promise.all([
      fetchWithRetry(config.financialsPath),
      fetchWithRetry(config.transfersPath),
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

    // Initialise chart options and palette before charts mount
    initChartDefaults();

    // Mount the React Application immediately
    const rootEl = document.getElementById("root");
    if (!rootEl) throw new Error("No #root element found in index.html");

    const root = createRoot(rootEl);
    root.render(<App />);

    // Load rival datasets in parallel in background without blocking initial paint
    Promise.all([
      fetchWithRetry(config.benficaPath)
        .then((r) => r.json())
        .then((data) => state.setBenficaDataset(data)),
      fetchWithRetry(config.portoPath)
        .then((r) => r.json())
        .then((data) => state.setPortoDataset(data)),
    ]).catch((err) => {
      console.warn("Non-critical background rival data load failed:", err);
    });
  } catch (e: unknown) {
    console.error("Failed to load application data", e);
    const wrap = document.createElement("div");
    wrap.style.cssText =
      "padding: 2rem; color: #ff4444; font-family: sans-serif; text-align: center; max-width: 800px; margin: 0 auto;";
    wrap.innerHTML =
      "<h2>Failed to load application data.</h2><p>Please ensure you are running the application through a local web server, not opening the HTML file directly.</p>";
    const pre = document.createElement("pre");
    pre.style.cssText =
      "margin-top: 2rem; padding: 1rem; background: rgba(255,0,0,0.05); border: 1px dashed #ff4444; border-radius: 4px; text-align: left; font-family: monospace; overflow-x: auto; white-space: pre-wrap;";
    const errMsg = e instanceof Error ? e.stack || e.message : String(e);
    pre.textContent = `Error Details:\n${errMsg}`;
    wrap.appendChild(pre);
    document.body.innerHTML = "";
    document.body.appendChild(wrap);
  } finally {
    document.body.classList.remove("app-loading");
  }
}

// Start application
initApp();
