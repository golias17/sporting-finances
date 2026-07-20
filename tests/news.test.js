import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initNewsFeed } from "../src/news.js";

// Route fetch calls by URL: `staticFile` answers ./data/news.json (the
// build-time file), `feedItems` answers the rss2json fallback queries.
function mockFetchRoutes({ staticFile = null, feedItems = null } = {}) {
  global.fetch.mockImplementation((url) => {
    const u = String(url);
    if (u.includes("data/news.json")) {
      if (staticFile === null) return Promise.resolve({ ok: false });
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(staticFile),
      });
    }
    if (feedItems === null) return Promise.reject(new Error("API failure"));
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ items: feedItems }),
    });
  });
}

describe("news.js", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="newsFeed"></div>
    `;

    // Clear session storage
    sessionStorage.clear();

    // Mock fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should prefer the static build-time news.json when available", async () => {
    mockFetchRoutes({
      staticFile: {
        generated_at: "2026-07-17T06:30:00Z",
        items: [
          {
            title: "Sporting SAD apresenta contas anuais - A Bola",
            pubDate: "2026-07-16 10:00:00",
            link: "http://example.com/static",
            author: "A Bola",
            category: "FINANCE",
          },
        ],
      },
    });

    await initNewsFeed();

    const container = document.getElementById("newsFeed");
    const cards = container.querySelectorAll(".news-card");
    expect(cards.length).toBe(1);
    expect(cards[0].querySelector("h3").textContent).toBe(
      "Sporting SAD apresenta contas anuais",
    );
    // Only the static file was fetched — no rss2json calls.
    const calledUrls = global.fetch.mock.calls.map((c) => String(c[0]));
    expect(calledUrls.every((u) => u.includes("data/news.json"))).toBe(true);
  });

  it("should fetch news from rss2json and render clustered cards when no static file exists", async () => {
    mockFetchRoutes({
      feedItems: [
        {
          title: "Sporting apresenta resultados financeiros positivos recorde",
          pubDate: "2023-10-01 10:00:00",
          link: "http://example.com/1",
          author: "A Bola",
        },
        {
          title:
            "Sporting apresenta resultados financeiros positivos recorde na SAD", // Duplicate to test clustering
          pubDate: "2023-10-01 11:00:00",
          link: "http://example.com/2",
          author: "Record",
        },
      ],
    });

    await initNewsFeed();

    const container = document.getElementById("newsFeed");
    const cards = container.querySelectorAll(".news-card");

    // Should cluster the two items into one card
    expect(cards.length).toBe(1);

    // Check elements
    const title = cards[0].querySelector("h3").textContent;
    expect(title).toContain(
      "Sporting apresenta resultados financeiros positivos recorde",
    );

    const sources = cards[0].querySelectorAll(".source-pill");
    expect(sources.length).toBe(2);
    expect(sources[0].textContent).toBe("A Bola");
    expect(sources[1].textContent).toBe("Record");
  });

  it("should filter out noise (e.g. equipa b, futsal)", async () => {
    mockFetchRoutes({
      feedItems: [
        {
          title: "Sporting Futsal vence",
          pubDate: "2023-10-01 10:00:00",
          link: "http://example.com/1",
          author: "A Bola",
        },
        {
          title: "Equipa B do Sporting empata",
          pubDate: "2023-10-01 10:00:00",
          link: "http://example.com/1",
          author: "A Bola",
        },
      ],
    });

    await initNewsFeed();
    const container = document.getElementById("newsFeed");
    // All items are noise — filterNoise empties the list, triggering the
    // "No items found" error path (noise is now filtered before rendering).
    expect(container.innerHTML).toContain("No items found or feed is empty");
  });

  it("should not drop articles whose source or title merely contains a filtered word as a substring", async () => {
    mockFetchRoutes({
      feedItems: [
        {
          // "SAPO Desporto" contains "porto"; "aeroporto" too — neither is
          // rival-club noise and both must survive the word-boundary filter.
          title:
            "Sporting SAD emite obrigações no aeroporto de Lisboa - SAPO Desporto",
          pubDate: "2023-10-01 10:00:00",
          link: "http://example.com/1",
          author: "SAPO Desporto",
        },
      ],
    });

    await initNewsFeed();
    const container = document.getElementById("newsFeed");
    const cards = container.querySelectorAll(".news-card");
    expect(cards.length).toBe(1);
    expect(cards[0].querySelector(".source-pill").textContent).toBe(
      "SAPO Desporto",
    );
  });

  it("should still drop rival-club headlines matched as whole words", async () => {
    mockFetchRoutes({
      feedItems: [
        {
          title: "FC Porto vence clássico frente ao Sporting - Record",
          pubDate: "2023-10-01 10:00:00",
          link: "http://example.com/1",
          author: "Record",
        },
      ],
    });

    await initNewsFeed();
    const container = document.getElementById("newsFeed");
    // Noise filtered before rendering — triggers empty-feed error.
    expect(container.innerHTML).toContain("No items found or feed is empty");
  });

  it("should decode XML and HTML entities in titles and source names", async () => {
    mockFetchRoutes({
      feedItems: [
        {
          title:
            "Sporting SAD &amp; CMVM decidem reestruturar &#39;VMOCs&#39; - Record &amp; Notícias",
          pubDate: "2023-10-01 10:00:00",
          link: "http://example.com/1",
          author: "Record &amp; Notícias",
        },
      ],
    });

    await initNewsFeed();

    const container = document.getElementById("newsFeed");
    const cards = container.querySelectorAll(".news-card");

    expect(cards.length).toBe(1);

    const titleText = cards[0].querySelector("h3").textContent;
    expect(titleText).toBe("Sporting SAD & CMVM decidem reestruturar 'VMOCs'");

    const sourcePill = cards[0].querySelector(".source-pill");
    expect(sourcePill.textContent).toBe("Record & Notícias");
  });

  it("should display error message on API failure", async () => {
    mockFetchRoutes({}); // static file missing, feeds reject

    await initNewsFeed();
    const container = document.getElementById("newsFeed");
    expect(container.innerHTML).toContain(
      "Error: No items found or feed is empty.",
    );
  });

  it("should use cached items if available in sessionStorage", async () => {
    const cachedData = [
      {
        title: "Cached Article",
        category: "FINANCE",
        pubDate: "2023-10-01 10:00:00",
        link: "http://example.com/cache",
        sourceName: "O Jogo",
      },
    ];

    sessionStorage.setItem(
      "sportingNews_v1",
      JSON.stringify({
        ts: Date.now(),
        items: cachedData,
      }),
    );

    mockFetchRoutes({}); // static file missing

    await initNewsFeed();

    // Only the static-file probe hit the network — no rss2json calls.
    const calledUrls = global.fetch.mock.calls.map((c) => String(c[0]));
    expect(calledUrls.every((u) => u.includes("data/news.json"))).toBe(true);

    const container = document.getElementById("newsFeed");
    const cards = container.querySelectorAll(".news-card");
    expect(cards.length).toBe(1);
    expect(cards[0].querySelector("h3").textContent).toBe("Cached Article");
  });

  it("should fallback to stale cache when fetch fails", async () => {
    // Populate session storage with stale items (older than 30 minutes)
    const staleData = [
      {
        title: "Stale Cached Article",
        category: "FINANCE",
        pubDate: "2023-10-01 10:00:00",
        link: "http://example.com/stale",
        sourceName: "O Jogo",
      },
    ];

    sessionStorage.setItem(
      "sportingNews_v1",
      JSON.stringify({
        ts: Date.now() - 40 * 60 * 1000, // 40 minutes old
        items: staleData,
      }),
    );

    mockFetchRoutes({}); // static file missing, feeds reject

    await initNewsFeed();

    // Verify stale warning is rendered
    const container = document.getElementById("newsFeed");
    expect(container.innerHTML).toContain("Couldn't refresh news right now");

    // Verify stale item is rendered
    const cards = container.querySelectorAll(".news-card");
    expect(cards.length).toBe(1);
    expect(cards[0].querySelector("h3").textContent).toBe(
      "Stale Cached Article",
    );
  });

  it("should handle items with missing or invalid pubDate in sorting and rendering", async () => {
    mockFetchRoutes({
      feedItems: [
        {
          title: "Contas anuais do clube analisadas em detalhe",
          link: "http://example.com/missing-date",
          author: "O Jogo",
        },
        {
          title: "Grande reforco de peso contratado para a equipa principal",
          pubDate: "not-a-date-string",
          link: "http://example.com/invalid-date",
          author: "A Bola",
        },
        {
          title: "Resultados financeiros excelentes apresentados hoje",
          pubDate: "2023-10-01 10:00:00",
          link: "http://example.com/valid-date",
          author: "Record",
        },
      ],
    });

    await initNewsFeed();

    const container = document.getElementById("newsFeed");
    const cards = container.querySelectorAll(".news-card");
    expect(cards.length).toBe(3);

    const titles = Array.from(cards).map(
      (c) => c.querySelector("h3").textContent,
    );
    expect(titles).toContain("Contas anuais do clube analisadas em detalhe");
    expect(titles).toContain(
      "Grande reforco de peso contratado para a equipa principal",
    );
    expect(titles).toContain(
      "Resultados financeiros excelentes apresentados hoje",
    );

    const dates = Array.from(container.querySelectorAll(".news-date")).map(
      (d) => d.textContent,
    );
    expect(dates).toContain("Recent");
  });
});
