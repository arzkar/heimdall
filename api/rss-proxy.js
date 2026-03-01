/* ============================================================
   RSS Proxy — Vercel Edge Function
   Fetches upstream RSS/Atom feeds, returns raw XML.
   ============================================================ */

// Domain allowlist to prevent abuse
const ALLOWED_DOMAINS = [
  "feeds.bbci.co.uk",
  "news.google.com",
  "www.theguardian.com",
  "feeds.npr.org",
  "www.aljazeera.com",
  "thediplomat.com",
  "www.france24.com",
  "rss.dw.com",
  "news.un.org",
  "www.who.int",
  "www.crisisgroup.org",
  "foreignpolicy.com",
  "www.cnbc.com",
  "www.ft.com",
  "hnrss.org",
  "feeds.arstechnica.com",
  "www.theverge.com",
  "techcrunch.com",
  "www.technologyreview.com",
  "venturebeat.com",
  "news.crunchbase.com",
  "feeds.feedburner.com",
  "api.axios.com",
  "www.spiegel.de",
  "www.lemonde.fr",
  "www.euronews.com",
  "export.arxiv.org",
  "www.iaea.org",
  "www.federalreserve.gov",
  "www.sec.gov",
  "finance.yahoo.com",
  "www.atlanticcouncil.org",
  "www.foreignaffairs.com",
  "warontherocks.com",
  "www.aei.org",
  "responsiblestatecraft.org",
  "www.fpri.org",
  "jamestown.org",
];

function isDomainAllowed(urlStr) {
  try {
    const parsed = new URL(urlStr);
    return ALLOWED_DOMAINS.some(
      (d) => parsed.hostname === d || parsed.hostname.endsWith("." + d),
    );
  } catch {
    return false;
  }
}

export const config = { runtime: "edge" };

export default async function handler(request) {
  const url = new URL(request.url);
  const feedUrl = url.searchParams.get("url");

  if (!feedUrl) {
    return new Response(JSON.stringify({ error: "Missing url parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!isDomainAllowed(feedUrl)) {
    return new Response(JSON.stringify({ error: "Domain not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const upstream = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Heimdall/1.0 (RSS Aggregator)",
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream returned ${upstream.status}` }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const body = await upstream.text();

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") || "application/xml",
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Proxy fetch failed", detail: String(err) }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
