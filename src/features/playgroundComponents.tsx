import React from "react";

interface ZoneInfo {
  cls: string;
  text: string;
}

interface KpiCardProps {
  label: string;
  projVal: number;
  baseVal: number;
  isPt: boolean;
  zone?: ZoneInfo;
}

export function KpiCard({
  label,
  projVal,
  baseVal,
  isPt,
  zone,
}: KpiCardProps) {
  const diffVal = projVal - baseVal;
  const isPos = diffVal > 0;
  const cardClass = `kpi ${Math.abs(diffVal) < 0.01 ? "" : isPos ? "pos" : "neg"}`;
  const diffClass = `change ${Math.abs(diffVal) < 0.01 ? "" : isPos ? "pos" : "neg"}`;
  const sign = isPos ? "+" : "";
  const diffText =
    Math.abs(diffVal) < 0.01
      ? isPt
        ? "sem alteração"
        : "no change"
      : `${sign}${diffVal.toFixed(1)}M ${isPt ? "vs linha de base" : "vs baseline"}`;

  return (
    <div className={cardClass}>
      <div className="label">{label}</div>
      <div className="value">€{projVal.toFixed(1)}M</div>
      <div className={diffClass}>{diffText}</div>
      {zone && (
        <div className="pg-zone">
          <span className={`zone-dot ${zone.cls}`}></span> {zone.text}
        </div>
      )}
    </div>
  );
}
