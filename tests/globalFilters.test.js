import { describe, it, expect, beforeEach, vi } from "vitest";
import { state } from "../src/state.js";
import { initGlobalFilters, announceEraChange } from "../src/globalFilters.js";

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
    state.isPt = false;

    // Set up DOM — includes the aria-live announcer from index.html so
    // onChange()'s call to announceEraChange() has somewhere to write.
    document.body.innerHTML = `
      <div id="a11yAnnouncer" aria-live="polite"></div>
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

  describe("announceEraChange()", () => {
    it("writes a localized message into the aria-live announcer", () => {
      state.isPt = false;
      announceEraChange("2012/13", "2015/16");
      expect(document.getElementById("a11yAnnouncer").textContent).toBe(
        "Date range changed to 2012/13 through 2015/16",
      );

      state.isPt = true;
      announceEraChange("2012/13", "2015/16");
      expect(document.getElementById("a11yAnnouncer").textContent).toBe(
        "Período alterado para 2012/13 a 2015/16",
      );
    });

    it("is a no-op when the announcer element or a label is missing", () => {
      document.getElementById("a11yAnnouncer").remove();
      expect(() => announceEraChange("2012/13", "2015/16")).not.toThrow();
    });
  });

  it("announces the new range whenever the era filter changes", () => {
    initGlobalFilters();

    const startSelect = document.getElementById("globalStartSeason");
    startSelect.value = "1";
    startSelect.dispatchEvent(new window.Event("change"));

    expect(document.getElementById("a11yAnnouncer").textContent).toBe(
      "Date range changed to 2013/14 through 2015/16",
    );
  });

  it("should restore era filter index from URL parameters if valid", () => {
    state.urlEraStart = "2013/14";
    state.urlEraEnd = "2014/15";

    initGlobalFilters();

    expect(state.startSeasonIndex).toBe(1);
    expect(state.endSeasonIndex).toBe(2);
    expect(state.urlEraStart).toBeNull();
    expect(state.urlEraEnd).toBeNull();
  });

  it("should ignore invalid/inverted era parameters from URL", () => {
    state.startSeasonIndex = 0;
    state.endSeasonIndex = 3;

    state.urlEraStart = "invalid";
    state.urlEraEnd = "2014/15";
    initGlobalFilters();
    expect(state.startSeasonIndex).toBe(0);
    expect(state.endSeasonIndex).toBe(3);

    state.urlEraStart = "2014/15";
    state.urlEraEnd = "2013/14";
    initGlobalFilters();
    expect(state.startSeasonIndex).toBe(0);
    expect(state.endSeasonIndex).toBe(3);
  });
});
