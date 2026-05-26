import js from "@eslint/js";

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
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**"],
  },
];
