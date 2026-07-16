import { state } from "./state.js";

export function initGlobalFilters(onFilterChange) {
  const startSelect = document.getElementById("globalStartSeason");
  const endSelect = document.getElementById("globalEndSeason");
  if (!startSelect || !endSelect) return;

  const seasons = state.fullAnnual.map((d) => d.label);

  const renderOptions = () => {
    startSelect.innerHTML = "";
    endSelect.innerHTML = "";
    seasons.forEach((season, index) => {
      // Start Select
      const optStart = document.createElement("option");
      optStart.value = index;
      optStart.textContent = season;
      if (index === state.startSeasonIndex) optStart.selected = true;
      if (index > state.endSeasonIndex) optStart.disabled = true;
      startSelect.appendChild(optStart);

      // End Select
      const optEnd = document.createElement("option");
      optEnd.value = index;
      optEnd.textContent = season;
      if (index === state.endSeasonIndex) optEnd.selected = true;
      if (index < state.startSeasonIndex) optEnd.disabled = true;
      endSelect.appendChild(optEnd);
    });
  };

  const onChange = () => {
    // Capture the season healthBarIdx currently points at (if any) before
    // the range changes underneath it — see retargetHealthBarIdx() in
    // state.js for why this is necessary.
    const prevHealthLabel =
      state.healthBarIdx !== null && state.annual
        ? state.annual[state.healthBarIdx]?.label
        : null;
    state.setStartSeasonIndex(parseInt(startSelect.value, 10));
    state.setEndSeasonIndex(parseInt(endSelect.value, 10));
    state.retargetHealthBarIdx(prevHealthLabel);
    renderOptions();
    updateActivePreset();
    if (typeof onFilterChange === "function") {
      onFilterChange();
    }
  };

  const presets = document.querySelectorAll("#eraPresets .season-pill");

  const updateActivePreset = () => {
    presets.forEach((btn) => {
      const s = parseInt(btn.dataset.start, 10);
      const e =
        btn.dataset.end === "latest"
          ? seasons.length - 1
          : parseInt(btn.dataset.end, 10);
      const isActive =
        state.startSeasonIndex === s && state.endSeasonIndex === e;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  presets.forEach((btn) => {
    btn.addEventListener("click", () => {
      const s = parseInt(btn.dataset.start, 10);
      const e =
        btn.dataset.end === "latest"
          ? seasons.length - 1
          : parseInt(btn.dataset.end, 10);
      startSelect.value = s;
      endSelect.value = e;
      onChange();
    });
  });

  startSelect.addEventListener("change", onChange);
  endSelect.addEventListener("change", onChange);
  renderOptions();
  updateActivePreset();
}
