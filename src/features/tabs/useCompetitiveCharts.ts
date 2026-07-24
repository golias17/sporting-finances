import { useMemo } from "react";
import { useAppState } from "../../core/state.js";
import { getBrandColors, fmtMillions } from "../../charts/chartUtils.js";

interface FinancialData {
  season: string;
  label?: string;
  year?: string;
  revenue_operating: number;
  personnel_costs: number;
  net_result: number;
  equity: number;
  non_current_liabilities: number;
  current_liabilities: number;
  squad_market_value?: number;
  rev_tv_comp?: number;
  rev_matchday?: number;
  rev_commercial?: number;
  player_transfer_income?: number;
  player_transfer_cost?: number;
}

interface ChartDataset {
  label: string;
  data: (number | null)[];
  borderColor: string;
  backgroundColor: string;
  tension?: number;
  fill?: boolean;
  borderWidth?: number;
  borderRadius?: number;
  stack?: string;
}

// Helper to create competitor dataset for line charts
function createCompetitorLineDatasets(
  annual: FinancialData[],
  benficaAnnual: FinancialData[],
  portoAnnual: FinancialData[],
  competitorColors: { sporting: string; benfica: string; porto: string },
  getField: (d: FinancialData) => number | null,
  divisor: number = 1
): ChartDataset[] {
  const findRivalData = (dataset: FinancialData[], season: string) => {
    return dataset.find(d => d.season === season || d.year === season);
  };

  return [
    {
      label: "Sporting",
      data: annual.map((d) => getField(d) !== null ? getField(d)! / divisor : null),
      borderColor: competitorColors.sporting,
      backgroundColor: competitorColors.sporting + "33",
      tension: 0.3,
      fill: false,
    },
    {
      label: "Benfica",
      data: annual.map((d) => {
        const bd = findRivalData(benficaAnnual, d.season);
        return bd && getField(bd) !== null ? getField(bd)! / divisor : null;
      }),
      borderColor: competitorColors.benfica,
      backgroundColor: competitorColors.benfica + "33",
      tension: 0.3,
      fill: false,
    },
    {
      label: "Porto",
      data: annual.map((d) => {
        const pd = findRivalData(portoAnnual, d.season);
        return pd && getField(pd) !== null ? getField(pd)! / divisor : null;
      }),
      borderColor: competitorColors.porto,
      backgroundColor: competitorColors.porto + "33",
      tension: 0.3,
      fill: false,
    },
  ];
}

export function useCompetitiveCharts() {
  const annual = useAppState((s) => s.annual);
  const benficaDataset = useAppState((s) => s.BENFICA_DATASET);
  const portoDataset = useAppState((s) => s.PORTO_DATASET);
  
  const benficaAnnual = benficaDataset?.annual_data || [];
  const portoAnnual = portoDataset?.annual_data || [];

  const theme = useAppState((s) => s.theme);
  const COLORS = useAppState((s) => s.COLORS);
  const baseOpts = useAppState((s) => s.baseOpts);

  const brandColors = useMemo(() => getBrandColors(theme === "dark"), [theme]);

  const competitorColors = useMemo(() => ({
    sporting: brandColors.green,
    benfica: brandColors.neg,
    porto: brandColors.info,
  }), [brandColors]);

  const labels = useMemo(() => annual.map((d) => d.label || d.season), [annual]);

  const findRivalData = (dataset: FinancialData[], season: string) => {
    return dataset.find(d => d.season === season || d.year === season);
  };

  // Revenue by Source (stacked bar)
  const revenueBySource = useMemo(() => ({
    labels,
    datasets: [
      {
        label: "Sporting - TV & UEFA",
        data: annual.map((d) => d.rev_tv_comp ?? 0),
        backgroundColor: competitorColors.sporting + "B3",
        borderColor: competitorColors.sporting,
        borderWidth: 1,
        borderRadius: 0,
        stack: "sporting",
      },
      {
        label: "Sporting - Bilheteira",
        data: annual.map((d) => d.rev_matchday ?? 0),
        backgroundColor: competitorColors.sporting + "70",
        borderColor: competitorColors.sporting,
        borderWidth: 1,
        borderRadius: 0,
        stack: "sporting",
      },
      {
        label: "Sporting - Comercial",
        data: annual.map((d) => d.rev_commercial ?? 0),
        backgroundColor: competitorColors.sporting + "40",
        borderColor: competitorColors.sporting,
        borderWidth: 1,
        borderRadius: 3,
        stack: "sporting",
      },
      {
        label: "Benfica - TV & UEFA",
        data: annual.map((d) => {
          const bd = findRivalData(benficaAnnual, d.season);
          return bd ? (bd.rev_tv_comp ?? 0) : null;
        }),
        backgroundColor: competitorColors.benfica + "B3",
        borderColor: competitorColors.benfica,
        borderWidth: 1,
        borderRadius: 0,
        stack: "benfica",
      },
      {
        label: "Benfica - Bilheteira",
        data: annual.map((d) => {
          const bd = findRivalData(benficaAnnual, d.season);
          return bd ? (bd.rev_matchday ?? 0) : null;
        }),
        backgroundColor: competitorColors.benfica + "70",
        borderColor: competitorColors.benfica,
        borderWidth: 1,
        borderRadius: 0,
        stack: "benfica",
      },
      {
        label: "Benfica - Comercial",
        data: annual.map((d) => {
          const bd = findRivalData(benficaAnnual, d.season);
          return bd ? (bd.rev_commercial ?? 0) : null;
        }),
        backgroundColor: competitorColors.benfica + "40",
        borderColor: competitorColors.benfica,
        borderWidth: 1,
        borderRadius: 3,
        stack: "benfica",
      },
      {
        label: "Porto - TV & UEFA",
        data: annual.map((d) => {
          const pd = findRivalData(portoAnnual, d.season);
          return pd ? (pd.rev_tv_comp ?? 0) : null;
        }),
        backgroundColor: competitorColors.porto + "B3",
        borderColor: competitorColors.porto,
        borderWidth: 1,
        borderRadius: 0,
        stack: "porto",
      },
      {
        label: "Porto - Bilheteira",
        data: annual.map((d) => {
          const pd = findRivalData(portoAnnual, d.season);
          return pd ? (pd.rev_matchday ?? 0) : null;
        }),
        backgroundColor: competitorColors.porto + "70",
        borderColor: competitorColors.porto,
        borderWidth: 1,
        borderRadius: 0,
        stack: "porto",
      },
      {
        label: "Porto - Comercial",
        data: annual.map((d) => {
          const pd = findRivalData(portoAnnual, d.season);
          return pd ? (pd.rev_commercial ?? 0) : null;
        }),
        backgroundColor: competitorColors.porto + "40",
        borderColor: competitorColors.porto,
        borderWidth: 1,
        borderRadius: 3,
        stack: "porto",
      },
    ],
  }), [labels, annual, benficaAnnual, portoAnnual, competitorColors]);

  // Personnel Costs Ratio (line showing % of revenue)
  const personnelCostsRatio = useMemo(() => ({
    labels,
    datasets: createCompetitorLineDatasets(
      annual, benficaAnnual, portoAnnual, competitorColors,
      (d) => d.revenue_operating ? (Math.abs(d.personnel_costs) / d.revenue_operating) * 100 : null,
      1
    ),
  }), [labels, annual, benficaAnnual, portoAnnual, competitorColors]);

  // Personnel costs comparison (absolute values)
  const personnelComparison = useMemo(() => ({
    labels,
    datasets: createCompetitorLineDatasets(
      annual, benficaAnnual, portoAnnual, competitorColors,
      (d) => Math.abs(d.personnel_costs)
    ),
  }), [labels, annual, benficaAnnual, portoAnnual, competitorColors]);

  // Transfer Balance (net spending: income - cost)
  const transferBalance = useMemo(() => ({
    labels,
    datasets: [
      {
        label: "Sporting",
        data: annual.map((d) => (d.player_transfer_income ?? 0) - Math.abs(d.player_transfer_cost ?? 0)),
        backgroundColor: annual.map((d) => {
          const val = (d.player_transfer_income ?? 0) - Math.abs(d.player_transfer_cost ?? 0);
          return val >= 0 ? competitorColors.sporting + "B3" : competitorColors.benfica + "B3";
        }),
        borderColor: annual.map((d) => {
          const val = (d.player_transfer_income ?? 0) - Math.abs(d.player_transfer_cost ?? 0);
          return val >= 0 ? competitorColors.sporting : competitorColors.benfica;
        }),
        borderWidth: 1,
        borderRadius: 3,
      },
      {
        label: "Benfica",
        data: annual.map((d) => {
          const bd = findRivalData(benficaAnnual, d.season);
          if (!bd) return null;
          return (bd.player_transfer_income ?? 0) - Math.abs(bd.player_transfer_cost ?? 0);
        }),
        backgroundColor: annual.map((d) => {
          const bd = findRivalData(benficaAnnual, d.season);
          if (!bd) return "transparent";
          const val = (bd.player_transfer_income ?? 0) - Math.abs(bd.player_transfer_cost ?? 0);
          return val >= 0 ? competitorColors.benfica + "B3" : competitorColors.benfica + "50";
        }),
        borderColor: competitorColors.benfica,
        borderWidth: 1,
        borderRadius: 3,
      },
      {
        label: "Porto",
        data: annual.map((d) => {
          const pd = findRivalData(portoAnnual, d.season);
          if (!pd) return null;
          return (pd.player_transfer_income ?? 0) - Math.abs(pd.player_transfer_cost ?? 0);
        }),
        backgroundColor: annual.map((d) => {
          const pd = findRivalData(portoAnnual, d.season);
          if (!pd) return "transparent";
          const val = (pd.player_transfer_income ?? 0) - Math.abs(pd.player_transfer_cost ?? 0);
          return val >= 0 ? competitorColors.porto + "B3" : competitorColors.porto + "50";
        }),
        borderColor: competitorColors.porto,
        borderWidth: 1,
        borderRadius: 3,
      },
    ],
  }), [labels, annual, benficaAnnual, portoAnnual, competitorColors]);

  // Squad value comparison
  const squadValueComparison = useMemo(() => ({
    labels,
    datasets: createCompetitorLineDatasets(
      annual, benficaAnnual, portoAnnual, competitorColors,
      (d) => d.squad_market_value || 0
    ),
  }), [labels, annual, benficaAnnual, portoAnnual, competitorColors]);

  // Net result comparison
  const netResultComparison = useMemo(() => ({
    labels,
    datasets: [
      {
        label: "Sporting",
        data: annual.map((d) => d.net_result),
        borderColor: competitorColors.sporting,
        backgroundColor: competitorColors.sporting + "B3",
        borderWidth: 1,
      },
      {
        label: "Benfica",
        data: annual.map((d) => {
          const bd = findRivalData(benficaAnnual, d.season);
          return bd ? bd.net_result : null;
        }),
        borderColor: competitorColors.benfica,
        backgroundColor: competitorColors.benfica + "B3",
        borderWidth: 1,
      },
      {
        label: "Porto",
        data: annual.map((d) => {
          const pd = findRivalData(portoAnnual, d.season);
          return pd ? pd.net_result : null;
        }),
        borderColor: competitorColors.porto,
        backgroundColor: competitorColors.porto + "B3",
        borderWidth: 1,
      },
    ],
  }), [labels, annual, benficaAnnual, portoAnnual, competitorColors]);

  // Equity comparison
  const equityComparison = useMemo(() => ({
    labels,
    datasets: createCompetitorLineDatasets(
      annual, benficaAnnual, portoAnnual, competitorColors,
      (d) => d.equity
    ),
  }), [labels, annual, benficaAnnual, portoAnnual, competitorColors]);

  // Total liabilities comparison
  const totalLiabilitiesComparison = useMemo(() => ({
    labels,
    datasets: createCompetitorLineDatasets(
      annual, benficaAnnual, portoAnnual, competitorColors,
      (d) => (d.non_current_liabilities + d.current_liabilities)
    ),
  }), [labels, annual, benficaAnnual, portoAnnual, competitorColors]);

  // Chart options for currency charts
  const chartOptions = useMemo(() => ({
    ...baseOpts,
    plugins: {
      ...baseOpts.plugins,
      legend: {
        display: true,
        position: "bottom" as const,
        labels: {
          color: COLORS.muted,
          font: { size: 12 },
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        ...baseOpts.plugins?.tooltip,
        mode: "index" as const,
        intersect: false,
        callbacks: {
          ...(baseOpts.plugins?.tooltip as any)?.callbacks,
          label: (ctx: any) =>
            ` ${ctx.dataset.label}: ${fmtMillions(ctx.parsed.y)}`,
          footer: () => "",
        },
      },
    },
    scales: {
      ...baseOpts.scales,
      y: {
        ...baseOpts.scales?.y,
        ticks: {
          ...baseOpts.scales?.y?.ticks,
          callback: (value: number) => `€${value}M`,
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  }), [baseOpts, COLORS]);

  // Chart options for percentage charts
  const percentageOptions = useMemo(() => ({
    ...baseOpts,
    plugins: {
      ...baseOpts.plugins,
      legend: {
        display: true,
        position: "bottom" as const,
        labels: {
          color: COLORS.muted,
          font: { size: 12 },
          padding: 16,
          usePointStyle: true,
        },
      },
      tooltip: {
        ...baseOpts.plugins?.tooltip,
        mode: "index" as const,
        intersect: false,
        callbacks: {
          ...(baseOpts.plugins?.tooltip as any)?.callbacks,
          label: (ctx: any) =>
            ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}%`,
          footer: () => "",
        },
      },
    },
    scales: {
      ...baseOpts.scales,
      y: {
        ...baseOpts.scales?.y,
        ticks: {
          ...baseOpts.scales?.y?.ticks,
          callback: (value: number) => `${value.toFixed(0)}%`,
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  }), [baseOpts, COLORS]);

  const cumulativeNetResults = useMemo(() => {
    const sportingTotal = annual.reduce((acc, d) => acc + (d.net_result || 0), 0) / 1000;
    const benficaTotal = benficaAnnual.reduce((acc, d) => acc + (d.net_result || 0), 0) / 1000;
    const portoTotal = portoAnnual.reduce((acc, d) => acc + (d.net_result || 0), 0) / 1000;

    return {
      sporting: sportingTotal,
      benfica: benficaTotal,
      porto: portoTotal,
    };
  }, [annual, benficaAnnual, portoAnnual]);

  return {
    labels,
    revenueBySource,
    personnelCostsRatio,
    personnelComparison,
    transferBalance,
    squadValueComparison,
    netResultComparison,
    equityComparison,
    totalLiabilitiesComparison,
    chartOptions,
    percentageOptions,
    competitorColors,
    cumulativeNetResults,
  };
}
