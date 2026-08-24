import React, { useState } from "react";
import { SocialShareModal } from "./SocialShareModal.js";
import { useTranslation } from "../hooks/useTranslation.js";

interface ChartDownloadButtonProps {
  chartRef: React.RefObject<any>;
  fileName: string;
  title?: string;
  subtitle?: string;
}

export const ChartDownloadButton = React.memo(function ChartDownloadButton({
  chartRef,
  fileName,
  title,
  subtitle,
}: ChartDownloadButtonProps) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleExport = () => {
    if (chartRef.current) {
      const link = document.createElement("a");
      link.download = `${fileName}.png`;
      link.href = chartRef.current.toBase64Image
        ? chartRef.current.toBase64Image()
        : chartRef.current.canvas?.toDataURL();
      link.click();
    }
  };

  const cleanTitle =
    title ||
    fileName
      .replace(/^chart_?/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      <div
        className="chart-download-btn-group chart-btn-group"
        style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
      >
        {/* Social Infographic Card Trigger */}
        <button
          type="button"
          className="chart-download-btn chart-share-btn"
          onClick={() => setIsModalOpen(true)}
          aria-label={t("share_tooltip") || "Share Infographic Card"}
          title={t("share_tooltip") || "Share Infographic Card"}
          style={{ cursor: "pointer" }}
        >
          <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>📸</span>
        </button>

        {/* Direct PNG Download */}
        <button
          type="button"
          className="chart-download-btn"
          onClick={handleExport}
          aria-label="Download chart image"
          title="Download PNG"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>

      {isModalOpen && (
        <SocialShareModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          chartRef={chartRef}
          title={cleanTitle}
          subtitle={subtitle}
          fileName={fileName}
        />
      )}
    </>
  );
});
