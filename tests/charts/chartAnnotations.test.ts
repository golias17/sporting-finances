import { describe, it, expect, beforeEach } from "vitest";
import { state } from "../../src/core/state.js";
import { getPitchMilestone, getEventAnnotations, eventBoxes } from "../../src/charts/chartAnnotations";

describe("chartAnnotations", () => {
  beforeEach(() => {
    state.setIsPt(false);
  });

  describe("getPitchMilestone", () => {
    it("returns milestone for known season", () => {
      const result = getPitchMilestone("2023/24");
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });

    it("returns empty string for unknown season", () => {
      const result = getPitchMilestone("2099/00");
      expect(result).toBe("");
    });

    it("returns Portuguese text when isPt is true", () => {
      state.setIsPt(true);
      const result = getPitchMilestone("2023/24");
      expect(result).toBeTruthy();
      expect(result).toContain("Campo");
    });
  });

  describe("getEventAnnotations", () => {
    it("returns annotations object", () => {
      const result = getEventAnnotations();
      expect(typeof result).toBe("object");
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });
  });

  describe("eventBoxes", () => {
    it("returns event boxes object", () => {
      const result = eventBoxes(["2023/24"]);
      expect(typeof result).toBe("object");
    });

    it("returns empty object for unknown keys", () => {
      const result = eventBoxes(["2099/00"]);
      expect(Object.keys(result).length).toBe(0);
    });
  });
});

describe("getPitchMilestone additional cases", () => {
  it("returns milestone for 2015/16", () => {
    state.setIsPt(false);
    const result = getPitchMilestone("2015/16");
    expect(result).toBeTruthy();
  });

  it("returns milestone for 2020/21", () => {
    state.setIsPt(false);
    const result = getPitchMilestone("2020/21");
    expect(result).toBeTruthy();
  });

  it("returns Portuguese milestone for 2015/16", () => {
    state.setIsPt(true);
    const result = getPitchMilestone("2015/16");
    expect(result).toContain("Campo");
  });
});
