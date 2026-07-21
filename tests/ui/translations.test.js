import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  applyTranslations,
  loadTranslations,
} from "../../src/ui/translations.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mock fetch to return local JSON files from public/locales
beforeAll(() => {
  global.fetch = vi.fn((url) => {
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
      });
    } catch (err) {
      return Promise.reject(err);
    }
  });
});

describe("translations.js", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div data-i18n="era-all"></div>
      <div data-i18n="not-exists"></div>
    `;
  });

  it("should apply PT translations correctly to data-i18n elements", async () => {
    await loadTranslations("pt");
    applyTranslations("pt");

    const el = document.querySelector('[data-i18n="era-all"]');
    expect(el.textContent).toBe("Sempre");

    // Fallback or leave empty for non-existing translations (our logic leaves it alone or sets it)
    const none = document.querySelector('[data-i18n="not-exists"]');
    expect(none.textContent).toBe("");
  });

  it("should apply EN translations correctly to data-i18n elements", async () => {
    await loadTranslations("en");
    applyTranslations("en");

    const el = document.querySelector('[data-i18n="era-all"]');
    expect(el.textContent).toBe("All Time");
  });

  it("should let the most recent load win when calls race", async () => {
    // Fire PT then EN without awaiting — even if the PT fetch resolves last,
    // EN (the most recent request) must be the committed dictionary.
    const ptPromise = loadTranslations("pt");
    const enPromise = loadTranslations("en");
    await Promise.all([ptPromise, enPromise]);

    applyTranslations("en");
    const el = document.querySelector('[data-i18n="era-all"]');
    expect(el.textContent).toBe("All Time");
  });
});
