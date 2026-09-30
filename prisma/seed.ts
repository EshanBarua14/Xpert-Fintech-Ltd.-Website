/**
 * Seed data: only content Xpert has confirmed (architecture doc, sections 2–3,
 * and answers given on 30 Sep 2026). Safe to run more than once — every record
 * is upserted by a stable `key`.
 *
 * Records whose details still need Xpert input are created as DRAFT so an admin
 * can complete and publish them from the portal. Nothing here is invented copy.
 *
 * Run: npm run db:seed
 */
import { PrismaClient, type Locale, type Prisma } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const db = new PrismaClient();
const EN: Locale = "en";

// ── Site settings ────────────────────────────────────────────────────────────
async function seedSettings() {
  const settings: Record<string, Prisma.InputJsonValue> = {
    "company.name": { en: "Xpert Fintech Ltd." },
    "company.summary": {
      en: "Xpert Fintech Ltd. is a consortium of leading brokerage houses in Bangladesh dedicated to advancing the country's financial technology landscape.",
    },
    "company.about": {
      en: "Headquartered at Saiham Sky View Tower, 45 Bijoynagar, Dhaka, we specialize in delivering enterprise-grade software solutions for the capital market, money market, banking, non-banking financial institutions, and the insurance sector. By combining deep industry expertise with cutting-edge technology, we empower financial institutions to operate with greater efficiency, transparency, and security.",
    },
    "company.mission": {
      en: "To deliver innovative, reliable, and secure financial technology solutions that enable our partners to optimize performance, enhance investor confidence, and strengthen Bangladesh's economic ecosystem.",
    },
    "company.vision": {
      en: "To be recognized as Bangladesh's leading financial technology innovator, driving digital transformation, global competitiveness, and sustainable growth across the financial sector.",
    },
    "contact.email": "info@xpertfintech.com",
    "contact.phone": "+880 2 839 2725",
    "contact.appSupportEmail": "app.support@xpertfintech.com",
    "contact.appSupportPhone": "+880 1901-365408",
    "social.links": [{ label: "LinkedIn", url: "https://bd.linkedin.com/company/xpertfintech" }],
    "leads.alertEmails": [],
    "brand.logoMediaId": "",
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.siteSetting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
}

async function seedOffice() {
  const office = await db.office.upsert({
    where: { key: "hq" },
    update: {},
    create: {
      key: "hq",
      isPrimary: true,
      email: "info@xpertfintech.com",
      phone: "+880 2 839 2725",
      status: "PUBLISHED",
    },
  });
  await db.officeTranslation.upsert({
    where: { officeId_locale: { officeId: office.id, locale: EN } },
    update: {},
    create: {
      officeId: office.id,
      locale: EN,
      name: "Head office",
      address: "Saiham Sky View Tower (13-A), 45 Bijoynagar, Dhaka-1000, Bangladesh",
    },
  });
}

// ── Consortium members and exchanges ─────────────────────────────────────────
const organizations = [
  { key: "apex-investments", name: "Apex Investments Ltd.", kind: "CONSORTIUM_MEMBER" },
  { key: "bank-asia-securities", name: "Bank Asia Securities Ltd.", kind: "CONSORTIUM_MEMBER" },
  { key: "ebl-securities", name: "EBL Securities PLC", kind: "CONSORTIUM_MEMBER" },
  { key: "green-delta-securities", name: "Green Delta Securities Ltd.", kind: "CONSORTIUM_MEMBER" },
  { key: "islami-bank-securities", name: "Islami Bank Securities Ltd.", kind: "CONSORTIUM_MEMBER" },
  { key: "nli-securities", name: "NLI Securities Ltd.", kind: "CONSORTIUM_MEMBER" },
  { key: "one-securities", name: "ONE Securities Ltd.", kind: "CONSORTIUM_MEMBER" },
  { key: "sjibl-securities", name: "Shahjalal Islami Bank Securities Ltd.", kind: "CONSORTIUM_MEMBER" },
  { key: "ucb-stock-brokerage", name: "UCB Stock Brokerage Ltd.", kind: "CONSORTIUM_MEMBER" },
  { key: "mika-securities", name: "Mika Securities Ltd.", kind: "CONSORTIUM_MEMBER" },
  { key: "ab-securities", name: "AB Securities Limited", kind: "CONSORTIUM_MEMBER" },
  { key: "remons-investment", name: "Remons Investment & Securities Ltd", kind: "CONSORTIUM_MEMBER" },
  { key: "dse", name: "Dhaka Stock Exchange", shortName: "DSE", kind: "EXCHANGE" },
  { key: "cse", name: "Chittagong Stock Exchange", shortName: "CSE", kind: "EXCHANGE" },
] as const;

async function seedOrganizations() {
  for (const [i, o] of organizations.entries()) {
    const org = await db.organization.upsert({
      where: { key: o.key },
      update: {},
      // Names are public on Xpert's own About text; logos stay hidden
      // (logoPermission = false) until written permission is recorded.
      create: { key: o.key, kind: o.kind, status: "PUBLISHED", sortOrder: i },
    });
    await db.organizationTranslation.upsert({
      where: { organizationId_locale: { organizationId: org.id, locale: EN } },
      update: {},
      create: {
        organizationId: org.id,
        locale: EN,
        name: o.name,
        shortName: "shortName" in o ? o.shortName : null,
      },
    });
  }
}

// ── Offerings (working names — editable in Admin → Products) ─────────────────
const offerings = [
  { key: "trading-platform", type: "PLATFORM", slug: "trading-platform", name: "Xpert Trading Platform (OMS)", featured: true },
  { key: "rms", type: "MODULE", slug: "rms", name: "Xpert RMS", parent: "trading-platform" },
  { key: "ekyc", type: "PRODUCT", slug: "ekyc", name: "Xpert eKYC" },
  { key: "bo-account-opening", type: "PRODUCT", slug: "bo-account-opening", name: "BO Account Opening Portal" },
  { key: "dms", type: "PRODUCT", slug: "dms", name: "Xpert DMS" },
  { key: "back-office", type: "PRODUCT", slug: "back-office", name: "Brokerage Back Office" },
  { key: "market-data", type: "PRODUCT", slug: "market-data", name: "Market Data & Analysis" },
  { key: "exchange-connectivity", type: "INTEGRATION", slug: "exchange-connectivity", name: "Exchange Connectivity" },
] as const;

async function seedOfferings() {
  const ids = new Map<string, string>();
  for (const [i, o] of offerings.entries()) {
    const row = await db.offering.upsert({
      where: { key: o.key },
      update: {},
      // DRAFT until an admin adds the description, features and screenshots.
      create: { key: o.key, type: o.type, isFeatured: "featured" in o && o.featured, sortOrder: i },
    });
    ids.set(o.key, row.id);
    await db.offeringTranslation.upsert({
      where: { offeringId_locale: { offeringId: row.id, locale: EN } },
      update: {},
      create: { offeringId: row.id, locale: EN, slug: o.slug, name: o.name },
    });
  }
  for (const o of offerings) {
    if ("parent" in o) {
      await db.offering.update({ where: { key: o.key }, data: { parentId: ids.get(o.parent) } });
    }
  }

  // Capabilities stated in the public ONE TRADE store listing (checked 30 Sep 2026).
  const platformId = ids.get("trading-platform")!;
  const existing = await db.offeringItem.count({ where: { offeringId: platformId } });
  if (existing === 0) {
    const capabilities = [
      "Real-time portfolio balance and daily gain/loss",
      "Order entry and order management",
      "Candle and area charts with technical indicators",
      "Market depth",
      "Custom watchlists",
      "Market news and sector views",
      "Desktop keyboard shortcuts and customizable dashboards",
      "Historical order search",
    ];
    for (const [i, title] of capabilities.entries()) {
      await db.offeringItem.create({
        data: {
          offeringId: platformId,
          kind: "CAPABILITY",
          sortOrder: i,
          translations: { create: { locale: EN, title } },
        },
      });
    }
  }
  return ids;
}

// ── Deployments: branded trading apps on Google Play ─────────────────────────
const deployments = [
  { key: "ebl-fast-trade", app: "EBL Fast Trade", pkg: "com.xfltrade.ebs", org: "ebl-securities" },
  { key: "shahjalal-trade", app: "Shahjalal Trade", pkg: "com.xfltrade.sjb", org: "sjibl-securities" },
  { key: "ail-trade", app: "AIL Trade", pkg: "com.xfltrade.snm", org: "apex-investments" }, // likely match — confirm
  { key: "gds-trade", app: "GDS TRADE", pkg: "com.xfltrade.gdf", org: "green-delta-securities" },
  { key: "nls-smarttrade", app: "NLS SmartTrade", pkg: "com.xfltrade.nls", org: "nli-securities" }, // likely match — confirm
  { key: "ba-secure-trade", app: "BA SECURE TRADE", pkg: "com.xfltrade.bal", org: "bank-asia-securities" },
  { key: "tradeibs", app: "TradeIBS", pkg: "com.xfltrade.ibb", org: "islami-bank-securities" },
  { key: "one-trade", app: "ONE TRADE", pkg: "com.xfltrade.one", org: "one-securities" },
  { key: "rem", app: "Rem", pkg: "com.xfltrade.rem", org: "remons-investment" }, // likely match — confirm
  { key: "skytrade", app: "SkyTrade", pkg: "com.xfltrade.sky", org: null }, // brokerage unknown
] as const;

async function seedDeployments(offeringIds: Map<string, string>) {
  for (const [i, d] of deployments.entries()) {
    const org = d.org ? await db.organization.findUnique({ where: { key: d.org } }) : null;
    await db.deployment.upsert({
      where: { key: d.key },
      update: {},
      // DRAFT: publish each after the brokerage agrees to be shown.
      create: {
        key: d.key,
        appName: d.app,
        androidPackage: d.pkg,
        playStoreUrl: `https://play.google.com/store/apps/details?id=${d.pkg}`,
        organizationId: org?.id ?? null,
        offeringId: offeringIds.get("trading-platform") ?? null,
        linksCheckedAt: new Date("2026-09-30"),
        sortOrder: i,
      },
    });
  }
}

// ── Events (DRAFT until dates and details are confirmed) ─────────────────────
async function seedEvents() {
  const events = [
    {
      key: "dse-fix-certification",
      slug: "dse-fix-certification",
      title: "Nine consortium members achieve DSE FIX certification",
      summary:
        "Nine Xpert Fintech consortium members achieved Dhaka Stock Exchange (DSE) FIX Certification, aligning Bangladesh's market with international standards.",
      startsAt: null,
      dateIsApprox: true,
      legacyUrl: "/event/6",
    },
    {
      key: "cse-api-agreement-2024",
      slug: "cse-api-agreement-2024",
      title: "CSE API agreement with nine TREC holders",
      summary: null,
      startsAt: new Date("2024-11-25"),
      dateIsApprox: false,
      legacyUrl: null,
    },
    {
      key: "ecosoftbd-acquisition",
      slug: "ecosoftbd-acquisition",
      title: "Xpert Fintech Ltd. acquires EcoSoftBD IT Ltd.",
      summary: null,
      startsAt: new Date("2025-05-12"),
      dateIsApprox: false,
      legacyUrl:
        "/2025/05/12/xpert-fintech-ltd-acquires-ecosoftbd-it-ltd-to-strengthen-digital-footprint-in-financial-sector/",
    },
  ];
  for (const e of events) {
    const row = await db.event.upsert({
      where: { key: e.key },
      update: {},
      create: { key: e.key, startsAt: e.startsAt, dateIsApprox: e.dateIsApprox, legacyUrl: e.legacyUrl },
    });
    await db.eventTranslation.upsert({
      where: { eventId_locale: { eventId: row.id, locale: EN } },
      update: {},
      create: { eventId: row.id, locale: EN, slug: e.slug, title: e.title, summary: e.summary },
    });
  }
}

// ── People (DRAFT: titles to be entered by an admin) ─────────────────────────
async function seedPeople() {
  const management = [
    { key: "md-shahinur-rahman", name: "Md. Shahinur Rahman" },
    { key: "md-abdur-rahman-rony", name: "Md. Abdur Rahman Rony" },
    { key: "md-abul-moshad-chowdhury", name: "Md. Abul Moshad Chowdhury" },
    { key: "muhammad-shamsul-maruf", name: "Muhammad Shamsul Maruf" },
  ];
  for (const [i, p] of management.entries()) {
    const person = await db.person.upsert({ where: { key: p.key }, update: {}, create: { key: p.key, sortOrder: i } });
    await db.personTranslation.upsert({
      where: { personId_locale: { personId: person.id, locale: EN } },
      update: {},
      create: { personId: person.id, locale: EN, name: p.name },
    });
    await db.personRole.upsert({
      where: { personId_group: { personId: person.id, group: "MANAGEMENT" } },
      update: {},
      create: { personId: person.id, group: "MANAGEMENT", sortOrder: i },
    });
  }
}

// ── About page: company text, mission, vision, core values ───────────────────
async function seedAboutPage() {
  const page = await db.page.upsert({
    where: { key: "about" },
    update: {},
    create: { key: "about", status: "PUBLISHED" },
  });
  await db.pageTranslation.upsert({
    where: { pageId_locale: { pageId: page.id, locale: EN } },
    update: {},
    create: { pageId: page.id, locale: EN, path: "company/about", title: "About Xpert Fintech" },
  });
  if ((await db.pageSection.count({ where: { pageId: page.id } })) > 0) return;

  const section = await db.pageSection.create({ data: { pageId: page.id, anchorId: "values", sortOrder: 0 } });
  const values = [
    ["Collaboration", "Leveraging the strength of our consortium partnership"],
    ["Innovation", "Advancing technology that sets new industry benchmarks"],
    ["Integrity", "Operating with transparency, accountability, and trust"],
    ["Excellence", "Delivering solutions that meet global standards"],
    ["Impact", "Building a stronger, more resilient financial ecosystem"],
  ] as const;
  await db.contentBlock.create({
    data: {
      sectionId: section.id,
      type: "VALUES",
      status: "PUBLISHED",
      translations: { create: { locale: EN, title: "Core values" } },
      items: {
        create: values.map(([title, body], i) => ({
          sortOrder: i,
          translations: { create: { locale: EN, title, body } },
        })),
      },
    },
  });
}

async function seedHomePage() {
  const page = await db.page.upsert({ where: { key: "home" }, update: {}, create: { key: "home" } });
  await db.pageTranslation.upsert({
    where: { pageId_locale: { pageId: page.id, locale: EN } },
    update: {},
    create: { pageId: page.id, locale: EN, path: "", title: "Xpert Fintech Ltd." },
  });
}

// ── Navigation (English labels; Bangla added in Admin → Navigation) ──────────
async function seedNavigation() {
  const menu = await db.navMenu.upsert({
    where: { key: "header" },
    update: {},
    create: { key: "header", name: "Header" },
  });
  if ((await db.navItem.count({ where: { menuId: menu.id } })) > 0) return;
  const items = [
    ["Platform", "platform", false],
    ["Products", "products", false],
    ["Solutions", "solutions", false],
    ["Technology", "technology", false],
    ["Proof", "proof", false],
    ["Insights", "insights", false],
    ["Company", "company", false],
    ["Request a demo", "request-demo", true],
  ] as const;
  for (const [i, [label, href, isCta]] of items.entries()) {
    await db.navItem.create({
      data: { menuId: menu.id, href, isCta, sortOrder: i, translations: { create: { locale: EN, label } } },
    });
  }
}

type SeedLink = { label: string; href?: string; children?: SeedLink[] };

const productLinks: SeedLink[] = offerings.map((o) => ({ label: o.name, href: `products/${o.slug}` }));

/** Creates a menu with nested items, only if the menu has no items yet. */
async function ensureMenu(key: string, name: string, tree: SeedLink[]) {
  const menu = await db.navMenu.upsert({ where: { key }, update: {}, create: { key, name } });
  if ((await db.navItem.count({ where: { menuId: menu.id } })) > 0) return;
  const create = async (links: SeedLink[], parentId: string | null) => {
    for (const [i, link] of links.entries()) {
      const item = await db.navItem.create({
        data: {
          menuId: menu.id,
          parentId,
          linkType: link.href === undefined ? "NONE" : "INTERNAL",
          href: link.href ?? null,
          sortOrder: i,
          translations: { create: { locale: EN, label: link.label } },
        },
      });
      if (link.children) await create(link.children, item.id);
    }
  };
  await create(tree, null);
}

async function seedFooterAndDropdowns() {
  await ensureMenu("footer", "Footer columns", [
    { label: "Products", children: productLinks },
    {
      label: "Company",
      children: [
        { label: "About", href: "company/about" },
        { label: "Management", href: "company/management" },
        { label: "Board", href: "company/board" },
        { label: "Careers", href: "careers" },
        { label: "Contact", href: "contact" },
      ],
    },
    {
      label: "Insights",
      children: [
        { label: "News", href: "insights/news" },
        { label: "Events", href: "events" },
        { label: "Resources", href: "resources" },
      ],
    },
  ]);
  await ensureMenu("footer-legal", "Footer legal links", [
    { label: "Privacy policy", href: "privacy" },
    { label: "Terms of use", href: "terms" },
    { label: "Accessibility", href: "accessibility" },
  ]);

  // Products dropdown in the header — added once, even on databases seeded before it existed.
  const header = await db.navMenu.findUnique({ where: { key: "header" } });
  const products = header
    ? await db.navItem.findFirst({ where: { menuId: header.id, parentId: null, href: "products" } })
    : null;
  if (header && products && (await db.navItem.count({ where: { parentId: products.id } })) === 0) {
    for (const [i, link] of productLinks.entries()) {
      await db.navItem.create({
        data: {
          menuId: header.id,
          parentId: products.id,
          href: link.href ?? null,
          sortOrder: i,
          translations: { create: { locale: EN, label: link.label } },
        },
      });
    }
  }
}

// ── Redirects from the old site ──────────────────────────────────────────────
async function seedRedirects() {
  const redirects = [
    ["/oms/4", "/en/products/trading-platform"],
    ["/event/6", "/en/events/dse-fix-certification"],
    ["/xfl-team/", "/en/company/management"],
    ["/privacy-policy/", "/en/privacy"],
    [
      "/2025/05/12/xpert-fintech-ltd-acquires-ecosoftbd-it-ltd-to-strengthen-digital-footprint-in-financial-sector/",
      "/en/events/ecosoftbd-acquisition",
    ],
  ] as const;
  for (const [fromPath, toPath] of redirects) {
    await db.redirect.upsert({ where: { fromPath }, update: {}, create: { fromPath, toPath, note: "Old site URL" } });
  }
}

async function seedMarketData() {
  const count = await db.marketDataSource.count();
  if (count > 0) return;
  // Xpert holds a DSE/CSE display licence (confirmed 30 Sep 2026). Stays inactive
  // until the feed details and licence reference are entered in Admin → Market.
  await db.marketDataSource.create({ data: { name: "DSE / CSE feed", mode: "LICENSED", isActive: false } });
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("• Skipping admin account (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set)");
    return;
  }
  if (password.length < 12) throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters");
  const existing = await db.adminUser.findUnique({ where: { email } });
  if (existing) return;
  await db.adminUser.create({
    data: { email, name: process.env.SEED_ADMIN_NAME || "Xpert Admin", passwordHash: await hash(password) },
  });
  console.log(`• Created admin ${email}`);
}

async function main() {
  await seedSettings();
  await seedOffice();
  await seedOrganizations();
  const offeringIds = await seedOfferings();
  await seedDeployments(offeringIds);
  await seedEvents();
  await seedPeople();
  await seedAboutPage();
  await seedHomePage();
  await seedNavigation();
  await seedFooterAndDropdowns();
  await seedRedirects();
  await seedMarketData();
  await seedAdmin();
  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
