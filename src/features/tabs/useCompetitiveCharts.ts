import { useMemo } from "react";
import { useAppState } from "../../core/state.js";
import { getBrandColors } from "../../charts/chartUtils.js";

interface CompetitorData {
  label: string;
  color: string;
  data: number[];
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

  // Competitor colors matching Cash Flow by Activity (Green for Sporting, Red/Neg for Benfica, Blue/Info for Porto)
  const brandColors = useMemo(() => getBrandColors(theme === "dark"), [theme]);

  const competitorColors = useMemo(() => ({
    sporting: brandColors.green,
    benfica: brandColors.neg,  // Red (matches Cash Flow Investing)
    porto: brandColors.info,   // Blue (matches Cash Flow Financing)
  }), [brandColors]);

  const labels = useMemo(() => annual.map((d) => d.label || d.season), [annual]);

  // Helper to find data by season
  const findRivalData = (dataset: any[], season: string) => {
    return dataset.find(d => d.season === season || d.year === season);
  };

  // Revenue by Source (stacked bar) - replaces revenueComparison
  const revenueBySource = useMemo(() => ({
    labels,
    datasets: [
      // Sporting - TV
      {
        label: "Sporting - TV & UEFA",
        data: annual.map((d) => (d.rev_tv_comp ?? 0) / 1000),
        backgroundColor: competitorColors.sporting + "B3",
        borderColor: competitorColors.sporting,
        borderWidth: 1,
        borderRadius: 0,
        stack: "sporting",
      },
      // Sporting - Matchday
      {
        label: "Sporting - Bilheteira",
        data: annual.map((d) => (d.rev_matchday ?? 0) / 1000),
        backgroundColor: competitorColors.sporting + "70",
        borderColor: competitorColors.sporting,
        borderWidth: 1,
        borderRadius: 0,
        stack: "sporting",
      },
      // Sporting - Commercial
      {
        label: "Sporting - Comercial",
        data: annual.map((d) => (d.rev_commercial ?? 0) / 1000),
        backgroundColor: competitorColors.sporting + "40",
        borderColor: competitorColors.sporting,
        borderWidth: 1,
        borderRadius: 3,
        stack: "sporting",
      },
      // Benfica - TV
      {
        label: "Benfica - TV & UEFA",
        data: annual.map((d) => {
          const bd = findRivalData(benficaAnnual, d.season);
          return bd ? (bd.rev_tv_comp ?? 0) / 1000 : null;
        }),
        backgroundColor: competitorColors.benfica + "B3",
        borderColor: competitorColors.benfica,
        borderWidth: 1,
        borderRadius: 0,
        stack: "benfica",
      },
      // Benfica - Matchday
      {
        label: "Benfica - Bilheteira",
        data: annual.map((d) => {
          const bd = findRivalData(benficaAnnual, d.season);
          return bd ? (bd.rev_matchday ?? 0) / 1000 : null;
        }),
        backgroundColor: competitorColors.benfica + "70",
        borderColor: competitorColors.benfica,
        borderWidth: 1,
        borderRadius: 0,
        stack: "benfica",
      },
      // Benfica - Commercial
      {
        label: "Benfica - Comercial",
        data: annual.map((d) => {
          const bd = findRivalData(benficaAnnual, d.season);
          return bd ? (bd.rev_commercial ?? 0) / 1000 : null;
        }),
        backgroundColor: competitorColors.benfica + "40",
        borderColor: competitorColors.benfica,
        borderWidth: 1,
        borderRadius: 3,
        stack: "benfica",
      },
      // Porto - TV
      {
        label: "Porto - TV & UEFA",
        data: annual.map((d) => {
          const pd = findRivalData(portoAnnual, d.season);
          return pd ? (pd.rev_tv_comp ?? 0) / 1000 : null;
        }),
        backgroundColor: competitorColors.porto + "B3",
        borderColor: competitorColors.porto,
        borderWidth: 1,
        borderRadius: 0,
        stack: "porto",
      },
      // Porto - Matchday
      {
        label: "Porto - Bilheteira",
        data: annual.map((d) => {
          const pd = findRivalData(portoAnnual, d.season);
          return pd ? (pd.rev_matchday ?? 0) / 1000 : null;
        }),
        backgroundColor: competitorColors.porto + "70",
        borderColor: competitorColors.porto,
        borderWidth: 1,
        borderRadius: 0,
        stack: "porto",
      },
      // Porto - Commercial
      {
        label: "Porto - Comercial",
        data: annual.map((d) => {
          const pd = findRivalData(portoAnnual, d.season);
          return pd ? (pd.rev_commercial ?? 0) / 1000 : null;
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
    datasets: [
      {
        label: "Sporting",
        data: annual.map((d) => {
          if (!d.revenue_operating) return null;
          return (Math.abs(d.personnel_costs) / d.revenue_operating) * 100;
        }),
        borderColor: competitorColors.sporting,
        backgroundColor: competitorColors.sporting + "33",
        tension: 0.3,
        fill: false,
      },
      {
        label: "Benfica",
        data: annual.map((d) => {
          const bd = findRivalData(benficaAnnual, d.season);
          if (!bd || !bd.revenue_operating) return null;
          return (Math.abs(bd.personnel_costs) / bd.revenue_operating) * 100;
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
          if (!pd || !pd.revenue_operating) return null;
          return (Math.abs(pd.personnel_costs) / pd.revenue_operating) * 100;
        }),
        borderColor: competitorColors.porto,
        backgroundColor: competitorColors.porto + "33",
        tension: 0.3,
        fill: false,
      },
    ],
  }), [labels, annual, benficaAnnual, portoAnnual, competitorColors]);

  // Personnel costs comparison (absolute values)
  const personnelComparison = useMemo(() => ({
    labels,
    datasets: [
      {
        label: "Sporting",
        data: annual.map((d) => Math.abs(d.personnel_costs) / 1000),
        borderColor: competitorColors.sporting,
        backgroundColor: competitorColors.sporting + "33",
        tension: 0.3,
        fill: false,
      },
      {
        label: "Benfica",
        data: annual.map((d) => {
          const bd = findRivalData(benficaAnnual, d.season);
          return bd ? Math.abs(bd.personnel_costs) / 1000 : null;
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
          return pd ? Math.abs(pd.personnel_costs) / 1000 : null;
        }),
        borderColor: competitorColors.porto,
        backgroundColor: competitorColors.porto + "33",
        tension: 0.3,
        fill: false,
      },
    ],
  }), [labels, annual, benficaAnnual, portoAnnual, competitorColors]);

  // Transfer Balance (net spending: income - cost)
  const transferBalance = useMemo(() => ({
    labels,
    datasets: [
      {
        label: "Sporting",
        data: annual.map((d) => ((d.player_transfer_income ?? 0) - Math.abs(d.player_transfer_cost ?? 0)) / 1000),
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
          return ((bd.player_transfer_income ?? 0) - Math.abs(bd.player_transfer_cost ?? 0)) / 1000;
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
          return ((pd.player_transfer_income ?? 0) - Math.abs(pd.player_transfer_cost ?? 0)) / 1000;
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
    datasets: [
      {
        label: "Sporting",
        data: annual.map((d) => (d.squad_market_value || 0) / 1000),
        borderColor: competitorColors.sporting,
        backgroundColor: competitorColors.sporting + "33",
        tension: 0.3,
        fill: false,
      },
      {
        label: "Benfica",
        data: annual.map((d) => {
          const bd = findRivalData(benficaAnnual, d.season);
          return bd ? (bd.squad_market_value || 0) / 1000 : null;
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
          return pd ? (pd.squad_market_value || 0) / 1000 : null;
        }),
        borderColor: competitorColors.porto,
        backgroundColor: competitorColors.porto + "33",
        tension: 0.3,
        fill: false,
      },
    ],
  }), [labels, annual, benficaAnnual, portoAnnual, competitorColors]);

  // Net result comparison
  const netResultComparison = useMemo(() => ({
    labels,
    datasets: [
      {
        label: "Sporting",
        data: annual.map((d) => d.net_result / 1000),
        borderColor: competitorColors.sporting,
        backgroundColor: competitorColors.sporting + "B3",
        borderWidth: 1,
      },
      {
        label: "Benfica",
        data: annual.map((d) => {
          const bd = findRivalData(benficaAnnual, d.season);
          return bd ? bd.net_result / 1000 : null;
        }),
        borderColor: competitorColors.benfica,
        backgroundColor: competitorColors.benfica + "B3",
        borderWidth: 1,
      },
      {
        label: "Porto",
        data: annual.map((d) => {
          const pd = findRivalData(portoAnnual, d.season);
          return pd ? pd.net_result / 1000 : null;
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
    datasets: [
      {
        label: "Sporting",
        data: annual.map((d) => d.equity / 1000),
        borderColor: competitorColors.sporting,
        backgroundColor: competitorColors.sporting + "33",
        tension: 0.3,
        fill: false,
      },
      {
        label: "Benfica",
        data: annual.map((d) => {
          const bd = findRivalData(benficaAnnual, d.season);
          return bd ? bd.equity / 1000 : null;
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
          return pd ? pd.equity / 1000 : null;
        }),
        borderColor: competitorColors.porto,
        backgroundColor: competitorColors.porto + "33",
        tension: 0.3,
        fill: false,
      },
    ],
  }), [labels, annual, benficaAnnual, portoAnnual, competitorColors]);

  // Total liabilities comparison
  const totalLiabilitiesComparison = useMemo(() => ({
    labels,
    datasets: [
      {
        label: "Sporting",
        data: annual.map((d) => (d.non_current_liabilities + d.current_liabilities) / 1000),
        borderColor: competitorColors.sporting,
        backgroundColor: competitorColors.sporting + "33",
        tension: 0.3,
        fill: false,
      },
      {
        label: "Benfica",
        data: annual.map((d) => {
          const bd = findRivalData(benficaAnnual, d.season);
          return bd ? (bd.non_current_liabilities + bd.current_liabilities) / 1000 : null;
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
          return pd ? (pd.non_current_liabilities + pd.current_liabilities) / 1000 : null;
        }),
        borderColor: competitorColors.porto,
        backgroundColor: competitorColors.porto + "33",
        tension: 0.3,
        fill: false,
      },
    ],
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
