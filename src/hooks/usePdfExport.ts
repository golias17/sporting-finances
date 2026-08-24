import { useState, useCallback, useEffect } from "react";
import { useAppState } from "../core/state.js";

interface PdfExportState {
  isOpen: boolean;
  isGenerating: boolean;
  language: "en" | "pt";
  pages: boolean[];
  executiveNote: string;
  error: string | null;
}

const initialState: PdfExportState = {
  isOpen: false,
  isGenerating: false,
  language: "en",
  pages: [true, true, true, true, true, true, true],
  executiveNote: "",
  error: null,
};

/**
 * Manages the PDF export modal state, quick presets, and form submission.
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
      isGenerating: false,
      language: isPt ? "pt" : "en",
      pages: [true, true, true, true, true, true, true],
      executiveNote: "",
      error: null,
    }));
    document.body.style.overflow = "hidden";
  }, [isPt]);

  const close = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
      isGenerating: false,
      error: null,
    }));
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

  const selectAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      pages: [true, true, true, true, true, true, true],
    }));
  }, []);

  const deselectAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      pages: [false, false, false, false, false, false, false],
    }));
  }, []);

  const setExecutivePreset = useCallback(() => {
    // Cover (page 1, index 0) + Benchmark (page 6, index 5)
    setState((prev) => ({
      ...prev,
      pages: [true, false, false, false, false, true, false],
    }));
  }, []);

  const setFullPreset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      pages: [true, true, true, true, true, true, true],
    }));
  }, []);

  const setExecutiveNote = useCallback((note: string) => {
    setState((prev) => ({ ...prev, executiveNote: note }));
  }, []);

  const selectedCount = state.pages.filter(Boolean).length;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const { language, pages, executiveNote } = state;

      if (pages.filter(Boolean).length === 0) {
        return;
      }

      setState((prev) => ({ ...prev, isGenerating: true }));

      try {
        const { generateCuratedPdf } = await import("../ui/pdfGenerator.js");
        await generateCuratedPdf({ lang: language, pages, executiveNote });
        close();
      } catch (err) {
        console.error("Failed to generate PDF export", err);
        const msg = isPt
          ? "Não foi possível gerar o PDF. Tente novamente."
          : "Couldn't generate the PDF. Please try again.";
        setState((prev) => ({ ...prev, isGenerating: false, error: msg }));
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
      if (e.key === "Escape" && !state.isGenerating) close();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [state.isOpen, state.isGenerating, close]);

  // Backdrop click handler
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && !state.isGenerating) close();
    },
    [close, state.isGenerating],
  );

  return {
    ...state,
    selectedCount,
    open,
    close,
    setLanguage,
    togglePage,
    selectAll,
    deselectAll,
    setExecutivePreset,
    setFullPreset,
    setExecutiveNote,
    handleSubmit,
    handleBackdropClick,
  };
}
