import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { state } from "../src/state.js";
import {
  startStory,
  exitStory,
  nextStory,
  prevStory,
  initStoryMode,
} from "../src/story.js";
import { chartRegistry } from "../src/chartUtils.js";

// story.js reads chartRegistry from chartUtils.js; in jsdom the registry is
// simply empty, so the hero-chart highlight paths are safely skipped — no
// module mock needed.

describe("story.js", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="btnStartStory"></button>
      <button id="btnPrevStory"></button>
      <button id="btnNextStory"></button>
      <button id="btnExitStory"></button>
      <div id="storyCard" class="hidden"></div>
      <div id="storyContentWrap"></div>
      <div id="storySeason"></div>
      <div id="storyTitle"></div>
      <div id="storyNarrative"></div>
      <div id="storyCounter"></div>
      <div id="storyFill"></div>
      <div id="storyTrack"></div>
    `;

    state.isPt = false;
    state.storyIndex = 0;

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("should initialize story mode events", () => {
    initStoryMode();
    // Start story
    document.getElementById("btnStartStory").click();
    expect(
      document.getElementById("storyCard").classList.contains("hidden"),
    ).toBe(false);
  });

  it("should navigate through story steps", () => {
    startStory();
    vi.runAllTimers();
    expect(state.storyIndex).toBe(0);

    nextStory();
    vi.runAllTimers();
    expect(state.storyIndex).toBe(1);

    prevStory();
    vi.runAllTimers();
    expect(state.storyIndex).toBe(0);
  });

  it("should open at the requested step when startStory receives an index (deep link)", () => {
    startStory(4);
    vi.runAllTimers();
    expect(state.storyIndex).toBe(4);
  });

  it("should clamp an out-of-range start index to the last step", () => {
    startStory(999);
    vi.runAllTimers();
    expect(state.storyIndex).toBe(10); // last of the 11 steps
  });

  it("should exit story mode when next is clicked on the last step", () => {
    // 11 steps total
    state.storyIndex = 10;
    nextStory();
    expect(
      document.getElementById("storyCard").classList.contains("hidden"),
    ).toBe(true);
  });

  it("should exit story mode", () => {
    startStory();
    exitStory();
    expect(
      document.getElementById("storyCard").classList.contains("hidden"),
    ).toBe(true);
  });

  it("should handle keyboard navigation", () => {
    startStory(); // attaches the keydown listener

    document.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "ArrowRight" }),
    );
    expect(state.storyIndex).toBe(1);

    document.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "ArrowLeft" }),
    );
    expect(state.storyIndex).toBe(0);

    document.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Escape" }),
    );
    expect(
      document.getElementById("storyCard").classList.contains("hidden"),
    ).toBe(true);
  });

  it("should handle clicks on the story track to jump to steps", () => {
    initStoryMode();
    const track = document.getElementById("storyTrack");

    // Mock getBoundingClientRect
    track.getBoundingClientRect = () => ({
      left: 0,
      width: 1000,
    });

    // click at 50% width -> should be middle of the 11 steps -> index 5
    const clickEvent = new window.MouseEvent("click", { clientX: 500 });
    track.dispatchEvent(clickEvent);

    expect(state.storyIndex).toBe(5);
  });

  it("should update story texts successfully even if storyContentWrap is missing", () => {
    document.getElementById("storyContentWrap").remove();
    startStory();
    expect(document.getElementById("storyTitle").textContent).not.toBe("");
  });

  it("should add or delete story highlight annotations based on whether step season is in range", () => {
    const mockChart = {
      options: {
        plugins: {
          annotation: {
            annotations: {}
          }
        }
      },
      update: vi.fn()
    };
    chartRegistry.set("chartHero", mockChart);

    // 1. In range path (season of step 0 is '2012/13')
    state.DATASET = {
      annual_data: [{ label: "2012/13" }]
    };
    state.startSeasonIndex = 0;
    state.endSeasonIndex = 0;
    startStory(0);
    expect(mockChart.options.plugins.annotation.annotations.storyHighlight).toBeDefined();
    expect(mockChart.options.plugins.annotation.annotations.storyHighlight.xMin).toBe("2012/13");
    expect(mockChart.update).toHaveBeenCalled();

    // 2. Out of range path (season '2012/13' is not in state.annual)
    state.DATASET = {
      annual_data: [{ label: "2024/25" }]
    };
    startStory(0);
    expect(mockChart.options.plugins.annotation.annotations.storyHighlight).toBeUndefined();

    // Clean up
    chartRegistry.delete("chartHero");
  });

  it("should remove story highlight annotation from chart when exiting story mode", () => {
    const mockChart = {
      options: {
        plugins: {
          annotation: {
            annotations: {
              storyHighlight: {}
            }
          }
        }
      },
      update: vi.fn()
    };
    chartRegistry.set("chartHero", mockChart);

    exitStory();

    expect(mockChart.options.plugins.annotation.annotations.storyHighlight).toBeUndefined();
    expect(mockChart.update).toHaveBeenCalled();

    // Clean up
    chartRegistry.delete("chartHero");
  });
});
