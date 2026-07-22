import React from "react";

export function TabLoader() {
  return (
    <div className="tab-loading-skeleton" aria-live="polite" aria-busy="true">
      <div className="skeleton-header">
        <div className="skeleton-title"></div>
        <div className="skeleton-subtitle"></div>
      </div>
      <div className="skeleton-grid">
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
        <div className="skeleton-chart"></div>
      </div>
    </div>
  );
}
