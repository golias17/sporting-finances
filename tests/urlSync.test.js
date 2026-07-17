import { describe, it, expect, beforeEach, vi } from "vitest";
import { state } from "../src/state.js";
import { applyUrlParams, syncStateToUrl } from "../src/urlSync.js";

describe("urlSync.js", () => {
  beforeEach(() => {
    // Reset state before each test
    state.DATASET = {
      annual_data: [
        { label: "2012/13" },
        { label: "2013/14" },
        { label: "2014/15" },
        { label: "2024/25" },
      ],
    };
    state.startSeasonIndex = 0;
    state.endSeasonIndex = 3;
    state.healthBarIdx = null;
    state.storyIndex = 0;
    state.urlStoryActive = false;
    state.urlCmpA = null;
    state.urlCmpB = null;
    state.urlHealthSeason = null;
    state.urlEraStart = null;
    state.urlEraEnd = null;
    state.isPt = false;

    // Reset location and mocks
    vi.stubGlobal("location", {
      search: "",
      pathname: "/",
      hash: "",
    });
    vi.stubGlobal("history", {
      replaceState: vi.fn(),
    });
  });

  it("applyUrlParams should restore default overview tab if no parameters are present", () => {
    const tab = applyUrlParams();
    expect(tab).toBe("overview");
    expect(state.urlStoryActive).toBe(false);
  });

  it("applyUrlParams should restore active tab and story from query params", () => {
    vi.stubGlobal("location", {
      search: "?tab=overview&story=3&lang=pt",
      pathname: "/",
      hash: "",
    });

    const tab = applyUrlParams();
    expect(tab).toBe("overview");
    expect(state.isPt).toBe(true);
    expect(state.storyIndex).toBe(2);
    expect(state.urlStoryActive).toBe(true);
  });

  it("applyUrlParams should restore comparison seasons", () => {
    vi.stubGlobal("location", {
      search: "?tab=compare&s1=2012/13&s2=2014/15",
      pathname: "/",
      hash: "",
    });

    const tab = applyUrlParams();
    expect(tab).toBe("compare");
    expect(state.urlCmpA).toBe("2012/13");
    expect(state.urlCmpB).toBe("2014/15");
  });

  it("applyUrlParams should restore healthcheck season", () => {
    vi.stubGlobal("location", {
      search: "?tab=healthcheck&healthSeason=2013/14",
      pathname: "/",
      hash: "",
    });

    const tab = applyUrlParams();
    expect(tab).toBe("healthcheck");
    expect(state.urlHealthSeason).toBe("2013/14");
  });

  it("syncStateToUrl should persist healthSeason from the Overview KPI-strip selector, not just the Healthcheck tab's own one", () => {
    // Both selectors read/write the same state.healthBarIdx (see
    // globalFilters.js / health.js's initKpiSeasonSelector) — the URL sync
    // used to only recognise the Healthcheck tab's selection, silently
    // losing whatever season was picked via Overview's on a refresh.
    document.body.innerHTML = `
      <nav class="tabs">
        <button class="active" data-tab="overview"></button>
      </nav>
    `;
    state.healthBarIdx = 1; // "2013/14"

    syncStateToUrl();

    const callArgs = vi.mocked(history.replaceState).mock.calls[0];
    const urlString = callArgs[2];
    expect(urlString).toContain("tab=overview");
    expect(urlString).toContain("healthSeason=2013%2F14");
  });

  it("syncStateToUrl should not persist healthSeason on tabs where it isn't in play", () => {
    document.body.innerHTML = `
      <nav class="tabs">
        <button class="active" data-tab="revenue"></button>
      </nav>
    `;
    state.healthBarIdx = 1;

    syncStateToUrl();

    const callArgs = vi.mocked(history.replaceState).mock.calls[0];
    const urlString = callArgs[2];
    expect(urlString).not.toContain("healthSeason");
  });

  it("applyUrlParams should stash the era filter range for initGlobalFilters", () => {
    vi.stubGlobal("location", {
      search: "?eraStart=2013/14&eraEnd=2014/15",
      pathname: "/",
      hash: "",
    });

    applyUrlParams();
    expect(state.urlEraStart).toBe("2013/14");
    expect(state.urlEraEnd).toBe("2014/15");
  });

  it("syncStateToUrl should persist a narrowed era range and omit the full range", () => {
    document.body.innerHTML = `
      <nav class="tabs">
        <button class="active" data-tab="revenue"></button>
      </nav>
    `;

    // Full range → no era params
    syncStateToUrl();
    let urlString = vi.mocked(history.replaceState).mock.calls.at(-1)?.[2];
    // With nothing to change, replaceState may not even be called — either
    // way the URL must not contain era params.
    if (urlString) expect(urlString).not.toContain("eraStart");

    // Narrowed range → labels persisted
    state.startSeasonIndex = 1;
    state.endSeasonIndex = 2;
    syncStateToUrl();
    urlString = vi.mocked(history.replaceState).mock.calls.at(-1)[2];
    expect(urlString).toContain("eraStart=2013%2F14");
    expect(urlString).toContain("eraEnd=2014%2F15");
  });

  it("syncStateToUrl should push state elements back into URL parameters", () => {
    // Setup elements on document body to mimic DOM
    document.body.innerHTML = `
      <nav class="tabs">
        <button class="active" data-tab="compare"></button>
      </nav>
      <select id="compareSeasonA"><option selected>2012/13</option></select>
      <select id="compareSeasonB"><option selected>2024/25</option></select>
    `;

    syncStateToUrl();

    expect(history.replaceState).toHaveBeenCalled();
    const callArgs = vi.mocked(history.replaceState).mock.calls[0];
    const urlString = callArgs[2];
    expect(urlString).toContain("tab=compare");
    expect(urlString).toContain("s1=2012%2F13");
    expect(urlString).toContain("s2=2024%2F25");
  });

  it("syncStateToUrl should persist story parameter when story card is visible", () => {
    document.body.innerHTML = `
      <nav class="tabs">
        <button class="active" data-tab="overview"></button>
      </nav>
      <div id="storyCard"></div>
    `;
    state.storyIndex = 1;

    syncStateToUrl();

    const callArgs = vi.mocked(history.replaceState).mock.calls[0];
    const urlString = callArgs[2];
    expect(urlString).toContain("story=2");
  });

  it("syncStateToUrl should delete healthSeason if index points to invalid/missing season data", () => {
    vi.stubGlobal("location", {
      search: "?tab=overview&healthSeason=2013/14",
      pathname: "/",
      hash: "",
    });
    document.body.innerHTML = `
      <nav class="tabs">
        <button class="active" data-tab="overview"></button>
      </nav>
    `;
    state.healthBarIdx = 999; // invalid/missing

    syncStateToUrl();

    const callArgs = vi.mocked(history.replaceState).mock.calls[0];
    const urlString = callArgs[2];
    expect(urlString).not.toContain("healthSeason");
  });
});
