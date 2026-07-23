# Sporting CP — Financial Evolution Dashboard (2010/11 → 2024/25)

An interactive, high-fidelity React Single Page Application (SPA) dashboard tracing the financial evolution of **Sporting Clube de Portugal - Futebol, SAD** over the last 15 fiscal years.

**Hosted Live:** [https://golias17.github.io/sporting-finances/](https://golias17.github.io/sporting-finances/)

---

## 🏟️ Overview

This dashboard aggregates, visualizes, and contextualizes annual financial statements filed by Sporting SAD with the Portuguese Securities Market Commission (CMVM). It offers an editorial, data-driven walkthrough of the club's transition from technical insolvency (~€119M negative equity in 2010/11) to securing an investment-grade rating of **BBB− / BBB (low)** on its historic **€225M USPP bond placement** in October 2025.

The dashboard also includes a **Competitive Analysis** tab comparing Sporting CP with SL Benfica and FC Porto across 15 seasons of financial data.

---

## 📈 Key Features

- **Modern React SPA Architecture**: Built with React 19, Vite 8, and TypeScript 6, achieving lightning-fast hot module replacement, optimized production bundles, and fully componentized domain logic.
- **Robust State Management**: Powered by **Zustand**, providing a scalable, reactive, proxy-free store that seamlessly syncs with the browser URL for perfect routing and deep-linking.
- **100% Type-Safe**: Written in rigorous TypeScript, ensuring rock-solid data models, UI components, and API integration.
- **Dynamic Localization (i18n)**: Instantly switch between English and Portuguese using a custom React `useTranslation` hook.
- **14 Comprehensive Tab Views**: Detailed, dedicated charts built with Chart.js covering:
  - _Revenue & Wages_: Historical trends and stream breakdowns (TV, Matchday, Commercial).
  - _Debt & Liabilities_: Borrowings maturity and asset/liability comparisons.
  - _Instruments_: Detailed breakdowns of VMOC conversions, Lion Finance securitizations, and the €225M USPP bond.
  - _Squad & Transfers_: Historical player sales, squad book value vs. market value, and granular transfer ledger.
  - _Competitive Analysis_: Compare Sporting vs Benfica vs Porto with 9 comparative charts.
- **Guided Financial Story Mode**: Interactive step-by-step narrative highlighting major inflection points.
- **Club Assets & Identity**: Stadium, Academy, Museum, and 3D kit showcase.
- **CFO Simulator**: Interactive playground for financial scenario modeling.
- **Premium Theme Selector**: Light and Dark modes with automatic Chart.js theme adjustment.

---

## 📁 Codebase Structure

```
├── index.html                  # Core HTML entrypoint
├── package.json                # Project dependencies and npm scripts
├── vite.config.ts              # Vite build configuration and PWA setup
├── eslint.config.mjs           # ESLint configuration
├── .nvmrc                      # Node.js version (20)
├── tests/                      # Vitest & React Testing Library suite
├── public/
│   ├── data/                   # JSON datasets (financials, transfers, competitors)
│   └── locales/                # Translation dictionaries (en.json, pt.json)
└── src/
    ├── core/                   # Zustand state, configuration, and root App
    ├── features/               # Core domain logic (Transfers, Bonds, Squad)
    ├── features/tabs/          # React SPA Tabs (14 tabs)
    ├── components/             # Reusable UI components (Nav, Modals, Tables)
    ├── hooks/                  # Custom React hooks (PWA, PDF, Lightbox, etc.)
    ├── charts/                 # Chart.js rendering, configurations, and utilities
    ├── utils/                  # Shared utility functions and DOM helpers
    ├── ui/                     # Theme toggle, translations, PDF generator
    └── styles/                 # Modular CSS architecture
```

---

## 🚀 Running Locally

### 1. Install Dependencies

Make sure you have Node.js (v20+) installed, then run:

```bash
npm install
```

### 2. Development Server

To launch the app with Hot Module Replacement (HMR):

```bash
npm run dev
```

Then visit `http://localhost:5173`.

### 3. Production Build

To generate minified, static assets ready for deployment:

```bash
npm run build
```

### 4. Running Tests

To run the Vitest and React Testing Library suite:

```bash
npm run test:unit
```

For test coverage reports:

```bash
npm run test
```

### 5. Running Linter

```bash
npm run lint
```

---

## 📊 Data Source

All figures are derived directly from official financial reports published by:

- **Sporting Clube de Portugal - Futebol, SAD** (CMVM filings)
- **SL Benfica - Futebol, SAD** (CMVM filings)
- **FC Porto - Futebol, SAD** (CMVM filings)

Squad market values are sourced from [Transfermarkt](https://www.transfermarkt.com).

---

## 📋 Changelog

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.
