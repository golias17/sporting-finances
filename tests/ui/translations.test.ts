import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadTranslations } from "../../src/ui/translations.js";
import { useAppState, state } from "../../src/core/state.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mock fetch to return local JSON files from public/locales
beforeAll(() => {
  global.fetch = vi.fn((url: string) => {
    let filePath;
    if (url.includes("en.json")) {
      filePath = path.resolve(__dirname, "../../public/locales/en.json");
    } else if (url.includes("pt.json")) {
      filePath = path.resolve(__dirname, "../../public/locales/pt.json");
    } else {
      return Promise.reject(new Error("not found: " + url));
    }

    try {
      const content = fs.readFileSync(filePath, "utf8");
      return Promise.resolve({
        json: () => Promise.resolve(JSON.parse(content)),
        ok: true,
      } as any);
    } catch (err) {
      return Promise.reject(err);
    }
  });
});

describe("translations.js", () => {
  it("should load PT translations and push to Zustand", async () => {
    await loadTranslations("pt");
    const t = useAppState.getState().translations;
    expect(t["era-all"].text).toBe("Sempre");
  });

  it("should load EN translations and push to Zustand", async () => {
    await loadTranslations("en");
    const t = useAppState.getState().translations;
    expect(t["era-all"].text).toBe("All Time");
  });

  it("should let the most recent load win when calls race", async () => {
    // Fire PT then EN without awaiting — even if the PT fetch resolves last,
    // EN (the most recent request) must be the committed dictionary.
    const ptPromise = loadTranslations("pt");
    const enPromise = loadTranslations("en");
    await Promise.all([ptPromise, enPromise]);

    const t = useAppState.getState().translations;
    expect(t["era-all"].text).toBe("All Time");
  });
});
