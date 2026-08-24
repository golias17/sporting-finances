import { jsPDF } from "jspdf";

export interface CellData {
  section: string;
  column: { index: number };
  cell: {
    text: string[];
    styles: {
      textColor?: [number, number, number] | string;
      fontStyle?: string;
    };
  };
}

export interface ColorPalette {
  green: [number, number, number];
  gold: [number, number, number];
  darkInk: [number, number, number];
  mutedText: [number, number, number];
  positive: [number, number, number];
  negative: [number, number, number];
  lightGreyBg: [number, number, number];
}

export interface ThresholdConfig {
  negativeIf: (val: number) => boolean;
  positiveIf: (val: number) => boolean;
}

export interface AnnualData {
  label: string;
  season?: string;
  revenue_operating: number;
  personnel_costs: number;
  net_result: number;
  equity: number;
  total_assets: number;
  non_current_liabilities: number;
  current_liabilities: number;
  squad_book_value: number;
  squad_market_value?: number;
  borrowings_nc: number;
  borrowings_c: number;
  cash: number;
  player_transfer_income: number;
  player_transfer_cost: number;
  transfer_payables_c?: number;
  transfer_payables_nc?: number;
  transfer_receivables_c?: number;
  transfer_receivables_nc?: number;
  revenue_matchday?: number;
  revenue_tv?: number;
  revenue_commercial?: number;
  cf_operating?: number;
  cf_investing?: number;
  cf_financing?: number;
  [key: string]: any;
}

export interface SummaryLabels {
  revGrowthLabel: string;
  netResultLabel: string;
  equityLabel: string;
  executiveNote: string;
}

export interface GeneratePdfOptions {
  lang?: "en" | "pt";
  pages?: boolean[];
  executiveNote?: string;
}

export interface PdfContext {
  doc: jsPDF;
  isPt: boolean;
  data: AnnualData[];
  colors: ColorPalette;
  firstSeason: Partial<AnnualData>;
  latestSeason: Partial<AnnualData>;
  startNewPage: () => void;
  pageCounter: { count: number };
}
