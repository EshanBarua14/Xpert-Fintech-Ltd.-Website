import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clearMarketInfoCache, dhakaToday } from "@/lib/market/data";
import { saveShares } from "@/lib/market/share";

/**
 * POST /api/market-share — lets Xpert's own systems (OMS or back office)
 * publish the day's market share automatically after the close.
 *
 *   Authorization: Bearer <MARKET_SHARE_API_TOKEN>
 *   { "tradeDate": "2026-10-04",            // optional, defaults to today (Dhaka)
 *     "source": "Xpert OMS end-of-day",      // optional, shown on the website
 *     "figures": [
 *       { "exchange": "DSE", "xpertTurnover": 812345678.5, "marketTurnover": 6123456789 },
 *       { "exchange": "CSE", "xpertTurnover": 12345678 }   // market total read from CSE when omitted
 *     ] }
 *
 * Amounts are in taka. Sending the same day again replaces it.
 */
const bodySchema = z.object({
  tradeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  source: z.string().trim().max(200).optional(),
  figures: z
    .array(
      z.object({
        exchange: z.enum(["DSE", "CSE"]),
        xpertTurnover: z.number().nonnegative().max(1e14),
        marketTurnover: z.number().positive().max(1e14).optional(),
      }),
    )
    .min(1)
    .max(2),
});

function authorised(request: Request): boolean {
  const token = process.env.MARKET_SHARE_API_TOKEN ?? "";
  if (token.length < 24) return false; // switched off until a strong token is set
  const given = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorised(request)) return Response.json({ error: "Unauthorised" }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid body", issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) }, { status: 400 });
  const v = parsed.data;
  const tradeDate = v.tradeDate ?? dhakaToday();
  if (tradeDate > dhakaToday()) return Response.json({ error: "tradeDate is in the future" }, { status: 400 });
  const results = await saveShares(tradeDate, v.figures, v.source ?? null, null);
  if (results.some((r) => r.ok)) {
    clearMarketInfoCache();
    revalidatePath("/", "layout");
  }
  return Response.json({ tradeDate, results }, { status: results.every((r) => r.ok) ? 200 : 207 });
}
