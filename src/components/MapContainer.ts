/* ============================================================
   Map Container — Leaflet Integration
   ============================================================ */

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoNewsItem, SignalCluster, ThreatLevel } from "@/types";

// Threat → neon colour mapping (matches World Monitor palette)
const THREAT_COLOR: Record<ThreatLevel, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#0beb7a",
  info: "#22d3ee",
};

// Cluster proximity radius in degrees (~200 km)
const CLUSTER_RADIUS_DEG = 1.8;

const THREAT_ORDER: ThreatLevel[] = [
  "critical",
  "high",
  "medium",
  "low",
  "info",
];

function topThreat(levels: ThreatLevel[]): ThreatLevel {
  for (const t of THREAT_ORDER) {
    if (levels.includes(t)) return t;
  }
  return "info";
}

function haversineApprox(
  lng1: number,
  lat1: number,
  lng2: number,
  lat2: number,
): number {
  return Math.sqrt((lng1 - lng2) ** 2 + (lat1 - lat2) ** 2);
}

/**
 * Group GeoNewsItems into clusters by proximity.
 */
function buildClusters(items: GeoNewsItem[]): SignalCluster[] {
  const clusters: SignalCluster[] = [];

  for (const item of items) {
    let matched = false;
    for (const cluster of clusters) {
      if (
        haversineApprox(item.lng, item.lat, cluster.lng, cluster.lat) <
        CLUSTER_RADIUS_DEG
      ) {
        cluster.events.push(item);
        cluster.count++;
        cluster.topThreat = topThreat(
          cluster.events.map((e) => e.threatLevel ?? "info"),
        );
        matched = true;
        break;
      }
    }
    if (!matched) {
      clusters.push({
        id: `cluster-${clusters.length}`,
        lng: item.lng,
        lat: item.lat,
        events: [item],
        count: 1,
        topThreat: item.threatLevel ?? "info",
      });
    }
  }

  return clusters;
}

export class MapContainer {
  private container: HTMLElement;
  private map: L.Map | null = null;
  private isResizing = false;
  private startY = 0;
  private startHeight = 0;

  private currentClusters: SignalCluster[] = [];
  private signalMarkers: L.Marker[] = [];

  public onSignalClick?: (cluster: SignalCluster) => void;

  constructor(parentEl: HTMLElement) {
    this.container = parentEl;
    this.init();
  }

  private init(): void {
    const mapDiv = this.container.querySelector(
      ".map-container",
    ) as HTMLElement;
    if (!mapDiv) return;

    mapDiv.innerHTML = "";

    // Create Leaflet Map
    this.map = L.map(mapDiv, {
      center: [30, 20],
      zoom: 3,
      minZoom: 2,
      maxZoom: 12,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
    });

    // Add zoomed control to top right
    L.control.zoom({ position: "topright" }).addTo(this.map);

    // Add Attribution
    L.control
      .attribution({ position: "bottomright" })
      .addAttribution(
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      )
      .addAttribution(
        '&copy; <a href="https://carto.com/attributions">CARTO</a>',
      )
      .addTo(this.map);

    // Add CARTO Dark Matter Tiles
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        subdomains: "abcd",
        maxZoom: 20,
      },
    ).addTo(this.map);

    this.setupResize();
    this.loadEarthquakeLayer();
  }

  /**
   * Public: called by App after geocoding news items.
   */
  setSignals(items: GeoNewsItem[]): void {
    if (!this.map) return;

    this.currentClusters = buildClusters(items);

    // Remove existing
    for (const marker of this.signalMarkers) {
      marker.remove();
    }
    this.signalMarkers = [];

    // Add new clusters as CSS divIcons
    for (const cluster of this.currentClusters) {
      const color = THREAT_COLOR[cluster.topThreat] ?? THREAT_COLOR["info"];
      const size = Math.min(16 + cluster.count * 4, 48); // max 48px

      const html = `
        <div class="signal-marker" style="--signal-color: ${color}; width: ${size}px; height: ${size}px;">
          <div class="signal-halo"></div>
          <div class="signal-ring"></div>
          <div class="signal-dot"></div>
          <div class="signal-core"></div>
          ${cluster.count > 1 ? `<div class="signal-count">${cluster.count}</div>` : ""}
        </div>
      `;

      const icon = L.divIcon({
        html,
        className: "custom-signal-icon",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([cluster.lat, cluster.lng], { icon })
        .addTo(this.map)
        .on("click", () => {
          this.onSignalClick?.(cluster);
        });

      // Bind detailed popup matching aesthetic
      const primaryEvent = cluster.events[0];
      const dateStr = primaryEvent.pubDate.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const threatClass = cluster.topThreat;
      const threatLabel = cluster.topThreat.toUpperCase();

      const popupHtml = `
        <div class="strat-popup-content">
          <div class="strat-popup-header">
            <span class="strat-badge threat-${threatClass}">${threatLabel}</span>
            <span class="strat-mentions">${cluster.count} MENTION${cluster.count > 1 ? "S" : ""}</span>
          </div>
          <div class="strat-popup-body">
            <div class="strat-popup-loc"><span style="color:var(--accent)">${primaryEvent.locationName || "Unknown"}</span> mentioned in article:</div>
            <div class="strat-popup-title">${primaryEvent.title}</div>
          </div>
          <div class="strat-popup-footer">
            ${dateStr} | ${primaryEvent.source}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: "strat-popup-wrapper",
        closeButton: true,
        autoPan: false,
        offset: [0, -size / 2],
      });

      this.signalMarkers.push(marker);
    }
  }

  // ── Earthquake Layer (preserved) ──────────────────────────────

  private async loadEarthquakeLayer(): Promise<void> {
    if (!this.map) return;

    try {
      const res = await fetch(
        "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson",
        { signal: AbortSignal.timeout(10_000) },
      );
      if (!res.ok) return;
      const data = await res.json();

      L.geoJSON(data, {
        pointToLayer: (feature, latlng) => {
          const mag = feature.properties?.mag || 2.5;
          let color = "#3b9eff";
          if (mag >= 4) color = "#ffb83b";
          if (mag >= 5.5) color = "#f97316";
          if (mag >= 7) color = "#ef4444";

          const radius = Math.max(3, mag * 2);

          return L.circleMarker(latlng, {
            radius,
            fillColor: color,
            color: color,
            weight: 1,
            opacity: 0.4,
            fillOpacity: 0.5,
          });
        },
        onEachFeature: (feature, layer) => {
          if (!feature.properties) return;
          const props = feature.properties;
          const popupHtml = `
            <div style="font-family:var(--font-mono,monospace);font-size:11px;padding:4px">
              <div style="font-size:9px;font-weight:600;color:#ffb83b;margin-bottom:4px;letter-spacing:0.5px">SEISMIC</div>
              <div style="font-weight:700;margin-bottom:4px">M${Number(props.mag).toFixed(1)}</div>
              <div style="color:#b0b4cc">${props.place || "Unknown"}</div>
              <div style="color:#707498;font-size:9px;margin-top:2px">${new Date(props.time).toLocaleString()}</div>
            </div>
          `;
          layer.bindPopup(popupHtml, {
            className: "earthquake-popup",
            closeButton: false,
          });

          if (props.mag >= 5) {
            layer.bindTooltip(`M${Number(props.mag).toFixed(1)}`, {
              permanent: true,
              direction: "top",
              className: "eq-label",
            });
          }
        },
      }).addTo(this.map);
    } catch {
      // Silently fail
    }
  }

  // ── Resize ────────────────────────────────────────────────────

  private setupResize(): void {
    const handle = this.container.querySelector(
      ".map-resize-handle",
    ) as HTMLElement;
    if (!handle) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isResizing) return;
      const delta = e.clientY - this.startY;
      const newHeight = Math.max(
        200,
        Math.min(window.innerHeight * 0.92, this.startHeight + delta),
      );
      this.container.style.height = `${newHeight}px`;
      this.map?.invalidateSize();
    };

    const onMouseUp = () => {
      this.isResizing = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      this.isResizing = true;
      this.startY = e.clientY;
      this.startHeight = this.container.offsetHeight;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  }

  resize(): void {
    this.map?.invalidateSize();
  }

  destroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
