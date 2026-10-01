import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { marketMode } from "@/lib/market/data";
import { ConfirmButton } from "@/components/admin/AdminUi";
import { MarketShareForm, MarketSourceForm, TestFeedButton } from "@/components/admin/MarketForms";
import { deleteMarketShare } from "./actions";

const MODE_TEXT = {
  licensed: "Licensed feed (MARKET_DATA_MODE=licensed)",
  exchange: "DSE and CSE price boards (MARKET_DATA_MODE=exchange): last prices, changes, top movers and breadth for every listed stock. Index values need the licensed feed.",
  demo: "Demo data — generated prices, clearly labelled on the site. Never use on the live website.",
  none: "Off (MARKET_DATA_MODE=none). Only market-share figures entered below are shown.",
} as const;

export default async function MarketAdminPage() {
  await requireAdmin();
  const [source, shares] = await Promise.all([
    db.marketDataSource.findFirst({ orderBy: { createdAt: "asc" } }),
    db.marketShare.findMany({ orderBy: [{ tradeDate: "desc" }, { exchange: "asc" }], take: 60 }),
  ]);
  const mode = marketMode();
  const today = new Date(Date.now() + 6 * 3600 * 1000).toISOString().slice(0, 10);
  const bdt = (v: unknown) => `৳${(Number(v) / 1e7).toLocaleString("en-US", { maximumFractionDigits: 2 })} cr`;

  return (
    <div className="flex max-w-5xl flex-col gap-10">
      <div>
        <h1 className="font-display text-3xl font-semibold">Market data</h1>
        <p className="mt-1 text-sm text-text-secondary">
          DSE and CSE prices, indices and top movers come from the licensed feed. Xpert&rsquo;s market share comes from the figures entered below.
        </p>
      </div>

      <section className="flex flex-col gap-4 rounded-card border border-fg/10 p-6">
        <h2 className="font-display text-xl font-semibold">Feed</h2>
        <p className="text-sm">
          <span className="text-text-secondary">Current mode: </span>
          <span className={mode === "demo" ? "font-semibold text-amber-300" : "font-semibold"}>{MODE_TEXT[mode]}</span>
        </p>
        <p className="text-xs text-text-secondary">
          The mode, feed address and key are set in the server&rsquo;s <code>.env</code> (MARKET_DATA_MODE, MARKET_DATA_API_URL, MARKET_DATA_API_KEY) so secrets never live in the
          database. See docs/MARKET-DATA.md for the format the feed must return.
        </p>
        <MarketSourceForm
          values={{
            providerName: source?.providerName ?? "",
            licenceReference: source?.licenceReference ?? "",
            licenceExpiresAt: source?.licenceExpiresAt ? source.licenceExpiresAt.toISOString().slice(0, 10) : "",
            displayDelayMinutes: source?.displayDelayMinutes ?? 0,
            isActive: source?.isActive ?? false,
          }}
        />
        {(mode === "licensed" || mode === "exchange") && (
          <div className="border-t border-fg/10 pt-4">
            <TestFeedButton />
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-card border border-fg/10 p-6">
        <h2 className="font-display text-xl font-semibold">Xpert market share</h2>
        <p className="text-sm text-text-secondary">
          Enter the day&rsquo;s turnover traded through Xpert and the exchange&rsquo;s total turnover. The website shows the latest figure for each exchange with its source. Saving the
          same day and exchange again replaces it.
        </p>
        <MarketShareForm today={today} />
        <div className="overflow-x-auto rounded-card border border-fg/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-fg/10 text-xs tracking-wide text-text-secondary uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Day</th>
                <th className="px-4 py-3 font-medium">Exchange</th>
                <th className="px-4 py-3 font-medium">Xpert</th>
                <th className="px-4 py-3 font-medium">Market</th>
                <th className="px-4 py-3 font-medium">Share</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-fg/10">
              {shares.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-text-secondary">
                    No figures yet.
                  </td>
                </tr>
              )}
              {shares.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-mono">{s.tradeDate.toISOString().slice(0, 10)}</td>
                  <td className="px-4 py-3">{s.exchange}</td>
                  <td className="px-4 py-3 font-mono">{bdt(s.xpertTurnover)}</td>
                  <td className="px-4 py-3 font-mono">{bdt(s.marketTurnover)}</td>
                  <td className="px-4 py-3 font-mono font-semibold">{((Number(s.xpertTurnover) / Number(s.marketTurnover)) * 100).toFixed(2)}%</td>
                  <td className="px-4 py-3 text-text-secondary">{s.sourceNote ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteMarketShare}>
                      <input type="hidden" name="id" value={s.id} />
                      <ConfirmButton message="Delete this figure?" className="text-xs text-text-secondary hover:text-market-down">
                        Delete
                      </ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
