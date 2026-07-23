import "@testing-library/jest-dom";
import { vi } from "vitest";

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

vi.mock("react-chartjs-2", () => {
  const React = require("react");
  return {
    Bar: () => React.createElement("div", { "data-testid": "mock-chart-bar" }),
    Line: () =>
      React.createElement("div", { "data-testid": "mock-chart-line" }),
    Pie: () => React.createElement("div", { "data-testid": "mock-chart-pie" }),
    Doughnut: () =>
      React.createElement("div", { "data-testid": "mock-chart-doughnut" }),
    Chart: () =>
      React.createElement("div", { "data-testid": "mock-chart-bar" }),
  };
});

import fs from "fs";
import path from "path";

global.fetch = vi.fn((url) => {
  if (typeof url !== "string") return Promise.reject(new Error("Invalid URL"));
  let filePath;
  if (url.includes("en.json")) {
    filePath = path.resolve(__dirname, "../public/locales/en.json");
  } else if (url.includes("pt.json")) {
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
  } catch (e) {
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  }
});
