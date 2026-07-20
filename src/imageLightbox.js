import { state } from "./state.js";
import { trapFocusWithin } from "./focusTrap.js";

// IMAGE LIGHTBOX MODAL
// =============================================================
export function initImageLightbox() {
  const lightbox = document.getElementById("imageLightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const btnClose = document.getElementById("closeLightboxBtn");
  const toggleBtn = document.getElementById("lightboxToggleKitBtn");

  if (!lightbox || !lightboxImg || !lightboxCaption || !btnClose || !toggleBtn)
    return;

  const targets = document.querySelectorAll(
    ".stadium-panorama-img, .court-panorama-img, .academy-panorama-img, .museum-panorama-img, .kit-img",
  );

  let currentFrontSrc = null;
  let currentBackSrc = null;
  let currentFrontAlt = "";
  let currentBackAlt = "";
  let isShowingBack = false;

  // Restores focus to whatever triggered the lightbox once it closes, and
  // releases the Tab focus trap — see trapFocusWithin() in focusTrap.js.
  let previouslyFocused = null;
  let releaseFocusTrap = null;

  targets.forEach((img) => {
    // Plain <img> elements aren't keyboard-focusable or operable by
    // default — without this, there was no way to reach or open the
    // lightbox except by mouse/touch. tabindex makes it Tab-reachable;
    // role="button" + the keydown handler below make Enter/Space behave
    // like a click, matching native <button> semantics.
    //
    // Kit flip-cards are a special case: initKitCardFlip() (below) runs
    // right after this function and immediately overrides tabindex/role/
    // aria-hidden on .kit-card-front/.kit-card-back images to keep only
    // the currently-visible face reachable — both faces stay in the DOM at
    // all times (rotated away via CSS transform + backface-visibility, not
    // display:none), and unconditionally tabindex="0"-ing both would make
    // the rotated-away one a real Tab stop with no visible focus indicator.
    // The click/keydown handlers set up here are still attached to both
    // faces unconditionally — initKitCardFlip() only manages *reachability*
    // (tabindex/role), not whether opening the lightbox works once reached.
    img.setAttribute("tabindex", "0");
    img.setAttribute("role", "button");
    if (!img.hasAttribute("aria-label")) {
      img.setAttribute(
        "aria-label",
        `${img.alt || "Sporting CP asset"} — view enlarged`,
      );
    }

    const openLightboxFor = () => {
      const src = img.src;
      const alt = img.alt || "Sporting CP Asset";

      // Reset
      toggleBtn.classList.add("hidden");
      currentFrontSrc = null;
      currentBackSrc = null;
      isShowingBack = false;

      // Detect if image is inside a kit flip card
      const kitInner = img.closest(".kit-card-inner");
      if (kitInner) {
        const frontImg = kitInner.querySelector(".kit-card-front img");
        const backImg = kitInner.querySelector(".kit-card-back img");
        if (frontImg && backImg) {
          currentFrontSrc = frontImg.src;
          currentBackSrc = backImg.src;
          currentFrontAlt = frontImg.alt || "Kit Front";
          currentBackAlt = backImg.alt || "Kit Back";
          isShowingBack = src === currentBackSrc;
          toggleBtn.classList.remove("hidden");
        }
      }

      lightboxImg.src = src;
      lightboxCaption.textContent = alt;
      previouslyFocused = document.activeElement;
      lightbox.classList.add("active");
      document.body.style.overflow = "hidden";
      releaseFocusTrap = trapFocusWithin(lightbox);
      btnClose.focus();
    };

    img.addEventListener("click", openLightboxFor);
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openLightboxFor();
      }
    });
  });

  toggleBtn.addEventListener("click", () => {
    if (!currentFrontSrc || !currentBackSrc) return;
    isShowingBack = !isShowingBack;
    if (isShowingBack) {
      lightboxImg.src = currentBackSrc;
      lightboxCaption.textContent = currentBackAlt;
    } else {
      lightboxImg.src = currentFrontSrc;
      lightboxCaption.textContent = currentFrontAlt;
    }
  });

  function closeLightbox() {
    lightbox.classList.remove("active");
    document.body.style.overflow = "";
    if (releaseFocusTrap) {
      releaseFocusTrap();
      releaseFocusTrap = null;
    }
    if (previouslyFocused instanceof HTMLElement) {
      previouslyFocused.focus();
    }
    previouslyFocused = null;
  }

  btnClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.id === "imageLightbox") {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("active")) {
      closeLightbox();
    }
  });
}

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
  const cards = document.querySelectorAll(".kit-card-container:not(.no-flip)");

  cards.forEach((card) => {
    const frontImg = card.querySelector(".kit-card-front img");
    const backImg = card.querySelector(".kit-card-back img");
    if (!frontImg || !backImg) return;

    const kitName = (frontImg.alt || "Kit").replace(/\s*Front$/i, "");

    const syncFaceReachability = (flipped) => {
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

    const setFlipped = (flipped) => {
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

    card.addEventListener("click", (e) => {
      // Clicking either face's image opens the lightbox (wired in
      // initImageLightbox()) — that's the existing, expected behavior for
      // mouse users, who flip via :hover rather than by clicking the card.
      // Only toggle the flip for clicks on the card's own chrome (e.g. the
      // kit label), not one that's really targeting a descendant image.
      if (e.target.closest("img")) return;
      setFlipped(!card.classList.contains("flipped"));
    });

    card.addEventListener("keydown", (e) => {
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
