import React, { useEffect } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { initImageLightbox, initKitCardFlip } from "../../ui/imageLightbox.js";
import { initJornalModal } from "../../ui/jornalModal.js";

export function ClubTab() {
  const { t, T } = useTranslation();

  useEffect(() => {
    initImageLightbox();
    initKitCardFlip();
    initJornalModal();
  }, []);

  return (
    <>
      <div className="chapter">
        <T as="div" className="num" i18nKey="ch11-num" />
        <div>
          <T as="h2" i18nKey="ch11-h2" />
          <T as="p" className="lede" i18nKey="ch11-lede" />
        </div>
      </div>

      <div className="club-grid">
        {/* CARD 1: KITS */}
        <div className="card asset-card">
          <div className="card-head">
            <T as="h3" i18nKey="ch11-card-kits-title" />
            <span className="tag">Nike</span>
          </div>
          <T as="p" className="card-desc" i18nKey="ch11-card-kits-desc" />
          <div className="kit-showcase">
            {/* Home Flip Card */}
            <div className="kit-card-container">
              <div className="kit-card-inner">
                <div className="kit-card-front">
                  <img
                    src="https://lojaverde.sporting.pt/cdn/shop/files/IMG_06F_9_b2e1c87c-29d3-4088-acb2-0ca59d3a5a08.jpg?v=1783926957&width=1620"
                    alt="Home Front"
                    className="kit-img"
                    loading="lazy"
                  />
                  <span className="kit-label">Home Front</span>
                </div>
                <div className="kit-card-back">
                  <img
                    src="https://lojaverde.sporting.pt/cdn/shop/files/IMG_03F_8_dd697b98-f3b3-48f1-b5c4-c4c22ae8172a.jpg?v=1783926957&width=1946"
                    alt="Home Back"
                    className="kit-img"
                    loading="lazy"
                  />
                  <span className="kit-label">Home Back</span>
                </div>
              </div>
            </div>

            {/* Away Flip Card */}
            <div className="kit-card-container">
              <div className="kit-card-inner">
                <div className="kit-card-front">
                  <img
                    src="https://lojaverde.sporting.pt/cdn/shop/files/StrikeFrente.jpg?v=1782742123&width=1946"
                    alt="Away Front"
                    className="kit-img"
                    loading="lazy"
                  />
                  <span className="kit-label">Away Front</span>
                </div>
                <div className="kit-card-back">
                  <img
                    src="https://lojaverde.sporting.pt/cdn/shop/files/StrikeCostas.jpg?v=1782742123&width=1946"
                    alt="Away Back"
                    className="kit-img"
                    loading="lazy"
                  />
                  <span className="kit-label">Away Back</span>
                </div>
              </div>
            </div>

            {/* Stromp (Unrevealed) */}
            <div className="kit-card-container no-flip">
              <div className="kit-item stromp">
                <div className="stromp-unrevealed-overlay">
                  <span className="lock-icon">🔒</span>
                  <T
                    as="span"
                    className="unrevealed-label"
                    i18nKey="ch11-stromp-unrevealed"
                  />
                </div>
                <span className="kit-label">Stromp</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: STADIUM */}
        <div className="card asset-card">
          <div className="card-head">
            <T as="h3" i18nKey="ch11-card-stadium-title" />
            <span className="tag">52,095 Seats</span>
          </div>
          <T as="p" className="card-desc" i18nKey="ch11-card-stadium-desc" />
          <div className="stadium-seating-links">
            <a
              href="https://gamebox.sporting.pt/estadio"
              target="_blank"
              rel="noopener noreferrer"
              className="seating-link-btn"
            >
              <T as="span" i18nKey="ch11-stadium-gamebox" />
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="arrow-icon"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
            <a
              href="https://seating.sporting.pt/lionseats"
              target="_blank"
              rel="noopener noreferrer"
              className="seating-link-btn"
            >
              <T as="span" i18nKey="ch11-stadium-lionseats" />
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="arrow-icon"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
          <div className="stadium-image-box">
            <img
              src="assets/alvalade_stadium_panorama.webp"
              alt="Estádio José Alvalade"
              className="stadium-panorama-img"
              loading="lazy"
            />
          </div>
        </div>

        {/* CARD 3: SPORTS HALL */}
        <div className="card asset-card">
          <div className="card-head">
            <T as="h3" i18nKey="ch11-card-hall-title" />
            <span className="tag">3,000 Capacity</span>
          </div>
          <T as="p" className="card-desc" i18nKey="ch11-card-hall-desc" />
          <div className="court-image-box">
            <img
              src="assets/pavilhao_joao_rocha.webp"
              alt="Pavilhão João Rocha"
              className="court-panorama-img"
              loading="lazy"
            />
          </div>
        </div>

        {/* CARD 4: MUSEUM */}
        <div className="card asset-card">
          <div className="card-head">
            <T as="h3" i18nKey="ch11-card-museum-title" />
            <span className="tag">16,000+ Trophies</span>
          </div>
          <T as="p" className="card-desc" i18nKey="ch11-card-museum-desc" />
          <div className="museum-image-box">
            <img
              src="assets/museu_sporting.webp"
              alt="Museu Sporting"
              className="museum-panorama-img"
              loading="lazy"
            />
          </div>
        </div>

        {/* CARD 5: ACADEMY */}
        <div className="card asset-card">
          <div className="card-head">
            <T as="h3" i18nKey="ch11-card-academy-title" />
            <span className="tag">250,000 m²</span>
          </div>
          <T as="p" className="card-desc" i18nKey="ch11-card-academy-desc" />
          <div className="academy-image-box">
            <img
              src="assets/academia_cristiano_ronaldo.webp"
              alt="Academia Cristiano Ronaldo"
              className="academy-panorama-img"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* ============== SPORTING EXPERIENCE ============== */}
      <div className="card experience-card reveal">
        <div className="experience-content">
          <div className="experience-text">
            <T as="h3" i18nKey="ch11-exp-title" />
            <T as="p" className="card-desc" i18nKey="ch11-exp-desc" />
            <a
              href="https://sportingexperience.pt/pt"
              target="_blank"
              rel="noopener noreferrer"
              className="experience-btn"
            >
              <T as="span" i18nKey="ch11-exp-btn" />
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="arrow-icon"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="social-hub reveal">
        <T as="h3" i18nKey="ch11-social-h3" />
        <div className="social-grid">
          <button id="btnJornalModal" className="social-btn jornal">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            <T as="span" i18nKey="ch11-jornal-btn" />
          </button>
          <a
            href="https://www.linkedin.com/company/sporting-clube-de-portugal/"
            target="_blank"
            rel="noopener noreferrer"
            className="social-btn linkedin"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
              <rect x="2" y="9" width="4" height="12"></rect>
              <circle cx="4" cy="4" r="2"></circle>
            </svg>
            <T as="span" i18nKey="ch11-linkedin-btn" />
          </a>
          <a
            href="https://twitter.com/SportingCP"
            target="_blank"
            rel="noopener noreferrer"
            className="social-btn twitter"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
            </svg>
            <T as="span" i18nKey="ch11-twitter-btn" />
          </a>
          <a
            href="https://www.instagram.com/sportingcp/"
            target="_blank"
            rel="noopener noreferrer"
            className="social-btn instagram"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
            <T as="span" i18nKey="ch11-instagram-btn" />
          </a>
          <a
            href="https://www.youtube.com/user/SportingCP"
            target="_blank"
            rel="noopener noreferrer"
            className="social-btn youtube"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
            </svg>
            <T as="span" i18nKey="ch11-youtube-btn" />
          </a>
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
          <T as="p" i18nKey="ch11-disclaimer-p" />
        </div>
      </div>
    </>
  );
}
