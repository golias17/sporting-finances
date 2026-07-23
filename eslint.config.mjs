import tseslint from "typescript-eslint";
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  ...tseslint.configs.recommended,

  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        // Browser globals — most are covered by tsconfig's "lib": ["DOM"],
        // but ESLint needs them declared for the no-undef rule (currently off).
        // Only non-standard or library globals that TS lib doesn't cover are
        // listed here; standard DOM/window APIs are implicit.
        Chart: "readonly", // chart.js global when loaded via CDN
        caches: "readonly", // Service Worker Cache API
        self: "readonly", // Service Worker global scope
        FetchEvent: "readonly", // Service Worker event type
        registration: "readonly", // Service Worker registration
        global: "readonly", // Node.js compat in some build contexts
      },
    },
    rules: {
      "no-unused-vars": "off", // Disable base rule
      "@typescript-eslint/no-unused-vars": "off", // Too many legacy issues
      "@typescript-eslint/no-require-imports": "off", // Allow require in tests/setup.js
      "no-undef": "off", // TypeScript already checks for undefined variables
      "@typescript-eslint/no-explicit-any": "off", // Allow explicit any during JS -> TS migration
      "@typescript-eslint/no-unused-expressions": "off", // Too many false positives
      "@typescript-eslint/ban-ts-comment": "off", // We need @ts-nocheck in some config files
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
    // dist_check*/ are ad-hoc `vite build --outDir` verification dirs (see
    // .gitignore) — untracked scratch output, not source to lint.
    ignores: ["dist/**", "dist_check*/**", "node_modules/**", "coverage/**", "playwright-report/**", "test-results/**"],
  },
  prettierConfig,
);
