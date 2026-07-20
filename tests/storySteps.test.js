import { describe, it, expect } from "vitest";
import { STORY_STEPS } from "../src/storySteps.js";

// story.js and urlSync.js both consume this data (season labels, bilingual
// title/narrative pairs, and STORY_STEPS.length for ?story= deep-link
// bounds checking) but neither test file asserts anything about the data
// itself — only about the code that reads it. These tests catch a
// malformed or incomplete step slipping in (e.g. a missing pt translation,
// which would silently render blank story text for PT-locale users).
describe("storySteps.js", () => {
  it("has at least one step", () => {
    expect(STORY_STEPS.length).toBeGreaterThan(0);
  });

  it("gives every step a season label and non-empty en/pt title + narrative", () => {
    STORY_STEPS.forEach((step, i) => {
      expect(step.season, `step ${i} season`).toEqual(expect.any(String));
      expect(step.season.length, `step ${i} season`).toBeGreaterThan(0);

      for (const field of ["title", "narrative"]) {
        for (const lang of ["en", "pt"]) {
          const text = step[field]?.[lang];
          expect(text, `step ${i} ${field}.${lang}`).toEqual(
            expect.any(String),
          );
          expect(text.length, `step ${i} ${field}.${lang}`).toBeGreaterThan(0);
        }
      }
    });
  });

  it("uses each season label at most once", () => {
    const seasons = STORY_STEPS.map((s) => s.season);
    expect(new Set(seasons).size).toBe(seasons.length);
  });

  it("orders steps chronologically by season", () => {
    const startYears = STORY_STEPS.map((s) => parseInt(s.season, 10));
    const sorted = [...startYears].sort((a, b) => a - b);
    expect(startYears).toEqual(sorted);
  });
});
