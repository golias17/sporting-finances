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
  operating_costs_total?: number;
  operating_costs_excl_squad?: number;
  transfer_payables_c?: number;
  transfer_payables_nc?: number;
  transfer_receivables_c?: number;
  transfer_receivables_nc?: number;
  agent_commissions?: number;
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

/** Playground simulation inputs — the 7 sliders/controls. */
export interface PlaygroundInputs {
  uclPrize: number;
  payrollAdj: number;
  salesTarget: number;
  purchasesTarget: number;
  capexAdj: number;
  debtRepayTarget: number;
  revGrowthAdj: number;
}

/** Chart.js options object (subset of the full ChartOptions type). */
export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: Record<string, any>;
  scales?: Record<string, any>;
  [key: string]: any;
}

/** Brand color tokens used across charts and the PDF export. */
export interface BrandColors {
  ink: string;
  muted: string;
  mutedSoft: string;
  chartBg: string;
  green: string;
  greenLight: string;
  greenSoft: string;
  gold: string;
  goldSoft: string;
  pos: string;
  posSoft: string;
  neg: string;
  negSoft: string;
  warn: string;
  info: string;
  infoSoft: string;
  lineBorder: string;
}

/** Chart.js dataset structure passed to AccessibleTable. */
export interface ChartTableData {
  labels: (string | number)[];
  datasets: {
    label?: string;
    data: (number | null)[];
  }[];
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
  urlCmpA: string | null;
  urlCmpB: string | null;
  urlHealthSeason: string | null;
  urlPlayground: PlaygroundInputs | null;

  annual: FinancialRecord[];
  fullAnnual: FinancialRecord[] | null;
  VALID_TABS: string[];
  TAB_CHARTS: Record<string, ChartOptions>;
  COLORS: BrandColors;
  baseOpts: ChartOptions;

  activeLionTab: string;
  pinnedPlaygroundInputs: PlaygroundInputs | null;

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
  setPinnedPlaygroundInputs(v: PlaygroundInputs | null): void;
  setTfActiveSeason(v: string): void;
  setTfActiveType(v: string): void;
  setTfActiveWindow(v: string): void;
  setTfQuery(v: string): void;
  setTfSortCol(v: string | null): void;
  setTfSortDir(v: string): void;
  setUrlStoryActive(v: boolean): void;
  setUrlCmpA(v: string | null): void;
  setUrlCmpB: (v: string | null) => void;
  setUrlHealthSeason: (v: string | null) => void;
  setUrlPlayground: (v: PlaygroundInputs | null) => void;

  BENFICA_DATASET: FinancialDataset;
  PORTO_DATASET: FinancialDataset;
  setBenficaDataset: (val: FinancialDataset) => void;
  setPortoDataset: (val: FinancialDataset) => void;
}
