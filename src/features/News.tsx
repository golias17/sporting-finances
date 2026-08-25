import React, { useEffect, useState } from "react";
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

function filterNoise(
  items: Array<{
    title: string;
    link: string;
    pubDate: string;
    sourceName?: string;
    author?: string;
  }>,
) {
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

        const rawItems = [
          ...(responses[0].items || []).map(
            (i: { title: string; link: string; pubDate: string }) => ({
              ...i,
              category: "FINANCE",
            }),
          ),
          ...(responses[1].items || []).map(
            (i: { title: string; link: string; pubDate: string }) => ({
              ...i,
              category: "MARKET",
            }),
          ),
          ...(responses[2].items || []).map(
            (i: { title: string; link: string; pubDate: string }) => ({
              ...i,
              category: "CORPORATE",
            }),
          ),
          ...(responses[3].items || []).map(
            (i: { title: string; link: string; pubDate: string }) => ({
              ...i,
              category: "FINANCE",
            }),
          ),
          ...(responses[4].items || []).map(
            (i: { title: string; link: string; pubDate: string }) => ({
              ...i,
              category: "FINANCE",
            }),
          ),
        ];

        const filtered = filterNoise(rawItems);
        if (filtered.length === 0)
          throw new Error("No items found or feed is empty.");

        setCachedItems(filtered);

        if (mounted) {
          setDataItems(filtered);
          setLoading(false);
        }
      } catch (err: unknown) {
        const stale = getCachedItems(true);
        if (stale && stale.length > 0) {
          if (mounted) {
            setDataItems(stale);
            setIsStale(true);
            setLoading(false);
          }
        } else {
          if (mounted) {
            setErrorMsg(err instanceof Error ? err.message : "Unknown error");
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

  interface StoryCluster {
    primary: any;
    sources: any[];
    primaryWords: Set<string>;
  }

  const storyClusters: StoryCluster[] = [];
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
          !cluster.sources.find(
            (s: { sourceName: string }) => s.sourceName === item.sourceName,
          )
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

      {/* Skeleton loader while loading */}
      {loading &&
        [0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="news-skeleton-card">
            <div className="news-skeleton-line badge" />
            <div className="news-skeleton-line title" />
            <div className="news-skeleton-line long" />
            <div className="news-skeleton-line medium" />
            <div className="news-skeleton-pills">
              <div className="news-skeleton-pill" />
              <div className="news-skeleton-pill" />
            </div>
          </div>
        ))}

      {/* Empty state */}
      {!loading && storyClusters.length === 0 && !errorMsg && (
        <div className="news-empty">
          <svg
            className="news-empty-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <p className="news-empty-text">
            {isPt
              ? "Nenhuma notícia encontrada. As notícias aparecerão aqui quando disponíveis."
              : "No news found. Updates will appear here when available."}
          </p>
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
              {cluster.sources.map(
                (
                  sourceItem: {
                    title: string;
                    link: string;
                    pubDate: string;
                    sourceName: string;
                  },
                  idx: number,
                ) => {
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
                },
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
