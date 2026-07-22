import React, { useEffect, Suspense } from "react";
import { useAppState } from "./core/state.js";
import { TopNav } from "./components/TopNav.js";
import { Hero } from "./components/Hero.js";
import { TabsNavigation } from "./components/TabsNavigation.js";
import { TabLoader } from "./components/TabLoader.js";
import { initJornalModal } from "./ui/jornalModal.js";
import { initImageLightbox, initKitCardFlip } from "./ui/imageLightbox.js";
import { initPdfExport } from "./ui/pdfExportModal.js";
import { initDataExport } from "./features/data-table.js";
import { initNewsFeed } from "./features/News.js";
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
const DebtTab = React.lazy(() =>
  import("./features/tabs/DebtTab.js").then((m) => ({ default: m.DebtTab })),
);
const BondsTab = React.lazy(() =>
  import("./features/tabs/BondsTab.js").then((m) => ({ default: m.BondsTab })),
);
const SquadTab = React.lazy(() =>
  import("./features/tabs/SquadTab.js").then((m) => ({ default: m.SquadTab })),
);
const CashTab = React.lazy(() =>
  import("./features/tabs/CashTab.js").then((m) => ({ default: m.CashTab })),
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
    initJornalModal();
    initImageLightbox();
    initKitCardFlip();
    initPdfExport();
    initDataExport();
    initNewsFeed();

    // Scroll to Top Button listener
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
    if (scrollToTopBtn) {
      const onScroll = () => {
        if (window.scrollY > 300) {
          scrollToTopBtn.classList.add("visible");
        } else {
          scrollToTopBtn.classList.remove("visible");
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });

      scrollToTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      return () => {
        window.removeEventListener("scroll", onScroll);
      };
    }
  }, []);

  return (
    <>
      <T as="a" className="skip-link" href="#main" i18nKey="skip-link" />
      <div
        id="a11yAnnouncer"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      ></div>

      <TopNav />
      <Hero />

      <main className="container" id="main">
        <TabsNavigation />

        <Suspense
          fallback={<TabLoader />}
        >
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "revenue" && <RevenueTab />}
          {activeTab === "healthcheck" && <HealthcheckTab />}
          {activeTab === "debt" && <DebtTab />}
          {activeTab === "bonds" && <BondsTab />}
          {activeTab === "squad" && <SquadTab />}
          {activeTab === "cash" && <CashTab />}
          {activeTab === "compare" && <CompareTab />}
          {activeTab === "events" && <EventsTab />}
          {activeTab === "data" && <DataTab />}
          {activeTab === "club" && <ClubTab />}
          {activeTab === "news" && <NewsTab />}
          {activeTab === "playground" && <PlaygroundTab />}
        </Suspense>
      </main>

      <button
        id="scrollToTopBtn"
        className="scroll-to-top"
        aria-label="Scroll to top"
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
          <T as="div" className="footer-credit" i18nKey="auto-txt-div-80">
            <strong>Sporting Clube de Portugal — Futebol, SAD.</strong>
            Built from the SAD's official annual and semester reports filed with
            the CMVM. Figures in EUR thousands; some 2023/24 numbers restated
            per the 2024/25 report. Compiled for editorial reference.
          </T>
          <T as="div" className="footer-meta" i18nKey="auto-txt-div-81">
            Dossier · 2012/13 → 2025/26 H1
            <br />
            Period ended 31 Dec 2025
            <br />
            Euronext Lisbon · SCP
          </T>
        </div>
      </footer>

      {/* Lightbox Modal */}
      <div id="imageLightbox" className="lightbox-modal">
        <button
          className="lightbox-close"
          id="closeLightboxBtn"
          aria-label="Close image"
        >
          &times;
        </button>
        <div className="lightbox-image-wrapper">
          <img
            className="lightbox-content"
            id="lightboxImg"
            alt="Enlarged view"
          />
          <button
            id="lightboxToggleKitBtn"
            className="lightbox-toggle-btn hidden"
          >
            <span>Flip Kit 🔄</span>
          </button>
        </div>
        <div id="lightboxCaption" className="lightbox-caption"></div>
      </div>

      {/* Jornal Reader Modal */}
      <div id="jornalModal" className="modal-overlay hidden">
        <div className="modal-container">
          <button
            id="btnCloseJornal"
            className="modal-close"
            aria-label="Close Reader"
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
          <div className="modal-content-wrapper">
            <div
              id="jornalIframeContainer"
              className="jornal-iframe-container"
            ></div>
          </div>
        </div>
      </div>

      {/* PDF Customization Modal */}
      <div id="pdfModal" className="modal-overlay hidden">
        <div className="modal-container pdf-modal-container">
          <button
            id="btnClosePdf"
            className="modal-close"
            aria-label="Close Customizer"
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
              id="pdfModalTitle"
              className="pdf-modal-title"
              i18nKey="pdf_customizer_title"
            />
            <T
              as="p"
              id="pdfModalSubtitle"
              className="pdf-modal-subtitle"
              i18nKey="pdf_customizer_subtitle"
            />
          </div>
          <form
            id="pdfCustomizerForm"
            className="pdf-modal-form"
          >
            <div className="pdf-field-group">
              <T
                as="label"
                id="lblPdfLanguage"
                className="pdf-field-label"
                i18nKey="pdf_language"
              />
              <select
                id="pdfLanguageSelect"
                className="pdf-field-input"
              >
                <option value="en">English</option>
                <option value="pt">Português</option>
              </select>
            </div>
            <div className="pdf-field-group">
              <T
                as="label"
                id="lblPdfPages"
                className="pdf-field-label"
                i18nKey="pdf_pages"
              />
              <div className="pdf-checkbox-list">
                <label className="pdf-checkbox-label">
                  <input
                    type="checkbox"
                    id="chkPage1"
                    defaultChecked
                  />
                  <T as="span" i18nKey="pdf_page_1" />
                </label>
                <label className="pdf-checkbox-label">
                  <input
                    type="checkbox"
                    id="chkPage2"
                    defaultChecked
                  />
                  <T as="span" i18nKey="pdf_page_2" />
                </label>
                <label className="pdf-checkbox-label">
                  <input
                    type="checkbox"
                    id="chkPage3"
                    defaultChecked
                  />
                  <T as="span" i18nKey="pdf_page_3" />
                </label>
                <label className="pdf-checkbox-label">
                  <input
                    type="checkbox"
                    id="chkPage4"
                    defaultChecked
                  />
                  <T as="span" i18nKey="pdf_page_4" />
                </label>
                <label className="pdf-checkbox-label">
                  <input
                    type="checkbox"
                    id="chkPage5"
                    defaultChecked
                  />
                  <T as="span" i18nKey="pdf_page_5" />
                </label>
              </div>
            </div>
            <div className="pdf-field-group">
              <T
                as="label"
                id="lblPdfNotes"
                className="pdf-field-label"
                i18nKey="pdf_executive_notes"
              />
              <textarea
                id="pdfNotesText"
                rows={3}
                className="pdf-field-input"
                placeholder="Enter custom notes or disclaimer..."
              ></textarea>
            </div>
            <button
              type="submit"
              id="btnPdfModalSubmit"
              className="pdf-modal-submit"
            >
              <T as="span" i18nKey="pdf_generate_btn" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
