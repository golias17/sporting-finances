export interface PlayerValuationProfile {
  id: string;
  name: string;
  shortName: string;
  position: "forward" | "midfielder" | "defender" | "goalkeeper";
  number: number;
  nationality: string;
  joinYear: number;
  contractExpiry: number;
  contractYearsTotal: number;
  yearsElapsed: number;
  acquisitionCost: number; // in €M
  acquisitionAddons: number; // in €M
  annualAmortization: number; // in €M
  currentBookValue: number; // in €M (Net Book Value in 2025)
  releaseClause: number; // in €M
  marketValue: number; // in €M
  sellOnPercentage: number; // 0.0 to 1.0 (e.g. 0.10 for 10%)
  sellOnBasis: "profit" | "total";
  isHomegrown: boolean;
  annualSalaryEst: number; // in €M gross
}

export const SQUAD_VALUATION_PROFILES: PlayerValuationProfile[] = [
  {
    id: "gyokeres",
    name: "Viktor Gyökeres",
    shortName: "Gyökeres",
    position: "forward",
    number: 9,
    nationality: "🇸🇪 Suécia",
    joinYear: 2023,
    contractExpiry: 2028,
    contractYearsTotal: 5,
    yearsElapsed: 2,
    acquisitionCost: 24.0,
    acquisitionAddons: 4.0,
    annualAmortization: 4.8,
    currentBookValue: 14.4,
    releaseClause: 100.0,
    marketValue: 75.0,
    sellOnPercentage: 0.10, // Coventry City (10% on capital gain)
    sellOnBasis: "profit",
    isHomegrown: false,
    annualSalaryEst: 3.8,
  },
  {
    id: "hjulmand",
    name: "Morten Hjulmand",
    shortName: "Hjulmand",
    position: "midfielder",
    number: 42,
    nationality: "🇩🇰 Dinamarca",
    joinYear: 2023,
    contractExpiry: 2028,
    contractYearsTotal: 5,
    yearsElapsed: 2,
    acquisitionCost: 18.0,
    acquisitionAddons: 3.0,
    annualAmortization: 3.6,
    currentBookValue: 10.8,
    releaseClause: 80.0,
    marketValue: 50.0,
    sellOnPercentage: 0.0,
    sellOnBasis: "profit",
    isHomegrown: false,
    annualSalaryEst: 2.8,
  },
  {
    id: "debast",
    name: "Zeno Debast",
    shortName: "Debast",
    position: "defender",
    number: 6,
    nationality: "🇧🇪 Bélgica",
    joinYear: 2024,
    contractExpiry: 2029,
    contractYearsTotal: 5,
    yearsElapsed: 1,
    acquisitionCost: 15.5,
    acquisitionAddons: 5.5,
    annualAmortization: 3.1,
    currentBookValue: 12.4,
    releaseClause: 80.0,
    marketValue: 25.0,
    sellOnPercentage: 0.0,
    sellOnBasis: "profit",
    isHomegrown: false,
    annualSalaryEst: 2.2,
  },
  {
    id: "diomande",
    name: "Ousmane Diomande",
    shortName: "Diomande",
    position: "defender",
    number: 26,
    nationality: "🇨🇮 Costa do Marfim",
    joinYear: 2023,
    contractExpiry: 2027,
    contractYearsTotal: 4.5,
    yearsElapsed: 2.5,
    acquisitionCost: 7.5,
    acquisitionAddons: 5.0,
    annualAmortization: 1.67,
    currentBookValue: 3.33,
    releaseClause: 80.0,
    marketValue: 40.0,
    sellOnPercentage: 0.20, // Midtjylland (20% on capital gain)
    sellOnBasis: "profit",
    isHomegrown: false,
    annualSalaryEst: 2.0,
  },
  {
    id: "inacio",
    name: "Gonçalo Inácio",
    shortName: "Inácio",
    position: "defender",
    number: 25,
    nationality: "🇵🇹 Portugal",
    joinYear: 2020,
    contractExpiry: 2027,
    contractYearsTotal: 7,
    yearsElapsed: 5,
    acquisitionCost: 0.0,
    acquisitionAddons: 0.0,
    annualAmortization: 0.0,
    currentBookValue: 0.0,
    releaseClause: 60.0,
    marketValue: 45.0,
    sellOnPercentage: 0.0,
    sellOnBasis: "profit",
    isHomegrown: true,
    annualSalaryEst: 2.5,
  },
  {
    id: "quenda",
    name: "Geovany Quenda",
    shortName: "Quenda",
    position: "forward",
    number: 57,
    nationality: "🇵🇹 Portugal",
    joinYear: 2024,
    contractExpiry: 2027,
    contractYearsTotal: 3,
    yearsElapsed: 1,
    acquisitionCost: 0.0,
    acquisitionAddons: 0.0,
    annualAmortization: 0.0,
    currentBookValue: 0.0,
    releaseClause: 100.0,
    marketValue: 35.0,
    sellOnPercentage: 0.0,
    sellOnBasis: "profit",
    isHomegrown: true,
    annualSalaryEst: 1.2,
  },
  {
    id: "maxi_araujo",
    name: "Maximiliano Araújo",
    shortName: "Maxi Araújo",
    position: "forward",
    number: 20,
    nationality: "🇺🇾 Uruguai",
    joinYear: 2024,
    contractExpiry: 2029,
    contractYearsTotal: 5,
    yearsElapsed: 1,
    acquisitionCost: 13.6,
    acquisitionAddons: 1.4,
    annualAmortization: 2.72,
    currentBookValue: 10.88,
    releaseClause: 80.0,
    marketValue: 20.0,
    sellOnPercentage: 0.0,
    sellOnBasis: "profit",
    isHomegrown: false,
    annualSalaryEst: 2.0,
  },
  {
    id: "pote",
    name: "Pedro Gonçalves (Pote)",
    shortName: "Pote",
    position: "midfielder",
    number: 8,
    nationality: "🇵🇹 Portugal",
    joinYear: 2020,
    contractExpiry: 2027,
    contractYearsTotal: 7,
    yearsElapsed: 5,
    acquisitionCost: 13.5, // Total between initial 50% and repurchase
    acquisitionAddons: 0.0,
    annualAmortization: 1.93,
    currentBookValue: 2.5,
    releaseClause: 80.0,
    marketValue: 32.0,
    sellOnPercentage: 0.0,
    sellOnBasis: "profit",
    isHomegrown: false,
    annualSalaryEst: 2.6,
  },
  {
    id: "trincao",
    name: "Francisco Trincão",
    shortName: "Trincão",
    position: "forward",
    number: 17,
    nationality: "🇵🇹 Portugal",
    joinYear: 2022,
    contractExpiry: 2027,
    contractYearsTotal: 5,
    yearsElapsed: 3,
    acquisitionCost: 10.0,
    acquisitionAddons: 0.0,
    annualAmortization: 2.0,
    currentBookValue: 4.0,
    releaseClause: 60.0,
    marketValue: 25.0,
    sellOnPercentage: 0.0,
    sellOnBasis: "profit",
    isHomegrown: false,
    annualSalaryEst: 2.4,
  },
  {
    id: "catamo",
    name: "Geny Catamo",
    shortName: "Geny",
    position: "midfielder",
    number: 21,
    nationality: "🇲🇿 Moçambique",
    joinYear: 2020,
    contractExpiry: 2028,
    contractYearsTotal: 8,
    yearsElapsed: 5,
    acquisitionCost: 3.6, // Initial + buyback 75% Amora
    acquisitionAddons: 0.0,
    annualAmortization: 0.45,
    currentBookValue: 1.35,
    releaseClause: 60.0,
    marketValue: 15.0,
    sellOnPercentage: 0.0,
    sellOnBasis: "profit",
    isHomegrown: false,
    annualSalaryEst: 1.2,
  },
  {
    id: "israel",
    name: "Franco Israel",
    shortName: "Israel",
    position: "goalkeeper",
    number: 1,
    nationality: "🇺🇾 Uruguai",
    joinYear: 2022,
    contractExpiry: 2027,
    contractYearsTotal: 5,
    yearsElapsed: 3,
    acquisitionCost: 0.65,
    acquisitionAddons: 0.0,
    annualAmortization: 0.13,
    currentBookValue: 0.26,
    releaseClause: 45.0,
    marketValue: 12.0,
    sellOnPercentage: 0.40, // Juventus (40% of future sale or buyback rights)
    sellOnBasis: "total",
    isHomegrown: false,
    annualSalaryEst: 0.9,
  },
];

export interface PlayerSaleSimulationResult {
  grossFee: number;
  bookValueDeduction: number;
  sellOnFee: number;
  fifaSolidarity: number;
  agentFee: number;
  netAccountingGain: number; // Capital Gain for P&L
  netCashInflow: number; // Actual cash for Treasury
  roiMultiple: number;
  annualAmortizationRelief: number;
  annualWageRelief: number;
  uefaSquadCostRelief: number;
}

export function calculatePlayerSaleRoi(
  player: PlayerValuationProfile,
  proposedFee: number,
  agentFeePct: number = 0.05,
): PlayerSaleSimulationResult {
  const grossFee = Math.max(0, proposedFee);
  const bookValueDeduction = Math.min(grossFee, player.currentBookValue);

  // Sell-on fee calculation
  let sellOnFee = 0;
  if (player.sellOnPercentage > 0) {
    if (player.sellOnBasis === "profit") {
      const grossProfit = Math.max(0, grossFee - player.acquisitionCost);
      sellOnFee = grossProfit * player.sellOnPercentage;
    } else {
      sellOnFee = grossFee * player.sellOnPercentage;
    }
  }

  // Solidarity mechanism: 5% of gross fee for clubs involved in training (0 if homegrown)
  const fifaSolidarity = player.isHomegrown ? 0 : grossFee * 0.05;

  // Intermediation / Agent commission
  const agentFee = grossFee * Math.max(0, agentFeePct);

  // Net Accounting Capital Gain = Gross Fee - Net Book Value - Retained Sell-On - Solidarity - Agent
  const netAccountingGain = Math.max(
    -bookValueDeduction,
    grossFee - bookValueDeduction - sellOnFee - fifaSolidarity - agentFee,
  );

  // Net Cash Inflow = Gross Fee - Retained Sell-On - Solidarity - Agent
  const netCashInflow = Math.max(
    0,
    grossFee - sellOnFee - fifaSolidarity - agentFee,
  );

  const roiMultiple =
    player.acquisitionCost > 0
      ? grossFee / player.acquisitionCost
      : grossFee > 0
        ? 999.0 // Homegrown infinite ROI
        : 0;

  const annualAmortizationRelief = player.annualAmortization;
  const annualWageRelief = player.annualSalaryEst;
  const uefaSquadCostRelief = annualAmortizationRelief + annualWageRelief;

  const round2 = (n: number) => Math.round(n * 100) / 100;

  return {
    grossFee: round2(grossFee),
    bookValueDeduction: round2(bookValueDeduction),
    sellOnFee: round2(sellOnFee),
    fifaSolidarity: round2(fifaSolidarity),
    agentFee: round2(agentFee),
    netAccountingGain: round2(netAccountingGain),
    netCashInflow: round2(netCashInflow),
    roiMultiple: round2(roiMultiple),
    annualAmortizationRelief: round2(annualAmortizationRelief),
    annualWageRelief: round2(annualWageRelief),
    uefaSquadCostRelief: round2(uefaSquadCostRelief),
  };
}
