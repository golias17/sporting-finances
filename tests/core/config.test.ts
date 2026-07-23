import { describe, it, expect } from "vitest";
import { config } from "../../src/core/config.js";

describe("config.js", () => {
  it("builds a locale path for a given language code", () => {
    expect(config.localesPath("en")).toBe("./locales/en.json");
    expect(config.localesPath("pt")).toBe("./locales/pt.json");
  });

  it("exposes static data endpoint paths", () => {
    expect(config.financialsPath).toBe("./data/financials.json");
    expect(config.transfersPath).toBe("./data/transfers.json");
    expect(config.newsPath).toBe("./data/news.json");
  });

  it("builds an RSS search URL pinned to pt-PT/PT regardless of query content", () => {
    const url = config.rssSearchUrl("Sporting+SAD+contas");
    expect(url).toContain("q=Sporting+SAD+contas");
    // Deliberately pinned to Portuguese results (see the comment in
    // config.js) — not derived from the site's language toggle.
    expect(url).toContain("hl=pt-PT");
    expect(url).toContain("gl=PT");
    expect(url.startsWith("https://news.google.com/rss/search?")).toBe(true);
  });

  it("builds an rss2json proxy URL wrapping the given RSS URL", () => {
    const rssUrl = "https://news.google.com/rss/search?q=test";
    const url = config.rss2jsonApiUrl(rssUrl);
    expect(url).toBe(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
  });
});
