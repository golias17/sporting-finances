import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Manages the "scroll to top" button visibility and click behavior.
 * Returns a ref to attach to the button element and its visibility state.
 */
export function useScrollToTop(threshold = 300) {
  const [isVisible, setIsVisible] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setIsVisible(window.scrollY > threshold);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return { btnRef, isVisible, scrollToTop };
}
