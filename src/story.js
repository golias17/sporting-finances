import { state } from "./state.js";
import { chartRegistry } from "./charts.js";
import { syncStateToUrl } from "./urlSync.js";

const STORY_STEPS = [
  {
    season: "2012/13",
    title: {
      en: "Rock bottom",
      pt: "Fundo do poço",
    },
    narrative: {
      en: "Sporting had €1.3M in cash — less than a week's wage bill. Equity was -€119M, meaning the club couldn't cover its debts even if it sold everything. Short-term liabilities were 7× current assets. There was no European football. This is where the story starts.",
      pt: "O Sporting tinha 1,3 M€ em caixa — menos do que a folha salarial de uma semana. Os capitais próprios eram de -119 M€, o que significava que o clube não conseguiria cobrir as suas dívidas mesmo que vendesse tudo. O passivo de curto prazo era 7 vezes superior ao ativo corrente. Não havia competições europeias. É aqui que a história começa.",
    },
  },
  {
    season: "2013/14",
    title: {
      en: "Holding on",
      pt: "Aguentar a pressão",
    },
    narrative: {
      en: "A year of pure survival. Revenue crept up to €35M but the financial position barely moved. Net profit was a paper-thin €368,000. The squad was gutted, debt was enormous, and the club needed a structural solution — not just a good transfer window.",
      pt: "Um ano de pura sobrevivência. A receita operacional subiu ligeiramente para 35 M€, mas a situação financeira quase não se moveu. O resultado líquido foi um lucro insignificante de 368.000 €. O plantel foi reduzido, a dívida era enorme e o clube precisava de uma solução estrutural — e não apenas de uma boa janela de transferências.",
    },
  },
  {
    season: "2014/15",
    title: {
      en: "The lifeline",
      pt: "A tábua de salvação",
    },
    narrative: {
      en: "November 2014 changed everything. A capital restructuring plus mandatorily-convertible bonds (VMOCs) pushed short-term debt out by years and gave the club room to breathe. Equity turned positive (+€7M) for the first time. Revenue jumped to €58M. Sporting could plan again.",
      pt: "Novembro de 2014 mudou tudo. Uma reestruturação financeira e a emissão de VMOCs empurraram a dívida de curto prazo por vários anos e deram balão de oxigénio ao clube. O capital próprio tornou-se positivo (+7 M€) pela primeira vez. A receita operacional saltou para 58 M€. O Sporting podia voltar a planear.",
    },
  },
  {
    season: "2016/17",
    title: {
      en: "The golden year",
      pt: "O ano dourado",
    },
    narrative: {
      en: "The best financial season of the era — so far. €93M in player sales including João Mário (€40M to Inter) and Islam Slimani (€30.5M to Leicester). A €30.5M net profit. Champions League football. Everything was pointing up. Nobody knew what was 12 months away.",
      pt: "A melhor época financeira da era — até então. 93 M€ em vendas de jogadores, incluindo João Mário (40 M€ para o Inter) e Islam Slimani (30,5 M€ para o Leicester). Um resultado líquido positivo de 30,5 M€. Presença na Liga dos Campeões. Tudo corria de feição. Ninguém imaginava o que aconteceria 12 meses depois.",
    },
  },
  {
    season: "2017/18",
    title: {
      en: "The attack",
      pt: "O ataque",
    },
    narrative: {
      en: "On 15 May 2018, a mob stormed the Alcochete training ground. Rui Patrício, William Carvalho, Gelson Martins and others activated just-cause clauses and left for free. The best squad in years was gone overnight. Equity crashed to -€13M. Bruno de Carvalho was impeached. It would take four years to recover.",
      pt: "A 15 de Maio de 2018, a Academia de Alcochete foi invadida. Rui Patrício, William Carvalho, Gelson Martins e outros rescindiram por justa causa e saíram a custo zero. O melhor plantel em anos desmoronou-se da noite para o dia. O capital próprio caiu para -13 M€. Bruno de Carvalho foi destituído. Seriam necessários quatro anos para recuperar.",
    },
  },
  {
    season: "2019/20",
    title: {
      en: "Bruno says goodbye",
      pt: "A despedida de Bruno",
    },
    narrative: {
      en: "The year COVID arrived — and the year Bruno Fernandes left for €55M. Despite empty stadiums in the final months, €107M in total transfer income made this a surprisingly strong financial year (+€12.5M net result). Rúben Amorim was appointed mid-season. The rebuild had a new architect.",
      pt: "O ano em que o COVID chegou — e o ano em que Bruno Fernandes saiu por 55 M€. Apesar dos estádios vazios nos meses finais, os 107 M€ em receitas totais de transferências tornaram este um ano financeiro surpreendentemente forte (+12,5 M€ de resultado líquido). Rúben Amorim foi contratado a meio da época. A reconstrução tinha um novo arquiteto.",
    },
  },
  {
    season: "2020/21",
    title: {
      en: "Title in the silence",
      pt: "Título no silêncio",
    },
    narrative: {
      en: "The worst financial year in the dataset (-€33M net result, equity at its lowest ever: -€41M) — and the best sporting moment in 19 years. On 11 May 2021, Rúben Amorim's squad won the Liga in front of empty stands. The trophy didn't show up in the accounts. The turnaround would start the next season.",
      pt: "O pior ano financeiro do conjunto de dados (-33 M€ de resultado líquido, capitais próprios no nível mais baixo de sempre: -41 M€) — e o melhor momento desportivo em 19 anos. A 11 de Maio de 2021, o plantel de Rúben Amorim sagrou-se campeão nacional sem adeptos nas bancadas. O troféu não se refletiu nas contas. A reviravolta começaria na época seguinte.",
    },
  },
  {
    season: "2021/22",
    title: {
      en: "The comeback",
      pt: "A recuperação",
    },
    narrative: {
      en: "Fans back, Champions League, and a revenue jump from €64M to €123M in a single year — the biggest one-year leap in the dataset. The recurring business finally turned profitable on its own for the first time since 2014/15. After years of financial pain, the model was starting to work.",
      pt: "Regresso dos adeptos, Liga dos Campeões e um salto na receita de 64 M€ para 123 M€ num só ano — o maior crescimento anual do conjunto de dados. A atividade recorrente tornou-se finalmente lucrativa por si só, pela primeira vez desde 2014/15. Após anos de sofrimento financeiro, o modelo começava a funcionar.",
    },
  },
  {
    season: "2022/23",
    title: {
      en: "The debt disappears",
      pt: "A dívida desaparece",
    },
    narrative: {
      en: "€83.6M of the 2014 convertible bonds converted into share capital — debt erased at a stroke. Equity crossed zero for the first time since 2017. Manuel Ugarte sold to PSG for €60M. Financial expenses fell sharply. For the first time, Sporting's balance sheet looked like a club that could sustain itself.",
      pt: "Conversão em capital de 83,6 M€ das obrigações convertíveis (VMOCs) de 2014 — dívida eliminada de uma só vez. Capitais próprios acima de zero pela primeira vez desde 2017. Venda de Manuel Ugarte ao PSG por 60 M€. Os custos financeiros caíram drasticamente. Pela primeira vez, o balanço do Sporting era de um clube sustentável.",
    },
  },
  {
    season: "2023/24",
    title: {
      en: "The record",
      pt: "O recorde",
    },
    narrative: {
      en: "€144M in player transfer income — a new all-time high. Manuel Ugarte to PSG for €60M, Pedro Porro to Spurs for €43M. The second Liga title in three years under Rúben Amorim, who then left for Manchester United in November. In December, the second €51.4M VMOC conversion took equity to +€21M. The machine was running at full speed.",
      pt: "144 M€ em receitas de transferências — um novo recorde histórico. Manuel Ugarte para o PSG por 60 M€, Pedro Porro para o Spurs por 43 M€. Segundo título de campeão em três anos sob o comando de Rúben Amorim, que depois sairia para o Manchester United em Novembro. Em Dezembro, a segunda conversão de VMOCs de 51,4 M€ elevou os capitais próprios para +21 M€. A máquina funcionava a toda a velocidade.",
    },
  },
  {
    season: "2024/25",
    title: {
      en: "Investment grade",
      pt: "Grau de investimento",
    },
    narrative: {
      en: "Three Liga titles in five years. Gyökeres sold to Arsenal for €65.8M. Revenue at €148M — 130% higher than five years prior. Wage bill ratio at its healthiest ever. And in October 2025, Sporting became the first Portuguese club with investment-grade bond ratings from Fitch and DBRS. The transformation is complete.",
      pt: "Três campeonatos em cinco anos. Venda de Gyökeres ao Arsenal por 65,8 M€. Receitas operacionais em 148 M€ — 130% acima de há cinco anos. Rácio de massa salarial no nível mais saudável de sempre. E em Outubro de 2025, o Sporting tornou-se o primeiro clube português com rating de grau de investimento para obrigações pela Fitch e DBRS. A transformação está concluída.",
    },
  },
];

export function startStory() {
  state.setStoryIndex(0);
  document.getElementById("storyCard").classList.remove("hidden");
  document.getElementById("btnStartStory").classList.add("hidden");
  document.removeEventListener("keydown", storyKeyHandler);
  document.addEventListener("keydown", storyKeyHandler);
  updateStoryStep();
}

export function exitStory() {
  document.getElementById("storyCard").classList.add("hidden");
  document.getElementById("btnStartStory").classList.remove("hidden");
  document.removeEventListener("keydown", storyKeyHandler);
  const heroChart = chartRegistry.get("chartHero");
  if (heroChart && heroChart.options.plugins.annotation) {
    delete heroChart.options.plugins.annotation.annotations.storyHighlight;
    heroChart.update("none");
  }
  syncStateToUrl();
}

function storyKeyHandler(e) {
  if (e.key === "ArrowRight") {
    e.preventDefault();
    nextStory();
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    prevStory();
  } else if (e.key === "Escape") {
    exitStory();
  }
}

export function updateStoryStep() {
  const steps = STORY_STEPS;
  const step = steps[state.storyIndex];
  const total = steps.length;

  const wrap = document.getElementById("storyContentWrap");
  const tTitle = step.title[state.isPt ? "pt" : "en"];
  const tNarrative = step.narrative[state.isPt ? "pt" : "en"];

  if (wrap) {
    wrap.classList.add("story-fade-out");
    wrap.classList.remove("story-fade-in");
    setTimeout(() => {
      document.getElementById("storySeason").textContent = step.season;
      document.getElementById("storyTitle").textContent = tTitle;
      document.getElementById("storyNarrative").textContent = tNarrative;
      wrap.classList.remove("story-fade-out");
      wrap.classList.add("story-fade-in");
    }, 220);
  } else {
    document.getElementById("storySeason").textContent = step.season;
    document.getElementById("storyTitle").textContent = tTitle;
    document.getElementById("storyNarrative").textContent = tNarrative;
  }

  document.getElementById("storyCounter").textContent =
    `${state.storyIndex + 1} / ${total}`;
  document.getElementById("storyFill").style.width =
    `${((state.storyIndex + 1) / total) * 100}%`;
  document.getElementById("btnPrevStory").disabled = state.storyIndex === 0;
  document.getElementById("btnPrevStory").textContent = state.isPt
    ? "← Ant"
    : "← Prev";
  document
    .getElementById("btnPrevStory")
    .setAttribute(
      "aria-label",
      state.isPt ? "Passo anterior da história" : "Previous story step",
    );
  document.getElementById("btnNextStory").textContent =
    state.storyIndex === total - 1
      ? state.isPt
        ? "Concluir"
        : "Finish"
      : state.isPt
        ? "Seguinte →"
        : "Next →";
  document
    .getElementById("btnNextStory")
    .setAttribute(
      "aria-label",
      state.storyIndex === total - 1
        ? state.isPt
          ? "Concluir e fechar a história"
          : "Finish and close story"
        : state.isPt
          ? "Passo seguinte da história"
          : "Next story step",
    );

  const heroChart = chartRegistry.get("chartHero");
  if (heroChart && heroChart.options.plugins.annotation) {
    heroChart.options.plugins.annotation.annotations.storyHighlight = {
      type: "line",
      xMin: step.season,
      xMax: step.season,
      borderColor: "rgba(200,169,81,0.95)",
      borderWidth: 3,
      label: { display: false },
    };
    heroChart.update("none");
  }
  syncStateToUrl();
}

export function nextStory() {
  const steps = STORY_STEPS;
  if (state.storyIndex >= steps.length - 1) {
    exitStory();
    return;
  }
  state.setStoryIndex(state.storyIndex + 1);
  updateStoryStep();
}

export function prevStory() {
  if (state.storyIndex > 0) {
    state.setStoryIndex(state.storyIndex - 1);
    updateStoryStep();
  }
}

export function initStoryMode() {
  document
    .getElementById("btnStartStory")
    .addEventListener("click", startStory);
  document.getElementById("btnPrevStory").addEventListener("click", prevStory);
  document.getElementById("btnNextStory").addEventListener("click", nextStory);
  document.getElementById("btnExitStory").addEventListener("click", exitStory);

  const storyTrack = document.getElementById("storyTrack");
  if (storyTrack) {
    storyTrack.addEventListener("click", (e) => {
      const steps = STORY_STEPS;
      const rect = storyTrack.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const ratio = clickX / width;
      const newIndex = Math.min(
        steps.length - 1,
        Math.max(0, Math.floor(ratio * steps.length)),
      );
      state.setStoryIndex(newIndex);
      updateStoryStep();
    });
  }
}
