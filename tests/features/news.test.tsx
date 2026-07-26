import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { News } from "../../src/features/News.tsx";

function mockFetchRoutes({ staticFile = null, feedItems = null }: any = {}) {
  global.fetch = vi.fn().mockImplementation((url) => {
    const u = String(url);
    if (u.includes("data/news.json") || u.includes("news.json")) {
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

describe("News Component", () => {
  beforeEach(() => {
    sessionStorage.clear();
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
            title: "Sporting SAD apresenta contas anuais",
            pubDate: "2026-07-16 10:00:00",
            link: "http://example.com/static",
            author: "A Bola",
            category: "FINANCE",
          },
        ],
      },
    });

    render(<News />);

    await waitFor(() => {
      expect(
        screen.getAllByText(/Sporting SAD apresenta contas anuais/i)[0],
      ).toBeInTheDocument();
    });

    const calledUrls = (global.fetch as any).mock.calls.map((c: any) =>
      String(c[0]),
    );
    expect(calledUrls.every((u: string) => u.includes("news.json"))).toBe(true);
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
            "Sporting apresenta resultados financeiros positivos recorde na SAD",
          pubDate: "2023-10-01 11:00:00",
          link: "http://example.com/2",
          author: "Record",
        },
      ],
    });

    render(<News />);

    await waitFor(() => {
      expect(
        screen.getAllByText(/Sporting apresenta resultados financeiros/i)[0],
      ).toBeInTheDocument();
    });

    // Both sources should be rendered under the same card cluster
    expect(screen.getAllByText("A Bola")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Record")[0]).toBeInTheDocument();
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

    render(<News />);

    await waitFor(() => {
      expect(
        screen.getAllByText(/No items found/i)[0],
      ).toBeInTheDocument();
    });
  });

  it("should not drop articles whose source or title merely contains a filtered word as a substring", async () => {
    mockFetchRoutes({
      feedItems: [
        {
          title: "Sporting SAD emite obrigações no aeroporto de Lisboa",
          pubDate: "2023-10-01 10:00:00",
          link: "http://example.com/1",
          author: "SAPO Desporto",
        },
      ],
    });

    render(<News />);
    await waitFor(() => {
      expect(screen.getAllByText(/aeroporto de Lisboa/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText("SAPO Desporto")[0]).toBeInTheDocument();
    });
  });

  it("should still drop rival-club headlines matched as whole words", async () => {
    mockFetchRoutes({
      feedItems: [
        {
          title: "FC Porto vence clássico frente ao Sporting",
          pubDate: "2023-10-01 10:00:00",
          link: "http://example.com/1",
          author: "Record",
        },
      ],
    });

    render(<News />);
    await waitFor(() => {
      expect(
        screen.getAllByText(/No items found/i)[0],
      ).toBeInTheDocument();
    });
  });

  it("should decode XML and HTML entities in titles and source names", async () => {
    mockFetchRoutes({
      feedItems: [
        {
          title: "Sporting SAD &amp; CMVM decidem reestruturar &#39;VMOCs&#39;",
          pubDate: "2023-10-01 10:00:00",
          link: "http://example.com/1",
          author: "Record &amp; Notícias",
        },
      ],
    });

    render(<News />);

    await waitFor(() => {
      expect(
        screen.getAllByText(/VMOCs/i)[0],
      ).toBeInTheDocument();
      expect(screen.getAllByText("Record & Notícias")[0]).toBeInTheDocument();
    });
  });

  it("should display error message on API failure", async () => {
    mockFetchRoutes({});

    render(<News />);
    await waitFor(() => {
      expect(
        screen.getAllByText(/Error: No items found/i)[0],
      ).toBeInTheDocument();
    });
  });

  it("should use cached items if available in sessionStorage", async () => {
    sessionStorage.setItem(
      "sportingNews_v1",
      JSON.stringify({
        ts: Date.now(),
        items: [
          {
            title: "Cached Article",
            category: "FINANCE",
            pubDate: "2023-10-01 10:00:00",
            link: "http://example.com/cache",
            sourceName: "O Jogo",
          },
        ],
      }),
    );

    mockFetchRoutes({});

    render(<News />);

    await waitFor(() => {
      expect(screen.getAllByText("Cached Article").length).toBeGreaterThan(0);
    });
  });

  it("should fallback to stale cache when fetch fails", async () => {
    sessionStorage.setItem(
      "sportingNews_v1",
      JSON.stringify({
        ts: Date.now() - 40 * 60 * 1000,
        items: [
          {
            title: "Stale Cached Article",
            category: "FINANCE",
            pubDate: "2023-10-01 10:00:00",
            link: "http://example.com/stale",
            sourceName: "O Jogo",
          },
        ],
      }),
    );

    mockFetchRoutes({});

    render(<News />);

    await waitFor(() => {
      expect(
        screen.getAllByText(/showing the last saved results/i)[0],
      ).toBeInTheDocument();
      expect(screen.getAllByText("Stale Cached Article").length).toBeGreaterThan(0);
    });
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

    render(<News />);

    await waitFor(() => {
      expect(
        screen.getAllByText(/Contas anuais do clube analisadas em detalhe/i)[0],
      ).toBeInTheDocument();
      expect(
        screen.getAllByText(/Grande reforco de peso contratado/i)[0],
      ).toBeInTheDocument();
      expect(
        screen.getAllByText(/Resultados financeiros excelentes apresentados/i)[0],
      ).toBeInTheDocument();
    });

    // Test that the "Recent" fallback date works
    const recentElements = screen.getAllByText(/Recent/i);
    expect(recentElements.length).toBeGreaterThan(0);
  });

  it("should show empty state when fetch fails with no cache", async () => {
    // Mock fetch to always fail
    mockFetchRoutes({ staticFile: null, feedItems: null });
    sessionStorage.clear();

    render(<News />);

    await waitFor(() => {
      expect(screen.getAllByText(/No items found/i)[0]).toBeInTheDocument();
    });
  });

});