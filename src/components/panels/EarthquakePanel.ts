/* ============================================================
   Earthquake Panel — USGS API
   ============================================================ */

import { Panel } from "@/components/Panel";
import { h, replaceChildren, timeAgo } from "@/utils/dom";

const USGS_URL =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson";
const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

interface Quake {
  mag: number;
  place: string;
  time: number;
  url: string;
}

export class EarthquakePanel extends Panel {
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super({ id: "earthquake", title: "Seismic Activity", showCount: true });
    this.load();
    this.refreshTimer = setInterval(() => this.load(), REFRESH_INTERVAL);
  }

  private async load(): Promise<void> {
    try {
      const res = await fetch(USGS_URL, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error("USGS fetch failed");
      const data = await res.json();
      const quakes: Quake[] = data.features
        .map((f: { properties: Quake }) => f.properties)
        .sort((a: Quake, b: Quake) => b.mag - a.mag);

      this.setCount(quakes.length);
      this.setDataBadge("live");
      this.render(quakes);
    } catch {
      this.showError("Failed to load USGS data");
      this.setDataBadge("unavailable");
    }
  }

  private render(quakes: Quake[]): void {
    if (quakes.length === 0) {
      this.showError("No significant earthquakes in past 24h");
      return;
    }

    const list = h("div", { className: "news-list" });

    for (const q of quakes.slice(0, 20)) {
      const level =
        q.mag >= 6
          ? "critical"
          : q.mag >= 5
            ? "high"
            : q.mag >= 4
              ? "medium"
              : "low";

      const item = h("div", { className: "news-item" });
      const header = h("div", { className: "news-item-header" });
      header.appendChild(h("div", { className: `news-threat-dot ${level}` }));
      header.appendChild(
        h(
          "a",
          {
            className: "news-title",
            href: q.url,
            target: "_blank",
            rel: "noopener",
          },
          `M${q.mag.toFixed(1)} — ${q.place || "Unknown location"}`,
        ),
      );
      item.appendChild(header);

      const meta = h("div", { className: "news-meta" });
      meta.appendChild(h("span", { className: "news-source" }, "USGS"));
      meta.appendChild(
        h("span", { className: "news-time" }, timeAgo(new Date(q.time))),
      );
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
