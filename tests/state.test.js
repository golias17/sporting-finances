import { describe, it, expect, beforeEach, vi } from "vitest";
import { state } from "../src/state.js";

describe("state.js", () => {
  beforeEach(() => {
    // Reset state before each test
    state.DATASET = null;
    state.startSeasonIndex = 0;
    state.endSeasonIndex = null;
    state.healthBarIdx = null;
    state.storyIndex = 0;
    state.activeEventFilter = "all";
    state.tlActiveSeason = "2025/26";
    state.tlActiveWindow = "All";
  });

  it("should return null for annual and fullAnnual if DATASET is null", () => {
    expect(state.annual).toBeNull();
    expect(state.fullAnnual).toBeNull();
  });

  it("should return full DATASET.annual_data if indices are default", () => {
    const mockData = ["a", "b", "c"];
    state.DATASET = { annual_data: mockData };
    expect(state.fullAnnual).toEqual(mockData);
    expect(state.annual).toEqual(mockData);
  });

  it("should treat null endSeasonIndex as the last season", () => {
    const mockData = ["a", "b", "c"];
    state.DATASET = { annual_data: mockData };
    state.endSeasonIndex = null;
    expect(state.annual).toEqual(["a", "b", "c"]);
  });

  it("should return full DATASET.annual_data even if start and end indices are changed", () => {
    const mockData = ["a", "b", "c", "d", "e"];
    state.DATASET = { annual_data: mockData };

    state.setStartSeasonIndex(1);
    state.setEndSeasonIndex(3);

    expect(state.annual).toEqual(mockData);
    expect(state.fullAnnual).toEqual(mockData);
  });

  it("retargetHealthBarIdx keeps pointing at the same season if it's still in range", () => {
    state.DATASET = {
      annual_data: [
        { label: "2020/21" },
        { label: "2021/22" },
        { label: "2022/23" },
        { label: "2023/24" },
        { label: "2024/25" },
      ],
    };
    state.startSeasonIndex = 0;
    state.endSeasonIndex = 4;
    state.healthBarIdx = 2; // "2022/23"

    state.retargetHealthBarIdx("2022/23");

    expect(state.healthBarIdx).toBe(2);
  });

  it("retargetHealthBarIdx falls back to the new range's latest season when the old one is no longer in range", () => {
    // Full dataset had "2025/26" as the latest season at index 13; narrowing
    // the "Explore Era" filter to 2020/21-2024/25 leaves state.annual with
    // only 5 seasons, so index 13 (or the old season label) no longer
    // resolves. Before this fix, code paths that did state.annual[idx].label
    // (health.js's updateKpiBarTitle, kpi.js's renderKpis) would throw,
    // aborting the rest of Overview's chart re-render.
    state.DATASET = {
      annual_data: [
        { label: "2020/21" },
        { label: "2021/22" },
        { label: "2022/23" },
        { label: "2023/24" },
        { label: "2024/25" },
      ],
    };
    state.startSeasonIndex = 0;
    state.endSeasonIndex = 4;
    state.healthBarIdx = 13;

    state.retargetHealthBarIdx("2025/26");

    expect(state.healthBarIdx).toBe(4); // clamped to the new last index
    expect(state.annual[state.healthBarIdx]).toBeDefined();
  });

  it("retargetHealthBarIdx is a no-op when healthBarIdx or the dataset isn't set yet", () => {
    state.healthBarIdx = null;
    state.retargetHealthBarIdx("2022/23");
    expect(state.healthBarIdx).toBeNull();

    state.DATASET = null;
    state.healthBarIdx = 2;
    state.retargetHealthBarIdx("2022/23");
    expect(state.healthBarIdx).toBe(2); // unchanged — no annual to resolve against
  });

  it("should update state variables using setters", () => {
    state.setHealthBarIdx(5);
    expect(state.healthBarIdx).toBe(5);

    state.setStoryIndex(2);
    expect(state.storyIndex).toBe(2);

    state.setActiveEventFilter("win");
    expect(state.activeEventFilter).toBe("win");

    state.setTlActiveSeason("2024/25");
    expect(state.tlActiveSeason).toBe("2024/25");

    state.setTlActiveWindow("Summer");
    expect(state.tlActiveWindow).toBe("Summer");

    state.setTfActiveSeason("2023/24");
    expect(state.tfActiveSeason).toBe("2023/24");

    state.setTfActiveType("in");
    expect(state.tfActiveType).toBe("in");

    state.setTfActiveWindow("summer");
    expect(state.tfActiveWindow).toBe("summer");

    state.setTfQuery("testquery");
    expect(state.tfQuery).toBe("testquery");

    state.setTfSortCol("value");
    expect(state.tfSortCol).toBe("value");

    state.setTfSortDir("desc");
    expect(state.tfSortDir).toBe("desc");

    const scenario = { uclPrize: 47, payrollAdj: 0 };
    state.setPinnedPlaygroundInputs(scenario);
    expect(state.pinnedPlaygroundInputs).toBe(scenario);

    state.setPinnedPlaygroundInputs(null);
    expect(state.pinnedPlaygroundInputs).toBeNull();
  });

  it("COLORS Proxy logs console.warn on first access before initialization", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Read an undefined key from COLORS
    const val = state.COLORS.nonexistentKey;

    expect(warnSpy).toHaveBeenCalledWith(
      "[state] COLORS.nonexistentKey accessed before initChartDefaults() was called",
    );
    expect(val).toBeUndefined();

    warnSpy.mockRestore();
  });
});
