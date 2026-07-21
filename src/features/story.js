import { state } from "../core/state.js";
// chartRegistry comes from chartUtils.js (where it's defined) rather than
// via charts.js — keeps Chart.js and every chart builder out of this
// module's import graph.
import { chartRegistry } from "../charts/chartUtils.js";
import { syncStateToUrl } from "../utils/urlSync.js";
import { STORY_STEPS } from "./storySteps.js";

// Tracks updateStoryStep()'s pending fade-out/fade-in timeout so it can be
// cancelled — see the comment inside updateStoryStep() for why.
let pendingStoryStepTimeout = null;

// `startIndex` lets a ?story=N deep link open the story at the right step —
// startStory() used to always reset to 0, so main.js restoring a shared URL
// silently landed on step 1 no matter what N said. Clamped so an
// out-of-range value can never index past the last step.
export function startStory(startIndex = 0) {
  const storyCard = document.getElementById("storyCard");
  const btnStartStory = document.getElementById("btnStartStory");
  if (!storyCard || !btnStartStory) return;

  const idx = Math.min(Math.max(0, startIndex), STORY_STEPS.length - 1);
  state.setStoryIndex(idx);
  storyCard.classList.remove("hidden");
  btnStartStory.classList.add("hidden");
  document.removeEventListener("keydown", storyKeyHandler);
  document.addEventListener("keydown", storyKeyHandler);
  updateStoryStep();
}

export function exitStory() {
  const storyCard = document.getElementById("storyCard");
  const btnStartStory = document.getElementById("btnStartStory");
  if (!storyCard || !btnStartStory) return;

  storyCard.classList.add("hidden");
  btnStartStory.classList.remove("hidden");
  document.removeEventListener("keydown", storyKeyHandler);
  // Cancel any fade-out/fade-in still pending from a step change right
  // before exiting — otherwise it fires after the card is hidden and
  // silently writes stale season/title/narrative text into DOM nodes the
  // user can no longer see, ready to flash briefly on the next startStory().
  if (pendingStoryStepTimeout) {
    clearTimeout(pendingStoryStepTimeout);
    pendingStoryStepTimeout = null;
  }
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

  // storyContentWrap is optional — fetched separately below and only used
  // for the fade transition, matching its existing conditional handling.
  // Everything else here is essential; fetched once each (this used to call
  // getElementById("btnPrevStory") three separate times, and
  // ("btnNextStory") twice) and guarded together rather than letting a
  // missing one throw partway through updating the rest.
  const storySeason = document.getElementById("storySeason");
  const storyTitle = document.getElementById("storyTitle");
  const storyNarrative = document.getElementById("storyNarrative");
  const storyCounter = document.getElementById("storyCounter");
  const storyFill = document.getElementById("storyFill");
  const btnPrevStory = document.getElementById("btnPrevStory");
  const btnNextStory = document.getElementById("btnNextStory");
  if (
    !storySeason ||
    !storyTitle ||
    !storyNarrative ||
    !storyCounter ||
    !storyFill ||
    !btnPrevStory ||
    !btnNextStory
  ) {
    return;
  }

  const wrap = document.getElementById("storyContentWrap");
  const tTitle = step.title[state.isPt ? "pt" : "en"];
  const tNarrative = step.narrative[state.isPt ? "pt" : "en"];

  if (wrap) {
    // Rapid Next/Prev clicks (or held-down arrow keys, via storyKeyHandler)
    // call this on every step change, each queuing its own 220ms timeout.
    // Without cancelling the previous one, an older call's timeout could
    // resolve after a newer one and stomp the newer step's text/fade class
    // back with stale content for a frame. Only the most recently scheduled
    // update should ever land.
    if (pendingStoryStepTimeout) {
      clearTimeout(pendingStoryStepTimeout);
    }
    wrap.classList.add("story-fade-out");
    wrap.classList.remove("story-fade-in");
    pendingStoryStepTimeout = setTimeout(() => {
      storySeason.textContent = step.season;
      storyTitle.textContent = tTitle;
      storyNarrative.textContent = tNarrative;
      wrap.classList.remove("story-fade-out");
      wrap.classList.add("story-fade-in");
      pendingStoryStepTimeout = null;
    }, 220);
  } else {
    storySeason.textContent = step.season;
    storyTitle.textContent = tTitle;
    storyNarrative.textContent = tNarrative;
  }

  storyCounter.textContent = `${state.storyIndex + 1} / ${total}`;
  storyFill.style.width = `${((state.storyIndex + 1) / total) * 100}%`;
  btnPrevStory.disabled = state.storyIndex === 0;
  btnPrevStory.textContent = state.isPt ? "← Ant" : "← Prev";
  btnPrevStory.setAttribute(
    "aria-label",
    state.isPt ? "Passo anterior da história" : "Previous story step",
  );
  btnNextStory.textContent =
    state.storyIndex === total - 1
      ? state.isPt
        ? "Concluir"
        : "Finish"
      : state.isPt
        ? "Seguinte →"
        : "Next →";
  btnNextStory.setAttribute(
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
  const btnStartStory = document.getElementById("btnStartStory");
  const btnPrevStory = document.getElementById("btnPrevStory");
  const btnNextStory = document.getElementById("btnNextStory");
  const btnExitStory = document.getElementById("btnExitStory");
  if (!btnStartStory || !btnPrevStory || !btnNextStory || !btnExitStory) return;

  btnStartStory.addEventListener("click", () => startStory());
  btnPrevStory.addEventListener("click", prevStory);
  btnNextStory.addEventListener("click", nextStory);
  btnExitStory.addEventListener("click", exitStory);

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
