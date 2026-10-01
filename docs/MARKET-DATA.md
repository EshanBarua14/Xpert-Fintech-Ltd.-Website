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
| `exchange` | Reads the public price boards of DSE (`dse.com.bd/markets`) and CSE (`cse.com.bd/market/current_price`) at most once a minute: last price, change and % change for every listed stock, plus top movers and advanced/declined counts worked out from them. Index values (DSEX, CASPI…) are not on those pages, so they appear only with the licensed feed. DSE's robots.txt allows `/markets` and disallows `/api`; only the page is read. If an exchange changes its page layout, that exchange is left out and *Test connection* in the admin says so. |
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

## Market share

Admin → Market data → **Xpert market share**: for each trading day and exchange,
enter the turnover traded through Xpert and the exchange's total turnover (BDT),
plus the source (e.g. "DSE daily broker turnover report"). The site shows the
latest figure for each exchange as a percentage, with the date and source.
