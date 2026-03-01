/* ============================================================
   Heimdall — Core Types
   ============================================================ */

export interface Feed {
  name: string;
  url: string;
  tier?: number; // 1 = wire (most authoritative), 4 = aggregator
  type?: SourceType;
  category: string;
  lang?: string;
}

export type SourceType =
  | "wire"
  | "gov"
  | "intel"
  | "mainstream"
  | "market"
  | "tech"
  | "other";

export type ThreatLevel = "critical" | "high" | "medium" | "low" | "info";

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  source: string;
  sourceTier: number;
  pubDate: Date;
  category: string;
  description?: string;
}

export interface ClusteredEvent {
  id: string;
  headline: string;
  items: NewsItem[];
  sourceCount: number;
  threatLevel: ThreatLevel;
  latestDate: Date;
  categories: string[];
}

export interface GeoNewsItem extends NewsItem {
  lng: number;
  lat: number;
  locationName: string;
  threatLevel?: ThreatLevel;
}

export interface SignalCluster {
  id: string;
  lng: number;
  lat: number;
  events: GeoNewsItem[];
  count: number;
  topThreat: ThreatLevel;
}

export type ViewId = "geopolitics" | "finance" | "tech";

export interface ViewConfig {
  label: string;
  icon: string;
  feedCategories: string[];
  panelIds: string[];
}

export interface PanelOptions {
  id: string;
  title: string;
  showCount?: boolean;
  className?: string;
}
