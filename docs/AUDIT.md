# Accessibility and speed audit — 1 October 2026

Pages were rendered in a headless browser at 1440, 768 and 360 px wide, in
English and Bangla, dark and light mode, and checked with scripted scans
(text contrast, names of links/buttons/fields, image alt text, heading order,
duplicate IDs, landmarks, horizontal overflow) plus a code review. The axe scan
in `e2e/a11y.spec.ts` repeats these checks on every run.

## Accessibility (target: WCAG 2.2 AA)

| Check | Result |
| --- | --- |
| Text contrast, dark mode | All text ≥ 4.5:1 (large text ≥ 3:1) |
| Text contrast, light mode | **Fixed:** price gains in green were 4.4:1 → darkened to 6.4:1. **Fixed:** white text on the primary button's light end was 2.9:1 → gradient darkened (≥ 5.5:1) |
| Links, buttons, form fields | All have accessible names / labels |
| Images | All have alt text (decorative graphics are hidden from screen readers) |
| Headings | One `h1` per page, no skipped levels |
| Landmarks | Header, main, navigation and footer on every page; skip link to content |
| Keyboard | Visible focus ring everywhere; menus open with Enter and close with Escape; mobile menu moves focus inside |
| Motion | Respects "reduce motion": no scroll reveals, no background animation, no ticker scrolling, diagram stops cycling |
| Colour not the only signal | Price moves use ▲/▼ as well as green/red |
| Language | `lang="en"` / `lang="bn"` set on every page; language switch keeps the page |
| Phones | No horizontal scrolling at 360 px in English or Bangla |
| Forms | Errors are written next to each field, linked to it, and focus moves to the first problem |

## Speed

| Finding | Fix |
| --- | --- |
| Three market widgets each polled `/api/market` | **Fixed:** one shared poller (1 request every 20 s per open tab, only while visible) |
| The enquiry form shipped the validation library to the browser for one list | **Fixed:** constants moved to a small file; zod stays on the server |
| With real data the ticker could hold ~1,600 elements | **Fixed:** shows the 180 biggest movers per exchange |
| Background ran at 30 fps on every device | **Fixed:** 15 fps and fewer columns on phones; pauses in hidden tabs; one still frame with reduced motion |
| Exchange boards read on every visit would be slow and impolite | Server reads each board at most once a minute and shares the result |
| Fonts | Self-hosted by Next.js (no third-party requests), `font-display: swap`, unused bold weight removed |
| Images | Served as AVIF/WebP at the size needed (`next/image`) |
| Pages | Cached and refreshed every 5 minutes (market widgets refresh themselves) |

## Security headers (in `next.config.ts`)

Content-Security-Policy (site-only scripts, styles, images and fonts; only
YouTube/Vimeo/Turnstile frames; no plugins; `frame-ancestors 'none'`;
`form-action 'self'`), HSTS with preload (production), `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Cross-Origin-Opener-Policy`,
`Cross-Origin-Resource-Policy`, and a strict `Permissions-Policy`.

## Still to check on the real server

- Lighthouse on the deployed site (needs the real fonts, network and server).
- The axe scan (`npm run test:a11y`) against the live content once products,
  people and events are published.
- A screen-reader pass (NVDA on Windows, VoiceOver on iPhone) of the home page,
  the demo form and the admin sign-in.
