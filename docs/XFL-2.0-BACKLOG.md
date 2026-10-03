# XFL 2.0 — Remaining Work Package

Place this file at `docs/XFL-2.0-BACKLOG.md`. It lists everything still to build to bring XPERT NEXUS up to the "XFL 2.0 Digital Flagship" brief, in priority order. Each item has acceptance criteria.

Source of truth for current state: `README.md` (phase status) and `docs/ERD.md`. Items marked **(verify)** were inferred from the README and schema without reading the component code. Check what exists before building any of them.

---

## Kickoff prompt for Claude Code

> Read `README.md`, `docs/ERD.md`, `docs/AUDIT.md`, `docs/MARKET-DATA.md` and this file. Then inspect `src/components/motion`, `src/components/diagrams`, `src/content/blocks` and the home page to see how the existing ecosystem animation, globe hero, order-flow story and animated background work. Before writing code, update the **(verify)** items in this file: mark each as built, partly built or missing. Then work through the sections in order. After each item: run `npm run typecheck`, `npm run lint` and `npm run test:e2e`, open the affected pages at 1440px and 390px, check that reduced motion works, and tick the item. Follow the Ground rules below. Ask me before changing the stack, adding dependencies over ~30 kB gzipped, or deleting existing components.

---

## Ground rules (apply to every item)

1. **Preserve, don't replace.** Keep the stack: Next.js App Router, Prisma, Tailwind v4, no animation library. Extend the existing ecosystem animation; do not rewrite it into a new one.
2. **No fabricated content.** Products, clients, metrics, certifications, testimonials and market data come only from the CMS with the existing evidence fields (`sourceUrl`, `hasApproval`, `logoPermission`, licensed feed). Use empty states, never placeholders that look real.
3. **CMS-first.** All new copy is stored in `*Translation` tables (en and bn). Do not hard-code text in components.
4. **Motion rules.** Every animation respects `prefers-reduced-motion`, pauses when offscreen (IntersectionObserver), and runs on `requestAnimationFrame`. Mobile gets its own composition, not a shrunk desktop.
5. **Accessibility.** WCAG 2.2 AA. Every interactive SVG node can be reached with the keyboard and has an accessible name. Price movement is never shown by colour alone.
6. **Tests.** Every new public route gets a Playwright journey and passes the axe scan.

---

## 0. Content decisions from XFL

### Confirmed
- [x] **Legal name:** Xpert Fintech Ltd. Replace every "Xpert Infotech" occurrence in seed data and copy.
- [x] **Consortium:** 14 member brokerages. Update the seed, the Consortium page and any copy that says 9 or 10. Older public sources (news, LinkedIn) say 9 or 10. Where the site describes history (the founding agreement, the CSE API ceremony), keep the number that applied at the time and write it as history; use 14 for the current count.
- [x] **Confirmed products:** OMS, Smart Stock, RMS, DMS, BO Account Opening. These can be published with full product pages, workflows and ecosystem nodes.
- [x] **OST:** a separate confirmed product. Details to follow, so create its node and page as `DRAFT` with no description until XFL sends them.
- [x] **Leadership:** use placeholders until real content arrives (rules in 2.6).

### Still pending
- [ ] **eKYC:** pending. Build the node, page and workflow as `DRAFT` and keep them unpublished. Hide the "Verify" step of the playback tour until eKYC is published (see 1.4).
- [ ] **OST details:** full name, description, capabilities and workflow.
- [ ] Names, logos and logo permission for all 14 consortium members.
- [ ] Real leadership photos, biographies and responsibilities, which will replace the placeholders.
- [ ] Which metrics may be published, and the source for each.
- [ ] Capture the live site's page text (the remaining Phase 0 task).

---

## 1. Signature ecosystem (highest priority)

### 1.1 Ecosystem data model
Move the ecosystem from component code into the database so the CMS controls it. Proposed schema, following existing conventions:

```prisma
enum EcosystemLayer { MARKET XFL PRODUCT INSTITUTION USER }
enum EcosystemEdgeKind { DATA ORDER ONBOARDING RISK OPERATIONS }

model EcosystemNode {
  id             String   @id @default(cuid())
  key            String   @unique
  layer          EcosystemLayer
  offeringId     String?          // link to Offering for product nodes
  organizationId String?          // link to Organization for institution nodes
  iconName       String?
  layoutX        Float?           // desktop layout hint (0–1)
  layoutY        Float?
  mobileOrder    Int      @default(0)
  status         ContentStatus @default(DRAFT)
  publishAt      DateTime?
  sortOrder      Int      @default(0)
  createdById    String?
  updatedById    String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  deletedAt      DateTime?
  translations   EcosystemNodeTranslation[]
  outgoing       EcosystemEdge[] @relation("from")
  incoming       EcosystemEdge[] @relation("to")
}

model EcosystemNodeTranslation {
  id          String @id @default(cuid())
  nodeId      String
  locale      Locale
  label       String
  description String?
  ctaLabel    String?
  node        EcosystemNode @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  @@unique([nodeId, locale])
}

model EcosystemEdge {
  id         String @id @default(cuid())
  fromNodeId String
  toNodeId   String
  kind       EcosystemEdgeKind
  sortOrder  Int    @default(0)
  from       EcosystemNode @relation("from", fields: [fromNodeId], references: [id], onDelete: Cascade)
  to         EcosystemNode @relation("to",   fields: [toNodeId],   references: [id], onDelete: Cascade)
  flowSteps  EcosystemFlowStep[]
  @@unique([fromNodeId, toNodeId, kind])
}

model EcosystemFlow {            // e.g. "onboarding", "order-lifecycle", playback tour
  id           String @id @default(cuid())
  key          String @unique
  isPlayback   Boolean @default(false)
  status       ContentStatus @default(DRAFT)
  sortOrder    Int @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  deletedAt    DateTime?
  translations EcosystemFlowTranslation[]
  steps        EcosystemFlowStep[]
}

model EcosystemFlowTranslation {
  id      String @id @default(cuid())
  flowId  String
  locale  Locale
  name    String
  summary String?
  flow    EcosystemFlow @relation(fields: [flowId], references: [id], onDelete: Cascade)
  @@unique([flowId, locale])
}

model EcosystemFlowStep {
  id           String @id @default(cuid())
  flowId       String
  edgeId       String?
  sortOrder    Int
  translations Json      // { en: {title, body}, bn: {title, body} } or a separate Translation table
  flow         EcosystemFlow @relation(fields: [flowId], references: [id], onDelete: Cascade)
  edge         EcosystemEdge? @relation(fields: [edgeId], references: [id])
}
```

Acceptance:
- [ ] Migration, seed (verified nodes only, from section 0) and `npm run db:erd` regenerated. **Patch 1:** schema fragment and seed data delivered (`prisma/xfl2.fragment.prisma`, `src/content/xfl2/ecosystem.ts`).
- [ ] Admin → Ecosystem screen: CRUD for nodes, edges and flows, with draft/publish and trash like other entities.
- [ ] Publishing respects `src/lib/db/publishing.ts`.

### 1.2 Render the existing animation from data
- [ ] The existing ecosystem component reads nodes, edges and flows from the database. Its visual style and motion are preserved.
- [ ] Exposed as one reusable component with props `{ nodes, edges, flows, focusNodeKey?, interactive, autoPlay, variant: "hero" | "mini" | "mobile" }`.

### 1.3 Interaction
- [ ] Hover or focus on a node: it scales slightly, connected edges brighten, unrelated edges fade, and a tooltip shows the label, description and CTA.
- [ ] Clicking a node enters focus mode: other nodes dim, the node's flow animates, and an "Explore product" CTA appears when it has a linked offering.
- [ ] Keyboard: Tab moves between nodes, Enter enters focus, Esc exits. Screen readers get a text list equivalent of the graph.

### 1.4 Playback tour
- [ ] An "Explore the ecosystem" button plays the `isPlayback` flow: Connect → Onboard → Verify → Trade → Manage risk → Connect to market → Operate → Analyse, then zooms out.
- [ ] Under 30 seconds total; can be paused, skipped and stepped. Reduced motion shows the steps as a static stepper.
- [ ] Steps referencing unpublished products are hidden. Today that means the "Verify" (eKYC) step is skipped, so the onboarding step goes straight from BO Account Opening to Trade. It appears automatically when eKYC is published.

### 1.5 Mobile composition
- [ ] Below 768px, a vertical flow (Market → XFL → Products → Institutions → Investors) with tappable nodes and a bottom-sheet detail panel. Tested at 375 and 390px.

### 1.6 One visual world
- [ ] Review the globe hero, order-flow story, animated background and ecosystem together. Unify colour tokens, line weights, node shapes and motion timing (visual grammar: nodes = systems, lines = connectivity, pulses = events, flows = workflows).
- [ ] Decide with XFL whether the hero shows the globe, the ecosystem or a hand-off between them. Document the decision in `docs/`.
- [ ] Hero entrance sequence under about 6 seconds, and content readable from the first frame.

### 1.7 Mini ecosystem on product pages
- [ ] Each offering page with a linked node shows the `mini` variant with that node focused, and related nodes link to their product pages.

---

## 2. Public pages for existing models (verify each first)

- [ ] **Insights:** `/[locale]/insights`, category and tag filters, article detail with author, date, reading time, related offerings (via `ContentRelation`), share links, `Article` JSON-LD.
- [ ] **Careers:** listing (hides `isClosed` and past-deadline roles), detail, application form with CV upload (type and size validation, `isScanned` respected), consent checkbox, rate limiting, and admin review.
- [ ] **Case studies:** listing and detail (challenge, approach, outcome). Hidden entirely when there are none, with no placeholder cards.
- [ ] **Resources:** listing and download or external link.
- [ ] **Leadership:** check that board and management pages show photo, name, title, bio and responsibility, with a fallback when there's no photo.

### 2.6 Leadership placeholders
Placeholders let the design be finished now. They must never be mistaken for real people or reach production unnoticed.

- [ ] Add `isPlaceholder Boolean @default(false)` to `Person`, then migrate and regenerate the ERD. **Patch 1:** in the schema fragment.
- [ ] **Patch 1: data and silhouette delivered.** Seed placeholder records for the board (Chairman, Directors, Independent Director) and management (Managing Director/CEO, CTO, CFO & Company Secretary, Head of Operations, Head of Business), in English and Bangla:
  - **Name:** "Name to be confirmed" / "নাম নিশ্চিত করা হবে"
  - **Title:** the role title only, for example "Managing Director & CEO"
  - **Biography:** "Biography will be added soon." / "জীবনী শীঘ্রই যুক্ত করা হবে।"
  - **Responsibility:** one generic line per role (for example "Oversees technology strategy and platform delivery" for the CTO), marked for replacement
  - **Photo:** a neutral silhouette SVG in the brand palette (`public/placeholders/person.svg`), not a stock photo and not an AI-generated face
  - Leave LinkedIn empty.
- [ ] Do not seed real names found in public sources (job sites, directories). Real people's details come only from XFL.
- [ ] In development and staging, placeholder cards show a small "Placeholder" badge. In production the badge is hidden, but placeholder cards are styled consistently so the page doesn't look broken.
- [ ] Admin: the People list shows a "Placeholder" filter and badge. Saving a real name, bio and photo prompts the editor to switch `isPlaceholder` off.
- [ ] Exclude placeholders from JSON-LD (`Person` structured data) and from search results.
- [ ] Add a pre-launch check in the start-up configuration check that warns when published placeholder people exist.
- [ ] Each route: localized metadata, canonical, Open Graph, breadcrumbs, sitemap entry, Playwright journey and axe pass.

---

## 3. Product experience

- [ ] **Product page template** with sections: hero, problem, solution, interface, capabilities, workflow, architecture, integrations, security, benefits, deployment (uses `Deployment` records: live apps with store links), resources, FAQ, demo CTA. Sections with no data are hidden.
- [ ] **Live deployments proof layer:** a component listing published `Deployment` records (app name, organization if `logoPermission`, store links). Usable on the home page, the OMS page and the Consortium page.
- [ ] **Patch 1: built and browser-tested, needs placing on the OMS page.** **Interactive OMS preview:** a client-side simulation of market watch → order entry → orders → positions → risk check. Requirements:
  - A permanent "Product preview — simulated data, no real orders" banner.
  - Simulated instruments use obviously fictional symbols, never real DSE/CSE tickers or prices.
  - No network calls, keyboard-operable, with a reduced-motion version.
- [ ] **Patch 1: component and OMS/RMS/DMS/BO content delivered.** **Workflow visuals:** build one generic CMS-driven workflow component, then create content for each confirmed product:
  - **OMS:** order → pre-trade risk check (RMS) → exchange (DSE/CSE) → execution → position → back office
  - **RMS:** order → pre-trade check → limits → risk engine → execution → position → monitoring (no confidential algorithm detail)
  - **DMS:** document capture → secure storage → controlled access → workflow approval → audit trail
  - **BO Account Opening:** start application → identity information → document capture → review → approval → BO account created → investor ready. The eKYC step is hidden while eKYC is pending.
  - **Smart Stock:** workflow content from XFL
  - **OST:** `DRAFT` until details arrive
  - **eKYC:** build as `DRAFT` only
- [ ] Product pages for OMS, RMS, DMS, BO Account Opening, Smart Stock and (once published) OST are each linked to their ecosystem node and to each other through `ContentRelation`. For example, OMS ↔ RMS, and BO Account Opening ↔ DMS.

---

## 4. Market experience (depends on licensed-feed fields)

- [ ] Read `docs/MARKET-DATA.md` first. List which fields the licensed feed provides and build only those.
- [ ] `/[locale]/markets`, `/markets/dse`, `/markets/cse`: market status, indices, breadth, gainers, losers, most active, and sector performance if provided.
- [ ] `/markets/[exchange]/[symbol]`: quote fields from the feed, the display-delay notice from `MarketDataSource.displayDelayMinutes`, and a historical chart only if the feed provides history.
- [ ] Watchlist stored in localStorage (no account needed). Symbol search.
- [ ] States: loading, feed down, market closed, licence expired (from `licenceExpiresAt`), and empty.
- [ ] Financial tables: sorting, sticky header, dense/comfortable modes, arrows plus text for movement, horizontal scroll on mobile.

---

## 5. Platform features

- [ ] **Command search (Cmd+K / Ctrl+K):** a server-side index over published offerings, solutions, articles, people, events and pages (respects `showInSearch`), plus symbols from the feed. Bilingual, keyboard-first, with a `/search` page fallback. Postgres full-text search is enough; no new service needed.
- [ ] **Interactive architecture diagram** (clients → applications → services → data → market connectivity). CMS-driven, showing only components XFL approves; no confidential infrastructure.
- [ ] **Ask XFL:** architecture only. An interface definition, an approved-knowledge source list (published CMS content), and a disabled UI entry labelled "coming soon", or nothing at all. No fake answers.
- [ ] **Analytics events** (only if an analytics provider is configured): ecosystem node clicked, focus entered, playback completed, product preview opened, demo CTA clicked, demo submitted. No personal data in event payloads.

---

## 6. Admin and back end

- [ ] **Patch 1: schema delivered; server-action logging and viewer still to build.** **Audit log:**
  ```prisma
  model AuditLog {
    id         String   @id @default(cuid())
    actorId    String?
    action     String          // create | update | publish | delete | restore | login | role_change …
    entityType EntityType?
    entityId   String?
    changes    Json?            // field-level before/after, secrets excluded
    ip         String?
    userAgent  String?
    createdAt  DateTime @default(now())
    @@index([entityType, entityId])
    @@index([actorId, createdAt])
  }
  ```
  Write entries from every admin server action. Add an Admin → Audit log viewer with filters.
- [ ] **Roles (only if XFL approves):** add `AdminRole` enum and `AdminUser.role`, with a central permission map in `src/lib/auth`. Every server action checks permissions, not just the page. Start with Super Admin, Editor, HR, Market Data Admin and Viewer rather than all nine roles in the brief unless XFL wants them.
- [ ] **Lead email alerts:** send email on new leads with SMTP settings in `.env`, never put the lead's message body in the subject, and retry on failure.
- [ ] **Multi-step demo request** (verify current form): organisation → role → interest → products → contact → preferred time. The confirmation never claims a meeting is booked.
- [ ] Admin screens for articles, careers, applications, case studies and resources (verify which exist).

---

## 7. Final QA

- [ ] `typecheck`, `lint`, `test:e2e` and `test:a11y` all green.
- [ ] Viewports: 1440, 1280, 1024, 768, 430, 390, 375.
- [ ] Bangla: long strings, line height, no overflow in nav, mega menu, buttons and tables.
- [ ] States: empty database, feed down, expired session, invalid permissions, missing images, very long titles.
- [ ] Reduced motion: no continuous motion, all information still available.
- [ ] Lighthouse at 90 or above on home, a product page and markets (mobile profile). Check the ecosystem script is code-split and paused offscreen.
- [ ] Security: CSP still valid after new scripts, upload validation, rate limits on all public forms, no secrets in client bundles.
- [ ] Update the README phase table and `docs/AUDIT.md`.
