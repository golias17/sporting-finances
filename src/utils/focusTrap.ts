// MODAL ACCESSIBILITY HELPER
// =============================================================

// Shared by every hand-rolled overlay <div> modal in the app (the Jornal
// reader in jornalModal.js, the image lightbox in imageLightbox.js) — none
// of them are the native <dialog> element, so none gets keyboard focus
// management for free from the browser: trapping Tab/Shift+Tab within the
// modal's own focusable elements while it's open, so a keyboard user can't
// tab out into the page hidden behind it. Centralized here so every modal
// implements it identically instead of drifting. Each modal's own open/close
// functions are still responsible for moving focus in on open and restoring
// it to whatever triggered the modal on close — that part depends on which
// element they call .focus() on, which differs between callers.
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, iframe, [tabindex]:not([tabindex="-1"])';

export function trapFocusWithin(container: HTMLElement) {
  const handler = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const focusable = Array.from(
      container.querySelectorAll(FOCUSABLE_SELECTOR),
    ).filter((el) => (el as HTMLElement).offsetParent !== null); // visible only
    if (focusable.length === 0) return;
    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  container.addEventListener("keydown", handler);
  return () => container.removeEventListener("keydown", handler);
}
