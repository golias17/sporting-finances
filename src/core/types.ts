export interface FinancialRecord {
  season: string;
  label: string;
  year_end: string;
  revenue_operating: number;
  personnel_costs: number;
  external_supplies: number;
  da_excl_squad: number;
  operating_result_excl_players: number;
  squad_amortization_impairment: number;
  player_transfer_income: number;
  player_transfer_cost: number;
  operating_result_players: number;
  operating_result_total: number;
  financial_result: number;
  net_result: number;
  total_assets: number;
  non_current_assets: number;
  current_assets: number;
  current_liabilities: number;
  non_current_liabilities: number;
  equity: number;
  borrowings_nc: number;
  borrowings_c: number;
  cash: number;
  squad_book_value: number;
  squad_market_value: number;
  rev_tv_comp: number;
  rev_matchday: number;
  rev_commercial: number;
  cf_operating: number;
  cf_investing: number;
  cf_financing: number;
  source: string;
}

export interface FinancialDataset {
  currency: string;
  company: string;
  ticker: string;
  fiscal_year_end: string;
  annual_data: FinancialRecord[];
}

export interface TransferTransaction {
  player: string;
  club: string;
  fee: number;
  rights: string;
  window: "summer" | "winter";
  note?: string;
  note_pt?: string;
  commission?: number;
  bonus?: number;
}

export interface TransferLedgerSeason {
  season: string;
  income: number;
  cost: number;
  note: string;
  note_pt: string;
  purchases: TransferTransaction[];
  sales: TransferTransaction[];
}

export interface AppState {
  DATASET: FinancialDataset;
  TRANSFER_LEDGER: TransferLedgerSeason[];
  activeTab: string;
  isPt: boolean;
  theme: string;
  renderedCharts: Set<string>;

  tlActiveSeason: string;
  tlActiveWindow: string;
  healthBarIdx: number | null;
  storyIndex: number;
  activeEventFilter: string;

  urlStoryActive: boolean;
  urlCmpA: any;
  urlCmpB: any;
  urlHealthSeason: any;
  urlPlayground: any;

  annual: FinancialRecord[];
  fullAnnual: FinancialRecord[] | null;
  VALID_TABS: string[];
  TAB_CHARTS: Record<string, any>;
  COLORS: Record<string, string>;
  baseOpts: any;

  activeLionTab: string;
  pinnedPlaygroundInputs: any;

  tfActiveSeason: string;
  tfActiveType: string;
  tfActiveWindow: string;
  tfQuery: string;
  tfSortCol: string | null;
  tfSortDir: string;

  isStoryVisible: boolean;

  translations: Record<string, any>;

  setDataset(dataset: FinancialDataset): void;
  setTransferLedger(ledger: TransferLedgerSeason[]): void;
  setActiveTab(tab: string): void;
  setIsPt(isPt: boolean): void;
  setTheme(theme: string): void;
  setTranslations(t: Record<string, any>): void;
  setHealthBarIdx(idx: number | null): void;
  setStoryIndex(idx: number): void;
  setIsStoryVisible(v: boolean): void;
  setActiveEventFilter(filter: string): void;
  setTlActiveSeason(season: string): void;
  setTlActiveWindow(transferWindow: string): void;
  setActiveLionTab(tab: string): void;
  setPinnedPlaygroundInputs(v: any): void;
  setTfActiveSeason(v: string): void;
  setTfActiveType(v: string): void;
  setTfActiveWindow(v: string): void;
  setTfQuery(v: string): void;
  setTfSortCol(v: string | null): void;
  setTfSortDir(v: string): void;
  setUrlStoryActive(v: boolean): void;
  setUrlCmpA(v: any): void;
  setUrlCmpB(v: any): void;
  setUrlHealthSeason(v: any): void;
  setUrlPlayground(v: any): void;
}
