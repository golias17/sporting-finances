import React, { RefObject } from "react";
import { useAppState } from "../core/state.js";

interface ChartDownloadButtonProps {
  chartRef: RefObject<any>;
  fileName: string;
}

export function ChartDownloadButton({
  chartRef,
  fileName,
}: ChartDownloadButtonProps) {
  const isPt = useAppState((s) => s.isPt);

  const handleDownload = () => {
    if (!chartRef.current) return;
    const canvas = chartRef.current.canvas;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ariaLabel = isPt
    ? "Descarregar gráfico como imagem"
    : "Download chart as image";
  const title = isPt
    ? "Descarregar gráfico como imagem PNG"
    : "Download chart as PNG image";

  return (
    <button
      className="chart-download-btn"
      aria-label={ariaLabel}
      title={title}
      onClick={handleDownload}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          marginRight: "4px",
          display: "inline-block",
          verticalAlign: "middle",
        }}
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>PNG</span>
    </button>
  );
}
