import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initNewsFeed } from "../src/news.js";

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

  it("should fetch news from rss2json and render clustered cards", async () => {
    // Mock 5 responses for the 5 parallel fetch calls
    global.fetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          items: [
            {
              title:
                "Sporting apresenta resultados financeiros positivos recorde",
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
        }),
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
    global.fetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          items: [
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
        }),
    });

    await initNewsFeed();
    const container = document.getElementById("newsFeed");
    expect(container.innerHTML).toContain("No recent corporate updates found.");
  });

  it("should not drop articles whose source or title merely contains a filtered word as a substring", async () => {
    global.fetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          items: [
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
        }),
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
    global.fetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          items: [
            {
              title: "FC Porto vence clássico frente ao Sporting - Record",
              pubDate: "2023-10-01 10:00:00",
              link: "http://example.com/1",
              author: "Record",
            },
          ],
        }),
    });

    await initNewsFeed();
    const container = document.getElementById("newsFeed");
    expect(container.innerHTML).toContain("No recent corporate updates found.");
  });

  it("should decode XML and HTML entities in titles and source names", async () => {
    global.fetch.mockResolvedValue({
      json: () =>
        Promise.resolve({
          items: [
            {
              title:
                "Sporting SAD &amp; CMVM decidem reestruturar &#39;VMOCs&#39; - Record &amp; Notícias",
              pubDate: "2023-10-01 10:00:00",
              link: "http://example.com/1",
              author: "Record &amp; Notícias",
            },
          ],
        }),
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
    global.fetch.mockRejectedValue(new Error("API limit reached"));

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

    await initNewsFeed();

    // fetch should NOT have been called
    expect(global.fetch).not.toHaveBeenCalled();

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

    // Mock fetch failure
    global.fetch.mockRejectedValue(new Error("API Limit Reached"));

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
});
