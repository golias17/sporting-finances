const stateTarget = {
  // Initialised to false here; setupApp() sets the real value from localStorage
  // / navigator.language once the DOM is ready. Avoids a DOM read at module
  // import time, which would run before the <html lang> attribute is finalised
  // and makes the module testable without a DOM.
  isPt: false,
  tlActiveSeason: "2025/26",
  tlActiveWindow: "All",
  healthBarIdx: null,
  storyIndex: 0,
  activeEventFilter: "all",

  // View state restored from URL query params by applyUrlParams() (urlSync.js)
  // and consumed once by the module that owns each piece of UI: story mode
  // (main.js), the compare selects (compare.js), the health season selector
  // (health.js) and the era filter (globalFilters.js). Declared here so the
  // state shape is visible in one place rather than appearing via ad-hoc
  // assignment.
  urlStoryActive: false,
  urlCmpA: null,
  urlCmpB: null,
  urlHealthSeason: null,
  urlEraStart: null,
  urlEraEnd: null,

  DATASET: null,
  get annual() {
    if (!stateTarget.DATASET) return null;
    return stateTarget.DATASET.annual_data;
  },
  get fullAnnual() {
    return stateTarget.DATASET ? stateTarget.DATASET.annual_data : null;
  },
  TRANSFER_LEDGER: null,
  startSeasonIndex: 0,
  // null means "not yet set" — the annual getter treats it as the last index.
  // main.js calls setEndSeasonIndex(dataset.length - 1) once data has loaded
  // so the global filter UI reflects the real last index.
  endSeasonIndex: null,
  renderedCharts: new Set(),
  VALID_TABS: [
    "overview",
    "revenue",
    "healthcheck",
    "debt",
    "bonds",
    "squad",
    "cash",
    "compare",
    "events",
    "data",
    "news",
    "club",
    "playground",
  ],
  TAB_CHARTS: {},
  // Tabs where the global era filter is hidden: bonds (05) shows a fixed
  // historical cost breakdown that shouldn't shrink with the date range,
  // and compare (08) / events (09) / club (11) / news (12) aren't driven
  // by a season range at all.
  TABS_WITHOUT_GLOBAL_FILTER: new Set([
    "bonds",
    "compare",
    "events",
    "club",
    "news",
    "playground",
  ]),
  // Proxy emits a console.warn if a color key is read before initChartDefaults()
  // populates the object, surfacing ordering bugs at development time.
  // Object.assign(state.COLORS, {...}) in initChartDefaults() still works because
  // the Proxy forwards writes directly to the underlying target.
  COLORS: new Proxy(
    {},
    {
      get(target, key, receiver) {
        if (typeof key === "string" && !(key in target)) {
          console.warn(
            `[state] COLORS.${key} accessed before initChartDefaults() was called`,
          );
        }
        return Reflect.get(target, key, receiver);
      },
    },
  ),
  baseOpts: {},

  // Setters
  setIsPt(val) {
    stateTarget.isPt = val;
  },
  setDataset(val) {
    stateTarget.DATASET = val;
  },
  setTransferLedger(val) {
    stateTarget.TRANSFER_LEDGER = val;
  },
  setStartSeasonIndex(idx) {
    stateTarget.startSeasonIndex = idx;
  },
  setEndSeasonIndex(idx) {
    stateTarget.endSeasonIndex = idx;
  },
  setHealthBarIdx(idx) {
    stateTarget.healthBarIdx = idx;
  },
  // healthBarIdx is an index into the currently-filtered state.annual, not
  // the full dataset. Narrowing/widening the "Explore Era" range changes
  // what that array contains, so a stale index either points at the wrong
  // season or falls past the new end — the latter throws inside
  // health.js/kpi.js (state.annual[idx].label) and used to abort the rest
  // of Overview's chart re-render (chartHero, chartNetResult, chartEquity
  // never ran). Call this right after the start/end season indices change
  // to keep it valid: `prevLabel` is the season that was selected before
  // the range changed, so if it's still in range we stay pointed at it,
  // otherwise we fall back to the new range's latest season.
  retargetHealthBarIdx(prevLabel) {
    if (stateTarget.healthBarIdx === null || !stateTarget.annual) return;
    if (prevLabel) {
      const idx = stateTarget.annual.findIndex((d) => d.label === prevLabel);
      if (idx >= 0) {
        stateTarget.healthBarIdx = idx;
        return;
      }
    }
    stateTarget.healthBarIdx = stateTarget.annual.length - 1;
  },
  setStoryIndex(idx) {
    stateTarget.storyIndex = idx;
  },
  setActiveEventFilter(filter) {
    stateTarget.activeEventFilter = filter;
  },
  setTlActiveSeason(season) {
    stateTarget.tlActiveSeason = season;
  },
  // Parameter renamed from 'window' to 'transferWindow' to avoid shadowing the
  // browser global inside this method.
  setTlActiveWindow(transferWindow) {
    stateTarget.tlActiveWindow = transferWindow;
  },

  // Lion Finance (bonds) tab switcher — "both" | "lion" | "sporting"
  activeLionTab: "both",
  setActiveLionTab(tab) {
    stateTarget.activeLionTab = tab;
  },

  // Transfer detail table filter state (owned here so initTransfersDetailTable
  // can be called multiple times — e.g. on language toggle — without resetting
  // the user's current filter selections).
  tfActiveSeason: "2025/26",
  tfActiveType: "all",
  tfActiveWindow: "all",
  tfQuery: "",
  tfSortCol: null,
  tfSortDir: "asc",
  setTfActiveSeason(v) {
    stateTarget.tfActiveSeason = v;
  },
  setTfActiveType(v) {
    stateTarget.tfActiveType = v;
  },
  setTfActiveWindow(v) {
    stateTarget.tfActiveWindow = v;
  },
  setTfQuery(v) {
    stateTarget.tfQuery = v;
  },
  setTfSortCol(v) {
    stateTarget.tfSortCol = v;
  },
  setTfSortDir(v) {
    stateTarget.tfSortDir = v;
  },

  setUrlStoryActive(v) {
    stateTarget.urlStoryActive = v;
  },
  setUrlCmpA(v) {
    stateTarget.urlCmpA = v;
  },
  setUrlCmpB(v) {
    stateTarget.urlCmpB = v;
  },
  setUrlHealthSeason(v) {
    stateTarget.urlHealthSeason = v;
  },
  setUrlEraStart(v) {
    stateTarget.urlEraStart = v;
  },
  setUrlEraEnd(v) {
    stateTarget.urlEraEnd = v;
  },
};

export const state = new Proxy(stateTarget, {
  set(target, key, value, receiver) {
    // List of allowed direct mutations to nested structures or Set additions.
    const bypassWarnKeys = new Set(["COLORS", "baseOpts", "TAB_CHARTS", "renderedCharts"]);
    if (!bypassWarnKeys.has(key)) {
      let setterName = "set" + String(key).charAt(0).toUpperCase() + String(key).slice(1);
      if (key === "DATASET") setterName = "setDataset";
      if (key === "TRANSFER_LEDGER") setterName = "setTransferLedger";
      console.warn(
        `[state] Direct mutation of state.${String(key)} is deprecated. Please call state.${setterName}() instead.`,
      );
    }
    return Reflect.set(target, key, value, receiver);
  },
  get(target, key, receiver) {
    return Reflect.get(target, key, receiver);
  },
});
