import { describe, it, expect, beforeEach, vi } from "vitest";
import { state } from "../../src/core/state.js";

describe("state.js", () => {
  beforeEach(() => {
    // Reset state before each test
    state.setDataset(null);
    state.setHealthBarIdx(null);
    state.setStoryIndex(0);
    state.setActiveEventFilter("all");
    state.setTlActiveSeason("2025/26");
    state.setTlActiveWindow("All");
  });

  it("should return [] for annual and null for fullAnnual if DATASET is null", () => {
    expect(state.annual).toEqual([]);
    expect(state.fullAnnual).toBeNull();
  });

  it("should return full DATASET.annual_data for both annual and fullAnnual", () => {
    const mockData = ["a", "b", "c"];
    state.setDataset({ annual_data: mockData });
    expect(state.fullAnnual).toEqual(mockData);
    expect(state.annual).toEqual(mockData);
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
});
