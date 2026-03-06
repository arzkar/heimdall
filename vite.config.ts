import { defineConfig, type Plugin } from "vite";
import { resolve } from "path";

/**
 * Dev-only plugin that intercepts /api/* requests and proxies them
 * via Node.js fetch, bypassing browser CORS restrictions.
 * In production, Vercel Edge Functions handle these.
 */
function devProxyPlugin(): Plugin {
  return {
    name: "dev-proxy",
    configureServer(server) {
      // RSS proxy
      server.middlewares.use("/api/rss-proxy", async (req, res) => {
        const url = new URL(req.url || "/", "http://localhost");
        const feedUrl = url.searchParams.get("url");

        if (!feedUrl) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Missing url parameter" }));
          return;
        }

        try {
          const upstream = await fetch(feedUrl, {
            headers: {
              "User-Agent": "Heimdall/1.0 (RSS Aggregator)",
              Accept:
                "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
            },
            signal: AbortSignal.timeout(10_000),
          });

          if (!upstream.ok) {
            res.statusCode = 502;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({ error: `Upstream returned ${upstream.status}` }),
            );
            return;
          }

          const body = await upstream.text();
          res.statusCode = 200;
          res.setHeader(
            "Content-Type",
            upstream.headers.get("content-type") || "application/xml",
          );
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.end(body);
        } catch (err) {
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: String(err) }));
        }
      });

      // Yahoo Finance proxy for market data
      server.middlewares.use("/api/market", async (req, res) => {
        const url = new URL(req.url || "/", "http://localhost");
        const symbol = url.searchParams.get("symbol");

        if (!symbol) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Missing symbol parameter" }));
          return;
        }

        try {
          const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
          const upstream = await fetch(yahooUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            },
            signal: AbortSignal.timeout(8_000),
          });

          if (!upstream.ok) {
            res.statusCode = upstream.status;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({ error: `Yahoo returned ${upstream.status}` }),
            );
            return;
          }

          const body = await upstream.text();
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Cache-Control", "public, max-age=120");
          res.end(body);
        } catch (err) {
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: String(err) }));
        }
      });

      // PizzINT proxy for Pentagon Pizza Index
      server.middlewares.use("/api/pizzint", async (_req, res) => {
        try {
          const upstream = await fetch(
            `https://www.pizzint.watch/api/dashboard-data?_t=${Date.now()}`,
            {
              headers: { "User-Agent": "Heimdall/1.0" },
              signal: AbortSignal.timeout(10_000),
            },
          );

          if (!upstream.ok) {
            res.statusCode = upstream.status;
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({ error: `PizzINT returned ${upstream.status}` }),
            );
            return;
          }

          const body = await upstream.text();
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader("Cache-Control", "public, max-age=120");
          res.end(body);
        } catch (err) {
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [devProxyPlugin()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    target: "esnext",
    sourcemap: true,
  },
  esbuild: {
    target: "esnext",
  },
  server: {
    port: 5173,
    open: false,
  },
});
