import React, { useEffect } from "react";
import { useAppState } from "../core/state.js";
import { loadTranslations } from "../ui/translations.js";
import { syncStateToUrl } from "../utils/urlSync.js";
import { updateThemeUI, updateChartTheme } from "../ui/themeToggle.js";
import { useTranslation } from "../hooks/useTranslation.js";

export function TopNav() {
  const isPt = useAppState((s) => s.isPt);
  const theme = useAppState((s) => s.theme);
  const setIsPt = useAppState((s) => s.setIsPt);
  const setTheme = useAppState((s) => s.setTheme);
  const { t, T } = useTranslation();

  const handleLangToggle = async (lang: "en" | "pt") => {
    if ((lang === "pt") === isPt) return;
    setIsPt(lang === "pt");
    document.documentElement.lang = lang;
    localStorage.setItem("lang", lang);
    await loadTranslations(lang);
    syncStateToUrl();
  };

  const handleThemeToggle = () => {
    const isDark = document.body.classList.toggle("dark");
    const newTheme = isDark ? "dark" : "light";
    localStorage.setItem("theme", newTheme);
    setTheme(newTheme);
    updateThemeUI(isDark);
    updateChartTheme();

    const btn = document.getElementById("themeToggleBtn");
    if (btn) {
      btn.classList.add("animating");
      btn.addEventListener(
        "animationend",
        () => btn.classList.remove("animating"),
        { once: true },
      );
    }
  };

  useEffect(() => {
    document.documentElement.lang = isPt ? "pt" : "en";
    if (theme === "dark") {
      document.body.classList.add("dark");
      updateThemeUI(true);
    } else {
      document.body.classList.remove("dark");
      updateThemeUI(false);
    }
    updateChartTheme();
  }, []);

  return (
    <nav className="topbar">
      <div className="wrap">
        <T as="span" i18nKey="topbar-update" />
        <T as="span" className="topbar-listing" i18nKey="topbar-listing" />
        <div className="lang-switcher">
          <a
            className={`lang-link ${!isPt ? "active" : ""}`}
            data-lang="en"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleLangToggle("en");
            }}
          >
            EN
          </a>
          <span className="lang-sep">|</span>
          <a
            className={`lang-link ${isPt ? "active" : ""}`}
            data-lang="pt"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleLangToggle("pt");
            }}
          >
            PT
          </a>
        </div>
        <button
          aria-label={
            t("topbar-export-pdf-aria") || "Export Financial Dossier as PDF"
          }
          className="pdf-export-btn"
          id="pdfExportBtn"
        >
          <svg
            className="icon-inline"
            fill="none"
            height="12"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
            width="12"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <T as="span" i18nKey="topbar-export-pdf" />
        </button>
        <button
          aria-pressed={theme === "dark"}
          aria-label={t("auto-txt-span-1-aria") || "Toggle dark mode"}
          className="theme-toggle-btn"
          id="themeToggleBtn"
          onClick={handleThemeToggle}
        >
          <svg
            className="icon-inline"
            fill="none"
            height="12"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="12"
            aria-hidden="true"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
          <T as="span" i18nKey="auto-txt-span-1" />
        </button>
      </div>
    </nav>
  );
}
