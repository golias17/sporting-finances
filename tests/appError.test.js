import { describe, it, expect, beforeAll, vi } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("app load failure", () => {
  beforeAll(async () => {
    // Setup minimal DOM
    const html = fs.readFileSync(
      path.resolve(__dirname, "../index.html"),
      "utf8",
    );
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
    document.body.innerHTML = bodyMatch[1];
    document.body.classList.add("app-loading");

    // Stub window matchMedia
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    // Mock fetch to reject/throw an error to trigger load failure
    global.fetch = vi.fn(() => Promise.reject(new Error("Network Error")));

    // Import main.js, which triggers initApp()
    await import("../src/main.js");

    // Wait for the app-loading class to be removed (signaling initApp's finally block)
    await vi.waitFor(() =>
      expect(document.body.classList.contains("app-loading")).toBe(false),
    );
  });

  it("renders the programmatically built error banner in document.body", () => {
    const errorTitle = document.body.querySelector("h2");
    expect(errorTitle).not.toBeNull();
    expect(errorTitle.textContent).toBe("Failed to load application data.");

    const pre = document.body.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre.textContent).toContain("Error Details:");
    expect(pre.textContent).toContain("Network Error");
  });
});

// initApp() treats a *resolved* fetch with `ok: false` (e.g. a 404/500 from
// the local dev server) as a distinct failure mode from a rejected fetch
// (network error, covered above) — each has its own explicit
// `if (!res.ok) throw new Error(...)` check (main.js) so the banner's error
// text names the specific file and HTTP status instead of a generic
// network-error message. Each scenario needs its own isolated app boot
// (fresh module registry + DOM), since main.js runs initApp() once at
// import time as a side effect.
describe("app load failure — financials.json responds but not ok", () => {
  beforeAll(async () => {
    vi.resetModules();
    const html = fs.readFileSync(
      path.resolve(__dirname, "../index.html"),
      "utf8",
    );
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
    document.body.innerHTML = bodyMatch[1];
    document.body.classList.add("app-loading");

    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    global.fetch = vi.fn((url) => {
      const u = String(url);
      if (u.includes("data/financials.json")) {
        return Promise.resolve({ ok: false, status: 404, statusText: "Not Found" });
      }
      if (u.includes("data/transfers.json")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      if (u.includes("locales/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: false });
    });

    await import("../src/main.js");
    await vi.waitFor(() =>
      expect(document.body.classList.contains("app-loading")).toBe(false),
    );
  });

  it("names financials.json and its HTTP status in the error banner", () => {
    const pre = document.body.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre.textContent).toContain("data/financials.json");
    expect(pre.textContent).toContain("HTTP 404 Not Found");
  });
});

describe("app load failure — transfers.json responds but not ok", () => {
  beforeAll(async () => {
    vi.resetModules();
    const html = fs.readFileSync(
      path.resolve(__dirname, "../index.html"),
      "utf8",
    );
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
    document.body.innerHTML = bodyMatch[1];
    document.body.classList.add("app-loading");

    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    global.fetch = vi.fn((url) => {
      const u = String(url);
      if (u.includes("data/financials.json")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ annual_data: [] }),
        });
      }
      if (u.includes("data/transfers.json")) {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });
      }
      if (u.includes("locales/")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: false });
    });

    await import("../src/main.js");
    await vi.waitFor(() =>
      expect(document.body.classList.contains("app-loading")).toBe(false),
    );
  });

  it("names transfers.json and its HTTP status in the error banner", () => {
    const pre = document.body.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre.textContent).toContain("data/transfers.json");
    expect(pre.textContent).toContain("HTTP 500 Internal Server Error");
  });
});

// Every other test file that boots main.js (app.test.js) always sets
// localStorage's "theme" key before importing, so the
// `else { document.body.classList.remove("dark"); updateThemeUI(false); }`
// branch of the theme-detection boot logic (main.js, inside setupApp) —
// taken when there's no saved preference and the OS isn't set to dark — has
// never run anywhere else in the suite.
describe("app boot — no saved theme, system prefers light", () => {
  beforeAll(async () => {
    vi.resetModules();
    const html = fs.readFileSync(
      path.resolve(__dirname, "../index.html"),
      "utf8",
    );
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
    document.body.innerHTML = bodyMatch[1];
    document.body.classList.add("app-loading");
    document.body.classList.remove("dark"); // in case a prior file's boot left it set

    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false, // system does NOT prefer dark
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    window.scrollTo = vi.fn();
    Element.prototype.scrollTo = vi.fn();
    global.IntersectionObserver = class {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
    };

    window.localStorage.clear(); // no saved "theme" key at all

    const publicDir = path.resolve(__dirname, "../public");
    function serveFile(rel) {
      const content = fs.readFileSync(path.resolve(publicDir, rel), "utf8");
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(JSON.parse(content)),
      });
    }
    global.fetch = vi.fn((url) => {
      const u = String(url);
      if (u.includes("data/financials.json"))
        return serveFile("data/financials.json");
      if (u.includes("data/transfers.json"))
        return serveFile("data/transfers.json");
      if (u.includes("locales/en.json")) return serveFile("locales/en.json");
      if (u.includes("locales/pt.json")) return serveFile("locales/pt.json");
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });
    });

    await import("../src/main.js");
    await vi.waitFor(() =>
      expect(document.body.classList.contains("app-loading")).toBe(false),
    );
  });

  it("defaults to the light theme instead of dark", () => {
    expect(document.body.classList.contains("dark")).toBe(false);
    const themeBtn = document.getElementById("themeToggleBtn");
    // updateThemeUI(false) labels the toggle button to switch *to* dark next.
    expect(themeBtn.querySelector("span").textContent).toBe("Dark Mode");
  });
});
