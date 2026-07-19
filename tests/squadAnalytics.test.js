import { describe, it, expect, beforeEach } from "vitest";
import { state } from "../src/state.js";
import { getEraForSeason } from "../src/squadAnalytics.js";

describe("squadAnalytics.js - getEraForSeason", () => {
  beforeEach(() => {
    state.setIsPt(false);
  });

  it("maps early seasons to their historical manager eras", () => {
    expect(getEraForSeason("2013/14")).toBe("Leonardo Jardim (13/14)");
    expect(getEraForSeason("2016/17")).toBe("Jorge Jesus (15/16 - 17/18)");
    expect(getEraForSeason("2019/20")).toBe("Keizer / Silas (18/19 - 19/20)");
  });

  it("localizes the 2012/13 label with the pt accent only when isPt is true", () => {
    expect(getEraForSeason("2012/13")).toBe("Jesualdo/Sa Pinto (12/13)");
    state.setIsPt(true);
    expect(getEraForSeason("2012/13")).toBe("Jesualdo/Sá Pinto (12/13)");
  });

  it("maps the full seasons of Ruben Amorim's tenure to his era, not a range through 25/26", () => {
    expect(getEraForSeason("2020/21")).toBe("Rúben Amorim (20/21 - 23/24)");
    expect(getEraForSeason("2023/24")).toBe("Rúben Amorim (20/21 - 23/24)");
  });

  it("buckets 2024/25 as a transition season (Amorim left for Man Utd mid-season, then Pereira, then Borges)", () => {
    expect(getEraForSeason("2024/25")).toBe("Amorim / Pereira / Borges (24/25)");
  });

  it("does not misattribute 2024/25 or later seasons to Ruben Amorim", () => {
    expect(getEraForSeason("2024/25")).not.toMatch(/Amorim \(/);
    expect(getEraForSeason("2025/26")).not.toMatch(/Amorim/);
  });

  it("falls back to the current manager for seasons beyond the known table (25/26 onward)", () => {
    expect(getEraForSeason("2025/26")).toBe("Rui Borges (25/26 - )");
    expect(getEraForSeason("2026/27")).toBe("Rui Borges (25/26 - )");
  });
});
