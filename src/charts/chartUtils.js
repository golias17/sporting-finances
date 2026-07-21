// Re-export barrel — chartUtils.js used to be a single 692-line file mixing
// four genuinely separate concerns (color palette + number formatting,
// pitch-milestone/event annotations, chart companion widgets like the
// accessible data table and glass tooltip, and the shared Chart.js
// defaults). Split into chartPalette.js / chartAnnotations.js /
// chartWidgets.js / chartDefaults.js so each concern has its own small,
// focused file — every consumer of a specific piece can go straight to the
// file that owns it instead of scrolling a 692-line grab-bag.
//
// This file is kept as a re-export barrel (rather than updating every
// consumer's import path) because 19 files across src/ and tests/ import
// from "./chartUtils.js", several of them pulling symbols that now live in
// three or four different files in a single import statement (see
// charts.js, for instance). Re-exporting here means every one of those
// import paths keeps working unchanged — zero risk to any of them — while
// still getting the organizational benefit: chartUtils.js itself is no
// longer where the actual implementation lives.
export * from "./chartPalette.js";
export * from "./chartAnnotations.js";
export * from "./chartWidgets.js";
export * from "./chartDefaults.js";
