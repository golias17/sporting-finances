import React from "react";
import { state, useAppState } from "../core/state.ts";
import { calculateHealthSignals } from "./metrics.ts";
import { fmtMillions } from "../charts/chartUtils.ts";
import { AppChart } from "../components/AppChart.js";

function Sparkline({
  history,
  labels,
  color,
  sId,
}: {
  history: (number | null)[];
  labels: string[];
  color: string;
  sId: string;
}) {
  const data = React.useMemo(
    () => ({
      labels: labels,
      datasets: [
        {
          data: history,
          borderColor: color,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: false,
        },
      ],
    }),
    [history, labels, color],
  );

  const options = React.useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { display: false },
        y: { display: false },
      },
      layout: { padding: 0 },
    }),
    [],
  );

  return (
    <AppChart
      id={sId}
      type="line"
      data={data as any}
      options={options as any}
      hideTable={true}
    />
  );
}

export function HealthSignals() {
  const isPt = useAppState((s) => s.isPt);
  const healthBarIdx = useAppState((s) => s.healthBarIdx);
  const setHealthBarIdx = useAppState((s) => s.setHealthBarIdx);
  const annual = useAppState((s) => s.annual);

  const activeIdx = healthBarIdx ?? (annual.length > 0 ? annual.length - 1 : 0);

  const handlePillClick = (idx: number) => {
    setHealthBarIdx(idx);
    import("../utils/urlSync.ts").then((m) => m.syncStateToUrl());
  };

  const d = annual[activeIdx];
  if (!d) return null;
  const signals = calculateHealthSignals(state, activeIdx, fmtMillions);

  const histStartIdx = Math.max(0, activeIdx - 4);
  const histLabels = annual
    .slice(histStartIdx, activeIdx + 1)
    .map((y) => y.label);

  const title = isPt
    ? `Saúde Financeira do Clube — ${d.label}`
    : `Club Financial Health — ${d.label}`;

  return (
    <div className="health-bar">
      <div className="hb-sub">{isPt ? "Sinais vitais" : "Vital signs"}</div>
      <div className="hb-title" id="healthBarTitle">
        {title}
      </div>
      <div className="season-selector" id="seasonSelector">
        {state.annual.map((a, i) => (
          <button
            key={i}
            className={`season-pill ${i === activeIdx ? "active" : ""}`}
            aria-pressed={i === activeIdx}
            onClick={() => handlePillClick(i)}
          >
            {a.label}
          </button>
        ))}
      </div>
      <div className="health-signals" id="healthSignals">
        {signals.map((s) => {
          const colorMap: Record<string, string> = {
            green: (state.COLORS as any).pos,
            amber: (state.COLORS as any).warn,
            red: (state.COLORS as any).neg,
          };
          const color = colorMap[s.status] || (state.COLORS as any).ink;

          return (
            <div key={s.id} className={`health-signal ${s.status}`}>
              <div className="sig-header">
                <div
                  className="sig-icon"
                  dangerouslySetInnerHTML={{ __html: s.icon }}
                ></div>
                <div className="sig-label">{s.label}</div>
                <div className="status-dot"></div>
              </div>
              <div className="sig-value">{s.value}</div>
              <div className="sig-note">{s.note}</div>
              <div className="sparkline-wrap">
                <Sparkline
                  history={s.history}
                  labels={histLabels}
                  color={color}
                  sId={s.id}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
