import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        document: "readonly",
        window: "readonly",
        console: "readonly",
        fetch: "readonly",
        Chart: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        navigator: "readonly",
        location: "readonly",
        history: "readonly",
        IntersectionObserver: "readonly",
        AbortController: "readonly",
        Blob: "readonly",
        URL: "readonly",
        Request: "readonly",
        Response: "readonly",
        Headers: "readonly",
        caches: "readonly",
        self: "readonly",
        FetchEvent: "readonly",
        registration: "readonly",
        global: "readonly",
        HTMLCanvasElement: "readonly",
        Image: "readonly",
        URLSearchParams: "readonly",
        HTMLAnchorElement: "readonly",
        Document: "readonly",
        ResizeObserver: "readonly",
        Element: "readonly",
        Event: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-console": ["warn", { allow: ["info", "warn", "error"] }],
    },
  },
  {
    // Node CLI scripts (build-time tooling) run outside the browser.
    files: ["scripts/**"],
    languageOptions: {
      globals: {
        process: "readonly",
      },
    },
    rules: {
      "no-console": "off",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
  prettierConfig,
];
