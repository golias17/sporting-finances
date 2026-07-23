import React from "react";
import { state, useAppState } from "../core/state.ts";
import { calculateKpis } from "./metrics.ts";
import { fmtMillions } from "../charts/chartUtils.ts";

export function KPIBar() {
  const isPt = useAppState((s) => s.isPt);
  const healthBarIdx = useAppState((s) => s.healthBarIdx);
  const setHealthBarIdx = useAppState((s) => s.setHealthBarIdx);
  const annual = useAppState((s) => s.annual);

  const activeIdx = healthBarIdx ?? (annual.length > 0 ? annual.length - 1 : 0);

  const handlePillClick = (idx: number) => {
    setHealthBarIdx(idx);
    import("../utils/urlSync.ts").then((m) => m.syncStateToUrl());
  };

  const d = state.annual[activeIdx];
  const kpis = calculateKpis(state, activeIdx, fmtMillions);

  const title = isPt
    ? `Visão Geral do Clube — ${d.label}`
    : `Club Overview — ${d.label}`;

  return (
    <div className="health-bar kpi-strip">
      <div className="hb-sub">
        {isPt ? "Indicadores Principais" : "Headline KPIs"}
      </div>
      <div className="hb-title" id="kpiBarTitle">
        {title}
      </div>
      <div className="season-selector" id="kpiSeasonSelector">
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
      <div className="kpis" id="kpiRow">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={`kpi ${k.cls || "neutral"}`}
            tabIndex={0}
            role="group"
            aria-label={`${k.label}: ${k.value}. ${k.change}`}
          >
            <div className="label" aria-hidden="true">
              {k.label}
            </div>
            <div className="value" aria-hidden="true">
              {k.value}
            </div>
            <div className="change" aria-hidden="true">
              {k.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
