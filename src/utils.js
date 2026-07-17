// Small framework-free helpers shared across modules.

/**
 * Collapses a burst of rapid-fire events into a single call `delayMs` after
 * the last one, instead of running on every event. Used for window resize
 * (main.js) and the transfer table's search box (transfers.js) — both fire
 * dozens of times in quick succession when only the settled value matters.
 */
export function debounce(fn, delayMs) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}
