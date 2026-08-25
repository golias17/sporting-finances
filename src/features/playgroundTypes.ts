export interface BaselineData {
  revenue_operating: number;
  personnel_costs: number;
  external_supplies: number;
  da_excl_squad: number;
  squad_amortization: number;
  player_transfer_cost: number;
  player_transfer_income: number;
  financial_result: number;
  net_result: number;
  equity: number;
  current_assets: number;
  current_liabilities: number;
  total_assets: number;
  cash: number;
}

export interface ProjectionData {
  revenue: number;
  payroll: number;
  overhead: number;
  financialResult: number;
  netTrading: number;
  netResult: number;
  equity: number;
  cash: number;
  solvency: number;
  personnelCostRatio: number;
}

export interface PinnedData {
  revenue: number;
  payroll: number;
  overhead: number;
  financialResult: number;
  netTrading: number;
  netResult: number;
  equity: number;
  solvency: number;
}

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
  ucl_swiss: {
    uclPrize: 55,
    payrollAdj: 4,
    salesTarget: 100,
    purchasesTarget: 35,
    capexAdj: 5,
    debtRepayTarget: 15,
    revGrowthAdj: 10,
  },
  supersale: {
    uclPrize: 47,
    payrollAdj: 2,
    salesTarget: 150,
    purchasesTarget: 40,
    capexAdj: 10,
    debtRepayTarget: 35,
    revGrowthAdj: 5,
  },
  austerity: {
    uclPrize: 36,
    payrollAdj: -8,
    salesTarget: 70,
    purchasesTarget: 15,
    capexAdj: 0,
    debtRepayTarget: 25,
    revGrowthAdj: 0,
  },
};

export const UCL_BONUS_COST_RATE = 0.15;
