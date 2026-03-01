/* ============================================================
   Live News Panel
   ============================================================ */

import { Panel } from "@/components/Panel";
import { fetchAllFeeds } from "@/services/rss";
import { clusterNews } from "@/services/clustering";
import { getFeedsByCategories } from "@/config/feeds";
import { h, replaceChildren, timeAgo } from "@/utils/dom";
import type { ClusteredEvent } from "@/types";

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export class LiveNewsPanel extends Panel {
  private categories: string[];
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private events: ClusteredEvent[] = [];

  constructor(categories: string[]) {
    super({ id: "liveNews", title: "Live Intelligence Feed", showCount: true });
    this.categories = categories;
    this.load();
    this.refreshTimer = setInterval(() => this.load(), REFRESH_INTERVAL);
  }

  updateCategories(categories: string[]): void {
    this.categories = categories;
    this.showLoading("Switching feeds…");
    this.load();
  }

  private async load(): Promise<void> {
    try {
      const feeds = getFeedsByCategories(this.categories);
      if (feeds.length === 0) {
        this.showError("No feeds configured for this view");
        return;
      }

      const items = await fetchAllFeeds(feeds);
      this.events = clusterNews(items);
      this.setCount(this.events.length);
      this.setDataBadge("live");
      this.render();
    } catch {
      this.showError("Failed to load feeds");
      this.setDataBadge("unavailable");
    }
  }

  private render(): void {
    if (this.events.length === 0) {
      this.showError("No stories found");
      return;
    }

    const list = h("div", { className: "news-list" });

    for (const event of this.events.slice(0, 50)) {
      const item = h("div", { className: "news-item" });

      const header = h("div", { className: "news-item-header" });
      header.appendChild(
        h("div", { className: `news-threat-dot ${event.threatLevel}` }),
      );

      const titleEl = h(
        "a",
        {
          className: "news-title",
          href: event.items[0].link,
          target: "_blank",
          rel: "noopener",
        },
        event.headline,
      );
      header.appendChild(titleEl);
      item.appendChild(header);

      const meta = h("div", { className: "news-meta" });
      meta.appendChild(
        h("span", { className: "news-source" }, event.items[0].source),
      );
      meta.appendChild(
        h("span", { className: "news-time" }, timeAgo(event.latestDate)),
      );

      if (event.sourceCount > 1) {
        meta.appendChild(
          h(
            "span",
            { className: "news-sources-count" },
            `${event.sourceCount} sources`,
          ),
        );
      }

      item.appendChild(meta);
      list.appendChild(item);
    }

    replaceChildren(this.content, list);
  }

  override destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    super.destroy();
  }
}
