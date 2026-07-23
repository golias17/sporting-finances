import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "../App.js";
import { config } from "./config.js";
import { state } from "./state.js";
import { loadTranslations } from "../ui/translations.js";
import { applyUrlParams } from "../utils/urlSync.js";

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

async function initApp() {
  try {
    const initialTab = applyUrlParams();
    state.setActiveTab(initialTab || "overview");

    const [finRes, trRes, benRes, porRes] = await Promise.all([
      fetch(config.financialsPath),
      fetch(config.transfersPath),
      fetch(config.benficaPath),
      fetch(config.portoPath),
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

    const [dataset, transferLedger, benficaData, portoData] = await Promise.all([
      finRes.json(),
      trRes.json(),
      benRes.json(),
      porRes.json(),
    ]);

    state.setDataset(dataset);
    state.setTransferLedger(transferLedger);
    state.setBenficaDataset(benficaData);
    state.setPortoDataset(portoData);

    // Initialise chart options and palette before charts mount
    const { initChartDefaults } = await import("../charts/chartUtils.js");
    initChartDefaults();

    // Unmount any pre-existing loading DOM from index.html if we want to rely on React.
    // In our case, React will just overwrite <div id="root"></div>.
    const rootEl = document.getElementById("root");
    if (!rootEl) throw new Error("No #root element found in index.html");

    // Mount the React Application
    const root = createRoot(rootEl);
    root.render(<App />);
  } catch (e: any) {
    console.error("Failed to load application data", e);
    const wrap = document.createElement("div");
    wrap.style.cssText =
      "padding: 2rem; color: #ff4444; font-family: sans-serif; text-align: center; max-width: 800px; margin: 0 auto;";
    wrap.innerHTML =
      "<h2>Failed to load application data.</h2><p>Please ensure you are running the application through a local web server, not opening the HTML file directly.</p>";
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
