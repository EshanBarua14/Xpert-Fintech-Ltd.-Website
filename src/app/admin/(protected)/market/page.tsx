import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { DEFAULT_REFRESH, dhakaToday, liveMarketTurnover, marketMode, readSessions, REFRESH_KEY, SESSIONS_KEY } from "@/lib/market/data";
import { ConfirmButton } from "@/components/admin/AdminUi";
import { RefreshIntervalForm, TradingHoursForm, HeadlineShareForm, MarketGoalForm, MarketShareForm, MarketSourceForm, TestFeedButton } from "@/components/admin/MarketForms";
import { getHeadlineShare, readGoal } from "@/lib/content/leaders";
import { clearMarketGoal, deleteMarketShare } from "./actions";

const MODE_TEXT = {
  licensed: "Licensed feed (MARKET_DATA_MODE=licensed)",
  exchange: "DSE and CSE public pages (MARKET_DATA_MODE=exchange): every listed stock's price, top gainers and losers, advanced/declined; CSE's five indices, trades, volume and value. DSE's indices and turnover need the licensed feed. Shown as soon as this mode is set (no tick needed).",
  demo: "Demo data — generated prices, clearly labelled on the site. Never use on the live website.",
  none: "Off (MARKET_DATA_MODE=none). Only market-share figures entered below are shown.",
} as const;

export default async function MarketAdminPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  await requireAdmin();
  const { edit } = await searchParams;
  const headline = await getHeadlineShare();
  const sessions = readSessions((await db.siteSetting.findUnique({ where: { key: SESSIONS_KEY } }))?.value);
  const refreshRow = await db.siteSetting.findUnique({ where: { key: REFRESH_KEY } });
  const refreshSeconds = Number((refreshRow?.value as { seconds?: unknown } | null)?.seconds) || DEFAULT_REFRESH;
  const [source, shares, goalRow] = await Promise.all([
    db.marketDataSource.findFirst({ orderBy: { createdAt: "asc" } }),
    db.marketShare.findMany({ orderBy: [{ tradeDate: "desc" }, { exchange: "asc" }], take: 60 }),
    db.siteSetting.findUnique({ where: { key: "market.goal" } }),
  ]);
  const goal = goalRow ? readGoal(goalRow.value) : null;
  const mode = marketMode();
  const today = dhakaToday();
  const [liveDse, liveCse] = await Promise.all([liveMarketTurnover("DSE").catch(() => null), liveMarketTurnover("CSE").catch(() => null)]);
  const latest = (ex: "DSE" | "CSE") => shares.find((s) => s.exchange === ex)?.tradeDate.toISOString().slice(0, 10) ?? null;
  const apiOn = (process.env.MARKET_SHARE_API_TOKEN ?? "").length >= 24;
  // "Edit" on a row loads that day's DSE and CSE figures into the form.
  const editDay = edit && /^\d{4}-\d{2}-\d{2}$/.test(edit) ? edit : null;
  const editRows = editDay
    ? await db.marketShare.findMany({ where: { tradeDate: new Date(`${editDay}T00:00:00.000Z`) } })
    : [];
  const num = (v: unknown) => (v === null || v === undefined ? "" : String(Number(v)));
  const initial = editDay
    ? {
        tradeDate: editDay,
        sourceNote: editRows[0]?.sourceNote ?? "",
        dseXpert: num(editRows.find((r) => r.exchange === "DSE")?.xpertTurnover),
        dseMarket: num(editRows.find((r) => r.exchange === "DSE")?.marketTurnover),
        cseXpert: num(editRows.find((r) => r.exchange === "CSE")?.xpertTurnover),
        cseMarket: num(editRows.find((r) => r.exchange === "CSE")?.marketTurnover),
      }
    : undefined;
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
          <span className={mode === "demo" ? "font-semibold text-gold" : "font-semibold"}>{MODE_TEXT[mode]}</span>
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

      <section id="share-form" className="flex scroll-mt-24 flex-col gap-4 rounded-card border border-fg/10 p-6">
        <h2 className="font-display text-xl font-semibold">Xpert market share</h2>
        <p className="text-sm text-text-secondary">
          Enter the day&rsquo;s turnover traded through Xpert and the exchange&rsquo;s total turnover. The website shows the latest figure for each exchange with its source. Saving the
          same day and exchange again replaces it.
        </p>
        <ul className="flex flex-wrap gap-3 text-sm">
          {(["DSE", "CSE"] as const).map((ex) => {
            const d = latest(ex);
            return (
              <li key={ex} className={"rounded-full border px-3 py-1 " + (d === today ? "border-market-up/40 text-market-up" : "border-gold/40 text-gold")}>
                {ex}: {d ? (d === today ? "today's figure saved" : `latest is ${d}`) : "no figure yet"}
              </li>
            );
          })}
        </ul>
        {initial && (
          <p className="rounded-control border border-brand-sky/30 bg-brand-sky/10 px-4 py-3 text-sm">
            Editing {initial.tradeDate}. Change the figures and save; <a href="/admin/market#share-form" className="text-brand-sky underline">cancel</a>.
          </p>
        )}
        <MarketShareForm key={editDay ?? "new"} today={today} live={{ DSE: liveDse, CSE: liveCse }} initial={initial} />
        <p className="text-xs text-text-secondary">
          Automatic daily update: {apiOn ? "on" : "off"}. Xpert&rsquo;s OMS or back office can send the day&rsquo;s figures to <code>POST /api/market-share</code> with the
          token in <code>MARKET_SHARE_API_TOKEN</code> (see docs/MARKET-DATA.md); CSE&rsquo;s total is filled in automatically.
        </p>
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
                  <td className="flex items-center justify-end gap-4 px-4 py-3">
                    <a href={`/admin/market?edit=${s.tradeDate.toISOString().slice(0, 10)}#share-form`} className="text-xs text-brand-sky hover:underline">
                      Edit
                    </a>
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

      <section id="refresh" className="flex scroll-mt-24 flex-col gap-4 rounded-card border border-fg/10 p-6">
        <h2 className="font-display text-xl font-semibold">Refresh interval</h2>
        <p className="text-sm text-text-secondary">
          How often the ticker, hero indices, market cards and price boards update. The server reads DSE and CSE (or the licensed feed) at most once per
          interval, however many visitors are on the site; browsers ask for new prices at the same pace while the page is open.
        </p>
        <RefreshIntervalForm seconds={refreshSeconds} />
      </section>

      <section id="overall-share" className="flex scroll-mt-24 flex-col gap-4 rounded-card border border-fg/10 p-6">
        <h2 className="font-display text-xl font-semibold">Market share figures</h2>
        <p className="text-sm text-text-secondary">
          Xpert&rsquo;s share of DSE and CSE turnover combined, as XFL states it. When set, the home page leads with this figure (and its goal bar
          uses it) instead of the one worked out from the daily entries above. {headline ? `Now: ${headline.pct}%${headline.asOf ? ` as of ${headline.asOf}` : ""}.` : "Not set."}
        </p>
        <HeadlineShareForm
          key={headline ? `${headline.pct}-${headline.asOf}-${headline.dse}-${headline.cse}` : "none"}
          pct={headline ? String(headline.pct) : ""}
          asOf={headline?.asOf ?? ""}
          dse={headline?.dse !== undefined ? String(headline.dse) : ""}
          cse={headline?.cse !== undefined ? String(headline.cse) : ""}
        />
      </section>

      <section id="trading-hours" className="flex scroll-mt-24 flex-col gap-4 rounded-card border border-fg/10 p-6">
        <h2 className="font-display text-xl font-semibold">Trading hours</h2>
        <p className="text-sm text-text-secondary">
          The status shown everywhere (pre-opening amber, open green, post-closing violet, closed red) follows these times in Dhaka, minute by minute. Update them when an exchange
          announces new hours (e.g. in Ramadan) and add its holidays. A halt or an unscheduled closure reported on the exchange&rsquo;s own page still wins.
        </p>
        <TradingHoursForm values={sessions} />
      </section>

      <section id="goal" className="flex scroll-mt-24 flex-col gap-4 rounded-card border border-fg/10 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">Market-share goal</h2>
          {goal && (
            <form action={clearMarketGoal}>
              <ConfirmButton message="Remove the goal from the website?" className="text-xs text-text-secondary hover:text-market-down">
                Remove goal
              </ConfirmButton>
            </form>
          )}
        </div>
        <p className="text-sm text-text-secondary">
          Shown on the home page next to the latest market share, as a progress bar towards the target. {goal ? `Now: ${goal.targetPct}% by ${goal.year}.` : "No goal set: the home page shows market share without a target."}
        </p>
        <MarketGoalForm
          key={goal ? `${goal.targetPct}-${goal.year}` : "none"}
          values={{ targetPct: goal ? String(goal.targetPct) : "", year: goal ? String(goal.year) : "", goalEn: goal?.en ?? "", goalBn: goal?.bn ?? "" }}
        />
      </section>
    </div>
  );
}
