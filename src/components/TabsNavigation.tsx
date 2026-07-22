import React, { useEffect, useRef } from "react";
import { useAppState } from "../core/state.js";
import { syncStateToUrl } from "../utils/urlSync.js";
import { debounce } from "../utils/utils.js";
import { syncEventsFilter } from "../features/events.js";
import { useTranslation } from "../hooks/useTranslation.js";

const TABS = [
  { id: "overview", num: "01", label: "Overview", i18n: "tab-btn-overview" },
  { id: "revenue", num: "02", label: "Revenue", i18n: "tab-btn-revenue" },
  {
    id: "healthcheck",
    num: "03",
    label: "Health",
    i18n: "tab-btn-healthcheck",
  },
  { id: "debt", num: "04", label: "Debt", i18n: "tab-btn-debt" },
  { id: "bonds", num: "05", label: "Instruments", i18n: "tab-btn-bonds" },
  { id: "squad", num: "06", label: "Squad", i18n: "tab-btn-squad" },
  { id: "cash", num: "07", label: "Cash", i18n: "tab-btn-cash" },
  { id: "compare", num: "08", label: "Compare", i18n: "tab-btn-compare" },
  { id: "events", num: "09", label: "Events", i18n: "tab-btn-events" },
  { id: "data", num: "10", label: "Data", i18n: "tab-btn-data" },
  { id: "club", num: "11", label: "Club SAD", i18n: "tab-btn-club" },
  { id: "news", num: "12", label: "News", i18n: "tab-btn-news" },
  {
    id: "playground",
    num: "13",
    label: "Playground",
    i18n: "tab-btn-playground",
  },
];

export function TabsNavigation() {
  const activeTab = useAppState((s) => s.activeTab);
  const setActiveTab = useAppState((s) => s.setActiveTab);
  const setIsStoryVisible = useAppState((s) => s.setIsStoryVisible);
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const { T } = useTranslation();

  const updateIndicator = () => {
    if (!navRef.current || !indicatorRef.current) return;
    const activeBtn = navRef.current.querySelector(
      "button.active",
    ) as HTMLElement;
    if (!activeBtn) {
      indicatorRef.current.style.width = "0px";
      return;
    }

    indicatorRef.current.style.left = `${activeBtn.offsetLeft}px`;
    indicatorRef.current.style.width = `${activeBtn.offsetWidth}px`;

    const containerWidth = navRef.current.offsetWidth;
    if (typeof navRef.current.scrollTo === "function") {
      navRef.current.scrollTo({
        left:
          activeBtn.offsetLeft - containerWidth / 2 + activeBtn.offsetWidth / 2,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    updateIndicator();
  }, [activeTab]);

  useEffect(() => {
    const handleResize = debounce(updateIndicator, 120);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);

    // Give React and Suspense a moment to mount the new tab component
    // before we sync the DOM state back to the URL query params
    setTimeout(syncStateToUrl, 100);

    if (tabId !== "overview") {
      setIsStoryVisible(false);
    }
    if (tabId === "events") {
      // Need a slight delay to let the DOM render before syncing events scroll
      setTimeout(syncEventsFilter, 50);
    }

    if (window.innerWidth <= 768) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();

    const currentIndex = TABS.findIndex((t) => t.id === activeTab);
    if (currentIndex === -1) return;

    let nextIndex;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % TABS.length;
    } else {
      nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    }

    handleTabClick(TABS[nextIndex].id);

    // Focus the new button
    setTimeout(() => {
      if (navRef.current) {
        const btns = navRef.current.querySelectorAll("button");
        if (btns[nextIndex]) btns[nextIndex].focus();
      }
    }, 10);
  };

  return (
    <nav
      aria-label="Dashboard sections"
      className="tabs"
      role="tablist"
      ref={navRef}
      onKeyDown={handleKeyDown}
    >
      {TABS.map((tab) => (
        <T
          as="button"
          key={tab.id}
          i18nKey={tab.i18n}
          aria-selected={activeTab === tab.id}
          className={activeTab === tab.id ? "active" : ""}
          data-tab={tab.id}
          id={`btn-tab-${tab.id}`}
          role="tab"
          tabIndex={activeTab === tab.id ? 0 : -1}
          onClick={() => handleTabClick(tab.id)}
        >
          <span className="tab-num">{tab.num}</span>
          {tab.label}
        </T>
      ))}
      <div className="tab-indicator" ref={indicatorRef}></div>
    </nav>
  );
}
