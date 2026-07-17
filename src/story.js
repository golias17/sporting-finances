import { state } from "./state.js";
// chartRegistry comes from chartUtils.js (where it's defined) rather than
// via charts.js — keeps Chart.js and every chart builder out of this
// module's import graph.
import { chartRegistry } from "./chartUtils.js";
import { syncStateToUrl } from "./urlSync.js";
import { STORY_STEPS } from "./storySteps.js";

// `startIndex` lets a ?story=N deep link open the story at the right step —
// startStory() used to always reset to 0, so main.js restoring a shared URL
// silently landed on step 1 no matter what N said. Clamped so an
// out-of-range value can never index past the last step.
export function startStory(startIndex = 0) {
  const idx = Math.min(Math.max(0, startIndex), STORY_STEPS.length - 1);
  state.setStoryIndex(idx);
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
    // Only draw the highlight when the step's season is actually on the
    // chart's x-axis. With a narrowed era filter the season may be out of
    // range, and the annotation plugin would clamp the line to the nearest
    // edge — visually attaching the step to the wrong season. Same rationale
    // as eventBoxes() in chartUtils.js.
    const inRange =
      state.annual && state.annual.some((d) => d.label === step.season);
    if (inRange) {
      heroChart.options.plugins.annotation.annotations.storyHighlight = {
        type: "line",
        xMin: step.season,
        xMax: step.season,
        borderColor: "rgba(200,169,81,0.95)",
        borderWidth: 3,
        label: { display: false },
      };
    } else {
      delete heroChart.options.plugins.annotation.annotations.storyHighlight;
    }
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
    .addEventListener("click", () => startStory());
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
