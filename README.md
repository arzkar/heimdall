# Heimdall

**Global Intelligence Dashboard**

Heimdall is a real-time, browser-based geopolitical intelligence dashboard. It aggregates global news, live market indices, and recent seismic activity, visualizing strategic intelligence on an interactive, high-performance world map.

![Heimdall Screenshot](/public/favicon.svg) _(Screenshot placeholder)_

## Features

- **Strategic Threat Mapping**: Parses live global news and precisely plots incidents on an interactive map. Features granular strategic location geocoding, prioritizing critical infrastructure (airports, military bases) and capitals over generic country matches.
- **Real-Time Signal Clusters**: Visualizes aggregated intelligence signals as pulsating nodes. Clicking a cluster opens detailed, highly-stylized Leaflet popups containing threat assessments and source mentions.
- **Live News Ticker**: A continuously scrolling, customizable feed of breaking alerts and headlines at the bottom of your screen.
- **Seismic Activity**: Overlays live global earthquake data (M4.5+), providing magnitude, depth, and location markers.
- **Financial Markets Pulse**: Tracks major global indices (S&P 500, Dow Jones, FTSE, Nikkei, VIX) in real-time.

## Tech Stack

Heimdall is built for pure performance and low overhead, avoiding virtual DOM abstractions in favor of direct DOM manipulation.

- **Core**: Vanilla TypeScript / DOM API
- **Map Engine**: [Leaflet](https://leafletjs.com/) with CARTO Dark Matter vector tiles.
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Data Parsing**: `fast-xml-parser` for real-time RSS ingestion.
- **Compute**: Custom geographic clustering, signal classification, and coordinate extraction logic entirely on the client-side.
- **Backend / Proxy**: Vercel Serverless Functions (`api/rss-proxy.js`) to handle CORS for heterogeneous global feeds.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm

### Installation

1. **Clone the repository:**

   ```bash
   git clone git@github.com:arzkar/heimdall.git
   cd heimdall
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Copy `.env.example` to `.env` if required (mostly for development if you are running your own RSS proxy).

4. **Run the Development Server:**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`.

### Production Build

To build the project for production:

```bash
npm run build
```

This will run TypeScript verification and generate a highly optimized bundle in the `dist` directory. You can preview it with:

```bash
npm run preview
```

## Contributing

Contributions are welcome! If you're looking to add new data source integrations or improve the clustering algorithms, please open an issue first to discuss the proposed changes.

### Adding New Feeds

News feeds are configured in `src/config/feeds.ts`. To add a new source:

1. Ensure the feed is valid RSS/Atom.
2. Add the URL and internal name to the configuration lists.
3. The built-in Vercel proxy (`api/rss-proxy.js`) will seamlessly handle CORS routing in production.

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See the [LICENSE](LICENSE) file for details.
