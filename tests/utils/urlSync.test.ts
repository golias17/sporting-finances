import { describe, it, expect, beforeEach, vi } from "vitest";
import { state } from "../../src/core/state.js";
import { applyUrlParams, syncStateToUrl } from "../../src/utils/urlSync.js";

describe("urlSync.js", () => {
  beforeEach(() => {
    // Reset state before each test
    state.setDataset({
      annual_data: [
        { label: "2012/13" },
        { label: "2013/14" },
        { label: "2014/15" },
        { label: "2024/25" },
      ],
    });
    state.setHealthBarIdx(null);
    state.setStoryIndex(0);
    state.setUrlStoryActive(false);
    state.setUrlCmpA(null);
    state.setUrlCmpB(null);
    state.setUrlHealthSeason(null);
    state.setUrlPlayground(null);
    state.setIsPt(false);

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
    // health.js's initKpiSeasonSelector) — the URL sync used to only
    // recognise the Healthcheck tab's selection, silently losing whatever
    // season was picked via Overview's on a refresh.
    state.setActiveTab("overview");
    state.setHealthBarIdx(1); // "2013/14"

    syncStateToUrl();

    const callArgs = vi.mocked(history.replaceState).mock.calls[0];
    const urlString = callArgs[2];
    expect(urlString).toContain("tab=overview");
    expect(urlString).toContain("healthSeason=2013%2F14");
  });

  it("syncStateToUrl should not persist healthSeason on tabs where it isn't in play", () => {
    state.setActiveTab("revenue");
    state.setHealthBarIdx(1);

    syncStateToUrl();

    const callArgs = vi.mocked(history.replaceState).mock.calls[0];
    const urlString = callArgs[2];
    expect(urlString).not.toContain("healthSeason");
  });

  it("syncStateToUrl should push state elements back into URL parameters", () => {
    state.setActiveTab("compare");
    document.body.innerHTML = `
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
    state.setActiveTab("overview");
    document.body.innerHTML = `
      <div id="storyCard"></div>
    `;
    state.setStoryIndex(1);

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
    state.setActiveTab("overview");
    state.setHealthBarIdx(999); // invalid/missing

    syncStateToUrl();

    const callArgs = vi.mocked(history.replaceState).mock.calls[0];
    const urlString = callArgs[2];
    expect(urlString).not.toContain("healthSeason");
  });

  it("syncStateToUrl should persist the Playground scenario's sliders when that tab is active", () => {
    state.setActiveTab("playground");
    document.body.innerHTML = `
      <select id="uclSelect"><option value="47" selected>Round of 16</option></select>
      <input id="payrollSlider" value="10" />
      <input id="salesSlider" value="140" />
      <input id="purchasesSlider" value="60" />
      <input id="capexSlider" value="0" />
      <input id="debtRepaySlider" value="20" />
      <input id="revGrowthSlider" value="8" />
    `;

    syncStateToUrl();

    const callArgs = vi.mocked(history.replaceState).mock.calls[0];
    const urlString = callArgs[2];
    expect(urlString).toContain("tab=playground");
    expect(urlString).toContain("pgUcl=47");
    expect(urlString).toContain("pgPayroll=10");
    expect(urlString).toContain("pgSales=140");
    expect(urlString).toContain("pgPurchases=60");
    expect(urlString).toContain("pgCapex=0");
    expect(urlString).toContain("pgDebt=20");
    expect(urlString).toContain("pgRevGrowth=8");
  });

  it("syncStateToUrl should omit the Playground params on other tabs", () => {
    state.setActiveTab("revenue");

    syncStateToUrl();

    const callArgs = vi.mocked(history.replaceState).mock.calls.at(-1);
    const urlString = callArgs ? callArgs[2] : "";
    expect(urlString).not.toContain("pgUcl");
    expect(urlString).not.toContain("pgPayroll");
  });

  it("applyUrlParams should stash a full Playground scenario for initPlayground to restore", () => {
    vi.stubGlobal("location", {
      search:
        "?tab=playground&pgUcl=47&pgPayroll=10&pgSales=140&pgPurchases=60&pgCapex=0&pgDebt=20&pgRevGrowth=8",
      pathname: "/",
      hash: "",
    });

    const tab = applyUrlParams();

    expect(tab).toBe("playground");
    expect(state.urlPlayground).toEqual({
      uclPrize: "47",
      payrollAdj: "10",
      salesTarget: "140",
      purchasesTarget: "60",
      capexAdj: "0",
      debtRepayTarget: "20",
      revGrowthAdj: "8",
    });
  });

  it("applyUrlParams should leave urlPlayground null when the URL has no Playground params", () => {
    applyUrlParams();
    expect(state.urlPlayground).toBeNull();
  });
});
