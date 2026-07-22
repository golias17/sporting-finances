import { create } from "zustand";
import type {
  AppState,
  FinancialDataset,
  TransferLedgerSeason,
  PlaygroundInputs,
  BrandColors,
  ChartOptions,
} from "./types.ts";

export const useAppState = create<AppState>((set, get) => ({
  isPt: false,
  tlActiveSeason: "2025/26",
  tlActiveWindow: "All",
  healthBarIdx: null,
  storyIndex: 0,
  isStoryVisible: false,
  activeEventFilter: "all",

  urlStoryActive: false,
  urlCmpA: null,
  urlCmpB: null,
  urlHealthSeason: null,
  urlPlayground: null,

  DATASET: null as unknown as FinancialDataset,
  TRANSFER_LEDGER: null as unknown as TransferLedgerSeason[],
  activeTab: "overview",

  theme: "light",
  renderedCharts: new Set<string>(),
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
  TAB_CHARTS: {} as Record<string, ChartOptions>,
  COLORS: {} as BrandColors,
  baseOpts: {} as ChartOptions,

  activeLionTab: "both",
  pinnedPlaygroundInputs: null,

  tfActiveSeason: "2025/26",
  tfActiveType: "all",
  tfActiveWindow: "all",
  tfQuery: "",
  tfSortCol: null,
  tfSortDir: "asc",

  translations: {},
  annual: [],
  fullAnnual: null,

  setIsPt: (val: boolean) => set({ isPt: val }),
  setDataset: (val: FinancialDataset) =>
    set({
      DATASET: val,
      annual: val ? val.annual_data : [],
      fullAnnual: val ? val.annual_data : null,
    }),
  setActiveTab: (tab: string) => set({ activeTab: tab }),
  setTransferLedger: (val: TransferLedgerSeason[]) =>
    set({ TRANSFER_LEDGER: val }),
  setTranslations: (val: Record<string, any>) => set({ translations: val }),
  setTheme: (val: string) => set({ theme: val }),
  setHealthBarIdx: (idx: number | null) => set({ healthBarIdx: idx }),
  setStoryIndex: (idx: number) => set({ storyIndex: idx }),
  setIsStoryVisible: (v: boolean) => set({ isStoryVisible: v }),
  setActiveEventFilter: (filter: string) => set({ activeEventFilter: filter }),
  setTlActiveSeason: (season: string) => set({ tlActiveSeason: season }),
  setTlActiveWindow: (transferWindow: string) =>
    set({ tlActiveWindow: transferWindow }),
  setActiveLionTab: (tab: string) => set({ activeLionTab: tab }),
  setPinnedPlaygroundInputs: (v: PlaygroundInputs | null) =>
    set({ pinnedPlaygroundInputs: v }),
  setTfActiveSeason: (v: string) => set({ tfActiveSeason: v }),
  setTfActiveType: (v: string) => set({ tfActiveType: v }),
  setTfActiveWindow: (v: string) => set({ tfActiveWindow: v }),
  setTfQuery: (v: string) => set({ tfQuery: v }),
  setTfSortCol: (v: string | null) => set({ tfSortCol: v }),
  setTfSortDir: (v: string) => set({ tfSortDir: v }),
  setUrlStoryActive: (v: boolean) => set({ urlStoryActive: v }),
  setUrlCmpA: (v: string | null) => set({ urlCmpA: v }),
  setUrlCmpB: (v: string | null) => set({ urlCmpB: v }),
  setUrlHealthSeason: (v: string | null) => set({ urlHealthSeason: v }),
  setUrlPlayground: (v: PlaygroundInputs | null) => set({ urlPlayground: v }),
}));

export const state = new Proxy({} as AppState, {
  get(target: any, key: PropertyKey, receiver: any) {
    const s = useAppState.getState() as any;

    if (key === "COLORS" && (!s.COLORS || Object.keys(s.COLORS).length === 0)) {
      console.warn(
        `[state] COLORS accessed before initChartDefaults() was called`,
      );
      return s.COLORS || {};
    }

    return s[key];
  },
  set(target: any, key: PropertyKey, value: any, receiver: any) {
    const bypassWarnKeys = new Set([
      "COLORS",
      "baseOpts",
      "TAB_CHARTS",
      "renderedCharts",
    ]);
    const s = useAppState.getState() as any;
    let setterName =
      "set" + String(key).charAt(0).toUpperCase() + String(key).slice(1);
    if (key === "DATASET") setterName = "setDataset";
    if (key === "TRANSFER_LEDGER") setterName = "setTransferLedger";

    if (!bypassWarnKeys.has(key as string)) {
      if (!s[setterName]) {
        console.warn(
          `[state] Direct mutation of state.${String(key)} is deprecated. Please call state.${setterName}() instead.`,
        );
      }
    }

    if (s[setterName] && typeof s[setterName] === "function") {
      s[setterName](value);
    } else {
      useAppState.setState({ [key]: value } as any);
    }
    return true;
  },
}) as AppState;
