import { config } from "./config.js";
import { state } from "./state.js";

const CACHE_KEY = "sportingNews_v1";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Return cached news items, or null if there's nothing cached.
 * By default only returns items within CACHE_TTL_MS; pass allowStale=true
 * to get whatever is cached regardless of age. This lets initNewsFeed fall
 * back to a stale cache instead of a hard error page when the sole upstream
 * dependency (rss2json's free tier, 500 req/day) is rate-limited or down —
 * outdated news is still more useful to a reader than no news at all.
 */
function getCachedItems(allowStale = false) {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, items } = JSON.parse(raw);
    if (!allowStale && Date.now() - ts > CACHE_TTL_MS) return null;
    return items;
  } catch {
    return null;
  }
}

/**
 * Persist items to sessionStorage with the current timestamp.
 */
function setCachedItems(items) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ts: Date.now(), items }),
    );
  } catch {
    // sessionStorage may be unavailable (private browsing quota, etc.) — silently ignore.
  }
}

export async function initNewsFeed() {
  const container = document.getElementById("newsFeed");
  if (!container) return;

  // Preferred source: the static news.json generated daily at build time by
  // scripts/fetch-news.mjs (via .github/workflows/news.yml). It loads
  // instantly, hits no third-party quota, and is served from the same origin.
  try {
    const res = await fetch(config.newsPath);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        renderNewsItems(container, data.items);
        return;
      }
    }
  } catch {
    // Fall through to the runtime rss2json path (e.g. local dev before the
    // first scheduled fetch has ever committed a news.json).
  }

  // Serve from cache when available to avoid burning rss2json free-tier quota
  // (500 req/day). Five queries per page load = cache is essential.
  const cached = getCachedItems();
  if (cached) {
    renderNewsItems(container, cached);
    return;
  }

  // Split queries to bypass 10-item limit on rss2json without hitting blocked scrapers
  const queries = [
    "Sporting+SAD+finanças+OR+CMVM",
    "Sporting+SAD+mercado+OR+transferências+OR+contratações",
    "Sporting+SAD+negócio+OR+patrocínio",
    "Sporting+SAD+relatório+OR+contas",
    "Sporting+SAD+ações+OR+bolsa",
  ];

  try {
    const responses = await Promise.all(
      queries.map((q) => {
        const url = encodeURIComponent(config.rssSearchUrl(q));
        return fetch(config.rss2jsonApiUrl(url))
          .then((r) => {
            if (!r.ok) {
              throw new Error(`rss2json fetch failed: HTTP ${r.status}`);
            }
            return r.json();
          })
          .catch(() => ({ items: [] }));
      }),
    );

    // rss2json returns HTTP 200 even when it can't serve the request (e.g.
    // free-tier quota exhausted) — the failure shows up as status: "error"
    // in the body, not as a rejected fetch. Surface that in the console so
    // "no news showed up" is traceable to a quota issue rather than looking
    // like a silent bug.
    const quotaOrUpstreamErrors = responses
      .filter((r) => r && r.status === "error")
      .map((r) => r.message)
      .filter(Boolean);
    if (quotaOrUpstreamErrors.length > 0) {
      console.warn(
        "[news] rss2json reported errors on one or more queries (likely free-tier quota):",
        quotaOrUpstreamErrors,
      );
    }

    // Tag each item with a category based on the query it came from.
    // All names use consistent camelCase.
    const finItems1 = (responses[0].items || []).map((i) => ({
      ...i,
      category: "FINANCE",
    }));
    const mktItems = (responses[1].items || []).map((i) => ({
      ...i,
      category: "MARKET",
    }));
    const corpItems = (responses[2].items || []).map((i) => ({
      ...i,
      category: "CORPORATE",
    }));
    const finItems2 = (responses[3].items || []).map((i) => ({
      ...i,
      category: "FINANCE",
    }));
    const finItems3 = (responses[4].items || []).map((i) => ({
      ...i,
      category: "FINANCE",
    }));

    const rawItems = [
      ...finItems1,
      ...mktItems,
      ...corpItems,
      ...finItems2,
      ...finItems3,
    ];

    // Filter noise at the rss2json level (the build-time script handles
    // news.json; this covers the local-dev / fallback path).
    const dataItems = filterNoise(rawItems);

    if (dataItems.length === 0) {
      throw new Error("No items found or feed is empty.");
    }

    setCachedItems(dataItems);
    renderNewsItems(container, dataItems);
  } catch (error) {
    console.error("Failed to load news feed:", error);

    // Degrade gracefully: a stale cached feed is more useful to a reader
    // than a bare error, so fall back to it (regardless of TTL) before
    // giving up entirely.
    const stale = getCachedItems(true);
    if (stale && stale.length > 0) {
      renderNewsItems(container, stale, { stale: true });
      return;
    }

    // Use textContent (not innerHTML) so a malformed error.message string cannot
    // inject markup into the DOM.
    const errDiv = document.createElement("div");
    errDiv.className = "news-loading";
    errDiv.style.color = "var(--neg)";
    errDiv.textContent = `Error: ${error.message}`;
    container.innerHTML = "";
    container.appendChild(errDiv);
  }
}

function decodeHtml(html) {
  if (!html) return "";
  // Strip HTML tags (e.g. <b>Text</b> -> Text)
  const stripped = html.replace(/<\/?[^>]+(>|$)/g, "");
  return stripped
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

// Noise filters for the news feed: youth/B-team/other-sport chatter, players
// long gone from the club, and rival-club headlines. All patterns use word
// boundaries — a naive substring check like includes("porto") also matched
// "desporto" and "aeroporto" (and, worse, ran before the source suffix was
// stripped, so every article from sources like "SAPO Desporto" was silently
// dropped).
//
// Production data (news.json) is already filtered at build time by
// scripts/fetch-news.mjs. This list is used only for the rss2json runtime
// fallback (local dev / quota exhaustion).
const NOISE_PATTERNS = [
  // Other squads / sports
  /\bequipa b\b/,
  /\bfutsal\b/,
  /\bandebol\b/,
  /\bhóquei\b/,
  /\bsub-\d/,
  // Historic re-index glitches (people no longer at the club)
  /\brui patrício\b/,
  /\bbruno de carvalho\b/,
  /\bjorge jesus\b/,
  /\bbas dost\b/,
  // Rival clubs
  /\bbenfica\b/,
  /\bporto\b/,
  /\bfcp\b/,
  /\bslb\b/,
  /\bbraga\b/,
  // bad sources
  /\bleonino\b/,
];

function isNoise(text) {
  const t = text.toLowerCase();
  return NOISE_PATTERNS.some((rx) => rx.test(t));
}

/**
 * Filter noise from raw API items by checking both the title and author.
 * Used by the rss2json fallback path; the static news.json is pre-filtered
 * at build time by scripts/fetch-news.mjs.
 */
function filterNoise(items) {
  return items.filter((item) => {
    const title = (item.title || "").toLowerCase();
    const author = (item.author || "").toLowerCase();
    return !isNoise(title) && !isNoise(author);
  });
}

function renderNewsItems(container, dataItems, { stale = false } = {}) {
  container.innerHTML = ""; // Clear loading text

  if (stale) {
    const notice = document.createElement("div");
    notice.className = "news-stale-notice";
    notice.textContent =
      document.documentElement.lang === "pt"
        ? "Não foi possível atualizar as notícias agora — a mostrar os últimos resultados guardados."
        : "Couldn't refresh news right now — showing the last saved results.";
    container.appendChild(notice);
  }

  // Process all items to extract sourceName cleanly
  const processedItems = dataItems.map((item) => {
    let sourceName = item.category === "OFFICIAL" ? "Sporting CP" : "Notícias";
    // Derive title locally — never mutate the original API item object before
    // spreading it, as that would corrupt the cached copy in sessionStorage.
    let title = decodeHtml(item.title ?? "");
    if (title.includes(" - ")) {
      const parts = title.split(" - ");
      sourceName = parts.pop();
      title = parts.join(" - ");
    } else if (item.author) {
      sourceName = item.author;
    }
    return {
      ...item,
      title: title.trim(),
      sourceName: decodeHtml(sourceName).trim(),
    };
  });

  const relevantItems = processedItems;

  // Cluster news from the same topic
  const storyClusters = [];
  const stopWords = new Set([
    "sporting",
    "sad",
    "cmvm",
    "sobre",
    "novo",
    "nova",
    "mais",
    "como",
    "pelo",
    "pela",
  ]);

  for (const item of relevantItems) {
    const words = item.title
      .toLowerCase()
      .split(/[\s\W]+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));

    let addedToCluster = false;
    for (const cluster of storyClusters) {
      // cluster.primaryWords is precomputed once, when the cluster is
      // created below, and reused here on every subsequent item's
      // comparison — cluster.primary.title never changes after that point,
      // so re-tokenizing it from scratch for every incoming item (as this
      // used to do) was pure repeated work. Also a Set instead of an array
      // for O(1) membership checks instead of O(n) .includes() per word.
      let overlap = 0;
      for (const w of words) {
        if (cluster.primaryWords.has(w)) overlap++;
      }
      // If they share 3 or more significant words, they are likely the same topic
      if (overlap >= 3) {
        // Only add to sources if this specific source isn't already there
        if (!cluster.sources.find((s) => s.sourceName === item.sourceName)) {
          cluster.sources.push(item);
        }
        addedToCluster = true;
        break;
      }
    }
    if (!addedToCluster) {
      storyClusters.push({
        primary: item,
        sources: [item],
        primaryWords: new Set(words),
      });
    }
  }

  if (storyClusters.length === 0) {
    container.innerHTML = `<div class="news-loading">No recent corporate updates found.</div>`;
    return;
  }

  // Sort clusters by date of the primary article descending
  storyClusters.sort((a, b) => {
    const da = new Date(
      a.primary.pubDate ? a.primary.pubDate.replace(" ", "T") + "Z" : 0,
    );
    const db = new Date(
      b.primary.pubDate ? b.primary.pubDate.replace(" ", "T") + "Z" : 0,
    );
    return db - da;
  });

  // Show up to 18 clusters (6 rows of 3 on desktop)
  storyClusters.slice(0, 18).forEach((cluster, index) => {
    const item = cluster.primary;

    const card = document.createElement("div");
    let classes = ["news-card"];
    if (index === 0) classes.push("hero-card");
    if (item.category) classes.push(`category-${item.category.toLowerCase()}`);
    card.className = classes.join(" ");

    // Badge
    if (item.category) {
      const badge = document.createElement("span");
      badge.className = `news-badge badge-${item.category.toLowerCase()}`;
      badge.textContent = item.category;
      card.appendChild(badge);
    }

    const title = document.createElement("h3");
    title.className = "news-title";
    title.textContent = item.title;
    card.appendChild(title);

    const date = document.createElement("div");
    date.className = "news-date";
    // Article content here is inherently Portuguese-language coverage (the
    // RSS fallback's search queries in initNewsFeed() are Portuguese terms
    // targeting Portuguese financial press — that's intentional, not a bug,
    // since English-language coverage of a Portuguese club's SAD finances is
    // essentially nonexistent). The date *format*, however, should still
    // follow the site's own language toggle like every other date on the
    // page, rather than always rendering pt-PT style even in English mode.
    const recentLabel = state.isPt ? "Recente" : "Recent";
    if (item.pubDate) {
      const d = new Date(item.pubDate.replace(" ", "T") + "Z");
      if (!isNaN(d.getTime())) {
        date.textContent = d.toLocaleDateString(state.isPt ? "pt-PT" : "en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      } else {
        date.textContent = recentLabel;
      }
    } else {
      date.textContent = recentLabel;
    }
    card.appendChild(date);

    // Render Source Pills
    const sourcesContainer = document.createElement("div");
    sourcesContainer.className = "news-sources-list";

    cluster.sources.forEach((sourceItem) => {
      // Only ever link to http(s) URLs — the feed is external (Google News /
      // rss2json, or the build-time news.json), so a malformed or tampered
      // item could otherwise carry a "javascript:" URL that runs on click.
      const link = sourceItem.link;
      const isSafeUrl =
        typeof link === "string" && /^https?:\/\//i.test(link);
      if (!isSafeUrl) return;

      const pill = document.createElement("a");
      pill.className = "source-pill";
      pill.href = link;
      pill.target = "_blank";
      pill.rel = "noopener noreferrer";
      pill.textContent = sourceItem.sourceName;
      sourcesContainer.appendChild(pill);
    });

    card.appendChild(sourcesContainer);
    container.appendChild(card);
  });
}
