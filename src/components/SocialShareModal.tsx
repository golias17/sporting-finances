import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "../hooks/useTranslation.js";
import { useAppState } from "../core/state.js";
import {
  generateSocialCardCanvas,
  downloadSocialCard,
  copySocialCardToClipboard,
  shareSocialCardNative,
  type SocialCardFormat,
  type SocialCardTheme,
} from "../utils/socialCardGenerator.js";

export interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  chartRef: React.RefObject<any> | { current: any };
  title: string;
  subtitle?: string;
  fileName: string;
}

export function SocialShareModal({
  isOpen,
  onClose,
  chartRef,
  title,
  subtitle,
  fileName,
}: SocialShareModalProps) {
  const { t, T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);

  const [format, setFormat] = useState<SocialCardFormat>("1:1");
  const [theme, setTheme] = useState<SocialCardTheme>("emerald");
  const [customNote, setCustomNote] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [hasNativeShare, setHasNativeShare] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function"
    ) {
      setHasNativeShare(true);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl("");
      setIsCopied(false);
      return;
    }

    let isMounted = true;
    setIsGenerating(true);

    const timer = setTimeout(() => {
      generateSocialCardCanvas(chartRef, {
        title,
        subtitle,
        format,
        theme,
        customNote,
        isPt,
      }).then((canvas) => {
        if (!isMounted || !canvas) {
          setIsGenerating(false);
          return;
        }
        canvasRef.current = canvas;
        setPreviewUrl(canvas.toDataURL("image/png"));
        setIsGenerating(false);
      });
    }, 120);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, format, theme, customNote, chartRef, title, subtitle, isPt]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (canvasRef.current) {
      downloadSocialCard(canvasRef.current, fileName || "sporting_finances");
    }
  };

  const handleCopy = async () => {
    if (canvasRef.current) {
      const ok = await copySocialCardToClipboard(canvasRef.current);
      if (ok) {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 3000);
      }
    }
  };

  const handleNativeShare = async () => {
    if (canvasRef.current) {
      await shareSocialCardNative(canvasRef.current, title);
    }
  };

  return (
    <div
      className="social-share-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="social-share-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.3rem" }}>📸</span>
              <T as="h3" i18nKey="share_modal_title" style={{ margin: 0, fontSize: "1.1rem" }} />
            </div>
            <T as="p" i18nKey="share_modal_subtitle" style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "var(--muted)" }} />
          </div>
          <button
            onClick={onClose}
            className="pill-btn"
            style={{ fontSize: "1rem", padding: "4px 10px", lineHeight: 1 }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Controls Strip: Format & Theme Selectors */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Format Selector */}
          <div className="filter-toolbar" style={{ margin: 0 }}>
            <div className="filter-toolbar-group">
              <button
                className={`btn-preset ${format === "1:1" ? "active" : ""}`}
                onClick={() => setFormat("1:1")}
              >
                {t("share_format_square")}
              </button>
              <button
                className={`btn-preset ${format === "16:9" ? "active" : ""}`}
                onClick={() => setFormat("16:9")}
              >
                {t("share_format_landscape")}
              </button>
              <button
                className={`btn-preset ${format === "9:16" ? "active" : ""}`}
                onClick={() => setFormat("9:16")}
              >
                {t("share_format_story")}
              </button>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="filter-toolbar" style={{ margin: 0 }}>
            <div className="filter-toolbar-group">
              <span className="filter-toolbar-label">{isPt ? "Tema:" : "Theme:"}</span>
              <button
                className={`btn-preset ${theme === "emerald" ? "active" : ""}`}
                onClick={() => setTheme("emerald")}
              >
                {t("share_theme_emerald")}
              </button>
              <button
                className={`btn-preset ${theme === "dark" ? "active" : ""}`}
                onClick={() => setTheme("dark")}
              >
                {t("share_theme_dark")}
              </button>
              <button
                className={`btn-preset ${theme === "light" ? "active" : ""}`}
                onClick={() => setTheme("light")}
              >
                {t("share_theme_light")}
              </button>
            </div>
          </div>
        </div>

        {/* Custom Note / Takeaway Input */}
        <div>
          <input
            type="text"
            className="filter-input"
            placeholder={t("share_custom_note_placeholder")}
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            style={{ width: "100%", padding: "7px 12px", fontSize: "0.82rem" }}
          />
        </div>

        {/* Live Preview Area */}
        <div
          style={{
            background: theme === "light" ? "#f4f8f5" : "#02160d",
            borderRadius: "var(--radius-md)",
            padding: "16px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "260px",
            maxHeight: "380px",
            overflow: "hidden",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          {isGenerating ? (
            <div style={{ color: theme === "light" ? "#0a5d3a" : "#e5cf87", fontFamily: "var(--mono)", fontSize: "0.85rem" }}>
              ⏳ A gerar cartão de alta resolução...
            </div>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt="Social Share Card Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "340px",
                objectFit: "contain",
                borderRadius: "8px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.4)",
              }}
            />
          ) : (
            <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
              Pré-visualização indisponível
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            marginTop: "4px",
          }}
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              className="btn-preset active"
              onClick={handleDownload}
              style={{ padding: "8px 16px", fontWeight: 700 }}
            >
              {t("share_btn_download")}
            </button>
            <button
              className="btn-preset"
              onClick={handleCopy}
              style={{
                padding: "8px 16px",
                fontWeight: 700,
                borderColor: isCopied ? "var(--green)" : undefined,
                color: isCopied ? "var(--green)" : undefined,
              }}
            >
              {isCopied ? t("share_btn_copied") : t("share_btn_copy")}
            </button>

            {hasNativeShare && (
              <button
                className="btn-preset"
                onClick={handleNativeShare}
                style={{ padding: "8px 16px", fontWeight: 700 }}
              >
                {t("share_btn_native_share")}
              </button>
            )}
          </div>

          <button
            className="pill-btn"
            onClick={onClose}
            style={{ padding: "8px 16px" }}
          >
            {t("share_btn_close")}
          </button>
        </div>
      </div>
    </div>
  );
}
