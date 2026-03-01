/* ============================================================
   News Clustering — Jaccard Similarity
   ============================================================ */

import type { NewsItem, ClusteredEvent } from "@/types";
import { hashString } from "@/utils/dom";
import { classify } from "@/services/classifier";

const SIMILARITY_THRESHOLD = 0.35;

/**
 * Tokenize a headline into lowercase words.
 */
function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2), // skip short words
  );
}

/**
 * Jaccard similarity between two token sets.
 */
function jaccard(a: Set<string>, b: Set<string>): number {
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Cluster news items by headline similarity.
 */
export function clusterNews(items: NewsItem[]): ClusteredEvent[] {
  const clusters: ClusteredEvent[] = [];
  const tokenSets = items.map((item) => tokenize(item.title));
  const assigned = new Set<number>();

  for (let i = 0; i < items.length; i++) {
    if (assigned.has(i)) continue;

    const cluster: NewsItem[] = [items[i]];
    assigned.add(i);

    for (let j = i + 1; j < items.length; j++) {
      if (assigned.has(j)) continue;
      if (jaccard(tokenSets[i], tokenSets[j]) >= SIMILARITY_THRESHOLD) {
        cluster.push(items[j]);
        assigned.add(j);
      }
    }

    // Use highest-tier source's title as headline
    const sorted = [...cluster].sort((a, b) => a.sourceTier - b.sourceTier);
    const headline = sorted[0].title;
    const latestDate = new Date(
      Math.max(...cluster.map((c) => c.pubDate.getTime())),
    );
    const categories = [...new Set(cluster.map((c) => c.category))];

    const event: ClusteredEvent = {
      id: hashString(headline),
      headline,
      items: cluster,
      sourceCount: new Set(cluster.map((c) => c.source)).size,
      threatLevel: classify(headline, categories),
      latestDate,
      categories,
    };

    clusters.push(event);
  }

  // Sort by date, then by source count (higher = more important)
  clusters.sort((a, b) => {
    const dateDiff = b.latestDate.getTime() - a.latestDate.getTime();
    if (Math.abs(dateDiff) < 5 * 60 * 1000)
      return b.sourceCount - a.sourceCount; // within 5 min
    return dateDiff;
  });

  return clusters;
}
