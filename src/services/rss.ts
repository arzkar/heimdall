/* ============================================================
   RSS Service — Fetch, parse, cache feeds
   ============================================================ */

import type { Feed, NewsItem } from "@/types";
import { hashString } from "@/utils/dom";

interface FeedCacheEntry {
  items: NewsItem[];
  expires: number;
}

const feedCache = new Map<string, FeedCacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch and parse a single RSS feed. Returns cached result if fresh.
 */
export async function fetchFeed(feed: Feed): Promise<NewsItem[]> {
  const cacheKey = hashString(feed.url);
  const cached = feedCache.get(cacheKey);
  if (cached && Date.now() < cached.expires) return cached.items;

  try {
    const res = await fetch(feed.url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return [];

    const text = await res.text();
    const items = parseRSS(text, feed);

    feedCache.set(cacheKey, { items, expires: Date.now() + CACHE_TTL });
    return items;
  } catch {
    // Return stale cache on error, or empty
    return cached?.items ?? [];
  }
}

/**
 * Fetch multiple feeds concurrently, calling onBatch as each resolves.
 */
export async function fetchAllFeeds(
  feeds: Feed[],
  onBatch?: (items: NewsItem[], feedName: string) => void,
): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];

  const promises = feeds.map(async (feed) => {
    const items = await fetchFeed(feed);
    allItems.push(...items);
    onBatch?.(items, feed.name);
  });

  await Promise.allSettled(promises);

  // Sort by date descending
  allItems.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  // Deduplicate by title hash
  const seen = new Set<string>();
  return allItems.filter((item) => {
    const key = hashString(item.title.toLowerCase().trim());
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Parse RSS/Atom XML into NewsItems.
 */
function parseRSS(xml: string, feed: Feed): NewsItem[] {
  const items: NewsItem[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");

  // RSS 2.0
  const rssItems = doc.querySelectorAll("item");
  for (const item of rssItems) {
    const title = item.querySelector("title")?.textContent?.trim();
    const link = item.querySelector("link")?.textContent?.trim();
    const pubDateStr = item.querySelector("pubDate")?.textContent?.trim();

    if (!title) continue;

    items.push({
      id: hashString(`${feed.name}:${title}`),
      title,
      link: link || "",
      source: feed.name,
      sourceTier: feed.tier ?? 4,
      pubDate: pubDateStr ? new Date(pubDateStr) : new Date(),
      category: feed.category,
      description: item.querySelector("description")?.textContent?.trim(),
    });
  }

  // Atom
  if (items.length === 0) {
    const entries = doc.querySelectorAll("entry");
    for (const entry of entries) {
      const title = entry.querySelector("title")?.textContent?.trim();
      const linkEl = entry.querySelector("link[href]");
      const link = linkEl?.getAttribute("href") || "";
      const updated =
        entry.querySelector("updated")?.textContent?.trim() ||
        entry.querySelector("published")?.textContent?.trim();

      if (!title) continue;

      items.push({
        id: hashString(`${feed.name}:${title}`),
        title,
        link,
        source: feed.name,
        sourceTier: feed.tier ?? 4,
        pubDate: updated ? new Date(updated) : new Date(),
        category: feed.category,
        description: entry.querySelector("summary")?.textContent?.trim(),
      });
    }
  }

  return items;
}
