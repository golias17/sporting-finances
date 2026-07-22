import { state } from "../core/state.js";

// CHART ANNOTATIONS — pitch milestones & event markers
// =============================================================

// Static data, hoisted to module scope rather than built inside
// getPitchMilestone() below — that function is wired into every chart's
// shared tooltip footer callback (state.baseOpts.plugins.tooltip.callbacks.footer
// in chartDefaults.js's initChartDefaults()), so it used to re-allocate this
// entire 14-entry bilingual object on every single tooltip update while a
// user hovers any chart in the app, for no reason since none of it depends
// on the call's arguments.
const PITCH_MILESTONES: Record<string, { en: string; pt: string }> = {
  "2012/13": {
    en: "⚽ Pitch: 7th place in Primeira Liga (worst in club history).",
    pt: "⚽ Campo: 7º lugar na Primeira Liga (pior na história do clube).",
  },
  "2013/14": {
    en: "⚽ Pitch: Leonardo Jardim leads team to 2nd place & UCL qualification.",
    pt: "⚽ Campo: Leonardo Jardim lidera equipa ao 2º lugar e qualificação UCL.",
  },
  "2014/15": {
    en: "⚽ Pitch: Marco Silva wins Taça de Portugal.",
    pt: "⚽ Campo: Marco Silva vence Taça de Portugal.",
  },
  "2015/16": {
    en: "⚽ Pitch: Jorge Jesus arrives. Record 86 points, finished 2nd.",
    pt: "⚽ Campo: Jorge Jesus chega. Recorde de 86 pontos, terminou em 2º.",
  },
  "2016/17": {
    en: "⚽ Pitch: 3rd place finish, qualified for UCL group stage.",
    pt: "⚽ Campo: Termina em 3º lugar, qualificação para a fase de grupos UCL.",
  },
  "2017/18": {
    en: "⚽ Pitch: Alcochete academy attack. Taça de Portugal runners-up.",
    pt: "⚽ Campo: Ataque à academia de Alcochete. Finalista vencido da Taça.",
  },
  "2018/19": {
    en: "⚽ Pitch: Marcel Keizer wins Taça de Portugal & Taça da Liga.",
    pt: "⚽ Campo: Marcel Keizer vence Taça de Portugal e Taça da Liga.",
  },
  "2019/20": {
    en: "⚽ Pitch: Rúben Amorim appointed in March for record €10M fee.",
    pt: "⚽ Campo: Rúben Amorim contratado em Março por €10M (recorde).",
  },
  "2020/21": {
    en: "⚽ Pitch: Champions! First Primeira Liga title in 19 years.",
    pt: "⚽ Campo: Campeões! 1º título da Primeira Liga em 19 anos.",
  },
  "2021/22": {
    en: "⚽ Pitch: UCL Round of 16 qualification; won Taça da Liga.",
    pt: "⚽ Campo: Oitavos-de-final da UCL; vence Taça da Liga.",
  },
  "2022/23": {
    en: "⚽ Pitch: 4th place finish; Europa League quarter-finalists.",
    pt: "⚽ Campo: Termina em 4º lugar; Quartos-de-final da Liga Europa.",
  },
  "2023/24": {
    en: "⚽ Pitch: Champions! 20th Primeira Liga title (Gyökeres 29 goals).",
    pt: "⚽ Campo: Campeões! 20º título da Primeira Liga (Gyökeres 29 golos).",
  },
  "2024/25": {
    en: "⚽ Pitch: Amorim departs for Man Utd; João Pereira appointed.",
    pt: "⚽ Campo: Amorim sai para o Man Utd; João Pereira contratado.",
  },
  "2025/26": {
    en: "⚽ Pitch: Title contention under João Pereira.",
    pt: "⚽ Campo: Na luta pelo título sob o comando de João Pereira.",
  },
};

export function getPitchMilestone(season: string) {
  let cleanSeason = season;
  if (
    season.includes("H1") ||
    season.includes("Semestre") ||
    season.includes("2025/26")
  ) {
    cleanSeason = "2025/26";
  }

  const milestone = PITCH_MILESTONES[cleanSeason];
  if (!milestone) return "";

  return state.isPt ? milestone.pt : milestone.en;
}

export function getEventAnnotations(): Record<string, any> {
  return {
    restructure14: {
      x: "2014/15",
      label: state.isPt ? "Reestruturação 2014" : "2014 Capital Restructuring",
      color: state.COLORS.info,
    },
    alcochete: {
      x: "2017/18",
      label: state.isPt ? "Alcochete 2018" : "2018 Alcochete",
      color: state.COLORS.neg,
    },
    covid: { x: "2020/21", label: "COVID", color: state.COLORS.warn },
    vmoc1: {
      x: "2022/23",
      label: state.isPt ? "Conversão VMOC €83,6M" : "€83.6M VMOC conversion",
      color: state.COLORS.green,
    },
    vmoc2: {
      x: "2023/24",
      label: state.isPt ? "Conversão VMOC €51,4M" : "€51.4M VMOC conversion",
      color: state.COLORS.green,
    },
    uspp: {
      x: "2024/25",
      label: state.isPt
        ? "→ Out 2025: USPP de €225M"
        : "→ Oct 2025: €225M USPP",
      color: state.COLORS.green,
    },
  };
}

export function eventBoxes(eventKeys: string[]) {
  const annos: Record<string, any> = {};
  const eventAnnotations = getEventAnnotations();
  // Event markers have a fixed season (e.g. "2014/15") regardless of the
  // active global era filter. The chart's x-axis only has categories for
  // whatever state.annual currently covers, so a marker outside that range
  // has nowhere valid to anchor to — the annotation plugin was clamping it
  // to the nearest edge instead, making it look like it belonged to
  // whichever season happened to be first/last. Drop it instead.
  const visibleSeasons =
    state.annual && state.annual.length > 0
      ? new Set(state.annual.map((d) => d.label))
      : null;
  eventKeys.forEach((k) => {
    const e = eventAnnotations[k];
    if (!e) return;
    if (visibleSeasons && !visibleSeasons.has(e.x)) return;
    annos["e_" + k] = {
      type: "line",
      xMin: e.x,
      xMax: e.x,
      borderColor: e.color,
      borderWidth: 1.5,
      z: -1,
      borderDash: [4, 4],
      label: {
        display: true,
        content: e.label,
        position: "start",
        backgroundColor: e.color,
        color: "#fff",
        font: { size: 10, weight: "600" },
        padding: 4,
        rotation: -90,
        yAdjust: 0,
      },
    };
  });
  return annos;
}
