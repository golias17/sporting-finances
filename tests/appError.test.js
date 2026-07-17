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
