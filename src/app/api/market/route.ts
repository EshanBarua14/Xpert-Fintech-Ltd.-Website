import { getMarketPayload } from "@/lib/market/data";

export const dynamic = "force-dynamic";

/** Market snapshot for the public widgets, polled by visitors' browsers. */
export async function GET() {
  const payload = await getMarketPayload();
  return Response.json(payload, {
    headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20" },
  });
}
