import { config } from "../core/config.js";
import { state } from "../core/state.js";

let TRANSLATIONS: Record<string, any> = {};
let loadedLang: string | null = null;
let latestRequestId = 0;

/**
 * Loads translations for a specific language asynchronously and stores them in Zustand.
 * Only the most recent call is allowed to commit its result.
 */
export async function loadTranslations(lang: "en" | "pt") {
  if (loadedLang === lang) {
    ++latestRequestId;
    return TRANSLATIONS;
  }
  const requestId = ++latestRequestId;
  try {
    const res = await fetch(config.localesPath(lang));
    if (!res.ok) {
      throw new Error(
        `Failed to load ${config.localesPath(lang)}: HTTP ${res.status} ${res.statusText}`,
      );
    }
    const json = await res.json();
    if (requestId === latestRequestId) {
      TRANSLATIONS = json;
      loadedLang = lang;
      // Push into Zustand so all React components reactively re-render
      state.setTranslations(TRANSLATIONS);
    }
  } catch (e) {
    console.error(`[translations] Failed to load translations for ${lang}`, e);
    throw e;
  }
  return TRANSLATIONS;
}
