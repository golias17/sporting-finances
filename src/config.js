// Configuration file holding all API paths, JSON endpoints, and feed URLs.
export const config = {
  localesPath: (lang) => `./locales/${lang}.json`,
  financialsPath: "./data/financials.json",
  transfersPath: "./data/transfers.json",
  newsPath: "./data/news.json",
  rssSearchUrl: (query) =>
    `https://news.google.com/rss/search?q=${query}&hl=pt-PT&gl=PT&ceid=PT:pt-150`,
  rss2jsonApiUrl: (rssUrl) =>
    `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`,
};
