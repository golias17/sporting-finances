import React from "react";
import { useTranslation } from "../hooks/useTranslation.js";

export function Hero() {
  const { T } = useTranslation();
  return (
    <header className="hero">
      <div className="wrap">
        <div className="lead">
          <div className="badge-row">
            <img
              alt="Sporting Clube de Portugal crest"
              className="club-badge"
              src="assets/LOGO.png"
            />
          </div>
          <T as="p" className="eyebrow" i18nKey="hero-eyebrow" />
          <T as="h1" i18nKey="ch01-hero-h1" />
          <T as="p" className="sub" i18nKey="ch01-hero-sub" />
        </div>
      </div>
    </header>
  );
}
