/* ============================================================
   Feed Configuration
   ============================================================ */

import type { Feed } from "@/types";

const rss = (url: string) => `/api/rss-proxy?url=${encodeURIComponent(url)}`;

export const FEEDS: Feed[] = [
  // ── Politics / World ──
  {
    name: "BBC World",
    url: rss("https://feeds.bbci.co.uk/news/world/rss.xml"),
    tier: 2,
    type: "mainstream",
    category: "politics",
  },
  {
    name: "AP News",
    url: rss(
      "https://news.google.com/rss/search?q=site:apnews.com&hl=en-US&gl=US&ceid=US:en",
    ),
    tier: 1,
    type: "wire",
    category: "politics",
  },
  {
    name: "Reuters",
    url: rss(
      "https://news.google.com/rss/search?q=site:reuters.com+world&hl=en-US&gl=US&ceid=US:en",
    ),
    tier: 1,
    type: "wire",
    category: "politics",
  },
  {
    name: "Guardian World",
    url: rss("https://www.theguardian.com/world/rss"),
    tier: 2,
    type: "mainstream",
    category: "politics",
  },
  {
    name: "NPR News",
    url: rss("https://feeds.npr.org/1001/rss.xml"),
    tier: 2,
    type: "mainstream",
    category: "politics",
  },

  // ── Middle East ──
  {
    name: "BBC Middle East",
    url: rss("https://feeds.bbci.co.uk/news/world/middle_east/rss.xml"),
    tier: 2,
    type: "mainstream",
    category: "middleeast",
  },
  {
    name: "Al Jazeera",
    url: rss("https://www.aljazeera.com/xml/rss/all.xml"),
    tier: 2,
    type: "mainstream",
    category: "middleeast",
  },
  {
    name: "Guardian ME",
    url: rss("https://www.theguardian.com/world/middleeast/rss"),
    tier: 2,
    type: "mainstream",
    category: "middleeast",
  },

  // ── Asia ──
  {
    name: "BBC Asia",
    url: rss("https://feeds.bbci.co.uk/news/world/asia/rss.xml"),
    tier: 2,
    type: "mainstream",
    category: "asia",
  },
  {
    name: "The Diplomat",
    url: rss("https://thediplomat.com/feed/"),
    tier: 3,
    type: "intel",
    category: "asia",
  },
  {
    name: "NDTV",
    url: rss("https://feeds.feedburner.com/ndtvnews-top-stories"),
    tier: 2,
    type: "mainstream",
    category: "asia",
  },

  // ── Africa ──
  {
    name: "BBC Africa",
    url: rss("https://feeds.bbci.co.uk/news/world/africa/rss.xml"),
    tier: 2,
    type: "mainstream",
    category: "africa",
  },

  // ── Europe ──
  {
    name: "France 24",
    url: rss("https://www.france24.com/en/rss"),
    tier: 2,
    type: "mainstream",
    category: "europe",
  },
  {
    name: "DW News",
    url: rss("https://rss.dw.com/xml/rss-en-all"),
    tier: 2,
    type: "mainstream",
    category: "europe",
  },

  // ── Defense / Think Tanks ──
  {
    name: "Defense One",
    url: rss(
      "https://news.google.com/rss/search?q=site:defenseone.com&hl=en-US&gl=US&ceid=US:en",
    ),
    tier: 3,
    type: "intel",
    category: "defense",
  },
  {
    name: "Foreign Policy",
    url: rss("https://foreignpolicy.com/feed/"),
    tier: 3,
    type: "intel",
    category: "defense",
  },
  {
    name: "CrisisWatch",
    url: rss("https://www.crisisgroup.org/rss"),
    tier: 3,
    type: "intel",
    category: "defense",
  },

  // ── Government ──
  {
    name: "UN News",
    url: rss("https://news.un.org/feed/subscribe/en/news/all/rss.xml"),
    tier: 1,
    type: "gov",
    category: "gov",
  },
  {
    name: "WHO",
    url: rss("https://www.who.int/rss-feeds/news-english.xml"),
    tier: 1,
    type: "gov",
    category: "gov",
  },

  // ── Finance ──
  {
    name: "CNBC",
    url: rss("https://www.cnbc.com/id/100003114/device/rss/rss.html"),
    tier: 2,
    type: "market",
    category: "finance",
  },
  {
    name: "MarketWatch",
    url: rss(
      "https://news.google.com/rss/search?q=site:marketwatch.com+markets+when:1d&hl=en-US&gl=US&ceid=US:en",
    ),
    tier: 2,
    type: "market",
    category: "finance",
  },
  {
    name: "Financial Times",
    url: rss("https://www.ft.com/rss/home"),
    tier: 2,
    type: "market",
    category: "finance",
  },
  {
    name: "Reuters Business",
    url: rss(
      "https://news.google.com/rss/search?q=site:reuters.com+business+markets&hl=en-US&gl=US&ceid=US:en",
    ),
    tier: 1,
    type: "wire",
    category: "finance",
  },

  // ── Tech ──
  {
    name: "Hacker News",
    url: rss("https://hnrss.org/frontpage"),
    tier: 4,
    type: "tech",
    category: "tech",
  },
  {
    name: "Ars Technica",
    url: rss("https://feeds.arstechnica.com/arstechnica/technology-lab"),
    tier: 3,
    type: "tech",
    category: "tech",
  },
  {
    name: "The Verge",
    url: rss("https://www.theverge.com/rss/index.xml"),
    tier: 4,
    type: "tech",
    category: "tech",
  },
  {
    name: "TechCrunch",
    url: rss("https://techcrunch.com/feed/"),
    tier: 3,
    type: "tech",
    category: "tech",
  },
  {
    name: "MIT Tech Review",
    url: rss("https://www.technologyreview.com/feed/"),
    tier: 3,
    type: "tech",
    category: "tech",
  },

  // ── AI ──
  {
    name: "VentureBeat AI",
    url: rss("https://venturebeat.com/category/ai/feed/"),
    tier: 4,
    type: "tech",
    category: "ai",
  },
  {
    name: "AI News",
    url: rss(
      'https://news.google.com/rss/search?q=(OpenAI+OR+Anthropic+OR+Google+AI+OR+"large+language+model")+when:2d&hl=en-US&gl=US&ceid=US:en',
    ),
    tier: 4,
    type: "tech",
    category: "ai",
  },

  // ── Startups ──
  {
    name: "TechCrunch Startups",
    url: rss("https://techcrunch.com/category/startups/feed/"),
    tier: 3,
    type: "tech",
    category: "startups",
  },
  {
    name: "Crunchbase News",
    url: rss("https://news.crunchbase.com/feed/"),
    tier: 3,
    type: "tech",
    category: "startups",
  },
];

/**
 * Get feeds for given categories.
 */
export function getFeedsByCategories(categories: string[]): Feed[] {
  return FEEDS.filter((f) => categories.includes(f.category));
}
