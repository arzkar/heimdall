/* ============================================================
   PizzINT Proxy — Vercel Edge Function
   Proxies pizzint.watch dashboard data to avoid CORS.
   ============================================================ */

export const config = { runtime: "edge" };

export default async function handler() {
  try {
    const upstream = await fetch(
      `https://www.pizzint.watch/api/dashboard-data?_t=${Date.now()}`,
      {
        headers: { "User-Agent": "Heimdall/1.0" },
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: `PizzINT returned ${upstream.status}` }),
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
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=120, stale-while-revalidate=300",
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
