/* ============================================================
   Signal Detail Panel — floating terminal-style window
   Appears when a signal cluster is clicked on the map.
   Draggable, dismissable, displays event list + threat level.
   ============================================================ */

import type { SignalCluster, ThreatLevel } from "@/types";
import { h } from "@/utils/dom";

const THREAT_LABELS: Record<ThreatLevel, string> = {
  critical: "CRITICAL",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
  info: "INFO",
};

const THREAT_COLORS: Record<ThreatLevel, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#0beb7a",
  info: "#22d3ee",
};

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatCoords(lng: number, lat: number): string {
  return `${lat.toFixed(2)}°${lat >= 0 ? "N" : "S"}, ${lng.toFixed(2)}°${lng >= 0 ? "E" : "W"}`;
}

export class SignalDetailPanel {
  private el: HTMLElement;
  private isDragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  constructor(private mountEl: HTMLElement) {
    this.el = h("div", { className: "signal-panel hidden" });
    this.mountEl.appendChild(this.el);
  }

  show(cluster: SignalCluster): void {
    const { topThreat, events, count, lng, lat } = cluster;
    const primaryEvent = events[0];
    const color = THREAT_COLORS[topThreat];

    // Build content
    this.el.innerHTML = "";
    this.el.classList.remove("hidden");

    // ── Title bar ──────────────────────────────────────────────
    const titleBar = h("div", { className: "signal-panel-titlebar" });

    const titleLeft = h(
      "div",
      { className: "signal-panel-title-left" },
      h("span", { className: "signal-panel-dot" }),
      h("span", { className: "signal-panel-label" }, "SIGNAL DETAIL"),
    );

    const titleRight = h("div", { className: "signal-panel-title-right" });
    const btnMin = h(
      "button",
      { className: "signal-panel-btn", title: "Minimise" },
      "−",
    );
    const btnMax = h(
      "button",
      { className: "signal-panel-btn", title: "Maximise" },
      "□",
    );
    const btnClose = h(
      "button",
      { className: "signal-panel-btn signal-panel-btn-close", title: "Close" },
      "✕",
    );
    btnClose.onclick = () => this.hide();
    titleRight.append(btnMin, btnMax, btnClose);
    titleBar.append(titleLeft, titleRight);

    // ── Threat badge ──────────────────────────────────────────
    const meta = h("div", { className: "signal-panel-meta" });
    const badge = h(
      "span",
      {
        className: "signal-threat-badge",
        style: { background: `${color}22`, color, borderColor: `${color}55` },
      },
      THREAT_LABELS[topThreat],
    );
    const mentions = h(
      "span",
      { className: "signal-mentions" },
      `${count} MENTION${count !== 1 ? "S" : ""}`,
    );
    meta.append(badge, mentions);

    // ── Location info ─────────────────────────────────────────
    const locLine = h("div", { className: "signal-panel-location" });
    const locationName =
      events
        .map((e) => e.locationName)
        .filter(Boolean)
        .find(Boolean) || "Unknown Region";
    locLine.append(
      h("span", { className: "signal-location-name" }, locationName),
      h(
        "span",
        { className: "signal-location-coords" },
        formatCoords(lng, lat),
      ),
    );

    // ── Summary ────────────────────────────────────────────────
    const summarySection = h("div", { className: "signal-section" });
    summarySection.append(
      h("div", { className: "signal-section-header" }, "INTELLIGENCE SUMMARY"),
      h("div", { className: "signal-summary" }, primaryEvent.title),
    );

    // ── Key events ─────────────────────────────────────────────
    const eventsSection = h("div", { className: "signal-section" });
    eventsSection.append(
      h("div", { className: "signal-section-header" }, "KEY EVENTS"),
    );
    const eventsList = h("div", { className: "signal-events-list" });
    for (const ev of events.slice(0, 8)) {
      const item = h("div", { className: "signal-event-item" });
      const timeEl = h(
        "span",
        { className: "signal-event-time" },
        relativeTime(ev.pubDate),
      );
      const titleEl = h("div", { className: "signal-event-title" });
      titleEl.innerHTML = `<a href="${ev.link}" target="_blank" rel="noopener">${ev.title}</a>`;
      const sourceEl = h(
        "span",
        { className: "signal-event-source" },
        ev.source,
      );
      item.append(timeEl, titleEl, sourceEl);
      eventsList.appendChild(item);
    }
    eventsSection.appendChild(eventsList);

    this.el.append(titleBar, meta, locLine, summarySection, eventsSection);

    // Position near centre-left, but honour existing drag position
    const existing = this.el.style.left;
    if (!existing || existing === "") {
      this.el.style.left = "380px"; // Offset to right of main panels
      this.el.style.top = "80px";
    }

    // Setup dragging on title bar
    this.setupDrag(titleBar);
  }

  hide(): void {
    this.el.classList.add("hidden");
  }

  private setupDrag(handle: HTMLElement): void {
    const onMouseMove = (e: MouseEvent) => {
      if (!this.isDragging) return;
      this.el.style.left = `${e.clientX - this.dragOffsetX}px`;
      this.el.style.top = `${e.clientY - this.dragOffsetY}px`;
    };
    const onMouseUp = () => {
      this.isDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    // Remove old listener by replacing element
    const newHandle = handle.cloneNode(true) as HTMLElement;
    handle.replaceWith(newHandle);
    this.el.prepend(newHandle);

    newHandle.addEventListener("mousedown", (e) => {
      if ((e.target as HTMLElement).closest(".signal-panel-btn")) return;
      this.isDragging = true;
      const rect = this.el.getBoundingClientRect();
      this.dragOffsetX = e.clientX - rect.left;
      this.dragOffsetY = e.clientY - rect.top;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      e.preventDefault();
    });

    // Re-bind close button after cloneNode
    const closeBtn = newHandle.querySelector(
      ".signal-panel-btn-close",
    ) as HTMLElement;
    if (closeBtn) closeBtn.onclick = () => this.hide();
  }

  destroy(): void {
    this.el.remove();
  }
}
