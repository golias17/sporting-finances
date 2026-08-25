import type { FinancialRecord } from "../core/types.js";

export interface SquadCostCalculatorInputs {
  playerName: string;
  transferFee: number; // in Millions €
  contractYears: number; // 1 to 5 (UEFA cap)
  annualGrossWage: number; // in Millions €
  agentFee: number; // in Millions €
  transferWindow: "summer" | "winter"; // Summer = 12 months, Winter = 6 months
  targetSeason: string; // "2024/25" | "2025/26" | "2026/27"
  offsetSaleFee: number; // in Millions €
  offsetBookValue: number; // in Millions €
  offsetWageSaved: number; // in Millions €
}

export interface YearProjection {
  yearIndex: number; // 1, 2, 3
  labelPt: string;
  labelEn: string;
  squadCosts: number;
  totalRevenue: number;
  ratio: number;
  uefaCap: number; // e.g. 70.0
  headroom: number;
  status: "green" | "amber" | "red";
}

export interface SquadCostCalculationResult {
  // Player specific
  annualAmortization: number; // in Millions €
  annualSquadCostImpact: number; // in Millions €
  totalCommitment: number; // total contract value (fee + agents + wages * years)
  uefaCapPercent: number; // 80% for 24/25, 70% for 25/26+

  // Club baseline
  baselineRevenue: number;
  baselineTransferIncome: number;
  baselineTotalRevenue: number;
  baselineSquadCosts: number;
  baselineRatio: number; // in %

  // Year 1 (Operation Year)
  year1: YearProjection;

  // Year 2 (Post-sale Year)
  year2: YearProjection;

  // Year 3 (Medium-Term Year)
  year3: YearProjection;

  // Projected Year 1 summary
  projectedTotalRevenue: number;
  projectedSquadCosts: number;
  projectedRatio: number; // in %
  ratioDelta: number; // in % (+2.4% pts)
  uefaCapValue: number; // 70% of total revenue
  uefaHeadroom: number; // remaining room in €M (positive = compliant, negative = breach)
  status: "green" | "amber" | "red";
  verdictPt: string;
  verdictEn: string;
}

export const DEFAULT_CALCULATOR_INPUTS: SquadCostCalculatorInputs = {
  playerName: "Contratação Alvo",
  transferFee: 20.0,
  contractYears: 5,
  annualGrossWage: 3.2,
  agentFee: 1.8,
  transferWindow: "summer",
  targetSeason: "2025/26",
  offsetSaleFee: 0.0,
  offsetBookValue: 0.0,
  offsetWageSaved: 0.0,
};

export const CALCULATOR_PRESETS: Array<{
  id: string;
  namePt: string;
  nameEn: string;
  icon: string;
  inputs: SquadCostCalculatorInputs;
}> = [
  {
    id: "star_signing",
    namePt: "🌟 Contratação Estrela (Gyökeres / Hjulmand)",
    nameEn: "🌟 Star Signing (Gyökeres / Hjulmand)",
    icon: "🌟",
    inputs: {
      playerName: "Avançado Internacional",
      transferFee: 24.0,
      contractYears: 5,
      annualGrossWage: 3.8,
      agentFee: 2.5,
      transferWindow: "summer",
      targetSeason: "2025/26",
      offsetSaleFee: 0.0,
      offsetBookValue: 0.0,
      offsetWageSaved: 0.0,
    },
  },
  {
    id: "young_talent",
    namePt: "💎 Jovem Promessa (Debast / Fresneda)",
    nameEn: "💎 Young Talent (Debast / Fresneda)",
    icon: "💎",
    inputs: {
      playerName: "Jovem Talento",
      transferFee: 15.5,
      contractYears: 5,
      annualGrossWage: 1.4,
      agentFee: 1.2,
      transferWindow: "summer",
      targetSeason: "2025/26",
      offsetSaleFee: 0.0,
      offsetBookValue: 0.0,
      offsetWageSaved: 0.0,
    },
  },
  {
    id: "free_agent",
    namePt: "🆓 Jogador Livre com Salário Top",
    nameEn: "🆓 Free Agent with Top Tier Wage",
    icon: "🆓",
    inputs: {
      playerName: "Craque a Custo Zero",
      transferFee: 0.0,
      contractYears: 3,
      annualGrossWage: 4.5,
      agentFee: 3.5,
      transferWindow: "summer",
      targetSeason: "2025/26",
      offsetSaleFee: 0.0,
      offsetBookValue: 0.0,
      offsetWageSaved: 0.0,
    },
  },
  {
    id: "swap_offset",
    namePt: "🔄 Reforço Financiado por Venda (€40M)",
    nameEn: "🔄 Transfer Funded by Player Sale (€40M)",
    icon: "🔄",
    inputs: {
      playerName: "Novo Titular",
      transferFee: 22.0,
      contractYears: 5,
      annualGrossWage: 2.8,
      agentFee: 1.5,
      transferWindow: "summer",
      targetSeason: "2025/26",
      offsetSaleFee: 40.0,
      offsetBookValue: 6.0,
      offsetWageSaved: 2.2,
    },
  },
  {
    id: "winter_signing",
    namePt: "❄️ Reforço de Inverno (Janeiro)",
    nameEn: "❄️ Winter Transfer Window Signing",
    icon: "❄️",
    inputs: {
      playerName: "Reforço de Inverno",
      transferFee: 18.0,
      contractYears: 4,
      annualGrossWage: 2.5,
      agentFee: 1.2,
      transferWindow: "winter",
      targetSeason: "2025/26",
      offsetSaleFee: 0.0,
      offsetBookValue: 0.0,
      offsetWageSaved: 0.0,
    },
  },
];

export function calculateSquadCostImpact(
  inputs: SquadCostCalculatorInputs,
  record: FinancialRecord | null,
  isPt: boolean,
): SquadCostCalculationResult {
  // Baseline extraction (fallback to 2024/25 typical metrics if record is null)
  const baselineRevenue = record
    ? (record.revenue_operating || 0) / 1000
    : 140.0;
  const baselineTransferIncome = record
    ? (record.player_transfer_income || 0) / 1000
    : 60.0;
  const baselineTotalRevenue = Math.max(
    1,
    baselineRevenue + baselineTransferIncome,
  );

  const baselineWages = record
    ? Math.abs(record.personnel_costs || 0) / 1000
    : 80.0;
  const baselineAmort = record
    ? Math.abs(record.squad_amortization_impairment || 0) / 1000
    : 25.0;
  const baselineSquadCosts = baselineWages + baselineAmort;
  const baselineRatio = (baselineSquadCosts / baselineTotalRevenue) * 100;

  // Regulatory Cap based on target season
  const uefaCapPercent = inputs.targetSeason === "2024/25" ? 80.0 : 70.0;

  // New Player calculations
  const effectiveYears = Math.max(1, Math.min(5, inputs.contractYears || 5)); // UEFA FSR 5-year cap
  const totalCapex =
    Math.max(0, inputs.transferFee) + Math.max(0, inputs.agentFee);
  const annualAmortization = totalCapex / effectiveYears;
  const annualSquadCostImpact =
    annualAmortization + Math.max(0, inputs.annualGrossWage);
  const totalCommitment =
    totalCapex + Math.max(0, inputs.annualGrossWage) * inputs.contractYears;

  // Transfer Window Factor (Summer = 100% of year, Winter = 50% in Year 1)
  const windowFactorY1 = inputs.transferWindow === "winter" ? 0.5 : 1.0;

  // Outgoing Player calculations
  const offsetGain = Math.max(0, inputs.offsetSaleFee - inputs.offsetBookValue);
  const offsetCostReductionY1 =
    Math.max(0, inputs.offsetWageSaved) * windowFactorY1 +
    (inputs.offsetBookValue > 0
      ? (inputs.offsetBookValue / 3) * windowFactorY1
      : 0);
  const offsetCostReductionY2 =
    Math.max(0, inputs.offsetWageSaved) +
    (inputs.offsetBookValue > 0 ? inputs.offsetBookValue / 3 : 0);

  // Year 1 (Deal Year)
  const y1SquadCostAddition =
    annualAmortization * windowFactorY1 +
    Math.max(0, inputs.annualGrossWage) * windowFactorY1;
  const y1SquadCosts =
    baselineSquadCosts + y1SquadCostAddition - offsetCostReductionY1;
  const y1TotalRevenue = baselineTotalRevenue + offsetGain;
  const y1Ratio = (y1SquadCosts / y1TotalRevenue) * 100;
  const y1CapValue = (uefaCapPercent / 100) * y1TotalRevenue;
  const y1Headroom = y1CapValue - y1SquadCosts;

  let y1Status: "green" | "amber" | "red" = "green";
  if (y1Ratio > uefaCapPercent + 5.0) y1Status = "red";
  else if (y1Ratio > uefaCapPercent) y1Status = "amber";

  const year1: YearProjection = {
    yearIndex: 1,
    labelPt: `Ano 1 (${inputs.targetSeason}${inputs.transferWindow === "winter" ? " - Inverno" : " - Verão"})`,
    labelEn: `Year 1 (${inputs.targetSeason}${inputs.transferWindow === "winter" ? " - Winter" : " - Summer"})`,
    squadCosts: y1SquadCosts,
    totalRevenue: y1TotalRevenue,
    ratio: y1Ratio,
    uefaCap: uefaCapPercent,
    headroom: y1Headroom,
    status: y1Status,
  };

  // Year 2 (Post-Sale / Full Year Phase - One-off sale gain drops to 0)
  const y2SquadCosts =
    baselineSquadCosts + annualSquadCostImpact - offsetCostReductionY2;
  const y2TotalRevenue = baselineTotalRevenue; // One-off transfer gain drops off
  const y2Ratio = (y2SquadCosts / y2TotalRevenue) * 100;
  const y2CapValue = 0.7 * y2TotalRevenue; // Definitive 70% in Year 2
  const y2Headroom = y2CapValue - y2SquadCosts;

  let y2Status: "green" | "amber" | "red" = "green";
  if (y2Ratio > 75.0) y2Status = "red";
  else if (y2Ratio > 70.0) y2Status = "amber";

  const year2: YearProjection = {
    yearIndex: 2,
    labelPt: "Ano 2 (Exercício Seguinte / Recorrente)",
    labelEn: "Year 2 (Following Season / Recurring)",
    squadCosts: y2SquadCosts,
    totalRevenue: y2TotalRevenue,
    ratio: y2Ratio,
    uefaCap: 70.0,
    headroom: y2Headroom,
    status: y2Status,
  };

  // Year 3 (Medium-Term Horizon)
  const year3: YearProjection = {
    yearIndex: 3,
    labelPt: "Ano 3 (Médio Prazo)",
    labelEn: "Year 3 (Medium-Term)",
    squadCosts: y2SquadCosts,
    totalRevenue: y2TotalRevenue,
    ratio: y2Ratio,
    uefaCap: 70.0,
    headroom: y2Headroom,
    status: y2Status,
  };

  // Summary mapping
  const projectedTotalRevenue = y1TotalRevenue;
  const projectedSquadCosts = y1SquadCosts;
  const projectedRatio = y1Ratio;
  const ratioDelta = projectedRatio - baselineRatio;
  const uefaCapValue = y1CapValue;
  const uefaHeadroom = y1Headroom;
  const status = y1Status;

  let verdictPt = "";
  let verdictEn = "";

  if (
    inputs.offsetSaleFee > 0 &&
    y1Status === "green" &&
    y2Status !== "green"
  ) {
    verdictPt = `Efeito Bipolar de Venda: A mais-valia imediata de €${offsetGain.toFixed(1)}M garante aprovação folgada no Ano 1 (${y1Ratio.toFixed(1)}%). Contudo, no Ano 2, sem o encaixe da venda, o encargo estrutural (€${annualSquadCostImpact.toFixed(1)}M/ano) eleva o rácio para ${y2Ratio.toFixed(1)}%, ultrapassando o teto de 70%. Exigirá novas vendas no ano seguinte.`;
    verdictEn = `Transfer Windfall Effect: The immediate one-off gain of €${offsetGain.toFixed(1)}M ensures smooth compliance in Year 1 (${y1Ratio.toFixed(1)}%). However, in Year 2 without the sale proceeds, recurring squad costs (€${annualSquadCostImpact.toFixed(1)}M/yr) lift the ratio to ${y2Ratio.toFixed(1)}%, exceeding the 70% cap.`;
  } else if (status === "green") {
    verdictPt = `Operação sustentável dentro do teto UEFA FSR (${uefaCapPercent}%). O rácio situa-se em ${projectedRatio.toFixed(1)}%, mantendo uma folga orçamental de €${uefaHeadroom.toFixed(1)}M no plantel.`;
    verdictEn = `Sustainable operation within UEFA FSR cap (${uefaCapPercent}%). The Squad Cost Ratio settles at ${projectedRatio.toFixed(1)}%, retaining €${uefaHeadroom.toFixed(1)}M of financial headroom.`;
  } else if (status === "amber") {
    verdictPt = `Atenção: A contratação eleva o rácio para ${projectedRatio.toFixed(1)}%, ultrapassando ligeiramente o teto regulamentar de ${uefaCapPercent}% em €${Math.abs(uefaHeadroom).toFixed(1)}M. Recomenda-se gerar mais-valias compensatórias com vendas.`;
    verdictEn = `Warning: The signing pushes the Squad Cost Ratio to ${projectedRatio.toFixed(1)}%, slightly exceeding UEFA's ${uefaCapPercent}% threshold by €${Math.abs(uefaHeadroom).toFixed(1)}M. Compensatory transfer gains are advised.`;
  } else {
    verdictPt = `Risco Regulamentar Elevado: O rácio sobe para ${projectedRatio.toFixed(1)}% (excesso de €${Math.abs(uefaHeadroom).toFixed(1)}M face ao teto). Risco de sanções financeiras e restrições de inscrição nas competições UEFA.`;
    verdictEn = `High Regulatory Risk: The Squad Cost Ratio surges to ${projectedRatio.toFixed(1)}% (€${Math.abs(uefaHeadroom).toFixed(1)}M deficit vs. cap). Risk of UEFA financial penalties and squad registration limits.`;
  }

  return {
    annualAmortization,
    annualSquadCostImpact,
    totalCommitment,
    uefaCapPercent,
    baselineRevenue,
    baselineTransferIncome,
    baselineTotalRevenue,
    baselineSquadCosts,
    baselineRatio,
    year1,
    year2,
    year3,
    projectedTotalRevenue,
    projectedSquadCosts,
    projectedRatio,
    ratioDelta,
    uefaCapValue,
    uefaHeadroom,
    status,
    verdictPt,
    verdictEn,
  };
}
