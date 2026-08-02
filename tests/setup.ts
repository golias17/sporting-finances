import "@testing-library/jest-dom";
import { beforeAll, vi } from "vitest";
import { initChartDefaults } from "../src/charts/chartUtils.js";
import fs from "fs";
import path from "path";

vi.mock("react-chartjs-2", () => {
  const React = require("react");
  return {
    Bar: () => React.createElement("div", { "data-testid": "mock-chart-bar" }),
    Line: () => React.createElement("div", { "data-testid": "mock-chart-line" }),
    Pie: () => React.createElement("div", { "data-testid": "mock-chart-pie" }),
    Doughnut: () => React.createElement("div", { "data-testid": "mock-chart-doughnut" }),
    Chart: () => React.createElement("div", { "data-testid": "mock-chart-bar" }),
  };
});

if (typeof global !== "undefined") {
  global.fetch = vi.fn((url: string | URL | Request) => {
    const urlStr = typeof url === "string" ? url : url.toString();
    let filePath: string;
    if (urlStr.includes("en.json")) {
      filePath = path.resolve(__dirname, "../public/locales/en.json");
    } else if (urlStr.includes("pt.json")) {
      filePath = path.resolve(__dirname, "../public/locales/pt.json");
    } else {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }

    try {
      const content = fs.readFileSync(filePath, "utf8");
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(JSON.parse(content)),
      });
    } catch {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }
  }) as any;
}

beforeAll(() => {
  if (typeof window !== "undefined") {
    const mockStorage = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = String(value);
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
        key: (index: number) => Object.keys(store)[index] || null,
        get length() {
          return Object.keys(store).length;
        },
      };
    })();

    try {
      delete (globalThis as any).localStorage;
    } catch {
      // Not configurable in this environment
    }
    try {
      delete (window as any).localStorage;
    } catch {
      // Not configurable in this environment
    }

    try {
      Object.defineProperty(window, "localStorage", {
        value: mockStorage,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, "localStorage", {
        value: mockStorage,
        writable: true,
        configurable: true,
      });
    } catch {
      // localStorage already defined
    }

    if (!window.getComputedStyle) {
      window.getComputedStyle = (el: Element) =>
        ({
          getPropertyValue: () => "",
          width: (el as HTMLElement)?.style?.width || "0px",
          height: (el as HTMLElement)?.style?.height || "0px",
        }) as any;
    } else {
      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = (el: Element) => {
        try {
          return (
            originalGetComputedStyle(el) ||
            (({
              getPropertyValue: () => "",
              width: (el as HTMLElement)?.style?.width || "0px",
              height: (el as HTMLElement)?.style?.height || "0px",
            } as any) as CSSStyleDeclaration)
          );
        } catch {
          return ({
            getPropertyValue: () => "",
            width: (el as HTMLElement)?.style?.width || "0px",
            height: (el as HTMLElement)?.style?.height || "0px",
          } as any) as CSSStyleDeclaration;
        }
      };
    }
  }

  if (typeof Document !== "undefined" && typeof window !== "undefined") {
    Object.defineProperty(Document.prototype, "defaultView", {
      get() {
        return window;
      },
      configurable: true,
    });
  }

  if (typeof global !== "undefined" && !global.ResizeObserver) {
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  initChartDefaults();
});
