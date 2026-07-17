import { beforeAll } from "vitest";
import { initChartDefaults } from "../src/chartUtils.js";

beforeAll(() => {
  // Ensure window.getComputedStyle is robustly mocked
  if (typeof window !== "undefined") {
    const mockStorage = (() => {
      let store = {};
      return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = String(value); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
        key: (index) => Object.keys(store)[index] || null,
        get length() { return Object.keys(store).length; }
      };
    })();

    try {
      delete globalThis.localStorage;
    } catch {
      // Not configurable in this environment; defineProperty below will overwrite it.
    }
    try {
      delete window.localStorage;
    } catch {
      // Not configurable in this environment; defineProperty below will overwrite it.
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
      // localStorage already defined as non-configurable; leave native impl in place.
    }

    if (!window.getComputedStyle) {
      window.getComputedStyle = (el) => ({
        getPropertyValue: () => "",
        width: el?.style?.width || "0px",
        height: el?.style?.height || "0px",
      });
    } else {
      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = (el) => {
        try {
          return (
            originalGetComputedStyle(el) || {
              getPropertyValue: () => "",
              width: el?.style?.width || "0px",
              height: el?.style?.height || "0px",
            }
          );
        } catch {
          return {
            getPropertyValue: () => "",
            width: el?.style?.width || "0px",
            height: el?.style?.height || "0px",
          };
        }
      };
    }
  }

  // Prevent defaultView from returning null on detached documents
  if (typeof Document !== "undefined" && typeof window !== "undefined") {
    Object.defineProperty(Document.prototype, "defaultView", {
      get() {
        return window;
      },
      configurable: true,
    });
  }

  // Mock global ResizeObserver if not already present
  if (typeof global !== "undefined" && !global.ResizeObserver) {
    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  // Populate state.COLORS and state.baseOpts to prevent accessed-before-init warnings in tests
  initChartDefaults();
});
