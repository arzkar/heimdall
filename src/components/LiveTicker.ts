/* ============================================================
   Live Ticker — scrolling bottom bar with latest headlines
   ============================================================ */

import type { NewsItem } from "@/types";
import { h } from "@/utils/dom";

export class LiveTicker {
  private el: HTMLElement;
  private trackEl: HTMLElement;
  private paused = false;

  constructor(mountEl: HTMLElement) {
    this.el = h("div", { className: "live-ticker" });

    const live = h(
      "div",
      { className: "ticker-live-badge" },
      h("span", { className: "ticker-live-dot" }),
      "LIVE",
    );

    const viewport = h("div", { className: "ticker-viewport" });
    this.trackEl = h("div", { className: "ticker-track" });
    viewport.appendChild(this.trackEl);

    // Pause on hover
    viewport.addEventListener("mouseenter", () => {
      this.paused = true;
      this.trackEl.style.animationPlayState = "paused";
    });
    viewport.addEventListener("mouseleave", () => {
      this.paused = false;
      this.trackEl.style.animationPlayState = "running";
    });

    this.el.append(live, viewport);
    mountEl.appendChild(this.el);
  }

  update(items: NewsItem[]): void {
    if (items.length === 0) return;

    const latest = items.slice(0, 30);

    // Build doubled content for seamless loop
    const makeSegment = (items: NewsItem[]) =>
      items
        .map(
          (item) =>
            `<span class="ticker-item"><span class="ticker-src">${item.source}</span>${item.title}</span><span class="ticker-sep">◆</span>`,
        )
        .join("");

    const content = makeSegment(latest) + makeSegment(latest);
    this.trackEl.innerHTML = content;

    // Reset animation
    this.trackEl.style.animation = "none";
    void this.trackEl.offsetWidth; // reflow
    this.trackEl.style.animation = "";
    if (this.paused) this.trackEl.style.animationPlayState = "paused";
  }

  destroy(): void {
    this.el.remove();
  }
}
