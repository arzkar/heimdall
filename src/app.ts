/* ============================================================
   App Shell — bootstraps layout, router, panels, signal map
   ============================================================ */

import "@/styles/main.css";
import { h, replaceChildren } from "@/utils/dom";
import { router } from "@/router";
import { VIEWS, VIEW_IDS } from "@/config/views";
import { FEEDS } from "@/config/feeds";
import { MapContainer } from "@/components/MapContainer";
import { LiveNewsPanel } from "@/components/panels/LiveNewsPanel";
import { EarthquakePanel } from "@/components/panels/EarthquakePanel";
import { MarketPanel } from "@/components/panels/MarketPanel";
import { SignalDetailPanel } from "@/components/SignalDetailPanel";
import { LiveTicker } from "@/components/LiveTicker";
import { PizzaIndexPopup } from "@/components/PizzaIndexPopup";
import { fetchAllFeeds } from "@/services/rss";
import { classify } from "@/services/classifier";
import { extractLocations } from "@/services/geocoder";
import type { ViewId, GeoNewsItem, SignalCluster } from "@/types";
import type { Panel } from "@/components/Panel";

const GEO_VIEW_IDS: ViewId[] = ["geopolitics", "finance", "tech"];

class App {
  private sidebarToolbar!: HTMLElement;
  private panelsDock!: HTMLElement;
  private mapSection!: HTMLElement;
  private activePanels: Panel[] = [];
  private activeViewBtns: Map<string, HTMLElement> = new Map();
  private mapContainer!: MapContainer;
  private signalDetailPanel!: SignalDetailPanel;
  private ticker!: LiveTicker;
  private pizzaIndex!: PizzaIndexPopup;
  private feedPollTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.render();
    router.onChange((view) => this.switchView(view));
    this.switchView(router.currentView);

    requestAnimationFrame(() => {
      document.documentElement.classList.remove("no-transition");
    });
  }

  private render(): void {
    const app = document.getElementById("app")!;
    app.innerHTML = "";

    // Header
    app.appendChild(this.createHeader());

    // Main content wrapper
    const main = h("div", { className: "main-content" });

    // Map section (with sidebar overlay)
    this.mapSection = h("div", { className: "map-section" });
    const mapContainer = h("div", { className: "map-container" });

    // Radar overlays
    const overlays = h(
      "div",
      { className: "map-overlays" },
      h("div", { className: "map-grid" }),
      h("div", { className: "map-radar-sweep" }),
      h("div", { className: "map-scanlines" }),
      h("div", { className: "map-vignette" }),
    );

    this.mapSection.append(mapContainer, overlays);
    main.appendChild(this.mapSection);

    // Toolbar (left floating navigation)
    this.sidebarToolbar = h("div", { className: "sidebar-toolbar" });
    main.appendChild(this.sidebarToolbar);

    // Panels dock (horizontal bar at bottom, above ticker)
    this.panelsDock = h("div", { className: "panels-dock" });
    this.panelsDock.classList.add("hidden");
    main.appendChild(this.panelsDock);

    app.appendChild(main);

    // Init MapContainer
    this.mapContainer = new MapContainer(this.mapSection);
    this.mapContainer.onSignalClick = (cluster: SignalCluster) => {
      this.signalDetailPanel.show(cluster);
    };

    // Signal detail panel — mounted on body so it floats over everything
    this.signalDetailPanel = new SignalDetailPanel(document.body);

    // Bottom ticker
    this.ticker = new LiveTicker(app);
  }

  // Fullscreen handled entirely by CSS now without toggle.

  private createHeader(): HTMLElement {
    const header = h("div", { className: "header" });

    const left = h("div", { className: "header-left" });
    left.appendChild(
      h(
        "div",
        { className: "logo" },
        h("div", { className: "logo-icon" }, "H"),
        "Heimdall",
      ),
    );

    // View switcher
    const switcher = h("div", { className: "view-switcher" });
    for (const viewId of VIEW_IDS) {
      const view = VIEWS[viewId];
      const btn = h(
        "button",
        {
          className: "view-option",
          dataset: { view: viewId },
          onClick: () => router.navigate(viewId),
        },
        view.label,
      );
      this.activeViewBtns.set(viewId, btn);
      switcher.appendChild(btn);
    }
    left.appendChild(switcher);

    // Status indicator
    left.appendChild(
      h(
        "div",
        { className: "status-indicator" },
        h("div", { className: "status-dot" }),
        h("span", null, "LIVE"),
      ),
    );

    // Pizza Index button
    this.pizzaIndex = new PizzaIndexPopup();
    left.appendChild(this.pizzaIndex.getHeaderButton());

    header.appendChild(left);

    // Right: time
    const right = h("div", { className: "header-right" });
    const timeEl = h("span", { className: "header-time" });
    this.updateTime(timeEl);
    setInterval(() => this.updateTime(timeEl), 1000);
    right.appendChild(timeEl);
    header.appendChild(right);

    return header;
  }

  private updateTime(el: HTMLElement): void {
    const now = new Date();
    el.textContent = now
      .toUTCString()
      .replace("GMT", "UTC")
      .replace(/:\d+ /, " ")
      .slice(5);
  }

  private switchView(viewId: ViewId): void {
    const view = VIEWS[viewId];

    for (const [id, btn] of this.activeViewBtns) {
      btn.classList.toggle("active", id === viewId);
    }

    // Destroy existing panels
    for (const panel of this.activePanels) panel.destroy();
    this.activePanels = [];
    replaceChildren(this.sidebarToolbar);

    // Stop old poll
    if (this.feedPollTimer) clearInterval(this.feedPollTimer);

    // Geo map is always shown now, taking full possible height by default
    const hasSignalMap = GEO_VIEW_IDS.includes(viewId);
    this.mapSection.classList.toggle("hidden", !hasSignalMap);

    // Create panels & their toolbar icons
    for (const panelId of view.panelIds) {
      const panel = this.createPanel(panelId, view.feedCategories);
      if (panel) {
        this.activePanels.push(panel);
        panel.hide(); // Hidden by default, toggled via toolbar
        this.panelsDock.appendChild(panel.getElement());

        // Toolbar Button
        const iconInfo = this.getIconForPanel(panelId);
        const iconBtn = h(
          "div",
          {
            className: "sidebar-icon",
            dataset: { tooltip: iconInfo.tooltip },
          },
          iconInfo.icon,
        );

        iconBtn.onclick = () => {
          if (panel.isVisible()) {
            panel.hide();
            iconBtn.classList.remove("active");
          } else {
            panel.show();
            iconBtn.classList.add("active");
          }
          // Show/hide the dock based on whether any panel is visible
          const anyVisible = this.activePanels.some((p) => p.isVisible());
          this.panelsDock.classList.toggle("hidden", !anyVisible);
        };

        this.sidebarToolbar.appendChild(iconBtn);
      }
    }

    // Start signal map feed for geo views
    if (hasSignalMap) {
      void this.loadSignalsForView(viewId);
      this.feedPollTimer = setInterval(
        () => void this.loadSignalsForView(viewId),
        5 * 60 * 1000,
      );
    }
  }

  /**
   * Fetch feeds → geocode → push to map + ticker
   */
  private async loadSignalsForView(viewId: ViewId): Promise<void> {
    const view = VIEWS[viewId];
    const feeds = FEEDS.filter((f) => view.feedCategories.includes(f.category));

    if (feeds.length === 0) return;

    try {
      const items = await fetchAllFeeds(feeds);

      // Update ticker with all items
      this.ticker.update(items);

      // Geocode items → GeoNewsItems
      const geoItems: GeoNewsItem[] = [];
      for (const item of items) {
        const threat = classify(item.title);
        const locs = extractLocations(
          item.title + " " + (item.description ?? ""),
        );
        for (const loc of locs) {
          geoItems.push({
            ...item,
            lng: loc.lng,
            lat: loc.lat,
            locationName: loc.name,
            threatLevel: threat,
          });
        }
      }

      this.mapContainer.setSignals(geoItems);
    } catch (err) {
      console.warn("[Heimdall] Signal load failed:", err);
    }
  }

  private createPanel(panelId: string, feedCategories: string[]): Panel | null {
    switch (panelId) {
      case "liveNews":
        return new LiveNewsPanel(feedCategories);
      case "earthquake":
        return new EarthquakePanel();
      case "market":
        return new MarketPanel();
      default:
        return null;
    }
  }

  private getIconForPanel(panelId: string): { icon: string; tooltip: string } {
    switch (panelId) {
      case "liveNews":
        return { icon: "📺", tooltip: "Live Intelligence" };
      case "earthquake":
        return { icon: "⚠️", tooltip: "Seismic Activity" };
      case "market":
        return { icon: "📈", tooltip: "Markets & Indices" };
      default:
        return { icon: "📄", tooltip: "Panel" };
    }
  }
}

export function createApp(): App {
  return new App();
}
