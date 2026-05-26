import { describe, it, expect, beforeEach } from "vitest";
import { state } from "../src/state.js";

describe("state.js", () => {
  beforeEach(() => {
    // Reset state before each test
    state.DATASET = null;
    state.startSeasonIndex = 0;
    state.endSeasonIndex = Infinity;
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

  it("should return sliced DATASET.annual_data based on start and end indices", () => {
    const mockData = ["a", "b", "c", "d", "e"];
    state.DATASET = { annual_data: mockData };
    
    state.setStartSeasonIndex(1);
    state.setEndSeasonIndex(3);
    
    expect(state.annual).toEqual(["b", "c", "d"]);
    expect(state.fullAnnual).toEqual(mockData);
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
  });
});
