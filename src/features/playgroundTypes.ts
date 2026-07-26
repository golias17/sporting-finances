import { getBrandColors } from "../charts/chartUtils.js";

export const FALLBACK = getBrandColors(false);

export interface PlaygroundInputs {
  uclPrize: number;
  payrollAdj: number;
  salesTarget: number;
  purchasesTarget: number;
  capexAdj: number;
  debtRepayTarget: number;
  revGrowthAdj: number;
}

export interface ZoneInfo {
  label: string;
  cls: string;
}

export const DEFAULT_INPUTS: PlaygroundInputs = {
  uclPrize: 47,
  payrollAdj: 0,
  salesTarget: 117,
  purchasesTarget: 30,
  capexAdj: 0,
  debtRepayTarget: 0,
  revGrowthAdj: 0,
};

export const PRESETS: Record<string, PlaygroundInputs> = {
  conservative: {
    uclPrize: 36,
    payrollAdj: 5,
    salesTarget: 80,
    purchasesTarget: 20,
    capexAdj: 5,
    debtRepayTarget: 0,
    revGrowthAdj: -3,
  },
  base: DEFAULT_INPUTS,
  optimistic: {
    uclPrize: 60,
    payrollAdj: 10,
    salesTarget: 140,
    purchasesTarget: 60,
    capexAdj: 0,
    debtRepayTarget: 20,
    revGrowthAdj: 8,
  },
};

export const UCL_BONUS_COST_RATE = 0.15;
