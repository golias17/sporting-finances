import { config } from "./config.js";

let TRANSLATIONS = {};
let loadedLang = null;
// Monotonic token identifying the most recent loadTranslations() call.
// Guards against out-of-order fetch resolution: rapid EN→PT→EN toggles used
// to leave whichever fetch happened to resolve *last* as the active
// dictionary, regardless of which language the user actually ended on.
let latestRequestId = 0;

/**
 * Loads translations for a specific language asynchronously.
 * Only the most recent call is allowed to commit its result.
 * @param {"en"|"pt"} lang
 */
export async function loadTranslations(lang) {
  if (loadedLang === lang) {
    // Already loaded — but still bump the token so any in-flight load of a
    // *different* language (started by an earlier rapid toggle) is
    // invalidated and can't overwrite the dictionary when it resolves.
    ++latestRequestId;
    return TRANSLATIONS;
  }
  const requestId = ++latestRequestId;
  try {
    const res = await fetch(config.localesPath(lang));
    if (!res.ok) {
      throw new Error(`Failed to load ${config.localesPath(lang)}: HTTP ${res.status} ${res.statusText}`);
    }
    const json = await res.json();
    if (requestId === latestRequestId) {
      TRANSLATIONS = json;
      loadedLang = lang;
    }
  } catch (e) {
    console.error(`[translations] Failed to load translations for ${lang}`, e);
    throw e;
  }
  return TRANSLATIONS;
}

/**
 * Safely decodes HTML/XML entities (e.g. &amp;) using textarea.
 * @param {string} str
 * @returns {string}
 */
export function decodeEntities(str) {
  if (typeof document === "undefined") return str;
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

/**
 * Apply translations to all elements with data-i18n attributes.
 * @param {"en"|"pt"} lang
 */
export function applyTranslations(_lang) {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const entry = TRANSLATIONS[key];
    if (!entry) return;
    const text = entry.text;
    if (entry.isAria) {
      el.setAttribute("aria-label", text);
      return;
    }
    if (entry.innerHTML) {
      el.innerHTML = text;
    } else {
      // For inputs use placeholder, for others use textContent
      if (el.tagName === "INPUT" && el.hasAttribute("placeholder")) {
        el.placeholder = decodeEntities(text);
      } else if (el.tagName === "OPTION") {
        el.textContent = decodeEntities(text);
      } else {
        el.textContent = decodeEntities(text);
      }
    }
  });
}
