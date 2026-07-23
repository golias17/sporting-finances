import React from "react";
import { News } from "../News";
import { useTranslation } from "../../hooks/useTranslation";

export function NewsTab() {
  const { t, T } = useTranslation();
  return (
    <>
      <div className="chapter">
        <T as="div" className="num" i18nKey="ch13-num" />
        <div>
          <T as="h2" i18nKey="ch13-h2" />
          <T as="p" className="lede" i18nKey="ch13-lede" />
        </div>
      </div>

      <div className="disclaimer-banner reveal">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="disclaimer-icon"
          aria-hidden="true"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <div className="disclaimer-text">
          <T as="p" i18nKey="ch13-disclaimer-p" />
        </div>
      </div>

      <div className="news-grid reveal">
        <News />
      </div>
    </>
  );
}
