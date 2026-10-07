# XFL 2.0 — Patch 1 integration guide

This patch contains the parts of the backlog that could be built and tested without the running app. Every file sits at the path it should have in the repo. Nothing here replaces existing code.

## What's in this patch

| File | Purpose | Tested |
|---|---|---|
| `prisma/xfl2.fragment.prisma` | Ecosystem nodes, edges, flows and steps (with translations), `AuditLog`, and `Person.isPlaceholder` | Not run (no database here). Check the enum names before merging. |
| `src/content/xfl2/ecosystem.ts` | Ecosystem seed data with only confirmed items published. eKYC, OST and CDBL are drafts. Includes `getPublishedGraph()` and `neighbours()`. | Yes: drafts never leak, editor notes are stripped, no dangling edges, and the tour skips "Verify" while eKYC is a draft. |
| `src/content/xfl2/workflows.ts` | OMS, RMS, DMS and BO Account Opening workflow content in English and Bangla, plus `resolveWorkflow()` | Yes: the eKYC step is hidden now and appears once eKYC is published. |
| `src/content/xfl2/leadership-placeholders.ts` | 9 placeholder roles (board and management) in English and Bangla | Data only |
| `public/placeholders/person.svg` | Neutral silhouette for placeholder photos | Visual |
| `src/components/diagrams/WorkflowDiagram.tsx` + `.module.css` | Generic animated workflow: auto-advance, pauses offscreen and on hover, keyboard, reduced motion, horizontal or vertical | Yes, Chromium at 1440, 1280 and 390, including reduced motion |
| `src/components/products/oms-preview/simulation.ts` | Pure OMS simulation engine (fictional instruments, risk checks, fills) | Yes: unit tests, including determinism and price staying in band over 500 ticks |
| `src/components/products/oms-preview/OmsPreview.tsx` + `.module.css` | Interactive OMS preview with permanent "simulated" banner | Yes, Chromium at 3 viewports: rejection, fill, positions, tab keyboard, pause under reduced motion. No console errors, no page overflow. |

**Not verified:** `tsc --strict` against your `tsconfig.json`. React type definitions weren't available offline. The code was bundled with esbuild and run in Chromium, but run `npm run typecheck` and `npm run lint` after copying.

## Integration steps (in Claude Code or by hand)

1. **Copy** the files into the repo at the same paths.
2. **Schema:** merge the fragment into `prisma/schema.prisma` and match `ContentStatus`, `Locale` and `EntityType` to your existing enums. Add `isPlaceholder` to `Person`. Then run `npm run db:migrate -- --name xfl2_ecosystem_audit` and `npm run db:erd`.
3. **Seed:** extend `prisma/seed.ts` to upsert, by `key`:
   - ecosystem nodes, edges and flows from `ecosystem.ts`
   - workflows from `workflows.ts`, stored as `OfferingItem` rows with a WORKFLOW kind, or a new table
   - placeholder people with `isPlaceholder: true`, the photo set to `person.svg` (via Media), and `PersonRole` entries
   - `DRAFT` offerings for `ost` and `ekyc`, and published offerings for `oms`, `rms`, `dms`, `bo-account-opening` and `smart-stock` where missing
   
   Seeding must stay idempotent.
4. **Theme tokens:** the components read `--xfl-surface`, `--xfl-surface-2`, `--xfl-border`, `--xfl-text`, `--xfl-text-muted`, `--xfl-accent`, `--xfl-signal`, `--xfl-up` and `--xfl-down`, with fallbacks. Map these to your existing design tokens in the global CSS, including light mode.
5. **Place the components:**
   - OMS product page: `<WorkflowDiagram>` (resolved server-side with `resolveWorkflow`) and `<OmsPreview labels={…}>`. Load the preview with `next/dynamic` so its JavaScript stays off other pages.
   - RMS, DMS and BO pages: `<WorkflowDiagram>`.
   - Register both as page-builder block types in `src/content/blocks` so admins can place them.
6. **Ecosystem animation:** make the existing component read `getPublishedGraph()` output (backlog 1.2), then add hover, focus and playback (1.3–1.4). This is the main remaining work and needs the existing component code.
7. **Bangla labels for the OMS preview:** pass translated `labels`. English defaults live in `DEFAULT_LABELS`.
8. **CSP:** the components use no external resources or inline scripts, so no CSP change should be needed.
9. **Run** `npm run typecheck`, `npm run lint`, `npm run test:e2e` and `npm run test:a11y`, and add Playwright journeys for the OMS page.

## Still to do after this patch

See `docs/XFL-2.0-BACKLOG.md`. Items marked "Patch 1" are delivered as components or data and need integration. Everything else needs the running repo.
