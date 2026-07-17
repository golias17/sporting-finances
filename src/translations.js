// src/translations.js
// Dynamically fetches localized static UI strings.

let TRANSLATIONS = {};
let loadedLang = null;

/**
 * Loads translations for a specific language asynchronously.
 * @param {"en"|"pt"} lang
 */
export async function loadTranslations(lang) {
  if (loadedLang === lang) return TRANSLATIONS;
  try {
    const res = await fetch(`./locales/${lang}.json`);
    TRANSLATIONS = await res.json();
    loadedLang = lang;
  } catch (e) {
    console.error(`[translations] Failed to load translations for ${lang}`, e);
  }
  return TRANSLATIONS;
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
        el.placeholder = text;
      } else if (el.tagName === "OPTION") {
        el.textContent = text;
      } else {
        el.innerHTML = text; // use innerHTML to handle &amp; etc.
      }
    }
  });
}
