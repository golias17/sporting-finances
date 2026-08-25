# Sporting CP — Financial Evolution Dashboard (2010/11 → 2024/25)

An interactive, high-fidelity React Single Page Application (SPA) dashboard tracing the financial evolution of **Sporting Clube de Portugal - Futebol, SAD** over the last 15 fiscal years.

**Hosted Live:** [https://golias17.github.io/sporting-finances/](https://golias17.github.io/sporting-finances/)

---

## 🏟️ Overview

This dashboard aggregates, visualizes, and contextualizes annual financial statements filed by Sporting SAD with the Portuguese Securities Market Commission (CMVM). It offers an editorial, data-driven walkthrough of the club's transition from technical insolvency (~€119M negative equity in 2010/11) to securing an investment-grade rating of **BBB− / BBB (low)** on its historic **€225M USPP bond placement** in October 2025.

The platform also includes deep competitive benchmarks comparing Sporting CP with SL Benfica and FC Porto across 15 seasons of audited financial data, a 7-pillar UEFA Financial Sustainability Radar, a Quad-Engine simulation suite, high-resolution social infographic card generation, and automated 7-page executive PDF reporting.

---

## 📈 Key Features

- **Modern React SPA Architecture**: Built with React 19, Vite 8, and TypeScript 6, achieving sub-200ms production builds with Brotli/Gzip compression, instant zero-overhead CSS splash loader (0ms visual feedback), and fully componentized domain logic.
- **Robust State Management**: Powered by **Zustand**, providing a scalable, reactive store that seamlessly syncs with browser URLs for deep routing, tab states, and shareable simulation scenarios.
- **Dynamic Localization (i18n)**: Instant, zero-reload switching between Portuguese (`pt`) and English (`en`) with exact 100% key parity across 556 keys.
- **Instant Command Palette (`Cmd+K` / `Ctrl+K`)**: Fast universal spotlight search across all tabs, metrics, players, bonds, and simulation tools.
- **📸 Social Media Infographic Card Generator**:
  - Export any chart or metric as a high-definition, publication-ready social card.
  - **Formats**: 1:1 Square (Instagram/LinkedIn), 16:9 Landscape (Twitter/X/WhatsApp), 9:16 Vertical (Instagram Stories/Reels/TikTok).
  - **Themes**: Sporting Deep Emerald, Dark Carbon, and Light Executive.
  - **Actions**: Direct PNG download, native Clipboard copy (`navigator.clipboard.write`), and mobile Web Share sheet.
- **13 Comprehensive Tab Views & Interactive Modules**:
  1. **Overview**: Executive KPI strip, historical revenue vs. net debt evolution, and milestone timeline.
  2. **Revenue**: Breakdowns across Broadcasting rights, Commercial/Sponsorship, and Matchday streams.
  3. **Health Check & UEFA Radar**: 7-pillar solvency diagnostic scoring against UEFA Financial Sustainability Regulations (FSR).
  4. **Balance Sheet**: Assets, liabilities, debt maturity schedules, and net equity trajectory.
  5. **Instruments & Financing**: Deep dive into VMOC conversions, Lion Finance securitizations, and the €225M USPP bond terms.
  6. **Squad & Transfers**: Historical sales, squad market value vs. book value, and an interactive 15-season transfers ledger.
  7. **Compare**: Side-by-side multi-season and cross-metric analytical comparisons.
  8. **Rivals Benchmark**: 15-season consolidated 3-club benchmark (Sporting vs. Benfica vs. Porto) across 9 dimensions.
  9. **Events Timeline**: Key corporate, sporting, and financial milestones.
  10. **Data Explorer**: Raw audited financial statements table with instant CSV and Excel (`.xlsx`) export.
  11. **Club & Assets**: Stadium modernization, Cristiano Ronaldo Academy, Museum, and 3D kit showcase.
  12. **News & Press Releases**: Chronological feed of official announcements filed with the CMVM.
  13. **Quad-Engine Simulation Suite (Playground)**:
      - **1. Macro CFO Budget Simulator**: 4 strategic levers (Revenues & UCL Swiss model, Personnel Costs, Squad Trading Reinvestment, Debt Deleveraging), 6 1-click presets, real-time projected income statement ledger, shareable URL generator, and pin-to-compare.
      - **2. UEFA Squad Cost Rule Transfer Impact Calculator**: Micro deal simulator computing annual amortization capped at 5 years (UEFA FSR), gross wages, agent fees, Summer/Winter pro-rata window timing, compensatory sales relief, and a 3-year multi-year horizon projection.
      - **3. Player Net Book Value & Sale ROI Calculator**: Individual contract valuation profiles, residual book value deduction, sell-on percentages, FIFA solidarity (5%), agent fees, net P&L capital gains, and squad cost relief.
      - **4. Stress Testing & Cash Runway Simulator**: 24-month liquidity projection under extreme stress scenarios (European elimination, revenue shock, wage inflation) with prudential cash buffer alerts.
- **Guided Financial Story Mode**: Step-by-step editorial narrative highlighting pivotal turnaround inflection points.
- **Executive 7-Page PDF Report Generator**: Exports formatted executive PDF reports with cover page, balance sheet comparisons, bond analytics, transfer tables, and rival benchmarks using `jspdf`.
- **Progressive Web App (PWA)**: Offline caching with service workers via `vite-plugin-pwa`.
- **Theme Selector**: Seamless switching between Dark Mode and Light Mode with adaptive Chart.js palettes.

---

## 📁 Codebase Structure

```
├── index.html                  # Core HTML entrypoint with instant splash loader
├── package.json                # Project dependencies and npm scripts
├── vite.config.ts              # Vite build configuration and PWA setup
├── eslint.config.mjs           # ESLint 9 configuration
├── .nvmrc                      # Node.js version (20)
├── tests/                      # Vitest & React Testing Library test suites (61 suites, 555 tests)
├── public/
│   ├── data/                   # Audited JSON datasets (financials, transfers, rivals, news)
│   └── locales/                # Translation dictionaries (en.json, pt.json)
└── src/
    ├── core/                   # Zustand store, config, types, and root App
    ├── features/               # Core domain logic, simulators, and guides
    │   ├── bonds/              # USPP terms, VMOCs, debt maturity tracker, and Lion Finance
    │   ├── squad/              # Player Net Book Value, Valuation Matrix, and Sale ROI Calculator
    │   ├── stress/             # Stress Testing & 24-Month Cash Runway Simulator
    │   └── tabs/               # 13 dedicated React SPA tab views
    ├── components/             # Reusable UI components (ChartCard, SocialShareModal, CommandPalette)
    ├── hooks/                  # Custom hooks (Translation, PDF Export, Shortcuts, PWA)
    ├── charts/                 # Chart.js rendering engines, palettes, and annotations
    ├── utils/                  # Utility helpers, Social Card Generator, CSV/Excel export, URL state sync
    ├── ui/                     # PDF report generator, theme toggle, lightbox
    └── styles/                 # Modular CSS architecture
```

---

## 🚀 Running Locally

### 1. Prerequisites

Ensure you have **Node.js (v20+)** installed.

### 2. Install Dependencies

```bash
npm install
```

### 3. Development Server

Start the local Vite development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Production Build

Build and optimize static assets with Brotli and Gzip compression:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

### 5. Running Tests

Run the complete Vitest and React Testing Library test suite with coverage:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:unit
```

### 6. Linting & Formatting

Check code quality with ESLint:

```bash
npm run lint
```

Format code with Prettier:

```bash
npm run format
```

---

## 📊 Data Sources & Accounting Standards

All financial metrics are compiled directly from official audited annual reports filed with the Portuguese Securities Market Commission (**CMVM**):

- **Sporting Clube de Portugal - Futebol, SAD** (2010/11 → 2024/25)
- **SL Benfica - Futebol, SAD** (2010/11 → 2024/25)
- **FC Porto - Futebol, SAD** (2010/11 → 2024/25)

Market values for squad analytics are benchmarked against [Transfermarkt](https://www.transfermarkt.com). Regulatory calculations follow the **UEFA Financial Sustainability Regulations (FSR)** guidelines (Squad Cost Rule, Net Equity Rule, and Solvency Requirements).
