/* ============================================================
   Constants & Shared Configuration
   ============================================================ */

// MapTiler free key for dark vector tiles (rate-limited, suitable for dev)
export const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || "";

// Free vector tile styles that don't need a key
export const MAP_STYLE_DARK = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`
  : "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export const MAP_STYLE_LIGHT = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/dataviz-light/style.json?key=${MAPTILER_KEY}`
  : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

// Refresh intervals
export const RSS_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 min
export const USGS_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 min
export const MARKET_REFRESH_INTERVAL = 2 * 60 * 1000; // 2 min
