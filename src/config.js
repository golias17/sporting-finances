// Configuration file holding all API paths, JSON endpoints, and feed URLs.
export const config = {
  localesPath: (lang) => `./locales/${lang}.json`,
  financialsPath: "./data/financials.json",
  transfersPath: "./data/transfers.json",
  newsPath: "./data/news.json",
  // hl/gl are deliberately pinned to pt-PT/PT regardless of the site's own
  // language toggle (state.isPt) — the query terms passed in (see news.js's
  // `queries` array) are Portuguese financial-press search terms for a
  // Portuguese club's SAD accounts, and English-language coverage of that
  // subject is essentially nonexistent. Searching in English here would
  // return few or no relevant results, not more accessible ones.
  rssSearchUrl: (query) =>
    `https://news.google.com/rss/search?q=${query}&hl=pt-PT&gl=PT&ceid=PT:pt-150`,
  rss2jsonApiUrl: (rssUrl) =>
    `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`,
};
