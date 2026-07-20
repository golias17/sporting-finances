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
  // (main.js), the compare selects (compare.js), and the health season
  // selector (health.js). Declared here so the state shape is visible in
  // one place rather than appearing via ad-hoc assignment.
  urlStoryActive: false,
  urlCmpA: null,
  urlCmpB: null,
  urlHealthSeason: null,
  // Playground scenario (all 7 slider/select values as one object, not
  // split into scalar fields like urlCmpA/B) — playground.js's controls are
  // a single cohesive "scenario" consumed together by one module, unlike
  // e.g. the compare tab's two independent selects.
  urlPlayground: null,

  DATASET: null,
  // `annual` and `fullAnnual` used to differ — `annual` was meant to reflect
  // a season range narrowed via a since-removed "Explore Era" global filter,
  // while `fullAnnual` always returned the complete dataset for views (like
  // compare.js) that intentionally ignore that filter. The narrowing feature
  // never shipped past scaffolding (nothing ever moved the range off its
  // default), so the two were already identical in practice; `annual` is
  // kept as an alias since most of the app reads through it.
  get annual() {
    return stateTarget.fullAnnual;
  },
  get fullAnnual() {
    return stateTarget.DATASET ? stateTarget.DATASET.annual_data : null;
  },
  TRANSFER_LEDGER: null,
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
  setHealthBarIdx(idx) {
    stateTarget.healthBarIdx = idx;
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

  // Playground "pin this scenario" — a frozen snapshot of the 7 slider/select
  // inputs (same shape as playground.js's DEFAULT_INPUTS), captured when the
  // user clicks Pin, so they can keep adjusting the live scenario while
  // comparing it against the one they pinned. null means nothing is pinned.
  // Session-only (not persisted to the URL, unlike the live scenario in
  // urlPlayground) — kept deliberately simple for a first pass.
  pinnedPlaygroundInputs: null,
  setPinnedPlaygroundInputs(v) {
    stateTarget.pinnedPlaygroundInputs = v;
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
  setUrlPlayground(v) {
    stateTarget.urlPlayground = v;
  },
};

export const state = new Proxy(stateTarget, {
  set(target, key, value, receiver) {
    // List of allowed direct mutations to nested structures or Set additions.
    const bypassWarnKeys = new Set([
      "COLORS",
      "baseOpts",
      "TAB_CHARTS",
      "renderedCharts",
    ]);
    if (!bypassWarnKeys.has(key)) {
      let setterName =
        "set" + String(key).charAt(0).toUpperCase() + String(key).slice(1);
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
