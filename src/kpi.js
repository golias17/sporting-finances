import { state } from "./state.js";
import { calculateKpis } from "./metrics.js";
import { fmtMillions } from "./chartUtils.js";

export function renderKpis(idx) {
  if (idx === undefined || idx === null) {
    idx = state.healthBarIdx !== null ? state.healthBarIdx : state.annual.length - 1;
  }

  const kpis = calculateKpis(state, idx, fmtMillions);

  document.getElementById("kpiRow").innerHTML = kpis
    .map(
      (k) =>
        `<div class="kpi" tabindex="0" role="group" aria-label="${k.label}: ${k.value}. ${k.change}">
           <div class="label" aria-hidden="true">${k.label}</div>
           <div class="value" aria-hidden="true">${k.value}</div>
           <div class="change ${k.cls || "neutral"}" aria-hidden="true">${k.change}</div>
         </div>`,
    )
    .join("");
}
