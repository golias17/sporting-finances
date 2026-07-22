import { useState, useCallback, useEffect } from "react";
import { useAppState } from "../core/state.js";

interface PdfExportState {
  isOpen: boolean;
  language: "en" | "pt";
  pages: boolean[];
  executiveNote: string;
  error: string | null;
}

const initialState: PdfExportState = {
  isOpen: false,
  language: "en",
  pages: [true, true, true, true, true],
  executiveNote: "",
  error: null,
};

/**
 * Manages the PDF export modal state and form submission.
 * Replaces the imperative initPdfExport() with React-managed state.
 */
export function usePdfExport() {
  const isPt = useAppState((s) => s.isPt);
  const [state, setState] = useState<PdfExportState>({
    ...initialState,
    language: isPt ? "pt" : "en",
  });

  const open = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: true,
      language: isPt ? "pt" : "en",
      pages: [true, true, true, true, true],
      executiveNote: "",
      error: null,
    }));
    document.body.style.overflow = "hidden";
  }, [isPt]);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false, error: null }));
    document.body.style.overflow = "";
  }, []);

  const setLanguage = useCallback((lang: "en" | "pt") => {
    setState((prev) => ({ ...prev, language: lang }));
  }, []);

  const togglePage = useCallback((index: number) => {
    setState((prev) => {
      const pages = [...prev.pages];
      pages[index] = !pages[index];
      return { ...prev, pages };
    });
  }, []);

  const setExecutiveNote = useCallback((note: string) => {
    setState((prev) => ({ ...prev, executiveNote: note }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const { language, pages, executiveNote } = state;

      close();

      try {
        const { generateCuratedPdf } = await import("../ui/pdfGenerator.js");
        await generateCuratedPdf({ lang: language, pages, executiveNote });
      } catch (err) {
        console.error("Failed to generate PDF export", err);
        const msg = isPt
          ? "Não foi possível gerar o PDF. Tente novamente."
          : "Couldn't generate the PDF. Please try again.";
        setState((prev) => ({ ...prev, error: msg }));
        // Auto-dismiss error after 5 seconds
        setTimeout(() => {
          setState((prev) => ({ ...prev, error: null }));
        }, 5000);
      }
    },
    [state, close, isPt],
  );

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
      if (e.target === e.currentTarget) close();
    },
    [close],
  );

  return {
    ...state,
    open,
    close,
    setLanguage,
    togglePage,
    setExecutiveNote,
    handleSubmit,
    handleBackdropClick,
  };
}
