import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useImageLightbox, setupLightboxTriggers } from "../../src/hooks/useImageLightbox";

vi.mock("../../src/utils/focusTrap", () => ({
  trapFocusWithin: vi.fn(() => vi.fn()),
}));

describe("useImageLightbox", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="imageLightbox" class="lightbox-modal">
        <button class="lightbox-close">×</button>
        <div class="lightbox-image-wrapper">
          <img class="lightbox-content" />
          <button class="lightbox-toggle-btn hidden">Flip</button>
        </div>
        <div class="lightbox-caption"></div>
      </div>
    `;
    document.body.style.overflow = "";
  });

  afterEach(() => {
    document.body.style.overflow = "";
    vi.restoreAllMocks();
  });

  it("starts with lightbox closed", () => {
    const { result } = renderHook(() => useImageLightbox());
    expect(result.current.isOpen).toBe(false);
    expect(result.current.currentSrc).toBe("");
  });

  it("opens lightbox with image src and alt", () => {
    const { result } = renderHook(() => useImageLightbox());
    const img = document.createElement("img");
    img.src = "/test.jpg";
    img.alt = "Test Image";

    act(() => {
      result.current.open(img);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.currentSrc).toContain("test.jpg");
    expect(result.current.currentAlt).toBe("Test Image");
    expect(result.current.isKitFlip).toBe(false);
  });

  it("opens lightbox with kit flip options", () => {
    const { result } = renderHook(() => useImageLightbox());
    const img = document.createElement("img");
    img.src = "/front.jpg";

    act(() => {
      result.current.open(img, {
        frontSrc: "/front.jpg",
        backSrc: "/back.jpg",
        frontAlt: "Kit Front",
        backAlt: "Kit Back",
      });
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.isKitFlip).toBe(true);
    expect(result.current.frontSrc).toBe("/front.jpg");
    expect(result.current.backSrc).toBe("/back.jpg");
  });

  it("closes lightbox and restores body overflow", () => {
    const { result } = renderHook(() => useImageLightbox());
    const img = document.createElement("img");
    img.src = "/test.jpg";

    act(() => {
      result.current.open(img);
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("toggles kit flip between front and back", () => {
    const { result } = renderHook(() => useImageLightbox());
    const img = document.createElement("img");
    img.src = "/front.jpg";

    act(() => {
      result.current.open(img, {
        frontSrc: "/front.jpg",
        backSrc: "/back.jpg",
        frontAlt: "Kit Front",
        backAlt: "Kit Back",
      });
    });

    expect(result.current.isShowingBack).toBe(false);
    expect(result.current.currentSrc).toContain("front.jpg");

    act(() => {
      result.current.toggleKitFlip();
    });

    expect(result.current.isShowingBack).toBe(true);
    expect(result.current.currentSrc).toContain("back.jpg");

    act(() => {
      result.current.toggleKitFlip();
    });

    expect(result.current.isShowingBack).toBe(false);
    expect(result.current.currentSrc).toContain("front.jpg");
  });

  it("closes on Escape key", () => {
    const { result } = renderHook(() => useImageLightbox());
    const img = document.createElement("img");
    img.src = "/test.jpg";

    act(() => {
      result.current.open(img);
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("does not close on other keys", () => {
    const { result } = renderHook(() => useImageLightbox());
    const img = document.createElement("img");
    img.src = "/test.jpg";

    act(() => {
      result.current.open(img);
    });

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    });
    expect(result.current.isOpen).toBe(true);
  });

  it("close function sets isOpen to false", () => {
    const { result } = renderHook(() => useImageLightbox());

    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("open sets isKitFlip to false for non-kit images", () => {
    const { result } = renderHook(() => useImageLightbox());
    const img = document.createElement("img");

    act(() => {
      result.current.open(img);
    });

    expect(result.current.isKitFlip).toBe(false);
    expect(result.current.frontSrc).toBeNull();
    expect(result.current.backSrc).toBeNull();
  });

  it("setupLightboxTriggers binds click handlers to images", () => {
    const mockOpen = vi.fn();
    document.body.innerHTML = `
      <img class="stadium-panorama-img" src="/stadium.jpg" alt="Stadium" />
    `;

    setupLightboxTriggers(mockOpen);

    const img = document.querySelector(".stadium-panorama-img") as HTMLImageElement;
    expect(img.getAttribute("tabindex")).toBe("0");
    expect(img.getAttribute("role")).toBe("button");

    img.click();
    expect(mockOpen).toHaveBeenCalled();
  });

  it("setupLightboxTriggers handles kit card images", () => {
    const mockOpen = vi.fn();
    document.body.innerHTML = `
      <img class="kit-img" src="/front.jpg" alt="Home Front" />
    `;

    setupLightboxTriggers(mockOpen);

    const img = document.querySelector(".kit-img") as HTMLImageElement;
    img.click();
    expect(mockOpen).toHaveBeenCalled();
  });

  it("setupLightboxTriggers does not rebind already bound images", () => {
    const mockOpen = vi.fn();
    document.body.innerHTML = `
      <img class="stadium-panorama-img" src="/stadium.jpg" />
    `;

    setupLightboxTriggers(mockOpen);
    setupLightboxTriggers(mockOpen);

    const img = document.querySelector(".stadium-panorama-img") as HTMLImageElement;
    img.click();
    expect(mockOpen).toHaveBeenCalledTimes(1);
  });

  it("setupLightboxTriggers sets aria-label on images without alt", () => {
    const mockOpen = vi.fn();
    document.body.innerHTML = `
      <img class="stadium-panorama-img" src="/stadium.jpg" />
    `;

    setupLightboxTriggers(mockOpen);

    const img = document.querySelector(".stadium-panorama-img") as HTMLImageElement;
    expect(img.getAttribute("aria-label")).toContain("Sporting CP asset");
  });

  it("setupLightboxTriggers handles Enter key on images", () => {
    const mockOpen = vi.fn();
    document.body.innerHTML = `
      <img class="stadium-panorama-img" src="/stadium.jpg" alt="Stadium" />
    `;

    setupLightboxTriggers(mockOpen);

    const img = document.querySelector(".stadium-panorama-img") as HTMLImageElement;
    img.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(mockOpen).toHaveBeenCalled();
  });

  it("setupLightboxTriggers handles Space key on images", () => {
    const mockOpen = vi.fn();
    document.body.innerHTML = `
      <img class="stadium-panorama-img" src="/stadium.jpg" alt="Stadium" />
    `;

    setupLightboxTriggers(mockOpen);

    const img = document.querySelector(".stadium-panorama-img") as HTMLImageElement;
    img.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    expect(mockOpen).toHaveBeenCalled();
  });

  it("toggleKitFlip does nothing when not in kit flip mode", () => {
    const { result } = renderHook(() => useImageLightbox());
    const img = document.createElement("img");
    img.src = "/test.jpg";

    act(() => {
      result.current.open(img);
    });

    act(() => {
      result.current.toggleKitFlip();
    });

    expect(result.current.isShowingBack).toBe(false);
  });

  it("useImageLightbox returns refs", () => {
    const { result } = renderHook(() => useImageLightbox());
    expect(result.current.lightboxRef).toBeDefined();
    expect(result.current.closeBtnRef).toBeDefined();
  });

  it("useImageLightbox provides handleBackdropClick", () => {
    const { result } = renderHook(() => useImageLightbox());
    expect(typeof result.current.handleBackdropClick).toBe("function");
  });
});
