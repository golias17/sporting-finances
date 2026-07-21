# Sporting CP — Financial Evolution Dashboard (2012/13 → 2025/26)

An interactive, high-fidelity single-page application dashboard tracing the financial evolution of **Sporting Clube de Portugal - Futebol, SAD** over the last 13 fiscal years.

**Hosted Live:** [https://golias17.github.io/sporting-finances/](https://golias17.github.io/sporting-finances/)

---

## 🏟️ Overview

This dashboard aggregates, visualizes, and contextualizes annual and semi-annual financial statements filed by Sporting SAD with the Portuguese Securities Market Commission (CMVM). It offers an editorial, data-driven walkthrough of the club's transition from technical insolvency (~€119M negative equity in 2012/13) to securing an investment-grade rating of **BBB− / BBB (low)** on its historic **€225M USPP bond placement** in October 2025.

---

## 📈 Key Features

- **Dynamic Localization (i18n)**: Instantly switch between English and Portuguese! A dedicated localization engine translates complex player transfer clauses, ledger notes, and performance add-on details in real-time.
- **Guided Financial Story Mode**: An interactive, step-by-step narrative highlighting major inflection points (the 2014 restructuring, the 2018 training-ground crisis, the 2021 championship season, and the VMOC conversions). You can click anywhere along the progress track to jump directly to chapters.
- **Dynamic Health-Check Matrix**: Evaluates the club's financial stability season-by-season across six core metrics (Personnel Costs to Revenue, Net Debt to Revenue, Transfer Reliance, Shareholders' Equity, and Cash Reserves) with contextual status highlights.
- **Club Assets & Identity (Tab 11)**: A dedicated overview displaying Sporting CP's physical and visual assets:
  - _Stadium (Estádio José Alvalade)_: Real wide-angle panorama photo showcasing the UEFA Category 4 ground and its €225M USPP "Alvalade 2.0" upgrades (moat closure, capacity raise to 52,095 seats, hybrid Grassmax pitch, VIP Pitch Row, and premium Loges).
  - _Sports Hall (Pavilhão João Rocha)_: Wide-angle view showing the home court of multi-sports indoor disciplines.
  - _Museum (Museu Sporting)_: Real photo showcasing the legendary "Cinco Violinos" exhibit.
  - _Academy (Academia Cristiano Ronaldo)_: Visual cards presenting the state-of-the-art Alcochete complex.
- **3D Kit Hover-Flip Showcase**: Interactive, CSS-only 3D perspective flip cards for the official Home and Away match jerseys (featuring front and back images) and a locked indicator for the Stromp kit.
- **Premium Image Lightbox Modal**: Clicking on any stadium, sports hall, academy, museum, or kit photo opens it in a full-screen, backdrop-blurred (`backdrop-filter: blur(8px)`) overlay. Features a contextual **Flip Kit 🔄** button that lets users swap between front and back jersey views inside the lightbox.
- **Comprehensive Tab Views**: Detailed, dedicated charts built with Chart.js covering:
  - _Revenue & Wages_: Historical trends and stream breakdowns (TV, Matchday, Commercial).
  - _Debt & Liabilities_: Borrowings maturity and asset/liability comparisons.
  - _Instruments_: Detailed breakdowns of the VMOC conversions, Lion Finance securitizations, and the €225M USPP bond terms.
  - _Squad & Transfers_: Historical player sales, squad book value (balance sheet) vs. market value (Transfermarkt), and a granular season-by-season transfer ledger.
- **Interactive Season Comparison Tool**: Pick any two fiscal years to run a side-by-side metric comparison complete with auto-generated change narrative and bar charts.
- **Full Data Table**: Financial statement style table displaying all metrics in a scrollable view.
- **Premium Theme Selector**: Easily switch between Light and Dark modes. The Chart.js canvas elements automatically adjust grid and label colors. The light mode features customized green-tinted ambient glows and visual gradients.
- **Automated Multilingual SEO**: Pre-renders `index_pt.html` with default Portuguese lang tags at build-time to support search engine indexing.

---

## 📁 Codebase Structure

The project was recently modernized into a robust, decoupled ES Module architecture built on top of **Vite**:

```
├── index.html                  # Core layout and structural i18n hooks
├── package.json                # Project dependencies and npm scripts
├── vite.config.js              # Vite build configuration and PWA setup
├── eslint.config.mjs           # ESLint configuration
├── tests/                      # Vitest unit and integration test suite, mirroring src/
├── public/
│   ├── data/                   # Extracted raw JSON datasets (financials, transfers, news)
│   └── locales/                # Translation dictionaries (en.json, pt.json)
└── src/
    ├── core/                   # App bootstrapping, routing, and state management (main.js, router.js, state.js)
    ├── features/               # Core domain logic (transfers.js, bonds.js, squadAnalytics.js, etc.)
    ├── charts/                 # Chart.js rendering, configurations, and utilities
    ├── ui/                     # UI components (theme toggles, modals, lightboxes, PDF export)
    ├── utils/                  # Shared utility functions and PWA service worker registration
    ├── styles/                 # Modular CSS architecture (variables, layout, components)
    └── styles.css              # Main CSS entrypoint, processed by Vite
```

---

## 🚀 Running Locally

This application is built with vanilla JavaScript and CSS, but uses **Vite** to handle module imports, local development servers, and production bundling.

### 1. Install Dependencies

Make sure you have Node.js installed, then run:

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

To run the Vitest unit/integration test suite:

```bash
npm run test
```

### 5. Running Linter

To inspect the codebase for code quality issues using ESLint:

```bash
npm run lint
```

---

## 📊 Data Source

All figures are derived directly from official financial reports published by **Sporting Clube de Portugal - Futebol, SAD** (filed with the CMVM).
