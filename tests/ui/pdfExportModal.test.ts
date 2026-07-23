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
    expect(result.current.pages).toEqual([true, true, true, true, true]);
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
      pages: [true, false, true, false, true],
      executiveNote: "Test note",
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("shows error toast when generateCuratedPdf rejects", async () => {
    generateCuratedPdf.mockImplementation(() => Promise.reject(new Error("boom")));

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
    generateCuratedPdf.mockImplementation(() => Promise.reject(new Error("boom")));

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
