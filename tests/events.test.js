import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { state } from "../src/state.js";
import { initEventFilter, syncEventsFilter } from "../src/events.js";

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
    state.activeEventFilter = "all";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize event filters and handle click events", () => {
    initEventFilter();
    
    const buttons = document.querySelectorAll(".event-legend .el-filter");
    
    // Click 'on-pitch' filter
    buttons[1].click();
    expect(state.activeEventFilter).toBe("on-pitch");
    expect(buttons[0].classList.contains("active")).toBe(false);
    expect(buttons[1].classList.contains("active")).toBe(true);

    const event1 = document.querySelector("#eventsList .event.on-pitch");
    const event2 = document.querySelector("#eventsList .event.off-pitch");
    
    expect(event1.classList.contains("hidden")).toBe(false);
    expect(event2.classList.contains("hidden")).toBe(true);
  });

  it("should sync events with current filter", () => {
    state.activeEventFilter = "off-pitch";
    syncEventsFilter();

    const event1 = document.querySelector("#eventsList .event.on-pitch");
    const event2 = document.querySelector("#eventsList .event.off-pitch");

    expect(event1.classList.contains("hidden")).toBe(true);
    expect(event2.classList.contains("hidden")).toBe(false);

    state.activeEventFilter = "all";
    syncEventsFilter();

    expect(event1.classList.contains("hidden")).toBe(false);
    expect(event2.classList.contains("hidden")).toBe(false);
  });
});
