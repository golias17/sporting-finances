export const state = {
  isPt: document.documentElement.lang.startsWith("pt"),
  tlActiveSeason: "2025/26",
  tlActiveWindow: "All",
  healthBarIdx: null,
  storyIndex: 0,
  activeEventFilter: "all",
  DATASET: null,
  get annual() {
    if (!this.DATASET) return null;
    return this.DATASET.annual_data.slice(this.startSeasonIndex, this.endSeasonIndex + 1);
  },
  get fullAnnual() {
    return this.DATASET ? this.DATASET.annual_data : null;
  },
  TRANSFER_LEDGER: null,
  startSeasonIndex: 0,
  endSeasonIndex: 12,
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
  COLORS: {},
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
  setTlActiveWindow(window) {
    this.tlActiveWindow = window;
  }
};
