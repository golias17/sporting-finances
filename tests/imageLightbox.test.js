import { describe, it, expect, beforeEach } from "vitest";
import { state } from "../src/state.js";
import { initImageLightbox, initKitCardFlip } from "../src/imageLightbox.js";

// initImageLightbox()/initKitCardFlip() are already exercised indirectly
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

describe("imageLightbox.js — initImageLightbox()", () => {
  beforeEach(() => {
    buildDom();
    state.isPt = false;
  });

  it("does nothing (no throw) when a required element is missing", () => {
    document.body.innerHTML = "";
    expect(() => initImageLightbox()).not.toThrow();
  });

  it("opens on a plain (non-kit) image without exposing the front/back toggle", () => {
    initImageLightbox();
    const trigger = document.querySelector(".stadium-panorama-img");
    trigger.click();

    const lightbox = document.getElementById("imageLightbox");
    const toggleBtn = document.getElementById("lightboxToggleKitBtn");
    expect(lightbox.classList.contains("active")).toBe(true);
    expect(toggleBtn.classList.contains("hidden")).toBe(true);
    expect(document.getElementById("lightboxImg").src).toContain(
      "plain.jpg",
    );
  });

  it("toggles between the kit's front and back image via the toggle button", () => {
    initImageLightbox();
    const frontImg = document.querySelector(".kit-card-front .kit-img");
    frontImg.click();

    const toggleBtn = document.getElementById("lightboxToggleKitBtn");
    expect(toggleBtn.classList.contains("hidden")).toBe(false);
    const lightboxImg = document.getElementById("lightboxImg");
    const lightboxCaption = document.getElementById("lightboxCaption");
    expect(lightboxImg.src).toContain("front.jpg");
    expect(lightboxCaption.textContent).toBe("Home Front");

    toggleBtn.click();
    expect(lightboxImg.src).toContain("back.jpg");
    expect(lightboxCaption.textContent).toBe("Home Back");

    toggleBtn.click();
    expect(lightboxImg.src).toContain("front.jpg");
    expect(lightboxCaption.textContent).toBe("Home Front");
  });

  it("is a no-op if the toggle button is clicked with no kit front/back loaded", () => {
    initImageLightbox();
    document.querySelector(".stadium-panorama-img").click(); // plain image, no kit
    const toggleBtn = document.getElementById("lightboxToggleKitBtn");
    const lightboxImg = document.getElementById("lightboxImg");
    const before = lightboxImg.src;

    toggleBtn.click(); // hidden in the UI, but assert the handler itself no-ops
    expect(lightboxImg.src).toBe(before);
  });

  it("opens showing the back face directly when the back image itself was clicked", () => {
    initImageLightbox();
    document.querySelector(".kit-card-back .kit-img").click();
    expect(document.getElementById("lightboxImg").src).toContain("back.jpg");
    expect(document.getElementById("lightboxCaption").textContent).toBe(
      "Home Back",
    );
  });

  it("closes on a backdrop click, but not on a click inside its content", () => {
    initImageLightbox();
    const lightbox = document.getElementById("imageLightbox");
    document.querySelector(".stadium-panorama-img").click();
    expect(lightbox.classList.contains("active")).toBe(true);

    document.getElementById("lightboxCaption").click();
    expect(lightbox.classList.contains("active")).toBe(true);

    lightbox.click(); // e.target === lightbox itself
    expect(lightbox.classList.contains("active")).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on Escape only while active, restoring focus to the trigger", () => {
    initImageLightbox();
    const lightbox = document.getElementById("imageLightbox");
    const trigger = document.querySelector(".stadium-panorama-img");

    // Escape while closed is a no-op.
    document.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(lightbox.classList.contains("active")).toBe(false);

    trigger.focus();
    trigger.click();
    expect(document.activeElement).toBe(
      document.getElementById("closeLightboxBtn"),
    );

    document.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    expect(lightbox.classList.contains("active")).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });
});

describe("imageLightbox.js — initKitCardFlip()", () => {
  beforeEach(() => {
    buildDom();
    state.isPt = false;
  });

  it("flips the card on a direct click on its own chrome (not a descendant image)", () => {
    initImageLightbox();
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
    initImageLightbox();
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
    initImageLightbox();
    initKitCardFlip();
    const card = document.querySelector(".kit-card-container");
    const frontImg = card.querySelector(".kit-card-front .kit-img");

    frontImg.click(); // opens the lightbox via initImageLightbox()'s own handler
    expect(card.classList.contains("flipped")).toBe(false);
  });

  it("labels the flip control in Portuguese when active", () => {
    state.isPt = true;
    initImageLightbox();
    initKitCardFlip();
    const card = document.querySelector(".kit-card-container");
    card.querySelector(".kit-label").click();
    expect(card.getAttribute("aria-label")).toBe(
      "Ver a frente do kit Home",
    );
  });
});
