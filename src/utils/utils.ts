// Small framework-free helpers shared across modules.

/**
 * Collapses a burst of rapid-fire events into a single call `delayMs` after
 * the last one, instead of running on every event. Used for window resize
 * (main.js) and the transfer table's search box (transfers.js) — both fire
 * dozens of times in quick succession when only the settled value matters.
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delayMs: number,
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

/**
 * Escapes the five HTML-significant characters in `str` so it's safe to
 * interpolate into an innerHTML template string. Used by transfers.js for
 * player/club names and note text sourced from transfers.json — currently
 * developer-maintained, but that's a workflow guarantee, not a language
 * one, so the render path itself shouldn't rely on it. (news.js's feed
 * items are the one genuinely external data source in this app and are
 * kept safe a different way, via textContent assignment instead of
 * innerHTML — see initNewsFeed().)
 */
export function escapeHtml(str: string) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
