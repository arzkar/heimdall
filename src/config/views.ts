/* ============================================================
   View Definitions
   ============================================================ */

import type { ViewId, ViewConfig } from "@/types";

export const VIEWS: Record<ViewId, ViewConfig> = {
  geopolitics: {
    label: "Geopolitics",
    icon: "🌍",
    feedCategories: [
      "politics",
      "middleeast",
      "asia",
      "africa",
      "europe",
      "defense",
      "gov",
    ],
    panelIds: ["liveNews", "earthquake", "market"],
  },
  finance: {
    label: "Finance",
    icon: "📈",
    feedCategories: ["finance"],
    panelIds: ["market", "liveNews"],
  },
  tech: {
    label: "Tech",
    icon: "💻",
    feedCategories: ["tech", "ai", "startups"],
    panelIds: ["liveNews"],
  },
};

export const DEFAULT_VIEW: ViewId = "geopolitics";
export const VIEW_IDS: ViewId[] = ["geopolitics", "finance", "tech"];
