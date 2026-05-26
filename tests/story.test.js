import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { state } from "../src/state.js";
import {
  startStory,
  exitStory,
  nextStory,
  prevStory,
  initStoryMode,
  storyKeyHandler
} from "../src/story.js";
import { chartRegistry } from "../src/charts.js";

// Mock charts.js
vi.mock("../src/charts.js", () => ({
  chartRegistry: {
    get: vi.fn(),
  },
}));

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
    expect(document.getElementById("storyCard").classList.contains("hidden")).toBe(false);
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

  it("should exit story mode when next is clicked on the last step", () => {
    // 11 steps total
    state.storyIndex = 10;
    nextStory();
    expect(document.getElementById("storyCard").classList.contains("hidden")).toBe(true);
  });

  it("should exit story mode", () => {
    startStory();
    exitStory();
    expect(document.getElementById("storyCard").classList.contains("hidden")).toBe(true);
  });

  it("should handle keyboard navigation", () => {
    startStory();
    
    const rightEvent = new window.KeyboardEvent("keydown", { key: "ArrowRight" });
    storyKeyHandler(rightEvent);
    expect(state.storyIndex).toBe(1);

    const leftEvent = new window.KeyboardEvent("keydown", { key: "ArrowLeft" });
    storyKeyHandler(leftEvent);
    expect(state.storyIndex).toBe(0);

    const escEvent = new window.KeyboardEvent("keydown", { key: "Escape" });
    storyKeyHandler(escEvent);
    expect(document.getElementById("storyCard").classList.contains("hidden")).toBe(true);
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
});
