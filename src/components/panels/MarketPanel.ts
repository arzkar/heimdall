/* ============================================================
   Market Panel — Financial Indices
   ============================================================ */

import { Panel } from "@/components/Panel";
import { h, replaceChildren } from "@/utils/dom";

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

// Yahoo Finance chart API (public, no key required)
const INDICES = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^DJI", name: "Dow Jones" },
  { symbol: "^IXIC", name: "NASDAQ" },
  { symbol: "^FTSE", name: "FTSE 100" },
  { symbol: "^N225", name: "Nikkei 225" },
  { symbol: "^VIX", name: "VIX" },
  { symbol: "GC=F", name: "Gold" },
  { symbol: "CL=F", name: "Crude Oil" },
  { symbol: "BTC-USD", name: "Bitcoin" },
  { symbol: "ETH-USD", name: "Ethereum" },
  { symbol: "DX-Y.NYB", name: "USD Index" },
  { symbol: "^TNX", name: "10Y Yield" },
];

const REFRESH_INTERVAL = 2 * 60 * 1000;

export class MarketPanel extends Panel {
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private data: MarketIndex[] = [];

  constructor() {
    super({ id: "market", title: "Markets & Indices", showCount: true });
    this.element.classList.add("span-2");
    this.load();
    this.refreshTimer = setInterval(() => this.load(), REFRESH_INTERVAL);
  }

  private async load(): Promise<void> {
    try {
      // Use multiple proxied Yahoo Finance chart calls
      const results: MarketIndex[] = [];

      // Batch requests to avoid rate limits
      const batches = [INDICES.slice(0, 6), INDICES.slice(6)];

      for (const batch of batches) {
        const promises = batch.map(async (idx) => {
          try {
            const url = `/api/market?symbol=${encodeURIComponent(idx.symbol)}`;
            const res = await fetch(url, {
              signal: AbortSignal.timeout(8000),
            });
            if (!res.ok) return null;
            const data = await res.json();
            const meta = data?.chart?.result?.[0]?.meta;
            if (!meta) return null;

            const price = meta.regularMarketPrice ?? 0;
            const prevClose =
              meta.chartPreviousClose ?? meta.previousClose ?? price;
            const change = price - prevClose;
            const changePercent =
              prevClose > 0 ? (change / prevClose) * 100 : 0;

            return {
              symbol: idx.symbol,
              name: idx.name,
              price,
              change,
              changePercent,
            } as MarketIndex;
          } catch {
            return null;
          }
        });

        const batchResults = await Promise.allSettled(promises);
        for (const r of batchResults) {
          if (r.status === "fulfilled" && r.value) {
            results.push(r.value);
          }
        }
      }

      this.data = results;
      this.setCount(this.data.length);
      if (this.data.length > 0) {
        this.setDataBadge("live");
        this.render();
      } else {
        this.setDataBadge("unavailable");
        this.showError("Unable to fetch market data");
      }
    } catch {
      this.showError("Failed to load market data");
      this.setDataBadge("unavailable");
    }
  }

  private render(): void {
    const grid = h("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "1px",
        background: "var(--border-subtle)",
      },
    });

    for (const idx of this.data) {
      const isUp = idx.change >= 0;
      const color = isUp ? "var(--threat-low)" : "var(--threat-critical)";
      const arrow = isUp ? "▲" : "▼";

      const cell = h("div", {
        style: {
          padding: "12px 14px",
          background: "var(--surface)",
          cursor: "default",
          transition: "background 0.15s ease",
        },
      });

      // Name
      cell.appendChild(
        h(
          "div",
          {
            style: {
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              fontWeight: "600",
              letterSpacing: "0.8px",
              color: "var(--text-dim)",
              textTransform: "uppercase",
              marginBottom: "6px",
            },
          },
          idx.name,
        ),
      );

      // Price
      cell.appendChild(
        h(
          "div",
          {
            style: {
              fontFamily: "var(--font-mono)",
              fontSize: "16px",
              fontWeight: "700",
              color: "var(--text)",
              lineHeight: "1.2",
            },
          },
          this.formatPrice(idx.price, idx.symbol),
        ),
      );

      // Change
      const changeRow = h("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginTop: "4px",
        },
      });

      changeRow.appendChild(
        h(
          "span",
          {
            style: {
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: "600",
              color,
            },
          },
          `${arrow} ${Math.abs(idx.change).toFixed(2)}`,
        ),
      );

      changeRow.appendChild(
        h(
          "span",
          {
            style: {
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              fontWeight: "700",
              color,
              background: isUp ? "rgba(59,221,142,0.1)" : "rgba(255,59,92,0.1)",
              padding: "1px 5px",
              borderRadius: "3px",
            },
          },
          `${isUp ? "+" : ""}${idx.changePercent.toFixed(2)}%`,
        ),
      );

      cell.appendChild(changeRow);

      // Hover effect
      cell.addEventListener("mouseenter", () => {
        cell.style.background = "var(--surface-hover)";
      });
      cell.addEventListener("mouseleave", () => {
        cell.style.background = "var(--surface)";
      });

      grid.appendChild(cell);
    }

    replaceChildren(this.content, grid);
  }

  private formatPrice(price: number, symbol: string): string {
    if (symbol.includes("BTC") || symbol.includes("ETH")) {
      return price.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    }
    if (price > 10000) {
      return price.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    }
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  override destroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    super.destroy();
  }
}
