import { useState, useCallback, useEffect, useRef } from "react";

const IFRAME_SRC =
  "https://e.issuu.com/embed.html?backgroundColor=%23008057&backgroundColorFullscreen=%23008057&d=jornal_sporting_n._4077&hideIssuuLogo=true&hideShareButton=true&showOtherPublicationsAsSuggestions=true&u=sporting-digitalpaper";

/**
 * Manages the Jornal (newspaper) reader modal state.
 * Replaces the imperative initJornalModal() with React-managed state.
 */
export function useJornalModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const previouslyFocused = useRef<Element | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const open = useCallback(() => {
    previouslyFocused.current = document.activeElement;
    setIsOpen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    document.body.style.overflow = "";
    if (previouslyFocused.current instanceof HTMLElement) {
      previouslyFocused.current.focus();
    }
    previouslyFocused.current = null;
  }, []);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  // Focus trap when modal opens
  useEffect(() => {
    if (isOpen && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [isOpen]);

  // Backdrop click handler
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === modalRef.current) close();
    },
    [close],
  );

  return {
    isOpen,
    iframeLoaded,
    setIframeLoaded,
    modalRef,
    closeBtnRef,
    open,
    close,
    handleBackdropClick,
    iframeSrc: IFRAME_SRC,
  };
}
