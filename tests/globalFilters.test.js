import { describe, it, expect, beforeEach, vi } from "vitest";
import { state } from "../src/state.js";
import { initGlobalFilters } from "../src/globalFilters.js";

describe("globalFilters.js", () => {
  beforeEach(() => {
    // Mock the state variables needed
    state.DATASET = {
      annual_data: [
        { label: "2012/13" },
        { label: "2013/14" },
        { label: "2014/15" },
        { label: "2015/16" },
      ],
    };
    state.startSeasonIndex = 0;
    state.endSeasonIndex = 3;

    // Set up DOM
    document.body.innerHTML = `
      <select id="globalStartSeason"></select>
      <select id="globalEndSeason"></select>
      <div id="eraPresets">
        <button class="season-pill" data-start="0" data-end="1" id="preset1"></button>
        <button class="season-pill" data-start="1" data-end="latest" id="presetLatest"></button>
      </div>
    `;
  });

  it("should populate drop downs and select values based on state", () => {
    initGlobalFilters();

    const startSelect = document.getElementById("globalStartSeason");
    const endSelect = document.getElementById("globalEndSeason");

    expect(startSelect.children.length).toBe(4);
    expect(endSelect.children.length).toBe(4);

    expect(startSelect.value).toBe("0");
    expect(endSelect.value).toBe("3");
  });

  it("should disable invalid range choices in dropdowns", () => {
    state.startSeasonIndex = 1;
    state.endSeasonIndex = 2;

    initGlobalFilters();

    const startSelect = document.getElementById("globalStartSeason");
    const endSelect = document.getElementById("globalEndSeason");

    // For Start select: any option index > endSeasonIndex (2) should be disabled
    expect(startSelect.children[0].disabled).toBe(false);
    expect(startSelect.children[1].disabled).toBe(false);
    expect(startSelect.children[2].disabled).toBe(false);
    expect(startSelect.children[3].disabled).toBe(true);

    // For End select: any option index < startSeasonIndex (1) should be disabled
    expect(endSelect.children[0].disabled).toBe(true);
    expect(endSelect.children[1].disabled).toBe(false);
    expect(endSelect.children[2].disabled).toBe(false);
    expect(endSelect.children[3].disabled).toBe(false);
  });

  it("should invoke onFilterChange callback and update state when selects change", () => {
    const callback = vi.fn();
    initGlobalFilters(callback);

    const startSelect = document.getElementById("globalStartSeason");
    startSelect.value = "1";
    startSelect.dispatchEvent(new window.Event("change"));

    expect(state.startSeasonIndex).toBe(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should handle presets clicking and resolve 'latest' keyword", () => {
    const callback = vi.fn();
    initGlobalFilters(callback);

    const presetLatest = document.getElementById("presetLatest");
    presetLatest.click();

    expect(state.startSeasonIndex).toBe(1);
    expect(state.endSeasonIndex).toBe(3); // 'latest' index matches 3
    expect(presetLatest.classList.contains("active")).toBe(true);
    expect(presetLatest.getAttribute("aria-pressed")).toBe("true");
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
