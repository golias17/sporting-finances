import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { TopNav } from "../../src/components/TopNav";
import { useAppState } from "../../src/core/state";

vi.mock("../../src/core/state", () => ({
  useAppState: vi.fn(),
}));

vi.mock("../../src/ui/translations", () => ({
  loadTranslations: vi.fn(),
}));

vi.mock("../../src/utils/urlSync", () => ({
  syncStateToUrl: vi.fn(),
}));

vi.mock("../../src/ui/themeToggle", () => ({
  updateChartTheme: vi.fn(),
  MOON_SVG: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>',
  SUN_SVG: '<circle cx="12" cy="12" r="5"></circle>',
}));

vi.mock("../../src/hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    T: ({ as: Component = "span", children, i18nKey, ...props }: any) => (
      <Component {...props}>{children || i18nKey}</Component>
    ),
  }),
}));

describe("TopNav Component", () => {
  let mockSetIsPt: any;
  let mockSetTheme: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockSetIsPt = vi.fn();
    mockSetTheme = vi.fn();

    // Mock localStorage
    const mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true
    });

    (useAppState as any).mockImplementation((selector: any) => {
      const state = {
        isPt: false,
        theme: "light",
        setIsPt: mockSetIsPt,
        setTheme: mockSetTheme,
      };
      return selector(state);
    });
    
    document.body.classList.remove("dark");
  });

  it("renders the top navigation bar", () => {
    render(<TopNav />);
    
    expect(screen.getByText("topbar-update")).toBeInTheDocument();
    expect(screen.getByText("EN")).toBeInTheDocument();
    expect(screen.getByText("PT")).toBeInTheDocument();
  });

  it("toggles the language when clicked", () => {
    render(<TopNav />);
    
    const ptBtn = screen.getByText("PT");
    fireEvent.click(ptBtn);

    expect(mockSetIsPt).toHaveBeenCalledWith(true);
  });

  it("toggles the theme when theme button is clicked", () => {
    render(<TopNav />);
    
    const themeBtn = screen.getByText("nav-theme-light");
    fireEvent.click(themeBtn);

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
    expect(document.body.classList.contains("dark")).toBe(true);
  });

  it("handles language toggle when already in same language", () => {
    (useAppState as any).mockImplementation((selector: any) => {
      const state = {
        isPt: true,
        theme: "light",
        setIsPt: mockSetIsPt,
        setTheme: mockSetTheme,
      };
      return selector(state);
    });

    render(<TopNav />);
    
    const ptBtn = screen.getByText("PT");
    fireEvent.click(ptBtn);

    // Should not call setIsPt since already in PT
    expect(mockSetIsPt).not.toHaveBeenCalled();
  });

  it("handles dark theme to light theme toggle", () => {
    (useAppState as any).mockImplementation((selector: any) => {
      const state = {
        isPt: false,
        theme: "dark",
        setIsPt: mockSetIsPt,
        setTheme: mockSetTheme,
      };
      return selector(state);
    });

    document.body.classList.add("dark");
    
    render(<TopNav />);
    
    const themeBtn = screen.getByText("nav-theme-dark");
    fireEvent.click(themeBtn);

    expect(mockSetTheme).toHaveBeenCalledWith("light");
    expect(document.body.classList.contains("dark")).toBe(false);
  });

  it("handles PDF export button click", () => {
    const mockOnPdfExport = vi.fn();
    render(<TopNav onPdfExport={mockOnPdfExport} />);
    
    const pdfBtn = screen.getByRole("button", { name: /export/i });
    fireEvent.click(pdfBtn);

    expect(mockOnPdfExport).toHaveBeenCalled();
  });

  it("renders without PDF export button when onPdfExport is not provided", () => {
    render(<TopNav />);
    
    // Should still render without errors
    expect(screen.getByText("EN")).toBeInTheDocument();
  });
});
