export const state = {
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
  DATASET: null,
  get annual() {
    if (!this.DATASET) return null;
    // endSeasonIndex starts as null; treat null as "last season" so the full
    // dataset is covered before main.js pins it to the real last index.
    const end =
      this.endSeasonIndex !== null
        ? this.endSeasonIndex
        : this.DATASET.annual_data.length - 1;
    return this.DATASET.annual_data.slice(this.startSeasonIndex, end + 1);
  },
  get fullAnnual() {
    return this.DATASET ? this.DATASET.annual_data : null;
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
  setStartSeasonIndex(idx) {
    this.startSeasonIndex = idx;
  },
  setEndSeasonIndex(idx) {
    this.endSeasonIndex = idx;
  },
  setHealthBarIdx(idx) {
    this.healthBarIdx = idx;
  },
  setStoryIndex(idx) {
    this.storyIndex = idx;
  },
  setActiveEventFilter(filter) {
    this.activeEventFilter = filter;
  },
  setTlActiveSeason(season) {
    this.tlActiveSeason = season;
  },
  // Parameter renamed from 'window' to 'transferWindow' to avoid shadowing the
  // browser global inside this method.
  setTlActiveWindow(transferWindow) {
    this.tlActiveWindow = transferWindow;
  },

  // Lion Finance (bonds) tab switcher — "both" | "lion" | "sporting"
  activeLionTab: "both",
  setActiveLionTab(tab) {
    this.activeLionTab = tab;
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
  setTfActiveSeason(v) { this.tfActiveSeason = v; },
  setTfActiveType(v) { this.tfActiveType = v; },
  setTfActiveWindow(v) { this.tfActiveWindow = v; },
  setTfQuery(v) { this.tfQuery = v; },
  setTfSortCol(v) { this.tfSortCol = v; },
  setTfSortDir(v) { this.tfSortDir = v; },
};
