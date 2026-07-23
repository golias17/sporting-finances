#!/usr/bin/env node
// Fetches Sporting SAD news from Google News RSS at build time and writes
// public/data/news.json. Runs daily via .github/workflows/news.yml.
//
// Why build time instead of the browser: the runtime path in src/news.js
// depended on rss2json's free tier (500 requests/day shared across every
// visitor), making the News tab slow and quota-fragile. This script talks to
// Google News directly — no third-party proxy — and ships a static file the
// app can load instantly. src/news.js still keeps the rss2json path as a
// fallback for local dev before this file exists.
//
// Output item shape mirrors what rss2json returned ({title, pubDate, link,
// author, category}) so the renderer needs no changes; pubDate is normalised
// to "YYYY-MM-DD HH:mm:ss" (UTC), the format the renderer already parses.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.resolve(__dirname, "../public/data/news.json");

// Same queries and categories as the original runtime implementation.
const QUERIES = [
  { q: "Sporting+SAD+finanças+OR+CMVM", category: "FINANCE" },
  {
    q: "Sporting+SAD+mercado+OR+transferências+OR+contratações",
    category: "MARKET",
  },
  { q: "Sporting+SAD+negócio+OR+patrocínio", category: "CORPORATE" },
  { q: "Sporting+SAD+relatório+OR+contas", category: "FINANCE" },
  { q: "Sporting+SAD+ações+OR+bolsa", category: "FINANCE" },
];

function feedUrl(q) {
  return `https://news.google.com/rss/search?q=${q}&hl=pt-PT&gl=PT&ceid=PT:pt-150`;
}

// Minimal RSS <item> extraction — the Google News feed is flat and
// well-formed, so a full XML parser dependency isn't warranted.
function decodeXmlEntities(s) {
  return s
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>(.*?)</${name}>`, "s"));
  return m ? decodeXmlEntities(m[1].trim()) : "";
}

function parseItems(xml) {
  const items = [];
  for (const m of xml.matchAll(/<item>(.*?)<\/item>/gs)) {
    const block = m[1];
    const title = tag(block, "title");
    const link = tag(block, "link");
    const source = tag(block, "source");
    const rawDate = tag(block, "pubDate");
    if (!title || !link) continue;

    // RFC 822 → "YYYY-MM-DD HH:mm:ss" (UTC), matching what rss2json emitted.
    const d = new Date(rawDate);
    const pubDate = isNaN(d.getTime())
      ? ""
      : d.toISOString().slice(0, 19).replace("T", " ");

    items.push({ title, link, pubDate, author: source });
  }
  return items;
}

async function fetchFeed({ q, category }) {
  try {
    const res = await fetch(feedUrl(q), {
      headers: { "user-agent": "sporting-finances-news-fetcher" },
    });
    if (!res.ok) {
      console.error(`[news] ${q}: HTTP ${res.status}`);
      return [];
    }
    const xml = await res.text();
    return parseItems(xml).map((i) => ({ ...i, category }));
  } catch (e) {
    console.error(`[news] ${q}: ${e.message}`);
    return [];
  }
}

const results = await Promise.all(QUERIES.map(fetchFeed));
const items = results.flat();

// Dedupe by link — the five queries overlap.
const seen = new Set();
const deduped = items.filter((i) => {
  if (seen.has(i.link)) return false;
  seen.add(i.link);
  return true;
});

// Filter out noise articles at build time. Keep this list in sync with the
// NOISE_PATTERNS array in src/news.js (runtime fallback).
const NOISE_PATTERNS = [
  // Other squads / sports
  /\bequipa b\b/i,
  /\bfutsal\b/i,
  /\bandebol\b/i,
  /\bhóquei\b/i,
  /\bsub-\d/i,
  // Historic re-index glitches (people no longer at the club)
  /\brui patrício\b/i,
  /\bbruno de carvalho\b/i,
  /\bjorge jesus\b/i,
  /\bbas dost\b/i,
  // Rival clubs
  /\bbenfica\b/i,
  /\bporto\b/i,
  /\bfcp\b/i,
  /\bslb\b/i,
  /\bbraga\b/i,
  // Bad sources
  /\bleonino\b/i,
];
function isNoise(item) {
  const title = (item.title || "").toLowerCase();
  const author = (item.author || "").toLowerCase();
  return NOISE_PATTERNS.some((rx) => rx.test(title) || rx.test(author));
}
const filtered = deduped.filter((i) => !isNoise(i));

if (filtered.length === 0) {
  // Never overwrite a good file with an empty one (e.g. transient outage) —
  // fail the run instead so the previous news.json stays deployed.
  console.error("[news] no items fetched; keeping existing news.json");
  process.exit(1);
}

const payload = {
  generated_at: new Date().toISOString(),
  items: filtered,
};
fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2) + "\n");
console.log(`[news] wrote ${deduped.length} items to ${OUT_PATH}`);
