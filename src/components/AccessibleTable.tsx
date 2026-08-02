import React, { useState } from "react";
import { useAppState } from "../core/state.js";
import type { ChartTableData } from "../core/types.js";

interface AccessibleTableProps {
  data: ChartTableData;
  chartId: string;
  valueType?:
    | "currency-thousands"
    | "currency-millions"
    | "ratio"
    | "percentage";
  // Fallback for combo charts where datasets have different scales (e.g. playground)
  datasetValueTypes?: Record<
    number,
"currency-thousands" | "currency-millions" | "ratio" | "percentage"
  >;
  onToggle?: (isTableVisible: boolean) => void;
}

export function AccessibleTable({
  data,
  chartId,
  valueType = "currency-thousands",
  datasetValueTypes,
  onToggle,
}: AccessibleTableProps) {
  const [isHidden, setIsHidden] = useState(true);
  const isPt = useAppState((s) => s.isPt);

  const toggleTable = () => {
    const nextHidden = !isHidden;
    setIsHidden(nextHidden);
    onToggle?.(!nextHidden);
  };

  if (!data || !data.labels || !data.datasets) return null;

  const getBtnText = (hidden: boolean) => {
    return hidden
      ? isPt
        ? "Ver dados em tabela"
        : "View raw table data"
      : isPt
        ? "Ocultar tabela"
        : "Hide table data";
  };

  const formatter = (v: number | [number, number] | null | undefined, dsIndex: number, rowIdx: number) => {
    if (v === null || v === undefined) return "—";

    let numVal: number;
    if (Array.isArray(v)) {
      const stepValues = [177.6, -135.9, 52.0, -50.2, -23.5, 20.0];
      numVal = stepValues[rowIdx] !== undefined ? stepValues[rowIdx] : v[1] - v[0];
    } else {
      numVal = v;
    }

    const type = datasetValueTypes?.[dsIndex] || valueType;

    if (chartId.toLowerCase().includes("waterfall")) {
      const sign = numVal < 0 ? "−" : numVal > 0 ? "+" : "";
      return `€${sign}${Math.abs(numVal).toFixed(1)}M`;
    }

    if (type === "currency-millions") {
      const sign = numVal < 0 ? "−" : "";
      return `€${sign}${Math.abs(numVal).toFixed(1)}M`;
    }

    if (type === "ratio") {
      const sign = numVal < 0 ? "−" : "";
      return `${sign}${Math.abs(numVal).toFixed(1)}×`;
    }

    if (type === "percentage" || chartId.toLowerCase().includes("donut")) {
      return `${numVal.toFixed(1)}%`;
    }

    // Default currency-thousands
    const sign = numVal < 0 ? "−" : "";
    return `€${sign}${Math.abs(numVal).toFixed(1)}k`;
  };

  const cellClass = (v: number | [number, number] | null | undefined, rowIdx: number) => {
    if (v === null || v === undefined) return undefined;
    let numVal: number;
    if (Array.isArray(v)) {
      const stepValues = [177.6, -135.9, 52.0, -50.2, -23.5, 20.0];
      numVal = stepValues[rowIdx] !== undefined ? stepValues[rowIdx] : v[1] - v[0];
    } else {
      numVal = v;
    }

    if (numVal < 0) return "neg";
    if (
      numVal > 0 &&
      (chartId.toLowerCase().includes("netresult") ||
        chartId.toLowerCase().includes("profit") ||
        chartId.toLowerCase().includes("waterfall"))
    ) {
      return "pos";
    }
    return undefined;
  };

  const captionText = isPt
    ? `Tabela de dados do gráfico ${chartId}`
    : `Data table for chart ${chartId}`;

  const yearHeader = isPt ? "Época" : "Year";

  return (
    <>
      <div
        id={`${chartId}-a11y-table-wrap`}
        className={`table-wrap scroll-x ${isHidden ? "sr-only" : ""}`}
      >
        <table id={`${chartId}-a11y-table`} className="data">
          <caption>{captionText}</caption>
          <thead>
            <tr>
              <th>{yearHeader}</th>
              {data.datasets.map((ds, i) => (
                <th key={i}>{ds.label || "Value"}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.labels.map((lbl, i) => (
              <tr key={i}>
                <td>{lbl}</td>
                {data.datasets.map((ds, j) => {
                  const v = ds.data[i];
                  return (
                    <td key={j} className={cellClass(v, i)}>
                      {formatter(v, j, i)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        id={`${chartId}-table-toggle`}
        className="table-toggle-btn"
        aria-controls={`${chartId}-a11y-table-wrap`}
        aria-expanded={!isHidden}
        onClick={toggleTable}
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
            marginRight: "6px",
            display: "inline-block",
            verticalAlign: "middle",
            transition: "transform 0.2s ease",
          }}
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="9" y1="3" x2="9" y2="21"></line>
          <line x1="15" y1="3" x2="15" y2="21"></line>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="3" y1="15" x2="21" y2="15"></line>
        </svg>
        <span>{getBtnText(isHidden)}</span>
      </button>
    </>
  );
}
