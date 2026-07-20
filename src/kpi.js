import { state } from "./state.js";
import { calculateKpis } from "./metrics.js";
import { fmtMillions } from "./chartUtils.js";

export function renderKpis(idx) {
  const kpiRow = document.getElementById("kpiRow");
  if (!kpiRow) return;

  if (idx === undefined || idx === null) {
    idx =
      state.healthBarIdx !== null
        ? state.healthBarIdx
        : state.annual.length - 1;
  }

  const kpis = calculateKpis(state, idx, fmtMillions);

  kpiRow.innerHTML = kpis
    .map(
      (k) =>
        `<div class="kpi ${k.cls || "neutral"}" tabindex="0" role="group" aria-label="${k.label}: ${k.value}. ${k.change}">
           <div class="label" aria-hidden="true">${k.label}</div>
           <div class="value" aria-hidden="true">${k.value}</div>
           <div class="change ${k.cls || "neutral"}" aria-hidden="true">${k.change}</div>
         </div>`,
    )
    .join("");
}
