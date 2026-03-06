/* ============================================================
   Pentagon Pizza Index — Real-time pizza busyness near Pentagon
   Data source: pizzint.watch API (Google Maps busyness scraper)
   ============================================================ */

import { h } from "@/utils/dom";
import { timeAgo } from "@/utils/dom";

const API_URL = "/api/pizzint";
const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface PizzaStore {
  place_id: string;
  name: string;
  address: string;
  current_popularity: number | null;
  percentage_of_usual: number | null;
  is_spike: boolean;
  spike_magnitude: string | null;
  data_source: string;
  recorded_at: string;
  data_freshness: string;
}

interface PizzaApiResponse {
  success: boolean;
  data: PizzaStore[];
  overall_index: number;
  defcon_level: number;
  defcon_details: {
    at_time: string;
    raw_index: number;
    smoothed_index: number;
    open_places: number;
    total_places: number;
  };
  active_spikes: number;
  has_active_spikes: boolean;
  timestamp: string;
  data_freshness: string;
}

const DOUGHCON_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "COCKED PISTOL", color: "var(--threat-critical)" },
  2: { label: "FAST PACE", color: "var(--threat-high)" },
  3: { label: "ROUND HOUSE", color: "var(--threat-elevated)" },
  4: { label: "DOUBLE TAKE", color: "var(--status-active)" },
  5: { label: "FADE OUT", color: "var(--text-dim)" },
};

export class PizzaIndexPopup {
  private el!: HTMLElement;
  private overlay!: HTMLElement;
  private contentEl!: HTMLElement;
  private headerBtn!: HTMLElement;
  private defconBadge!: HTMLElement;
  private indexLabel!: HTMLElement;
  private visible = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private data: PizzaApiResponse | null = null;

  constructor() {
    this.createHeaderButton();
    this.createPopup();
    this.fetchData();
    this.pollTimer = setInterval(() => this.fetchData(), POLL_INTERVAL);
  }

  getHeaderButton(): HTMLElement {
    return this.headerBtn;
  }

  private createHeaderButton(): void {
    this.defconBadge = h(
      "span",
      { className: "pizza-defcon-badge" },
      "DoughCon —",
    );
    this.indexLabel = h("span", { className: "pizza-index-label" }, "—%");

    this.headerBtn = h(
      "button",
      {
        className: "pizza-header-btn",
        onClick: () => this.toggle(),
      },
      h("span", { className: "pizza-icon" }, "🍕"),
      this.defconBadge,
      this.indexLabel,
    );
  }

  private createPopup(): void {
    this.overlay = h("div", { className: "pizza-overlay hidden" });
    this.overlay.addEventListener("click", () => this.hide());

    this.el = h("div", { className: "pizza-popup hidden" });
    this.contentEl = h("div", { className: "pizza-popup-content" });

    const header = h(
      "div",
      { className: "pizza-popup-header" },
      h("span", null, "Pentagon Pizza Index — DoughCon"),
      h(
        "button",
        {
          className: "pizza-close-btn",
          onClick: () => this.hide(),
        },
        "✕",
      ),
    );

    this.el.append(header, this.contentEl);
    document.body.append(this.overlay, this.el);
  }

  private async fetchData(): Promise<void> {
    try {
      const res = await fetch(`${API_URL}?_t=${Date.now()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.data = await res.json();
      this.updateHeaderButton();
      if (this.visible) this.renderContent();
    } catch (err) {
      console.error("Pizza Index fetch error:", err);
    }
  }

  private updateHeaderButton(): void {
    if (!this.data) return;
    const level = this.data.defcon_level ?? 5;
    const info = DOUGHCON_LABELS[level] ?? DOUGHCON_LABELS[5];
    this.defconBadge.textContent = `DoughCon ${level}`;
    this.defconBadge.style.background = info.color;
    this.indexLabel.textContent = `${this.data.overall_index ?? 0}%`;
  }

  private toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  private show(): void {
    this.visible = true;
    this.el.classList.remove("hidden");
    this.overlay.classList.remove("hidden");
    this.renderContent();
  }

  private hide(): void {
    this.visible = false;
    this.el.classList.add("hidden");
    this.overlay.classList.add("hidden");
  }

  private renderContent(): void {
    this.contentEl.innerHTML = "";

    if (!this.data) {
      this.contentEl.appendChild(
        h(
          "div",
          { className: "pizza-loading" },
          "SCANNING PIZZA FREQUENCIES...",
        ),
      );
      return;
    }

    const level = this.data.defcon_level ?? 5;
    const info = DOUGHCON_LABELS[level] ?? DOUGHCON_LABELS[5];

    // DEFCON subtitle
    const subtitle = h("div", { className: "pizza-defcon-subtitle" });
    subtitle.style.color = info.color;
    subtitle.textContent = `${info.label} — ${level === 1 ? "MAXIMUM READINESS" : level === 2 ? "HIGH ALERT" : level === 3 ? "ELEVATED ACTIVITY" : level === 4 ? "INCREASED INTELLIGENCE WATCH" : "NORMAL OPERATIONS"}`;
    this.contentEl.appendChild(subtitle);

    // Store list
    const list = h("div", { className: "pizza-store-list" });
    // Deduplicate by name (API sometimes has dupes)
    const seen = new Set<string>();
    for (const store of this.data.data) {
      const key = store.place_id;
      if (seen.has(key)) continue;
      seen.add(key);
      list.appendChild(this.renderStore(store));
    }
    this.contentEl.appendChild(list);

    // Footer
    const updatedAt = this.data.timestamp
      ? timeAgo(new Date(this.data.timestamp))
      : "—";

    const footer = h(
      "div",
      { className: "pizza-footer" },
      h(
        "a",
        {
          className: "pizza-source-link",
          href: "https://www.pizzint.watch/",
          target: "_blank",
        },
        "Source: PizzINT",
      ),
      h("span", { className: "pizza-updated" }, `Updated ${updatedAt}`),
    );
    this.contentEl.appendChild(footer);
  }

  private renderStore(store: PizzaStore): HTMLElement {
    const row = h("div", { className: "pizza-store-row" });

    const nameEl = h("span", { className: "pizza-store-name" }, store.name);

    let badgeClass = "pizza-status-badge";
    let badgeText = "";

    if (
      store.current_popularity === null ||
      store.current_popularity === undefined
    ) {
      badgeClass += " badge-closed";
      badgeText = "CLOSED";
    } else if (store.is_spike) {
      badgeClass += " badge-spike";
      badgeText = `SPIKE ${store.percentage_of_usual ?? store.current_popularity}%`;
    } else if (store.current_popularity === 0) {
      badgeClass += " badge-quiet";
      badgeText = "QUIET 0%";
    } else {
      badgeClass += " badge-quiet";
      badgeText = `QUIET ${store.percentage_of_usual ?? store.current_popularity}%`;
    }

    const badge = h("span", { className: badgeClass }, badgeText);

    row.append(nameEl, badge);
    return row;
  }

  destroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.el.remove();
    this.overlay.remove();
  }
}
