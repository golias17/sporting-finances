import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { state } from "../../src/core/state.js";

describe("events.js", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="event-legend">
        <button data-filter="all" class="el-filter active">All</button>
        <button data-filter="on-pitch" class="el-filter">On Pitch</button>
        <button data-filter="off-pitch" class="el-filter">Off Pitch</button>
      </div>
      <div id="eventsList">
        <div class="event on-pitch">Event 1</div>
        <div class="event off-pitch">Event 2</div>
      </div>
    `;
    state.setActiveEventFilter("all");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should manage event filter state via Zustand", () => {
    // Initial state
    expect(state.activeEventFilter).toBe("all");

    // Set filter
    state.setActiveEventFilter("on-pitch");
    expect(state.activeEventFilter).toBe("on-pitch");

    // Reset filter
    state.setActiveEventFilter("all");
    expect(state.activeEventFilter).toBe("all");
  });

  it("should support all filter values", () => {
    const filters = ["all", "on-pitch", "off-pitch", "win", "crisis", "restructure"];
    filters.forEach((filter) => {
      state.setActiveEventFilter(filter);
      expect(state.activeEventFilter).toBe(filter);
    });
  });

  it("should allow resetting filter to default", () => {
    state.setActiveEventFilter("crisis");
    expect(state.activeEventFilter).toBe("crisis");

    state.setActiveEventFilter("all");
    expect(state.activeEventFilter).toBe("all");
  });
});
