import { state } from "./state.js";

/**
 * Synchronizes the current global application state variables into URL query parameters.
 * Uses history.replaceState to prevent flooding the browser navigation stack.
 */
export function syncStateToUrl() {
  if (typeof window === "undefined" || !state.DATASET) return;

  const params = new URLSearchParams(window.location.search);

  // 1. Active Tab
  const activeBtn = document.querySelector("nav.tabs button.active");
  const tab = activeBtn ? activeBtn.dataset.tab : "overview";
  params.set("tab", tab);

  // 2. Story step (only if overview tab and story is visible)
  const storyCard = document.getElementById("storyCard");
  if (
    tab === "overview" &&
    storyCard &&
    !storyCard.classList.contains("hidden")
  ) {
    params.set("story", state.storyIndex + 1);
  } else {
    params.delete("story");
  }

  // 3. Comparison seasons (only if compare tab)
  if (tab === "compare") {
    const selA = document.getElementById("compareSeasonA");
    const selB = document.getElementById("compareSeasonB");
    if (selA && selB) {
      const labelA = selA.options[selA.selectedIndex]?.textContent;
      const labelB = selB.options[selB.selectedIndex]?.textContent;
      if (labelA) params.set("s1", labelA);
      if (labelB) params.set("s2", labelB);
    }
  } else {
    params.delete("s1");
    params.delete("s2");
  }

  // 4. Healthcheck season (only if healthcheck tab)
  if (tab === "healthcheck" && state.healthBarIdx !== null) {
    const healthSeason = state.annual[state.healthBarIdx]?.label;
    if (healthSeason) {
      params.set("healthSeason", healthSeason);
    } else {
      params.delete("healthSeason");
    }
  } else {
    params.delete("healthSeason");
  }

  // Preserve language parameter if present or sync state.isPt
  params.set("lang", state.isPt ? "pt" : "en");

  const newSearch = params.toString();
  const currentSearch = window.location.search.replace("?", "");

  if (newSearch !== currentSearch) {
    const newUrl =
      window.location.pathname + "?" + newSearch + window.location.hash;
    window.history.replaceState(null, "", newUrl);
  }
}

/**
 * Parses URL query parameters and populates initial state indicators.
 * Returns the resolved initial tab name.
 */
export function applyUrlParams() {
  if (typeof window === "undefined") return "overview";

  const params = new URLSearchParams(window.location.search);

  // 1. Language Parameter
  const lang = params.get("lang");
  if (lang && (lang === "en" || lang === "pt")) {
    state.isPt = lang === "pt";
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("lang", lang);
    }
  }

  // 2. Tab Restoration
  let tab =
    params.get("tab") || window.location.hash.replace("#", "") || "overview";
  if (!state.VALID_TABS.includes(tab)) tab = "overview";

  // 3. Story Step Restoration
  const storyParam = params.get("story");
  if (storyParam) {
    const idx = parseInt(storyParam, 10) - 1;
    if (idx >= 0 && idx < 11) {
      // 11 steps
      state.storyIndex = idx;
      state.urlStoryActive = true;
    }
  }

  // 4. Comparison Seasons Restoration
  const s1 = params.get("s1");
  const s2 = params.get("s2");
  if (s1) state.urlCmpA = s1;
  if (s2) state.urlCmpB = s2;

  // 5. Healthcheck Season Restoration
  const healthSeason = params.get("healthSeason");
  if (healthSeason) state.urlHealthSeason = healthSeason;

  return tab;
}
