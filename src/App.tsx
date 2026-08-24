import React, { useEffect, useState, Suspense } from "react";
import { useAppState } from "./core/state.js";
import { TopNav } from "./components/TopNav.js";
import { Hero } from "./components/Hero.js";
import { TabsNavigation } from "./components/TabsNavigation.js";
import { TabLoader } from "./components/TabLoader.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import { CommandPalette } from "./components/CommandPalette.js";
import { useScrollToTop } from "./hooks/useScrollToTop.js";
import {
  useImageLightbox,
  setupLightboxTriggers,
} from "./hooks/useImageLightbox.js";
import { LightboxProvider } from "./hooks/useLightboxContext.tsx";
import { usePdfExport } from "./hooks/usePdfExport.js";
import { useDataExport } from "./hooks/useDataExport.js";
import { usePWA } from "./hooks/usePWA.js";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts.js";
import { initKitCardFlip } from "./ui/imageLightbox.js";
import { loadTranslations } from "./ui/translations.js";
import { useTranslation } from "./hooks/useTranslation.js";

// Lazy load tabs to keep bundle size small and mimic the old router lazy chunking behavior!
const OverviewTab = React.lazy(() =>
  import("./features/tabs/OverviewTab.js").then((m) => ({
    default: m.OverviewTab,
  })),
);
const RevenueTab = React.lazy(() =>
  import("./features/tabs/RevenueTab.js").then((m) => ({
    default: m.RevenueTab,
  })),
);
const HealthcheckTab = React.lazy(() =>
  import("./features/tabs/HealthcheckTab.js").then((m) => ({
    default: m.HealthcheckTab,
  })),
);
const BalanceSheetTab = React.lazy(() =>
  import("./features/tabs/BalanceSheetTab.js").then((m) => ({
    default: m.BalanceSheetTab,
  })),
);
const BondsTab = React.lazy(() =>
  import("./features/tabs/BondsTab.js").then((m) => ({ default: m.BondsTab })),
);
const SquadTab = React.lazy(() =>
  import("./features/tabs/SquadTab.js").then((m) => ({ default: m.SquadTab })),
);
const CompareTab = React.lazy(() =>
  import("./features/tabs/CompareTab.js").then((m) => ({
    default: m.CompareTab,
  })),
);
const EventsTab = React.lazy(() =>
  import("./features/tabs/EventsTab.js").then((m) => ({
    default: m.EventsTab,
  })),
);
const DataTab = React.lazy(() =>
  import("./features/tabs/DataTab.js").then((m) => ({ default: m.DataTab })),
);
const ClubTab = React.lazy(() =>
  import("./features/tabs/ClubTab.js").then((m) => ({ default: m.ClubTab })),
);
const NewsTab = React.lazy(() =>
  import("./features/tabs/NewsTab.js").then((m) => ({ default: m.NewsTab })),
);
const PlaygroundTab = React.lazy(() =>
  import("./features/tabs/PlaygroundTab.js").then((m) => ({
    default: m.PlaygroundTab,
  })),
);
const CompetitiveTab = React.lazy(() =>
  import("./features/tabs/CompetitiveTab.js").then((m) => ({
    default: m.CompetitiveTab,
  })),
);

function useScrollAnimations(activeTab: string) {
  useEffect(() => {
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

    const observeNodes = (
      nodes: NodeList | Node[] | Element[] | HTMLElement[],
    ) => {
      nodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (
            node.matches(
              ".card, .kpi, .health-bar, .event, .cmp-card, .lf-card, .hb-title, .narrative, .chart-box, .reveal",
            )
          ) {
            node.classList.add("reveal");
            observer.observe(node);
          }
          const targets = node.querySelectorAll(
            ".card, .kpi, .health-bar, .event, .cmp-card, .lf-card, .hb-title, .narrative, .chart-box, .reveal",
          );
          targets.forEach((el) => {
            el.classList.add("reveal");
            observer.observe(el);
          });
        }
      });
    };

    // 1. Observe existing DOM elements
    observeNodes([document.body]);

    // 2. Observe any elements added dynamically by React Suspense / Router
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          observeNodes(Array.from(mutation.addedNodes));
        }
      });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [activeTab]);
}

export function App() {
  const activeTab = useAppState((s) => s.activeTab);
  const isPt = useAppState((s) => s.isPt);
  const { t, T } = useTranslation();
  const {
    btnRef: scrollToTopRef,
    isVisible: scrollToTopVisible,
    scrollToTop,
  } = useScrollToTop();
  const lightbox = useImageLightbox();
  const pdfExport = usePdfExport();
  const dataExport = useDataExport();
  const pwa = usePWA();
  useKeyboardShortcuts();

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Re-run scroll animations when tab changes and new nodes appear
  useScrollAnimations(activeTab);

  useEffect(() => {
    // Load dictionary whenever language toggles
    loadTranslations(isPt ? "pt" : "en");

    // Update document title
    if (isPt) {
      document.title = "Finanças Sporting CP — Um Dossier de 13 Anos";
    } else {
      document.title = "Sporting CP Finances — A 13-Year Dossier";
    }
  }, [isPt]);

  useEffect(() => {
    // Initialize global UI features that were previously in main.ts
    setupLightboxTriggers(lightbox.open);
    initKitCardFlip();
  }, []);

  return (
    <LightboxProvider open={lightbox.open}>
      <T as="a" className="skip-link" href="#main" i18nKey="skip-link" />
      <div
        id="a11yAnnouncer"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      ></div>

      <TopNav
        onPdfExport={pdfExport.open}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />
      <Hero />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenPdfModal={pdfExport.open}
      />

      <main className="container" id="main">
        <TabsNavigation />

        <Suspense fallback={<TabLoader />}>
          {activeTab === "overview" && (
            <ErrorBoundary>
              <OverviewTab />
            </ErrorBoundary>
          )}
          {activeTab === "revenue" && (
            <ErrorBoundary>
              <RevenueTab />
            </ErrorBoundary>
          )}
          {activeTab === "healthcheck" && (
            <ErrorBoundary>
              <HealthcheckTab />
            </ErrorBoundary>
          )}
          {activeTab === "balance-sheet" && (
            <ErrorBoundary>
              <BalanceSheetTab />
            </ErrorBoundary>
          )}
          {activeTab === "bonds" && (
            <ErrorBoundary>
              <BondsTab />
            </ErrorBoundary>
          )}
          {activeTab === "squad" && (
            <ErrorBoundary>
              <SquadTab />
            </ErrorBoundary>
          )}
          {activeTab === "compare" && (
            <ErrorBoundary>
              <CompareTab />
            </ErrorBoundary>
          )}
          {activeTab === "events" && (
            <ErrorBoundary>
              <EventsTab />
            </ErrorBoundary>
          )}
          {activeTab === "data" && (
            <ErrorBoundary>
              <DataTab onExportCsv={dataExport.exportCsv} />
            </ErrorBoundary>
          )}
          {activeTab === "club" && (
            <ErrorBoundary>
              <ClubTab />
            </ErrorBoundary>
          )}
          {activeTab === "news" && (
            <ErrorBoundary>
              <NewsTab />
            </ErrorBoundary>
          )}
          {activeTab === "playground" && (
            <ErrorBoundary>
              <PlaygroundTab />
            </ErrorBoundary>
          )}
          {activeTab === "competitive" && (
            <ErrorBoundary>
              <CompetitiveTab />
            </ErrorBoundary>
          )}
        </Suspense>
      </main>

      <button
        ref={scrollToTopRef}
        className={`scroll-to-top ${scrollToTopVisible ? "visible" : ""}`}
        aria-label="Scroll to top"
        onClick={scrollToTop}
      >
        <svg
          className="icon-inline"
          fill="none"
          height="20"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          width="20"
          aria-hidden="true"
        >
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>

      <footer className="site-footer">
        <div className="wrap">
          <img
            alt="Sporting Clube de Portugal"
            className="footer-logo"
            src="assets/LOGO.png"
            loading="lazy"
          />
          <T as="div" className="footer-credit" i18nKey="footer-credit">
            <strong>Sporting Clube de Portugal — Futebol, SAD.</strong>
            Built from the SAD's official annual and semester reports filed with
            the CMVM. Figures in EUR thousands; some 2023/24 numbers restated
            per the 2024/25 report. Compiled for editorial reference.
          </T>
          <T as="div" className="footer-meta" i18nKey="footer-meta">
            Dossier · 2010/11 → 2024/25 H1
            <br />
            Period ended 31 Dec 2025
            <br />
            Euronext Lisbon · SCP
          </T>
        </div>
      </footer>

      {/* Lightbox Modal */}
      <div
        ref={lightbox.lightboxRef}
        id="imageLightbox"
        className={`lightbox-modal ${lightbox.isOpen ? "active" : ""}`}
        onClick={lightbox.handleBackdropClick}
      >
        <button
          ref={lightbox.closeBtnRef}
          className="lightbox-close"
          aria-label="Close image"
          onClick={lightbox.close}
        >
          &times;
        </button>
        <div className="lightbox-image-wrapper">
          {lightbox.currentSrc && (
            <img
              className="lightbox-content"
              src={lightbox.currentSrc}
              alt={lightbox.currentAlt}
            />
          )}
          {lightbox.isKitFlip && (
            <button
              className="lightbox-toggle-btn"
              onClick={lightbox.toggleKitFlip}
            >
              <span>Flip Kit 🔄</span>
            </button>
          )}
        </div>
        <div className="lightbox-caption">{lightbox.currentAlt}</div>
      </div>

      {/* PDF Customization Modal */}
      <div
        id="pdfModal"
        className={`modal-overlay ${pdfExport.isOpen ? "" : "hidden"}`}
        onClick={pdfExport.handleBackdropClick}
      >
        <div className="modal-container pdf-modal-container">
          <button
            className="modal-close"
            aria-label="Close Customizer"
            onClick={pdfExport.close}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div className="pdf-modal-intro">
            <T
              as="h2"
              className="pdf-modal-title"
              i18nKey="pdf_customizer_title"
            />
            <T
              as="p"
              className="pdf-modal-subtitle"
              i18nKey="pdf_customizer_subtitle"
            />
          </div>
          <form className="pdf-modal-form" onSubmit={pdfExport.handleSubmit}>
            <div className="pdf-field-group">
              <T
                as="label"
                className="pdf-field-label"
                i18nKey="pdf_language"
              />
              <select
                className="pdf-field-input"
                value={pdfExport.language}
                onChange={(e) =>
                  pdfExport.setLanguage(e.target.value as "en" | "pt")
                }
              >
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </div>
            <div className="pdf-field-group">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <T as="label" className="pdf-field-label" i18nKey="pdf_pages" />
                <span
                  style={{
                    fontSize: "var(--fs-xs)",
                    color: "var(--muted)",
                    fontWeight: 600,
                  }}
                >
                  {pdfExport.selectedCount} / 7 {isPt ? "secções" : "sections"}
                </span>
              </div>

              {/* Quick Presets & Bulk Actions */}
              <div className="pdf-presets-row">
                <button
                  type="button"
                  className="btn-pdf-preset"
                  onClick={pdfExport.setFullPreset}
                >
                  <T i18nKey="pdf_preset_full" />
                </button>
                <button
                  type="button"
                  className="btn-pdf-preset"
                  onClick={pdfExport.setExecutivePreset}
                >
                  <T i18nKey="pdf_preset_executive" />
                </button>
                <div className="pdf-action-pills">
                  <button
                    type="button"
                    className="btn-pdf-action"
                    onClick={pdfExport.selectAll}
                  >
                    <T i18nKey="pdf_select_all" />
                  </button>
                  <button
                    type="button"
                    className="btn-pdf-action"
                    onClick={pdfExport.deselectAll}
                  >
                    <T i18nKey="pdf_deselect_all" />
                  </button>
                </div>
              </div>

              <div className="pdf-checkbox-list">
                {pdfExport.pages.map((checked, i) => (
                  <label key={i} className="pdf-checkbox-label">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => pdfExport.togglePage(i)}
                    />
                    <T as="span" i18nKey={`pdf_page_${i + 1}`} />
                  </label>
                ))}
              </div>
            </div>
            <div className="pdf-field-group">
              <T
                as="label"
                className="pdf-field-label"
                i18nKey="pdf_executive_notes"
              />
              <textarea
                rows={3}
                className="pdf-field-input"
                placeholder={
                  isPt
                    ? "Introduza uma nota executiva personalizada..."
                    : "Enter custom notes or disclaimer..."
                }
                value={pdfExport.executiveNote}
                onChange={(e) => pdfExport.setExecutiveNote(e.target.value)}
              ></textarea>
            </div>
            <button
              type="submit"
              className="pdf-modal-submit"
              disabled={pdfExport.isGenerating || pdfExport.selectedCount === 0}
            >
              {pdfExport.isGenerating ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{
                      width: "16px",
                      height: "16px",
                      animation: "spin 1s linear infinite",
                    }}
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      strokeDasharray="32"
                      strokeDashoffset="12"
                    />
                  </svg>
                  <T as="span" i18nKey="pdf_generating" />
                </span>
              ) : (
                <T as="span" i18nKey="pdf_generate_btn" />
              )}
            </button>
          </form>
        </div>
      </div>
      {pdfExport.error && (
        <div className="pwa-toast visible">
          <div className="toast-body">
            <span>{pdfExport.error}</span>
            <button className="toast-btn" onClick={() => pdfExport.close()}>
              {pdfExport.language === "pt" ? "Ok" : "Dismiss"}
            </button>
          </div>
        </div>
      )}
      {/* PWA Update Toast */}
      {pwa.showUpdate && (
        <div className="pwa-toast visible" role="status" aria-live="polite">
          <div className="toast-body">
            <span>{pwa.updateMsg}</span>
            <button className="toast-btn" onClick={pwa.applyUpdate}>
              {pwa.updateBtnTxt}
            </button>
          </div>
        </div>
      )}
      {/* PWA Offline Ready Toast */}
      {pwa.showOfflineReady && (
        <div className="pwa-toast visible" role="status" aria-live="polite">
          <div className="toast-body">
            <span>{pwa.offlineMsg}</span>
            <button className="toast-btn" onClick={pwa.dismissOfflineReady}>
              {pwa.offlineBtnTxt}
            </button>
          </div>
        </div>
      )}
    </LightboxProvider>
  );
}
