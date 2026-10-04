# Market data

The public site shows DSE and CSE data in two places on the home page:

- **Ticker** along the bottom of the opening screen: indices, then every quote.
- **Market pulse**: indices, breadth (advanced / declined / unchanged), turnover,
  volume, trades, top 5 gainers and losers, and Xpert's market share.

Nothing is invented. Prices come only from the licensed feed; market share comes
only from figures entered in **Admin → Market data** (or written there by the feed).

## Modes (`.env`)

| `MARKET_DATA_MODE` | What visitors see |
| --- | --- |
| `none` (default) | No prices. Market-share figures entered in the admin are still shown. |
| `demo` | Generated prices on real DSE codes, labelled **"Demo data — not real prices"** everywhere. For development and design review only. Refused when `NODE_ENV`/`APP_ENV` is `production` unless `ALLOW_DEMO_MARKET_DATA=true`. |
| `exchange` | Reads DSE's and CSE's public pages at most once a minute. **DSE** (`dse.com.bd/markets`): last price, change and % change for every listed stock, so the ticker, top gainers/losers and advanced/declined counts are worked out from them. DSE's index values (DSEX, DS30, DSES), turnover and trades load through `dse.com.bd/api`, which DSE's robots.txt disallows, so they appear only with the licensed feed. **CSE** (`cse.com.bd/market/current_price` and the home page `cse.com.bd/`): every stock's price, the market status, the five indices (CASPI, CSE30, CSCX, CSI, CSE50) and the session's trades, volume and value. Before the session opens CSE shows the previous session's indices, which are used and the totals left out. If an exchange changes its page layout, that part is left out and *Test connection* in the admin says so. Remember to tick *Show market data on the website* in Admin → Market data. |
| `licensed` | The feed at `MARKET_DATA_API_URL`. |

Market data appears only after **Show market data on the website** is ticked in Admin → Market data.

If CSE's certificate chain cannot be verified by Node.js on your server, the CSE
board is skipped (DSE still shows). Fix it by giving Node the missing
intermediate certificate with `NODE_EXTRA_CA_CERTS=/path/to/chain.pem` — never
by turning certificate checks off.

```
MARKET_DATA_MODE=licensed
MARKET_DATA_API_URL=https://feed.example.com/xpert/snapshot
MARKET_DATA_API_KEY=…               # sent as "Authorization: Bearer …"
MARKET_DATA_API_KEY_HEADER=         # optional: send the raw key in this header instead, e.g. X-API-Key
```

The server calls the feed at most every 15 seconds (all visitors share one call)
and keeps showing the last good snapshot if the feed is briefly unavailable.
Browsers refresh from `/api/market` every 20 seconds while the page is visible.
The **display delay** set in the admin is shown to visitors ("Delayed 15 min").
The feed itself must apply any delay your licence requires.

## Feed format

`GET MARKET_DATA_API_URL` must return JSON in this shape. If your provider's
format differs, put a small adapter in front of it that returns this.

```json
{
  "asOf": "2026-09-30T08:45:00+06:00",
  "exchanges": [
    {
      "exchange": "DSE",
      "status": "OPEN",
      "indices": [
        { "name": "DSEX", "value": 5231.42, "change": 18.3, "changePct": 0.35 }
      ],
      "turnover": 6120000000,
      "volume": 190000000,
      "trades": 142000,
      "advancers": 210,
      "decliners": 120,
      "unchanged": 50,
      "quotes": [
        { "symbol": "GP", "ltp": 281.4, "change": 1.4, "changePct": 0.5, "volume": 350000 }
      ],
      "gainers": [],
      "losers": []
    }
  ]
}
```

| Field | Notes |
| --- | --- |
| `asOf` | ISO time with offset. |
| `exchange` | `DSE` or `CSE`; one or both. |
| `status` | Optional: `OPEN`, `CLOSED`, `PRE_OPEN`, `HALTED`. |
| `indices` | Up to 10. |
| `turnover` | BDT (shown in crore). |
| `quotes` | Up to 600; used by the ticker. |
| `gainers` / `losers` | Optional. When missing, the top 5 are worked out from `quotes`. |

A response that does not match is rejected (the reason is written to the server
log) and **Test connection** in the admin says so.

## Market share (DSE and CSE, every trading day)

The home page shows Xpert's share of each exchange's turnover side by side,
with the trading day it belongs to. A figure is Xpert turnover ÷ the
exchange's total turnover for that day.

**By hand** — Admin → Market data → *Xpert market share*: pick the day (today
by default), fill in Xpert's turnover for DSE, CSE or both, and the market
totals. For today, an empty CSE total is taken from CSE's live data (exchange
mode) or the licensed feed. DSE does not publish its total outside its data
feed, so enter it from DSE's daily report unless the licensed feed is on. The
page shows whether today's figure is saved for each exchange.

**Automatically** — Xpert's OMS or back office posts the day's figures after
the close (e.g. a 15:30 Dhaka scheduled job):

```bash
curl -X POST https://www.xpertfintech.com/api/market-share \
  -H "Authorization: Bearer $MARKET_SHARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"source":"Xpert OMS end-of-day",
       "figures":[{"exchange":"DSE","xpertTurnover":812345678.5,"marketTurnover":6123456789},
                  {"exchange":"CSE","xpertTurnover":12345678}]}'
```

- `tradeDate` (YYYY-MM-DD) is optional and defaults to today in Dhaka.
- `marketTurnover` may be left out for CSE (and for DSE with the licensed feed); it is then read from live data.
- Sending the same day again replaces it. Amounts are in taka.
- The endpoint is off until `MARKET_SHARE_API_TOKEN` (24+ random characters) is set in `.env`.
- Response: `200` when every figure was saved, `207` when some were refused (with the reason), `401` with a wrong token.
