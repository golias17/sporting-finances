import { useState, useCallback, useEffect, useRef } from "react";
import { trapFocusWithin } from "../utils/focusTrap.js";

interface LightboxState {
  isOpen: boolean;
  currentSrc: string;
  currentAlt: string;
  isKitFlip: boolean;
  frontSrc: string | null;
  backSrc: string | null;
  frontAlt: string;
  backAlt: string;
  isShowingBack: boolean;
}

const initialState: LightboxState = {
  isOpen: false,
  currentSrc: "",
  currentAlt: "",
  isKitFlip: false,
  frontSrc: null,
  backSrc: null,
  frontAlt: "",
  backAlt: "",
  isShowingBack: false,
};

/**
 * Manages the image lightbox modal state and behavior.
 * Replaces the imperative initImageLightbox() with React-managed state.
 */
export function useImageLightbox() {
  const [state, setState] = useState<LightboxState>(initialState);
  const previouslyFocused = useRef<Element | null>(null);
  const releaseFocusTrap = useRef<(() => void) | null>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const open = useCallback(
    (
      img: HTMLImageElement,
      options?: { frontSrc?: string; backSrc?: string; frontAlt?: string; backAlt?: string },
    ) => {
      const src = img.src;
      const alt = img.alt || "Sporting CP Asset";

      if (options?.frontSrc && options?.backSrc) {
        const isShowingBack = src === options.backSrc;
        setState({
          isOpen: true,
          currentSrc: isShowingBack ? options.backSrc : options.frontSrc,
          currentAlt: isShowingBack ? (options.backAlt || "Kit Back") : (options.frontAlt || "Kit Front"),
          isKitFlip: true,
          frontSrc: options.frontSrc,
          backSrc: options.backSrc,
          frontAlt: options.frontAlt || "Kit Front",
          backAlt: options.backAlt || "Kit Back",
          isShowingBack,
        });
      } else {
        setState({
          ...initialState,
          isOpen: true,
          currentSrc: src,
          currentAlt: alt,
        });
      }

      previouslyFocused.current = document.activeElement;
      document.body.style.overflow = "hidden";
    },
    [],
  );

  const close = useCallback(() => {
    setState(initialState);
    document.body.style.overflow = "";
    if (releaseFocusTrap.current) {
      releaseFocusTrap.current();
      releaseFocusTrap.current = null;
    }
    if (previouslyFocused.current instanceof HTMLElement) {
      previouslyFocused.current.focus();
    }
    previouslyFocused.current = null;
  }, []);

  const toggleKitFlip = useCallback(() => {
    setState((prev) => {
      if (!prev.isKitFlip || !prev.frontSrc || !prev.backSrc) return prev;
      const newIsShowingBack = !prev.isShowingBack;
      return {
        ...prev,
        isShowingBack: newIsShowingBack,
        currentSrc: newIsShowingBack ? prev.backSrc : prev.frontSrc,
        currentAlt: newIsShowingBack ? prev.backAlt : prev.frontAlt,
      };
    });
  }, []);

  // Focus trap when lightbox opens
  useEffect(() => {
    if (state.isOpen && lightboxRef.current) {
      releaseFocusTrap.current = trapFocusWithin(lightboxRef.current);
      closeBtnRef.current?.focus();
    }
  }, [state.isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!state.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [state.isOpen, close]);

  // Backdrop click handler
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === lightboxRef.current) close();
    },
    [close],
  );

  return {
    ...state,
    lightboxRef,
    closeBtnRef,
    open,
    close,
    toggleKitFlip,
    handleBackdropClick,
  };
}

/**
 * Sets up click/keydown handlers on lightbox-triggering images.
 * Call this in a useEffect after mount.
 */
export function setupLightboxTriggers(
  onOpen: (img: HTMLImageElement, options?: { frontSrc?: string; backSrc?: string; frontAlt?: string; backAlt?: string }) => void,
) {
  const targets = document.querySelectorAll<HTMLImageElement>(
    ".stadium-panorama-img, .court-panorama-img, .academy-panorama-img, .museum-panorama-img, .kit-img",
  );

  targets.forEach((img) => {
    if (img.dataset.lightboxBound) return;
    img.dataset.lightboxBound = "true";

    img.setAttribute("tabindex", "0");
    img.setAttribute("role", "button");
    if (!img.hasAttribute("aria-label")) {
      img.setAttribute(
        "aria-label",
        `${img.alt || "Sporting CP asset"} — view enlarged`,
      );
    }

    const handleClick = () => {
      const kitInner = img.closest(".kit-card-inner");
      if (kitInner) {
        const frontImg = kitInner.querySelector(".kit-card-front img") as HTMLImageElement;
        const backImg = kitInner.querySelector(".kit-card-back img") as HTMLImageElement;
        if (frontImg && backImg) {
          onOpen(img, {
            frontSrc: frontImg.src,
            backSrc: backImg.src,
            frontAlt: frontImg.alt || "Kit Front",
            backAlt: backImg.alt || "Kit Back",
          });
          return;
        }
      }
      onOpen(img);
    };

    img.addEventListener("click", handleClick);
    img.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    });
  });
}
