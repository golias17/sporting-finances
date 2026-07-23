import { describe, it, expect, beforeEach, vi } from "vitest";
import { externalTooltipHandler } from "../../src/charts/chartWidgets";

// Mock document methods
const mockAppendChild = vi.fn();
const mockGetElementById = vi.fn();
const mockCreateElement = vi.fn();
const mockGetBoundingClientRect = vi.fn();

Object.defineProperty(document, "getElementById", {
  value: mockGetElementById,
  writable: true,
});

Object.defineProperty(document, "createElement", {
  value: mockCreateElement,
  writable: true,
});

Object.defineProperty(document.body, "appendChild", {
  value: mockAppendChild,
  writable: true,
});

describe("chartWidgets.js — externalTooltipHandler", () => {
  let tooltipEl: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a mock tooltip element
    tooltipEl = {
      id: "",
      className: "",
      innerHTML: "",
      style: { left: "", top: "" },
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
    };
    
    mockGetElementById.mockReturnValue(null);
    mockCreateElement.mockReturnValue(tooltipEl);
    mockGetBoundingClientRect.mockReturnValue({
      left: 100,
      top: 200,
      width: 300,
      height: 150,
    });
  });

  it("creates tooltip element if it doesn't exist", () => {
    const chart = {
      canvas: {
        getBoundingClientRect: mockGetBoundingClientRect,
      },
    };
    const tooltip = {
      opacity: 1,
      body: [],
      title: [],
      footer: [],
      labelColors: [],
      caretX: 50,
      caretY: 30,
    };

    externalTooltipHandler({ chart, tooltip });

    expect(mockGetElementById).toHaveBeenCalledWith("chartjs-tooltip");
    expect(mockCreateElement).toHaveBeenCalledWith("div");
    expect(tooltipEl.id).toBe("chartjs-tooltip");
    expect(tooltipEl.className).toBe("glass-tooltip hidden");
    expect(mockAppendChild).toHaveBeenCalled();
  });

  it("hides tooltip when opacity is 0", () => {
    mockGetElementById.mockReturnValue(tooltipEl);
    
    const chart = {
      canvas: {
        getBoundingClientRect: mockGetBoundingClientRect,
      },
    };
    const tooltip = {
      opacity: 0,
      body: [],
      title: [],
      footer: [],
      labelColors: [],
      caretX: 50,
      caretY: 30,
    };

    externalTooltipHandler({ chart, tooltip });

    expect(tooltipEl.classList.add).toHaveBeenCalledWith("hidden");
  });

  it("renders tooltip with body content", () => {
    mockGetElementById.mockReturnValue(tooltipEl);
    
    const chart = {
      canvas: {
        getBoundingClientRect: mockGetBoundingClientRect,
      },
    };
    const tooltip = {
      opacity: 1,
      body: [
        {
          lines: ["Revenue: €100M"],
        },
      ],
      title: ["2023/24"],
      footer: [],
      labelColors: [
        { backgroundColor: "#ff0000", borderColor: "#cc0000" },
      ],
      caretX: 50,
      caretY: 30,
    };

    externalTooltipHandler({ chart, tooltip });

    expect(tooltipEl.innerHTML).toContain("glass-tooltip-title");
    expect(tooltipEl.innerHTML).toContain("2023/24");
    expect(tooltipEl.innerHTML).toContain("glass-tooltip-body");
    expect(tooltipEl.innerHTML).toContain("Revenue");
    expect(tooltipEl.innerHTML).toContain("€100M");
  });

  it("renders footer when present", () => {
    mockGetElementById.mockReturnValue(tooltipEl);
    
    const chart = {
      canvas: {
        getBoundingClientRect: mockGetBoundingClientRect,
      },
    };
    const tooltip = {
      opacity: 1,
      body: [
        {
          lines: ["Test: value"],
        },
      ],
      title: ["Title"],
      footer: ["Footer text"],
      labelColors: [
        { backgroundColor: "#00ff00", borderColor: "#00cc00" },
      ],
      caretX: 50,
      caretY: 30,
    };

    externalTooltipHandler({ chart, tooltip });

    expect(tooltipEl.innerHTML).toContain("glass-tooltip-footer");
    expect(tooltipEl.innerHTML).toContain("Footer text");
  });

  it("positions tooltip correctly", () => {
    mockGetElementById.mockReturnValue(tooltipEl);
    
    const chart = {
      canvas: {
        getBoundingClientRect: mockGetBoundingClientRect,
      },
    };
    const tooltip = {
      opacity: 1,
      body: [],
      title: [],
      footer: [],
      labelColors: [],
      caretX: 50,
      caretY: 30,
    };

    externalTooltipHandler({ chart, tooltip });

    expect(tooltipEl.style.left).toBe("150px"); // 100 + 50
    expect(tooltipEl.style.top).toBe("218px"); // 200 + 30 - 12
  });
});
