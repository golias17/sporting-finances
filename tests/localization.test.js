import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { translateNote } from "../src/localization.js";
import { applyTranslations, loadTranslations } from "../src/translations.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mock fetch to return local JSON files from public/locales
beforeAll(() => {
  global.fetch = vi.fn((url) => {
    let filePath;
    if (url.includes("en.json")) {
      filePath = path.resolve(__dirname, "../public/locales/en.json");
    } else if (url.includes("pt.json")) {
      filePath = path.resolve(__dirname, "../public/locales/pt.json");
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

describe("localization.js", () => {
  it("should translate direct map notes exactly", () => {
    const pt = translateNote(
      "Record sales season at the time. Marcos Rojo sold to Manchester United for €20M just one year after signing. Eric Dier and Cedric Soares also departed for the Premier League.",
    );
    expect(pt).toBe(
      "Época recorde de vendas à data. Venda de Marcos Rojo ao Manchester United por €20M um ano após a contratação. Eric Dier e Cédric Soares também saíram para a Premier League.",
    );
  });

  it("should apply sequential replacements for recurring phrases", () => {
    const original = "Winter signing. Contract terminated by mutual agreement.";
    const pt = translateNote(original);
    expect(pt).toBe(
      "Contratação de inverno. Contrato rescindido por mútuo acordo.",
    );
  });

  it("should handle dynamic Sold to X for Y replacements", () => {
    const original = "Sold to Manchester United for €50.5M";
    const pt = translateNote(original);
    expect(pt).toBe("Vendido ao Manchester United por €50.5M");
  });

  it("should return early for falsy input", () => {
    expect(translateNote(null)).toBe(null);
    expect(translateNote("")).toBe("");
  });

  it("should warn console.warn once for untranslated strings", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const untranslated = "A completely random untranslated note";

    // Call first time
    const res1 = translateNote(untranslated);
    expect(res1).toBe(untranslated);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("no direct or pattern match found"),
    );

    // Call second time with the same string (should not warn again)
    const res2 = translateNote(untranslated);
    expect(res2).toBe(untranslated);
    expect(spy).toHaveBeenCalledTimes(1);

    spy.mockRestore();
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
});
