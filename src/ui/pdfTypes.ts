import { jsPDF } from "jspdf";

// PDF Generator Types
interface CellData {
  section: string;
  column: { index: number };
  cell: {
    text: string[];
    styles: {
      textColor?: string;
      fontStyle?: string;
    };
  };
}

interface ColorPalette {
  negative: string;
  positive: string;
  neutral: string;
  brand: string;
  brandLight: string;
}

interface ThresholdConfig {
  negativeIf: (val: number) => boolean;
  positiveIf: (val: number) => boolean;
}

interface PdfContext {
  doc: jsPDF;
  isPt: boolean;
  data: AnnualData[];
  logoBase64: string;
  totalPages: number;
  colors: ColorPalette;
  brand: ColorPalette;
  currentPage: number;
  addPageHeader: () => void;
}

interface AnnualData {
  label: string;
  season: string;
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
  transfer_payables_c: number;
  transfer_payables_nc: number;
  transfer_receivables_c: number;
  transfer_receivables_nc: number;
}

interface SummaryLabels {
  revGrowthLabel: string;
  netResultLabel: string;
  equityLabel: string;
  executiveNote: string;
}

interface GeneratePdfOptions {
  isPt?: boolean;
  language?: string;
}
