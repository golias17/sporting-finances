# Sporting CP — Financial Evolution Dashboard (2012/13 → 2025/26)

An interactive, high-fidelity React Single Page Application (SPA) dashboard tracing the financial evolution of **Sporting Clube de Portugal - Futebol, SAD** over the last 13 fiscal years.

**Hosted Live:** [https://golias17.github.io/sporting-finances/](https://golias17.github.io/sporting-finances/)

---

## 🏟️ Overview

This dashboard aggregates, visualizes, and contextualizes annual and semi-annual financial statements filed by Sporting SAD with the Portuguese Securities Market Commission (CMVM). It offers an editorial, data-driven walkthrough of the club's transition from technical insolvency (~€119M negative equity in 2012/13) to securing an investment-grade rating of **BBB− / BBB (low)** on its historic **€225M USPP bond placement** in October 2025.

---

## 📈 Key Features

- **Modern React SPA Architecture**: Entirely rebuilt using React and Vite, achieving lightning-fast hot module replacement, optimized production bundles, and fully componentized domain logic.
- **Robust State Management**: Powered by **Zustand**, providing a scalable, reactive, proxy-free store that seamlessly syncs with the browser URL for perfect routing and deep-linking.
- **100% Type-Safe**: Written in rigorous TypeScript, ensuring rock-solid data models, UI components, and API integration.
- **Dynamic Localization (i18n)**: Instantly switch between English and Portuguese using a custom React `useTranslation` hook. A dedicated localization engine translates complex player transfer clauses, ledger notes, and performance add-on details in real-time.
- **Comprehensive Tab Views**: Detailed, dedicated charts built with Chart.js covering:
  - _Revenue & Wages_: Historical trends and stream breakdowns (TV, Matchday, Commercial).
  - _Debt & Liabilities_: Borrowings maturity and asset/liability comparisons.
  - _Instruments_: Detailed breakdowns of the VMOC conversions, Lion Finance securitizations, and the €225M USPP bond terms.
  - _Squad & Transfers_: Historical player sales, squad book value vs. market value, and a granular season-by-season transfer ledger.
- **Guided Financial Story Mode**: An interactive, step-by-step narrative highlighting major inflection points (the 2014 restructuring, the 2018 training-ground crisis, the 2021 championship season).
- **Club Assets & Identity**: A dedicated overview displaying Sporting CP's physical and visual assets:
  - _Stadium (Estádio José Alvalade)_: Showcasing the UEFA Category 4 ground and its €225M USPP "Alvalade 2.0" upgrades.
  - _Academy & Museum_: High-fidelity galleries with full-screen, backdrop-blurred (`backdrop-filter: blur(8px)`) lightbox modals.
- **3D Kit Hover-Flip Showcase**: Interactive, CSS-only 3D perspective flip cards for the official Home and Away match jerseys.
- **Premium Theme Selector**: Easily switch between Light and Dark modes. The Chart.js canvas elements automatically adjust grid and label colors.

---

## 📁 Codebase Structure

The project uses a highly decoupled ES Module architecture built on top of **Vite** and **React**:

```
├── index.html                  # Core HTML entrypoint
├── package.json                # Project dependencies and npm scripts
├── vite.config.js              # Vite build configuration and PWA setup
├── eslint.config.mjs           # ESLint configuration
├── tests/                      # Vitest & React Testing Library (RTL) suite
├── public/
│   ├── data/                   # Extracted raw JSON datasets
│   └── locales/                # Translation dictionaries (en.json, pt.json)
└── src/
    ├── core/                   # Zustand state, configuration, and root App
    ├── features/               # Core domain logic (Transfers, Bonds, Squad)
    ├── features/tabs/          # React SPA Tabs (Overview, Revenue, etc.)
    ├── components/             # Reusable UI components (Nav, Modals, Tables)
    ├── charts/                 # Chart.js rendering, configurations, and utilities
    ├── utils/                  # Shared utility functions and DOM helpers
    ├── styles/                 # Modular CSS architecture
    └── styles.css              # Main CSS entrypoint, processed by Vite
```

---

## 🚀 Running Locally

### 1. Install Dependencies

Make sure you have Node.js (v20+) installed, then run:

```bash
npm install
```

### 2. Development Server

To launch the app with blazing fast Hot Module Replacement (HMR):

```bash
npm run dev
```

Then visit the local URL provided in your terminal (usually `http://localhost:5173`).

### 3. Production Build

To generate minified, static assets ready for deployment to GitHub Pages or Vercel:

```bash
npm run build
```

This will output a lightweight `dist/` directory containing both the default `index.html` (English default) and `index_pt.html` (Portuguese default) files.

### 4. Running Tests

To run the Vitest and React Testing Library suite:

```bash
npm run test:unit
```

For test coverage reports:

```bash
npm run test
```

### 5. Running Linter & Formatter

To inspect the codebase for code quality issues using ESLint:

```bash
npm run lint
```
And to format using Prettier:
```bash
npm run format
```

---

## 📊 Data Source

All figures are derived directly from official financial reports published by **Sporting Clube de Portugal - Futebol, SAD** (filed with the CMVM).
