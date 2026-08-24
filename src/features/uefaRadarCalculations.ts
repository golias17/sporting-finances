import type { FinancialRecord } from "../core/types.js";
import { netDebt } from "./financialMetrics.js";

export interface RadarPillar {
  id: string;
  name: string;
  namePt: string;
  score: number; // 0 to 100
  actualValueStr: string;
  targetStr: string;
  targetStrPt: string;
  status: "green" | "amber" | "red";
  formulaDesc: string;
  formulaDescPt: string;
  analysis: string;
  analysisPt: string;
}

export interface UefaRadarAnalysis {
  seasonLabel: string;
  overallScore: number; // 0 to 100 average
  overallStatus: "green" | "amber" | "red";
  pillars: RadarPillar[];
  benchmarkScores: number[]; // UEFA target threshold score (e.g. [70, 75, 70, 75, 75])
}

/**
 * Computes UEFA FSR and Financial Sustainability Radar dimensions for a given season.
 */
export function calculateUefaRadar(
  d: FinancialRecord,
  isPt: boolean,
): UefaRadarAnalysis {
  if (!d) {
    return {
      seasonLabel: "—",
      overallScore: 0,
      overallStatus: "red",
      pillars: [],
      benchmarkScores: [70, 75, 70, 75, 75],
    };
  }

  // 1. SQUAD COST RULE (SCR)
  // Personnel costs + Squad amortizations / (Operating Revenue + Transfer Income)
  const squadCosts =
    Math.abs(d.personnel_costs || 0) +
    Math.abs(d.squad_amortization_impairment || 0);
  const totalRevForScr =
    (d.revenue_operating || 0) + (d.player_transfer_income || 0);
  const scr = totalRevForScr > 0 ? squadCosts / totalRevForScr : 1.2;
  const scrPct = scr * 100;

  let scrScore = Math.round(100 - (scr - 0.45) * 140);
  scrScore = Math.max(5, Math.min(100, scrScore));
  const scrStatus: "green" | "amber" | "red" =
    scr <= 0.7 ? "green" : scr <= 0.8 ? "amber" : "red";

  // 2. SOLVENCY / EQUITY RATIO
  // Equity / Total Assets
  const equityRatio = d.total_assets !== 0 ? d.equity / d.total_assets : 0;
  const eqPct = equityRatio * 100;
  let eqScore = Math.round(45 + equityRatio * 160);
  eqScore = Math.max(5, Math.min(100, eqScore));
  const eqStatus: "green" | "amber" | "red" =
    d.equity > 0 && equityRatio >= 0.2
      ? "green"
      : d.equity > 0
        ? "amber"
        : "red";

  // 3. NET DEBT / EBITDA LEVERAGE
  const nd = netDebt(d);
  const ebitda =
    d.ebitda_total ??
    d.operating_result_total +
      Math.abs(d.da_excl_squad || 0) +
      Math.abs(d.squad_amortization_impairment || 0);
  const leverage = ebitda > 0 ? nd / ebitda : nd <= 0 ? 0 : 8;
  let levScore = Math.round(100 - (leverage - 0.5) * 16);
  if (ebitda <= 0 && nd > 0) levScore = 10;
  levScore = Math.max(5, Math.min(100, levScore));
  const levStatus: "green" | "amber" | "red" =
    leverage <= 2.5 && ebitda > 0
      ? "green"
      : leverage <= 4.0 && ebitda > 0
        ? "amber"
        : "red";

  // 4. CURRENT LIQUIDITY RATIO
  const cr =
    d.current_liabilities !== 0 ? d.current_assets / d.current_liabilities : 0;
  let crScore = Math.round(cr * 75);
  crScore = Math.max(5, Math.min(100, crScore));
  const crStatus: "green" | "amber" | "red" =
    cr >= 1.0 ? "green" : cr >= 0.65 ? "amber" : "red";

  // 5. OPERATING SELF-SUFFICIENCY (Excluding Player Sales)
  const totalOpCosts =
    Math.abs(d.personnel_costs || 0) +
    Math.abs(d.external_supplies || 0) +
    Math.abs(d.da_excl_squad || 0);
  const selfSufficiency =
    totalOpCosts > 0 ? d.revenue_operating / totalOpCosts : 0;
  const ssPct = selfSufficiency * 100;
  let ssScore = Math.round((selfSufficiency - 0.4) * 150);
  ssScore = Math.max(5, Math.min(100, ssScore));
  const ssStatus: "green" | "amber" | "red" =
    selfSufficiency >= 0.9
      ? "green"
      : selfSufficiency >= 0.75
        ? "amber"
        : "red";

  const pillars: RadarPillar[] = [
    {
      id: "scr",
      name: "Squad Cost Ratio (UEFA FSR)",
      namePt: "Rácio Custos com Plantel (UEFA FSR)",
      score: scrScore,
      actualValueStr: `${scrPct.toFixed(1)}%`,
      targetStr: "UEFA Cap: ≤ 70.0%",
      targetStrPt: "Limite UEFA: ≤ 70,0%",
      status: scrStatus,
      formulaDesc: "(Wages + Squad Amort.) / (Op. Revenue + Transfer Income)",
      formulaDescPt:
        "(Salários + Amort. Plantel) / (Receitas Op. + Receitas Passes)",
      analysis:
        scr <= 0.7
          ? "Fully compliant with UEFA Financial Sustainability cap."
          : scr <= 0.8
            ? "Slightly above UEFA 70% threshold; watch wage inflation."
            : "Breaches UEFA 70% Squad Cost cap.",
      analysisPt:
        scr <= 0.7
          ? "Totalmente conforme com o teto de 70% do regulamento de sustentabilidade da UEFA."
          : scr <= 0.8
            ? "Ligeiramente acima do limite de 70%; requer contenção salarial."
            : "Ultrapassa o teto regulamentar de 70% da UEFA.",
    },
    {
      id: "solvency",
      name: "Solvency & Equity Ratio",
      namePt: "Solvabilidade e Autonomia Financeira",
      score: eqScore,
      actualValueStr:
        d.equity > 0
          ? `${eqPct.toFixed(1)}%`
          : `-${Math.abs(eqPct).toFixed(1)}%`,
      targetStr: "Target: ≥ 25.0% (Equity > 0)",
      targetStrPt: "Meta: ≥ 25,0% (CP > 0)",
      status: eqStatus,
      formulaDesc: "Shareholders' Equity / Total Assets",
      formulaDescPt: "Capitais Próprios / Ativo Total",
      analysis:
        d.equity > 0 && equityRatio >= 0.2
          ? "Healthy balance sheet with positive equity restored post-VMOC conversion."
          : d.equity > 0
            ? "Positive equity restored, but capital buffer still rebuilding."
            : "Technical bankruptcy / negative equity deficit.",
      analysisPt:
        d.equity > 0 && equityRatio >= 0.2
          ? "Balanço sólido com capitais próprios consolidados após conversão integral das VMOCs."
          : d.equity > 0
            ? "Capitais próprios em terreno positivo, reforço contínuo em curso."
            : "Falência técnica com défice estrutural de capitais próprios.",
    },
    {
      id: "leverage",
      name: "Net Debt / EBITDA Leverage",
      namePt: "Alavancagem Dívida Líquida / EBITDA",
      score: levScore,
      actualValueStr: ebitda > 0 ? `${leverage.toFixed(2)}x` : "N/A (Loss)",
      targetStr: "Target: ≤ 3.00x",
      targetStrPt: "Meta: ≤ 3,00x",
      status: levStatus,
      formulaDesc: "Net Debt / Total EBITDA",
      formulaDescPt: "Dívida Líquida / EBITDA Total",
      analysis:
        leverage <= 2.5 && ebitda > 0
          ? "Strong cash flow generation comfortably servicing debt load."
          : leverage <= 4.0 && ebitda > 0
            ? "Moderate leverage requiring steady European prize money."
            : "Elevated debt burden relative to operating cash flows.",
      analysisPt:
        leverage <= 2.5 && ebitda > 0
          ? "Forte geração de caixa operacional para suporte e serviço da dívida."
          : leverage <= 4.0 && ebitda > 0
            ? "Alavancagem moderada dependente de receitas UEFA regulares."
            : "Elevada pressão da dívida face à capacidade de geração de EBITDA.",
    },
    {
      id: "liquidity",
      name: "Short-Term Liquidity (Current Ratio)",
      namePt: "Liquidez a Curto Prazo (Rácio Corrente)",
      score: crScore,
      actualValueStr: `${cr.toFixed(2)}x`,
      targetStr: "Target: ≥ 1.00x",
      targetStrPt: "Meta: ≥ 1,00x",
      status: crStatus,
      formulaDesc: "Current Assets / Current Liabilities",
      formulaDescPt: "Ativo Circulante / Passivo de Curto Prazo",
      analysis:
        cr >= 1.0
          ? "Current assets cover all short-term obligations due within 12 months."
          : cr >= 0.65
            ? "Tight working capital managed via seasonal transfer receivables."
            : "Working capital deficit requiring refinancing or shareholder support.",
      analysisPt:
        cr >= 1.0
          ? "Ativo corrente cobre integralmente os compromissos exigíveis a 12 meses."
          : cr >= 0.65
            ? "Fundo de maneio condicionado, gerido com recebíveis de transferências."
            : "Défice de tesouraria de curto prazo com necessidade de refinanciamento.",
    },
    {
      id: "self_sufficiency",
      name: "Operating Self-Sufficiency",
      namePt: "Autossuficiência Operacional Recorrente",
      score: ssScore,
      actualValueStr: `${ssPct.toFixed(1)}%`,
      targetStr: "Target: ≥ 90.0%",
      targetStrPt: "Meta: ≥ 90,0%",
      status: ssStatus,
      formulaDesc:
        "Recurring Operating Revenue / Operating Costs (excl. player sales)",
      formulaDescPt: "Receita Operacional / Custos Operacionais (sem passes)",
      analysis:
        selfSufficiency >= 0.9
          ? "Core business (TV, commercial, matchday) covers operating overhead."
          : selfSufficiency >= 0.75
            ? "Substantial reliance on player trading gains to balance operations."
            : "High structural operating deficit without significant transfer gains.",
      analysisPt:
        selfSufficiency >= 0.9
          ? "Receitas recorrentes (TV, comercial e bilheteira) cobrem a estrutura de custos."
          : selfSufficiency >= 0.75
            ? "Dependência substancial de mais-valias de jogadores para equilibrar o exercício."
            : "Défice operacional estrutural acentuado na ausência de vendas de atletas.",
    },
  ];

  const overallScore = Math.round(
    pillars.reduce((s, p) => s + p.score, 0) / pillars.length,
  );
  const overallStatus: "green" | "amber" | "red" =
    overallScore >= 75 ? "green" : overallScore >= 50 ? "amber" : "red";

  return {
    seasonLabel: d.label,
    overallScore,
    overallStatus,
    pillars,
    benchmarkScores: [70, 75, 70, 75, 75], // UEFA / Financial Benchmark baseline
  };
}
