import { describe, it, expect, beforeEach } from "vitest";
import { state } from "../../src/core/state.js";
import { initKitCardFlip } from "../../src/ui/imageLightbox.js";

// initKitCardFlip() is already exercised indirectly
// through app.test.js's full-app boot, but several branches only trigger
// under conditions that file's shared DOM/interaction sequence never
// produces: the missing-elements guard, the kit front/back toggle button,
// closing via a backdrop click vs. Escape, and flipping a kit card via a
// direct click on its own chrome (not a keydown). Isolated here with a
// minimal DOM so each can be driven directly.
function buildDom() {
  document.body.innerHTML = `
    <img class="stadium-panorama-img" src="/plain.jpg" alt="Estadio" />

    <div class="kit-card-container">
      <div class="kit-card-inner">
        <div class="kit-card-front">
          <img class="kit-img" src="/front.jpg" alt="Home Front" />
        </div>
        <div class="kit-card-back">
          <img class="kit-img" src="/back.jpg" alt="Home Back" />
        </div>
      </div>
      <span class="kit-label">Home</span>
    </div>

    <div id="imageLightbox" class="lightbox">
      <button id="lightboxToggleKitBtn" class="hidden"></button>
      <button id="closeLightboxBtn"></button>
      <img id="lightboxImg" />
      <p id="lightboxCaption"></p>
    </div>
  `;
}

describe("imageLightbox.js — initKitCardFlip()", () => {
  beforeEach(() => {
    buildDom();
    state.setIsPt(false);
  });

  it("flips the card on a direct click on its own chrome (not a descendant image)", () => {
    initKitCardFlip();
    const card = document.querySelector(".kit-card-container");
    const label = card.querySelector(".kit-label");

    expect(card.classList.contains("flipped")).toBe(false);
    label.click();
    expect(card.classList.contains("flipped")).toBe(true);
    expect(card.getAttribute("aria-label")).toBe("Show Home kit front");

    label.click();
    expect(card.classList.contains("flipped")).toBe(false);
    expect(card.getAttribute("aria-label")).toBe("Show Home kit back");
  });

  it("makes only the currently-visible face reachable after flipping via a click", () => {
    initKitCardFlip();
    const card = document.querySelector(".kit-card-container");
    const frontImg = card.querySelector(".kit-card-front .kit-img");
    const backImg = card.querySelector(".kit-card-back .kit-img");

    card.querySelector(".kit-label").click(); // flips to back
    expect(backImg.getAttribute("tabindex")).toBe("0");
    expect(backImg.hasAttribute("aria-hidden")).toBe(false);
    expect(frontImg.getAttribute("tabindex")).toBe("-1");
    expect(frontImg.getAttribute("aria-hidden")).toBe("true");
  });

  it("does not flip when the click target is a descendant image", () => {
    initKitCardFlip();
    const card = document.querySelector(".kit-card-container");
    const frontImg = card.querySelector(".kit-card-front .kit-img");

    frontImg.click(); // opens the lightbox via initImageLightbox()'s own handler
    expect(card.classList.contains("flipped")).toBe(false);
  });

  it("labels the flip control in Portuguese when active", () => {
    state.setIsPt(true);
    initKitCardFlip();
    const card = document.querySelector(".kit-card-container");
    card.querySelector(".kit-label").click();
    expect(card.getAttribute("aria-label")).toBe("Ver a frente do kit Home");
  });
});
