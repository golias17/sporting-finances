import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { config } from "../core/config.ts";
import { useAppState } from "../core/state.ts";
import { useTranslation } from "../hooks/useTranslation.js";

const CACHE_KEY = "sportingNews_v1";
const CACHE_TTL_MS = 30 * 60 * 1000;

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

function setCachedItems(items: any[]) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ts: Date.now(), items }),
    );
  } catch {
    // ignore
  }
}

function decodeHtml(html: string) {
  if (!html) return "";
  const stripped = html.replace(/<\/?[^>]+(>|$)/g, "");
  return stripped
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

const NOISE_PATTERNS = [
  /\bequipa b\b/,
  /\bfutsal\b/,
  /\bandebol\b/,
  /\bhóquei\b/,
  /\bsub-\d/,
  /\brui patrício\b/,
  /\bbruno de carvalho\b/,
  /\bjorge jesus\b/,
  /\bbas dost\b/,
  /\bbenfica\b/,
  /\bporto\b/,
  /\bfcp\b/,
  /\bslb\b/,
  /\bbraga\b/,
  /\bleonino\b/,
];

function isNoise(text: string) {
  const t = text.toLowerCase();
  return NOISE_PATTERNS.some((rx) => rx.test(t));
}

function filterNoise(items: any[]) {
  return items.filter((item) => {
    const title = (item.title || "").toLowerCase();
    const author = (item.author || "").toLowerCase();
    return !isNoise(title) && !isNoise(author);
  });
}

export function News() {
  const { t, T } = useTranslation();
  const isPt = useAppState((s) => s.isPt);
  const [dataItems, setDataItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const res = await fetch(config.newsPath);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items) && data.items.length > 0) {
            if (mounted) {
              setDataItems(data.items);
              setLoading(false);
            }
            return;
          }
        }
      } catch {
        // Fallback to rss2json
      }

      const cached = getCachedItems();
      if (cached) {
        if (mounted) {
          setDataItems(cached);
          setLoading(false);
        }
        return;
      }

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
                if (!r.ok)
                  throw new Error(`rss2json fetch failed: HTTP ${r.status}`);
                return r.json();
              })
              .catch(() => ({ items: [] }));
          }),
        );

        const quotaErrors = responses
          .filter((r) => r && r.status === "error")
          .map((r) => r.message)
          .filter(Boolean);

        if (quotaErrors.length > 0) {
          console.warn("[news] rss2json reported errors:", quotaErrors);
        }

        const rawItems = [
          ...(responses[0].items || []).map((i: any) => ({
            ...i,
            category: "FINANCE",
          })),
          ...(responses[1].items || []).map((i: any) => ({
            ...i,
            category: "MARKET",
          })),
          ...(responses[2].items || []).map((i: any) => ({
            ...i,
            category: "CORPORATE",
          })),
          ...(responses[3].items || []).map((i: any) => ({
            ...i,
            category: "FINANCE",
          })),
          ...(responses[4].items || []).map((i: any) => ({
            ...i,
            category: "FINANCE",
          })),
        ];

        const filtered = filterNoise(rawItems);
        if (filtered.length === 0)
          throw new Error("No items found or feed is empty.");

        setCachedItems(filtered);

        if (mounted) {
          setDataItems(filtered);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Failed to load news feed:", err);
        const stale = getCachedItems(true);
        if (stale && stale.length > 0) {
          if (mounted) {
            setDataItems(stale);
            setIsStale(true);
            setLoading(false);
          }
        } else {
          if (mounted) {
            setErrorMsg(err.message || "Unknown error");
            setLoading(false);
          }
        }
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return null;
  }

  if (errorMsg) {
    return (
      <div className="news-loading" style={{ color: "var(--neg)" }}>
        Error: {errorMsg}
      </div>
    );
  }

  const processedItems = dataItems.map((item) => {
    let sourceName = item.category === "OFFICIAL" ? "Sporting CP" : "Notícias";
    let title = decodeHtml(item.title ?? "");
    if (title.includes(" - ")) {
      const parts = title.split(" - ");
      sourceName = parts.pop() || sourceName;
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

  const storyClusters: any[] = [];
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

  for (const item of processedItems) {
    const words = item.title
      .toLowerCase()
      .split(/[\s\W]+/)
      .filter((w: string) => w.length > 3 && !stopWords.has(w));

    let addedToCluster = false;
    for (const cluster of storyClusters) {
      let overlap = 0;
      for (const w of words) {
        if (cluster.primaryWords.has(w)) overlap++;
      }
      if (overlap >= 3) {
        if (
          !cluster.sources.find((s: any) => s.sourceName === item.sourceName)
        ) {
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
    return (
      <div className="news-loading">No recent corporate updates found.</div>
    );
  }

  storyClusters.sort((a, b) => {
    const da = new Date(
      a.primary.pubDate ? a.primary.pubDate.replace(" ", "T") + "Z" : 0,
    ).getTime();
    const db = new Date(
      b.primary.pubDate ? b.primary.pubDate.replace(" ", "T") + "Z" : 0,
    ).getTime();
    return db - da;
  });

  const recentLabel = isPt ? "Recente" : "Recent";

  return (
    <>
      {isStale && (
        <div className="news-stale-notice">
          {isPt
            ? "Não foi possível atualizar as notícias agora — a mostrar os últimos resultados guardados."
            : "Couldn't refresh news right now — showing the last saved results."}
        </div>
      )}
      {storyClusters.slice(0, 18).map((cluster, index) => {
        const item = cluster.primary;
        let classes = "news-card";
        if (index === 0) classes += " hero-card";
        if (item.category)
          classes += ` category-${item.category.toLowerCase()}`;

        let dateText = recentLabel;
        if (item.pubDate) {
          const d = new Date(item.pubDate.replace(" ", "T") + "Z");
          if (!isNaN(d.getTime())) {
            dateText = d.toLocaleDateString(isPt ? "pt-PT" : "en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
          }
        }

        return (
          <div key={index} className={classes}>
            {item.category && (
              <span
                className={`news-badge badge-${item.category.toLowerCase()}`}
              >
                {item.category}
              </span>
            )}
            <h3 className="news-title">{item.title}</h3>
            <div className="news-date">{dateText}</div>
            <div className="news-sources-list">
              {cluster.sources.map((sourceItem: any, idx: number) => {
                const link = sourceItem.link;
                const isSafeUrl =
                  typeof link === "string" && /^https?:\/\//i.test(link);
                if (!isSafeUrl) return null;
                return (
                  <a
                    key={idx}
                    className="source-pill"
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {sourceItem.sourceName}
                  </a>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}

let newsRoot: any = null;
export function initNewsFeed() {
  const container = document.getElementById("newsFeed");
  if (!container) return;
  if (!newsRoot) {
    newsRoot = createRoot(container);
  }
  newsRoot.render(<News />);
}
