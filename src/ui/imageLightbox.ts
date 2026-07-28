import { state } from "../core/state.js";
import { trapFocusWithin } from "../utils/focusTrap.js";

// IMAGE LIGHTBOX MODAL
// =============================================================

// KIT FLIP-CARD KEYBOARD SUPPORT
// =============================================================

// The kit flip-cards' CSS animation (.kit-card-container:hover in
// _components.css) only triggers on mouse :hover — initImageLightbox()
// above keeps a keyboard user from landing on the rotated-away, invisible
// back face as a confusing Tab stop, but on its own that left keyboard
// users with no way to actually SEE the back face on the card itself, only
// via the lightbox's own front/back toggle button after opening the front.
// This makes each card container a focusable "flip" control (Enter/Space
// toggles a .flipped class that mirrors :hover's rotation), and keeps
// whichever face is currently hidden out of both the Tab order and the
// accessibility tree — matching what :hover already does visually for
// mouse users, instead of just tolerating the gap.
//
// Deliberately kept in this same file (rather than its own module) as
// initImageLightbox() above — the two are genuinely coupled: this function
// only manages *reachability* (tabindex/role/aria-hidden) on the same
// .kit-card-front/.kit-card-back images initImageLightbox() already wired
// click/keydown listeners onto, and the comments in both functions
// cross-reference each other's behavior.
export function initKitCardFlip() {
  const cards = document.querySelectorAll<HTMLElement>(
    ".kit-card-container:not(.no-flip)",
  );

  cards.forEach((card) => {
    if (card.dataset.flipBound) return;
    card.dataset.flipBound = "true";
    const frontImg = card.querySelector(
      ".kit-card-front img",
    ) as HTMLImageElement;
    const backImg = card.querySelector(
      ".kit-card-back img",
    ) as HTMLImageElement;
    if (!frontImg || !backImg) return;

    const kitName = (frontImg.alt || "Kit").replace(/\s*Front$/i, "");

    const syncFaceReachability = (flipped: boolean) => {
      const [visible, hidden] = flipped
        ? [backImg, frontImg]
        : [frontImg, backImg];
      visible.setAttribute("tabindex", "0");
      visible.setAttribute("role", "button");
      visible.removeAttribute("aria-hidden");
      // tabindex="-1" alone stops Tab from reaching the hidden face, but a
      // screen reader's browse-mode virtual cursor walks the accessibility
      // tree independently of tab order — aria-hidden is what actually
      // removes it from that tree, since backface-visibility:hidden is a
      // rendering effect the accessibility tree doesn't otherwise know about.
      hidden.setAttribute("tabindex", "-1");
      hidden.removeAttribute("role");
      hidden.setAttribute("aria-hidden", "true");
    };

    const setFlipped = (flipped: boolean) => {
      card.classList.toggle("flipped", flipped);
      card.setAttribute("aria-pressed", String(flipped));
      card.setAttribute(
        "aria-label",
        flipped
          ? state.isPt
            ? `Ver a frente do kit ${kitName}`
            : `Show ${kitName} kit front`
          : state.isPt
            ? `Ver as costas do kit ${kitName}`
            : `Show ${kitName} kit back`,
      );
      syncFaceReachability(flipped);
    };

    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    setFlipped(false);

    card.addEventListener("click", (e: MouseEvent) => {
      // Clicking either face's image opens the lightbox (wired in
      // initImageLightbox()) — that's the existing, expected behavior for
      // mouse users, who flip via :hover rather than by clicking the card.
      // Only toggle the flip for clicks on the card's own chrome (e.g. the
      // kit label), not one that's really targeting a descendant image.
      if ((e.target as HTMLElement).closest("img")) return;
      setFlipped(!card.classList.contains("flipped"));
    });

    card.addEventListener("keydown", (e: KeyboardEvent) => {
      // Only handle Enter/Space when the card itself is focused — if focus
      // is on a descendant image, that image's own keydown handler (in
      // initImageLightbox()) already opens the lightbox, and this would
      // otherwise fire a second, unwanted flip on the same keypress.
      if (e.target !== card) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setFlipped(!card.classList.contains("flipped"));
      }
    });
  });
}
