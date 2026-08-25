import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePdfExport } from "../../src/hooks/usePdfExport.js";

const generateCuratedPdf = vi.fn(() => Promise.resolve());
vi.mock("../../src/ui/pdfGenerator.js", () => ({
  generateCuratedPdf: (...args: any[]) => generateCuratedPdf(...args),
}));

describe("usePdfExport hook", () => {
  beforeEach(() => {
    document.body.className = "";
    document.body.style.overflow = "";
    generateCuratedPdf.mockClear();
    generateCuratedPdf.mockImplementation(() => Promise.resolve());
  });

  it("starts with modal closed", () => {
    const { result } = renderHook(() => usePdfExport());
    expect(result.current.isOpen).toBe(false);
  });

  it("opens and closes the modal", () => {
    const { result } = renderHook(() => usePdfExport());

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
    expect(document.body.style.overflow).toBe("");
  });

  it("resets form state when opened", () => {
    const { result } = renderHook(() => usePdfExport());

    act(() => result.current.open());
    expect(result.current.pages).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(result.current.executiveNote).toBe("");
    expect(result.current.error).toBeNull();
  });

  it("toggles page selection", () => {
    const { result } = renderHook(() => usePdfExport());

    act(() => result.current.togglePage(1));
    expect(result.current.pages[1]).toBe(false);

    act(() => result.current.togglePage(1));
    expect(result.current.pages[1]).toBe(true);
  });

  it("sets language", () => {
    const { result } = renderHook(() => usePdfExport());

    act(() => result.current.setLanguage("pt"));
    expect(result.current.language).toBe("pt");

    act(() => result.current.setLanguage("en"));
    expect(result.current.language).toBe("en");
  });

  it("sets executive note", () => {
    const { result } = renderHook(() => usePdfExport());

    act(() => result.current.setExecutiveNote("Focus on debt."));
    expect(result.current.executiveNote).toBe("Focus on debt.");
  });

  it("submits form and calls generateCuratedPdf", async () => {
    const { result } = renderHook(() => usePdfExport());

    act(() => result.current.open());
    act(() => result.current.setLanguage("pt"));
    act(() => result.current.togglePage(1)); // uncheck page 2
    act(() => result.current.togglePage(3)); // uncheck page 4
    act(() => result.current.setExecutiveNote("Test note"));

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as any);
    });

    expect(generateCuratedPdf).toHaveBeenCalledWith({
      lang: "pt",
      pages: [true, false, true, false, true, true, true],
      executiveNote: "Test note",
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("shows error toast when generateCuratedPdf rejects", async () => {
    generateCuratedPdf.mockImplementation(() =>
      Promise.reject(new Error("boom")),
    );

    const { result } = renderHook(() => usePdfExport());

    act(() => result.current.open());

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as any);
    });

    expect(result.current.error).toContain("Couldn't generate the PDF");
  });

  it("clears error on close", async () => {
    generateCuratedPdf.mockImplementation(() =>
      Promise.reject(new Error("boom")),
    );

    const { result } = renderHook(() => usePdfExport());

    act(() => result.current.open());

    await act(async () => {
      await result.current.handleSubmit({
        preventDefault: vi.fn(),
      } as any);
    });

    expect(result.current.error).not.toBeNull();

    act(() => result.current.close());
    expect(result.current.error).toBeNull();
  });
});

describe("usePdfExport hook additional coverage", () => {
  it("handles toggle page", () => {
    const { result } = renderHook(() => usePdfExport());
    act(() => {
      result.current.togglePage(0);
    });
    expect(result.current.pages[0]).toBe(false);
  });

  it("handles set language", () => {
    const { result } = renderHook(() => usePdfExport());
    act(() => {
      result.current.setLanguage("pt");
    });
    expect(result.current.language).toBe("pt");
  });

  it("handles set executive note", () => {
    const { result } = renderHook(() => usePdfExport());
    act(() => {
      result.current.setExecutiveNote("Test note");
    });
    expect(result.current.executiveNote).toBe("Test note");
  });

  it("handles close", () => {
    const { result } = renderHook(() => usePdfExport());
    act(() => {
      result.current.open();
    });
    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("handles open", () => {
    const { result } = renderHook(() => usePdfExport());
    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
  });

  it("handles multiple toggle pages", () => {
    const { result } = renderHook(() => usePdfExport());
    act(() => {
      result.current.togglePage(0);
      result.current.togglePage(1);
      result.current.togglePage(2);
    });
    expect(result.current.pages[0]).toBe(false);
    expect(result.current.pages[1]).toBe(false);
    expect(result.current.pages[2]).toBe(false);
  });

  it("handles selectAll, deselectAll, setExecutivePreset, setFullPreset, and selectedCount", () => {
    const { result } = renderHook(() => usePdfExport());

    act(() => {
      result.current.deselectAll();
    });
    expect(result.current.pages.every((p) => p === false)).toBe(true);
    expect(result.current.selectedCount).toBe(0);

    act(() => {
      result.current.selectAll();
    });
    expect(result.current.pages.every((p) => p === true)).toBe(true);
    expect(result.current.selectedCount).toBe(7);

    act(() => {
      result.current.setExecutivePreset();
    });
    expect(result.current.pages).toEqual([
      true,
      false,
      false,
      false,
      false,
      true,
      false,
    ]);
    expect(result.current.selectedCount).toBe(2);

    act(() => {
      result.current.setFullPreset();
    });
    expect(result.current.pages).toEqual([
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(result.current.selectedCount).toBe(7);
  });
});
