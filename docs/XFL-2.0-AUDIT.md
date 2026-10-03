# XFL 2.0 — UX and content audit (3 Oct 2026)

Method: full code review of every public route, component and data loader in `feature/xfl2-patch-1`, plus server-rendered previews of new pages in Chromium (1440 and 390 px) with the site's compiled theme. The live site on XFL's machine was not viewed directly; re-check items marked *(verify live)*.

Scoring: **Critical** blocks trust or breaks a page · **High** visibly weakens the experience · **Medium** polish or consistency.

## Fixed in this round

| # | Severity | Finding | Fix |
|---|---|---|---|
| 1 | Critical | **No Team page.** The `TEAM` and `LEADERSHIP` people groups existed in the CMS but no page showed them. | New `/company/team` with photo cards and pop-up profiles, plus an empty state linking to Management and Board. The content seed adds a "Team" link after "Management" in the header and footer menus. |
| 2 | Critical | **Company story never shown.** About, mission and vision text were stored in Admin → Settings but rendered nowhere; the About page showed only a values list. | New `/company/about`: story, mission, vision, consortium strip, milestone timeline that draws in on scroll, links to Board / Management / Team, then the editor's CMS sections (values). |
| 3 | High | **Weak proof for a B2B buyer.** Ten live branded apps and the consortium size were buried or hidden. | Home "In the market" band: count-up figures from the database (members, products, apps, exchanges — no typed-in numbers), and a wall of the live branded apps, each linking to its public store listing. |
| 4 | High | **Pending eKYC shown as live** on the platform page's ecosystem map, the capability cards (home + platform) and the header's Platform menu. | Ecosystem map uses published products everywhere; eKYC card hidden until published; the content seed hides eKYC menu links and re-shows them when eKYC is published. Bento grid adjusts so six cards leave no gap. |
| 5 | High | **No milestones.** All events were drafts, so no timeline was possible. | Content seed publishes the two events with confirmed dates (CSE API agreement, 25 Nov 2024; EcoSoftBD acquisition, 12 May 2025) and fills empty summaries. DSE FIX certification stays draft until its date is confirmed. |
| 6 | Medium | About-page headline could overclaim ("built by"): the OMS core is supplied by a vendor and implemented and run by XFL. | Worded as "Market technology, shaped by the brokerages that use it". |

Earlier today: empty product pages, missing showcase, people pop-ups, logo wall, OMS preview, server/client boundary bug, CSS-module build error.

## Needs XFL content (not code)

1. **Logos** for 12 members + DSE/CSE (`npm run assets:import -- --list` for file names). Until then: monograms.
2. **Photos, titles and bios** for management; **names** for the 5 board placeholders; **team** profiles (Admin → People, group "Team" or "Leadership").
3. **The 2 missing consortium members** (12 in the database, 14 confirmed).
4. **Smart Stock and OST** descriptions; **eKYC** go-ahead.
5. **DSE FIX certification date**, to publish that milestone.
6. **Copy review:** the stored company text says "cutting-edge technology", a phrase the brief rules out. Suggested: "By combining deep industry expertise with proven market technology…". Edit in Admin → Settings.
7. **More product screens** (only OMS and DMS heroes so far). Real screens with client data hidden.

## Recommended next builds (by impact)

1. **Multi-step demo request** (organisation → role → interest → products → contact → time), the brief's main conversion path. The current form is one page.
2. **Command search (Ctrl/⌘+K)** over products, people, events and pages.
3. **Market pages** `/markets/dse`, `/markets/cse` with movers and sector views, from the licensed feed already wired in.
4. **Dedicated mobile ecosystem** (vertical flow) instead of the scaled desktop map *(verify live at 375 px)*.
5. **Insights / news** and **careers** pages (the database models exist).
6. **Per-page Open Graph images** for sharing (product name on the brand background).
7. **Lighthouse pass** on home, a product page and About, mobile profile *(verify live)*.
