import React from "react";

interface ChartDownloadButtonProps {
  chartRef: React.RefObject<any>;
  fileName: string;
}

export const ChartDownloadButton = React.memo(function ChartDownloadButton({
  chartRef,
  fileName,
}: ChartDownloadButtonProps) {
  const handleExport = () => {
    if (chartRef.current) {
      const link = document.createElement("a");
      link.download = `${fileName}.png`;
      link.href = chartRef.current.toBase64Image();
      link.click();
    }
  };

  return (
    <button
      className="chart-download-btn"
      onClick={handleExport}
      aria-label="Download chart"
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
  );
});
