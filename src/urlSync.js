import { state } from "./state.js";
import { STORY_STEPS } from "./storySteps.js";

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

  // 4. Selected season (healthcheck tab's own selector, and the Overview
  // KPI-strip selector — both read/write the same state.healthBarIdx, so
  // both need to persist it. Everywhere else this index isn't in play.
  if (
    (tab === "healthcheck" || tab === "overview") &&
    state.healthBarIdx !== null
  ) {
    const healthSeason = state.annual[state.healthBarIdx]?.label;
    if (healthSeason) {
      params.set("healthSeason", healthSeason);
    } else {
      params.delete("healthSeason");
    }
  } else {
    params.delete("healthSeason");
  }

  // 5. Era filter range — persisted whenever it isn't the full range, so a
  // shared URL reproduces the same narrowed view (healthSeason and the
  // compare selections were already persisted; the era range wasn't).
  const lastIdx = state.fullAnnual.length - 1;
  const eraNarrowed =
    state.startSeasonIndex > 0 ||
    (state.endSeasonIndex !== null && state.endSeasonIndex < lastIdx);
  const eraStartLabel = state.fullAnnual[state.startSeasonIndex]?.label;
  const eraEndLabel = state.fullAnnual[state.endSeasonIndex ?? lastIdx]?.label;
  if (eraNarrowed && eraStartLabel && eraEndLabel) {
    params.set("eraStart", eraStartLabel);
    params.set("eraEnd", eraEndLabel);
  } else {
    params.delete("eraStart");
    params.delete("eraEnd");
  }

  // 6. Playground scenario — persisted whenever the Playground tab is
  // active, so a specific what-if scenario can be bookmarked/shared. All 7
  // controls are read directly from the DOM (mirroring how the compare tab
  // reads its <select> elements above) rather than from state, since
  // playground.js keeps the live slider values in the DOM, not in `state`.
  if (tab === "playground") {
    const pgIds = {
      pgUcl: "uclSelect",
      pgPayroll: "payrollSlider",
      pgSales: "salesSlider",
      pgPurchases: "purchasesSlider",
      pgCapex: "capexSlider",
      pgDebt: "debtRepaySlider",
      pgRevGrowth: "revGrowthSlider",
    };
    for (const [param, elId] of Object.entries(pgIds)) {
      const el = document.getElementById(elId);
      if (el) params.set(param, el.value);
    }
  } else {
    [
      "pgUcl",
      "pgPayroll",
      "pgSales",
      "pgPurchases",
      "pgCapex",
      "pgDebt",
      "pgRevGrowth",
    ].forEach((p) => params.delete(p));
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
    state.setIsPt(lang === "pt");
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
    if (idx >= 0 && idx < STORY_STEPS.length) {
      state.setStoryIndex(idx);
      state.setUrlStoryActive(true);
    }
  }

  // 4. Comparison Seasons Restoration
  const s1 = params.get("s1");
  const s2 = params.get("s2");
  if (s1) state.setUrlCmpA(s1);
  if (s2) state.setUrlCmpB(s2);

  // 5. Healthcheck Season Restoration
  const healthSeason = params.get("healthSeason");
  if (healthSeason) state.setUrlHealthSeason(healthSeason);

  // 6. Era Filter Restoration — stashed as labels; initGlobalFilters()
  // resolves them to indices once the dataset has loaded.
  const eraStart = params.get("eraStart");
  const eraEnd = params.get("eraEnd");
  if (eraStart) state.setUrlEraStart(eraStart);
  if (eraEnd) state.setUrlEraEnd(eraEnd);

  // 7. Playground Scenario Restoration — stashed as one object (all-or-
  // nothing: a URL either encodes a full scenario or none) since
  // playground.js's initPlayground() applies every field at once.
  const pgParams = {
    uclPrize: params.get("pgUcl"),
    payrollAdj: params.get("pgPayroll"),
    salesTarget: params.get("pgSales"),
    purchasesTarget: params.get("pgPurchases"),
    capexAdj: params.get("pgCapex"),
    debtRepayTarget: params.get("pgDebt"),
    revGrowthAdj: params.get("pgRevGrowth"),
  };
  if (Object.values(pgParams).some((v) => v !== null)) {
    state.setUrlPlayground(pgParams);
  }

  return tab;
}
