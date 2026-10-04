/**
 * XFL 2.0 content seed — fills the product pages, people and showcase with
 * publishable content, on top of prisma/seed.ts.
 *
 * Run:  npm run db:seed:content
 *       npm run db:seed:content -- --with-deployments   (also publishes the branded apps)
 *
 * Rules, same as the main seed:
 *  - Safe to run more than once. Records are matched by `key`.
 *  - Never overwrites text an admin has already entered: only empty fields are filled,
 *    and item lists (capabilities, workflow…) are only added when that list is empty.
 *  - No invented figures: no client counts, uptime, latency, prices or certifications.
 *    Descriptions say what each product does, not how well it performs.
 *
 * Products XFL confirmed (3 Oct 2026): OMS, RMS, DMS, BO Account Opening, Smart Stock, OST.
 * eKYC is pending. Smart Stock and OST stay DRAFT until their descriptions arrive.
 * Back office, market data and exchange connectivity are published from public evidence
 * (EcoSoftBD/back-office history, DSE/CSE display licence, DSE FIX certification, CSE API
 * agreement). Remove a key from PUBLISH below to keep it as a draft.
 */
import { PrismaClient, type Locale, type OfferingItemKind, type OfferingType } from "@prisma/client";

const db = new PrismaClient();
const EN: Locale = "en";
const BN: Locale = "bn";
const WITH_DEPLOYMENTS = process.argv.includes("--with-deployments");

/** Offerings published by this seed. Everything else stays as it is. */
const PUBLISH = new Set([
  "trading-platform",
  "rms",
  "dms",
  "bo-account-opening",
  "back-office",
  "market-data",
  "exchange-connectivity",
]);

type Text = { en: string; bn?: string };
type Item = { title: Text; body?: Text; icon?: string };

type OfferingContent = {
  key: string;
  type: OfferingType;
  slug: string;
  name: Text;
  tagline?: Text;
  summary?: Text;
  problem?: Text;
  solution?: Text;
  targetCustomers?: Text;
  featured?: boolean;
  parent?: string;
  items?: Partial<Record<OfferingItemKind, Item[]>>;
};

const t = (en: string, bn?: string): Text => ({ en, bn });

// ── Product content ──────────────────────────────────────────────────────────

const CONTENT: OfferingContent[] = [
  {
    key: "trading-platform",
    type: "PLATFORM",
    slug: "trading-platform",
    featured: true,
    name: t("Xpert Trading Platform (OMS)", "এক্সপার্ট ট্রেডিং প্ল্যাটফর্ম (ওএমএস)"),
    tagline: t("Order management for brokerage trading on DSE and CSE.", "ডিএসই ও সিএসই-তে ব্রোকারেজ লেনদেনের অর্ডার ব্যবস্থাপনা।"),
    summary: t(
      "The trading platform consortium brokerages run every day: investors and dealers place and manage orders, follow the market and see their portfolio, on web, desktop and mobile. Xpert implements, operates and supports the platform for its member brokerages and connects it to both exchanges.",
      "কনসোর্টিয়াম ব্রোকারেজগুলো প্রতিদিন যে ট্রেডিং প্ল্যাটফর্ম ব্যবহার করে: বিনিয়োগকারী ও ডিলাররা ওয়েব, ডেস্কটপ ও মোবাইলে অর্ডার দেন ও পরিচালনা করেন, বাজার অনুসরণ করেন এবং পোর্টফোলিও দেখেন। এক্সপার্ট সদস্য ব্রোকারেজগুলোর জন্য প্ল্যাটফর্মটি বাস্তবায়ন, পরিচালনা ও সহায়তা করে এবং দুই এক্সচেঞ্জের সঙ্গে যুক্ত করে।",
    ),
    problem: t(
      "Brokerages need dependable order entry for dealers and investors, live market views and controls that apply to every order, across the channels their clients use. Building and certifying this independently is costly for each house.",
    ),
    solution: t(
      "One shared platform, run by Xpert for the consortium: order entry and management, watchlists, charts and market depth, connected to DSE and CSE and to risk checks before orders leave the brokerage. Each brokerage can offer its own branded app on top.",
    ),
    targetCustomers: t("TREC-holder brokerage houses, their dealers and their investors."),
    items: {
      WORKFLOW_STEP: [
        { title: t("Order entry", "অর্ডার প্রদান"), body: t("A dealer or investor enters an order on web, desktop or mobile.") },
        { title: t("Pre-trade risk check", "প্রি-ট্রেড ঝুঁকি যাচাই"), body: t("RMS checks the order against configured limits before it leaves the brokerage.") },
        { title: t("Exchange", "এক্সচেঞ্জ"), body: t("The order is routed to DSE or CSE.") },
        { title: t("Execution", "সম্পাদন"), body: t("Executions are reported back to the platform.") },
        { title: t("Portfolio update", "পোর্টফোলিও হালনাগাদ"), body: t("Holdings and balances update for the investor.") },
        { title: t("Back office", "ব্যাক অফিস"), body: t("Trades flow on to settlement and reporting.") },
      ],
      ARCHITECTURE_LAYER: [
        { title: t("Channels"), body: t("Web, desktop and branded mobile apps for investors and dealers.") },
        { title: t("Order management"), body: t("Order entry, amendment, cancellation and order book.") },
        { title: t("Risk controls"), body: t("Pre-trade limit checks through RMS.") },
        { title: t("Market connectivity"), body: t("Connections to Dhaka Stock Exchange and Chittagong Stock Exchange.") },
        { title: t("Back office"), body: t("Settlement, accounts and reporting downstream.") },
      ],
      INTEGRATION: [
        { title: t("Dhaka Stock Exchange"), body: t("Order routing and market data for DSE."), icon: "exchange" },
        { title: t("Chittagong Stock Exchange"), body: t("Order routing and market data for CSE."), icon: "exchange" },
        { title: t("Brokerage back office"), body: t("Executed trades handed to back-office systems."), icon: "chart" },
        { title: t("APIs"), body: t("API-driven, so it can work with a brokerage's existing back-office, risk or reporting systems."), icon: "network" },
      ],
      SECURITY: [
        { title: t("Role-based access"), body: t("Dealers, supervisors and investors see only what their role allows.") },
        { title: t("Risk checks on every order"), body: t("Orders pass RMS checks before reaching the exchange.") },
        { title: t("Activity records"), body: t("Order actions are recorded for review.") },
      ],
      TARGET_USER: [
        { title: t("Investors"), body: t("Trade and follow their portfolio from mobile, web or desktop.") },
        { title: t("Dealers"), body: t("Place and manage orders for clients.") },
        { title: t("Brokerage management"), body: t("Oversee trading activity across the house.") },
      ],
      FAQ: [
        { title: t("Which exchanges does it connect to?"), body: t("Dhaka Stock Exchange and Chittagong Stock Exchange.") },
        { title: t("Can it work with our existing systems?"), body: t("Yes. The platform is API-driven and can be fitted to existing back-office, risk or reporting systems.") },
        { title: t("Can we offer our own branded app?"), body: t("Yes. Several consortium brokerages already offer branded trading apps built on the platform.") },
      ],
    },
  },
  {
    key: "rms",
    type: "MODULE",
    slug: "rms",
    parent: "trading-platform",
    name: t("Xpert RMS", "এক্সপার্ট আরএমএস"),
    tagline: t("Risk controls applied to every order, before and after it reaches the market.", "বাজারে পৌঁছানোর আগে ও পরে প্রতিটি অর্ডারে ঝুঁকি নিয়ন্ত্রণ।"),
    summary: t(
      "The risk management system inside the trading platform. It checks each order against the limits a brokerage sets before the order leaves, and lets risk teams follow exposure afterwards.",
      "ট্রেডিং প্ল্যাটফর্মের ভেতরের ঝুঁকি ব্যবস্থাপনা ব্যবস্থা। প্রতিটি অর্ডার পাঠানোর আগে ব্রোকারেজের নির্ধারিত সীমার সঙ্গে যাচাই করে এবং পরে ঝুঁকির মাত্রা পর্যবেক্ষণে সহায়তা করে।",
    ),
    problem: t("Without automatic checks, an order that breaches a client's limits can reach the exchange before anyone notices."),
    solution: t("Limits are configured once and applied to every order automatically. Orders that fail a check are stopped with a reason, so dealers and clients know why."),
    targetCustomers: t("Brokerage risk and compliance teams, and supervisors."),
    items: {
      WORKFLOW_STEP: [
        { title: t("Order", "অর্ডার") },
        { title: t("Pre-trade check", "প্রি-ট্রেড যাচাই"), body: t("Each order is checked before submission.") },
        { title: t("Limits", "সীমা"), body: t("Configured limits are applied per client and per brokerage.") },
        { title: t("Decision", "সিদ্ধান্ত"), body: t("The order is accepted, or rejected with a reason.") },
        { title: t("Execution", "সম্পাদন") },
        { title: t("Monitoring", "পর্যবেক্ষণ"), body: t("Exposure is followed after execution.") },
      ],
      CAPABILITY: [
        { title: t("Pre-trade limit checks"), body: t("Every order is checked before it leaves the brokerage."), icon: "shield" },
        { title: t("Configurable limits"), body: t("Limits set by the brokerage, per client and overall."), icon: "lock" },
        { title: t("Clear rejection reasons"), body: t("Rejected orders carry the reason, for dealers and clients."), icon: "check" },
        { title: t("Exposure monitoring"), body: t("Risk teams follow positions and exposure after execution."), icon: "chart" },
      ],
      TARGET_USER: [
        { title: t("Risk teams") },
        { title: t("Compliance officers") },
        { title: t("Dealing supervisors") },
      ],
    },
  },
  {
    key: "bo-account-opening",
    type: "PRODUCT",
    slug: "bo-account-opening",
    name: t("BO Account Opening Portal", "বিও অ্যাকাউন্ট খোলার পোর্টাল"),
    tagline: t("Investors apply for a BO account online; brokerages review and approve in one place.", "বিনিয়োগকারীরা অনলাইনে বিও অ্যাকাউন্টের আবেদন করেন; ব্রোকারেজ এক জায়গায় যাচাই ও অনুমোদন করে।"),
    summary: t(
      "A digital application for new investors and a review desk for the brokerage. Applicants enter their details and upload documents online; operations staff review, request corrections and approve.",
      "নতুন বিনিয়োগকারীদের জন্য ডিজিটাল আবেদন এবং ব্রোকারেজের জন্য পর্যালোচনা ডেস্ক। আবেদনকারীরা অনলাইনে তথ্য দেন ও নথি আপলোড করেন; অপারেশনস কর্মীরা পর্যালোচনা, সংশোধনের অনুরোধ ও অনুমোদন করেন।",
    ),
    problem: t("Paper forms mean office visits, missing documents and slow back-and-forth before an investor can trade."),
    solution: t("Applications arrive complete and in one queue. Documents are stored with the application in DMS, and every review step is recorded."),
    targetCustomers: t("New investors and brokerage operations teams."),
    items: {
      WORKFLOW_STEP: [
        { title: t("Start application", "আবেদন শুরু") },
        { title: t("Personal details", "ব্যক্তিগত তথ্য") },
        { title: t("Document upload", "নথি আপলোড"), body: t("Required documents are uploaded and kept in DMS.") },
        { title: t("Review", "পর্যালোচনা"), body: t("Operations staff check the application.") },
        { title: t("Approval", "অনুমোদন") },
        { title: t("BO account created", "বিও অ্যাকাউন্ট তৈরি") },
        { title: t("Ready to trade", "লেনদেনের জন্য প্রস্তুত") },
      ],
      CAPABILITY: [
        { title: t("Online application"), body: t("Investors apply without visiting the office."), icon: "users" },
        { title: t("Document upload"), body: t("Documents attached to the application and stored in DMS."), icon: "document" },
        { title: t("Review queue"), body: t("One queue for operations staff, with correction requests."), icon: "check" },
        { title: t("Status tracking"), body: t("Applicants and staff can see where each application stands."), icon: "chart" },
      ],
      TARGET_USER: [
        { title: t("New investors") },
        { title: t("Operations teams") },
      ],
    },
  },
  {
    key: "dms",
    type: "PRODUCT",
    slug: "dms",
    name: t("Xpert DMS", "এক্সপার্ট ডিএমএস"),
    tagline: t("Client documents stored, controlled and traceable.", "গ্রাহকের নথি সংরক্ষিত, নিয়ন্ত্রিত ও অনুসরণযোগ্য।"),
    summary: t(
      "Document management for brokerage operations: client documents are stored centrally, only authorised staff can open them, and every action on a document is recorded.",
      "ব্রোকারেজ অপারেশনসের জন্য নথি ব্যবস্থাপনা: গ্রাহকের নথি কেন্দ্রীয়ভাবে সংরক্ষিত হয়, শুধু অনুমোদিত কর্মীরা দেখতে পারেন এবং নথির প্রতিটি কাজ রেকর্ড করা হয়।",
    ),
    problem: t("Client files spread across cabinets, inboxes and shared drives are hard to find, hard to protect and hard to audit."),
    solution: t("One store for client documents, linked to the client and to the workflow that created them, with access control and a record of who did what."),
    targetCustomers: t("Brokerage operations and compliance teams."),
    items: {
      WORKFLOW_STEP: [
        { title: t("Capture", "সংগ্রহ") },
        { title: t("Secure storage", "নিরাপদ সংরক্ষণ") },
        { title: t("Controlled access", "নিয়ন্ত্রিত প্রবেশাধিকার"), body: t("Only authorised staff can view or act on documents.") },
        { title: t("Approval", "অনুমোদন") },
        { title: t("Audit trail", "অডিট ট্রেইল"), body: t("Every action on a document is recorded.") },
      ],
      CAPABILITY: [
        { title: t("Central document store"), icon: "document" },
        { title: t("Role-based access"), icon: "lock" },
        { title: t("Linked to client records"), icon: "users" },
        { title: t("Audit trail"), icon: "shield" },
      ],
      SECURITY: [
        { title: t("Access by role"), body: t("Staff only see documents their role allows.") },
        { title: t("Recorded actions"), body: t("Views, uploads and changes are logged.") },
      ],
    },
  },
  {
    key: "back-office",
    type: "PRODUCT",
    slug: "back-office",
    name: t("Brokerage Back Office", "ব্রোকারেজ ব্যাক অফিস"),
    tagline: t("Accounts, settlement and reporting after the trade.", "লেনদেনের পরে হিসাব, নিষ্পত্তি ও প্রতিবেদন।"),
    summary: t(
      "The back-office system that takes over once trades are executed: client accounts, settlement with banks and the depository, and the reports brokerages and regulators need.",
      "লেনদেন সম্পন্ন হওয়ার পর যে ব্যাক-অফিস ব্যবস্থা দায়িত্ব নেয়: গ্রাহকের হিসাব, ব্যাংক ও ডিপোজিটরির সঙ্গে নিষ্পত্তি এবং ব্রোকারেজ ও নিয়ন্ত্রকদের প্রয়োজনীয় প্রতিবেদন।",
    ),
    targetCustomers: t("Brokerage accounts, settlement and reporting teams."),
    items: {
      WORKFLOW_STEP: [
        { title: t("Executed trades", "সম্পাদিত লেনদেন") },
        { title: t("Client accounts", "গ্রাহকের হিসাব") },
        { title: t("Settlement", "নিষ্পত্তি") },
        { title: t("Reporting", "প্রতিবেদন") },
      ],
      CAPABILITY: [
        { title: t("Client accounts and ledgers"), icon: "chart" },
        { title: t("Settlement"), icon: "exchange" },
        { title: t("Reports"), icon: "document" },
      ],
    },
  },
  {
    key: "market-data",
    type: "PRODUCT",
    slug: "market-data",
    name: t("Market Data & Analysis", "মার্কেট ডেটা ও বিশ্লেষণ"),
    tagline: t("Licensed DSE and CSE market data for brokerages and their investors.", "ব্রোকারেজ ও বিনিয়োগকারীদের জন্য লাইসেন্সপ্রাপ্ত ডিএসই ও সিএসই মার্কেট ডেটা।"),
    summary: t(
      "Market data from Dhaka and Chittagong stock exchanges, displayed under Xpert's display licence: prices, indices, market breadth and movers, in the trading apps and on this site.",
      "এক্সপার্টের ডিসপ্লে লাইসেন্সের আওতায় ঢাকা ও চট্টগ্রাম স্টক এক্সচেঞ্জের মার্কেট ডেটা: দাম, সূচক, বাজারের গতিপ্রকৃতি ও শীর্ষ পরিবর্তন, ট্রেডিং অ্যাপে ও এই সাইটে।",
    ),
    items: {
      CAPABILITY: [
        { title: t("Prices and indices"), icon: "chart" },
        { title: t("Market breadth"), icon: "globe" },
        { title: t("Top gainers and losers"), icon: "exchange" },
        { title: t("Watchlists and charts in the apps"), icon: "users" },
      ],
    },
  },
  {
    key: "exchange-connectivity",
    type: "INTEGRATION",
    slug: "exchange-connectivity",
    name: t("Exchange Connectivity", "এক্সচেঞ্জ সংযোগ"),
    tagline: t("Connections to Dhaka and Chittagong stock exchanges for consortium brokerages.", "কনসোর্টিয়াম ব্রোকারেজগুলোর জন্য ঢাকা ও চট্টগ্রাম স্টক এক্সচেঞ্জের সঙ্গে সংযোগ।"),
    summary: t(
      "How the platform reaches the market. Nine consortium members achieved DSE FIX certification, and on 25 November 2024 an API agreement with the Chittagong Stock Exchange was signed with nine TREC holders.",
      "প্ল্যাটফর্ম যেভাবে বাজারে পৌঁছায়। নয়টি কনসোর্টিয়াম সদস্য ডিএসই ফিক্স সার্টিফিকেশন অর্জন করেছে এবং ২৫ নভেম্বর ২০২৪ তারিখে নয়টি ট্রেক হোল্ডারের সঙ্গে চট্টগ্রাম স্টক এক্সচেঞ্জের এপিআই চুক্তি স্বাক্ষরিত হয়।",
    ),
    items: {
      INTEGRATION: [
        { title: t("DSE (FIX)"), body: t("FIX connectivity to Dhaka Stock Exchange."), icon: "exchange" },
        { title: t("CSE (API)"), body: t("API connectivity to Chittagong Stock Exchange."), icon: "exchange" },
      ],
    },
  },
  // Confirmed, details pending: created as drafts with names only.
  { key: "smart-stock", type: "PRODUCT", slug: "smart-stock", name: t("Smart Stock", "স্মার্ট স্টক") },
  { key: "ost", type: "PRODUCT", slug: "ost", name: t("OST") },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

type TrFields = "tagline" | "summary" | "problem" | "solution" | "targetCustomers";
const TR_FIELDS: TrFields[] = ["tagline", "summary", "problem", "solution", "targetCustomers"];

async function upsertOffering(c: OfferingContent) {
  const offering = await db.offering.upsert({
    where: { key: c.key },
    update: {},
    create: { key: c.key, type: c.type, isFeatured: c.featured ?? false },
  });

  for (const locale of [EN, BN]) {
    const name = c.name[locale];
    if (!name) continue;
    const existing = await db.offeringTranslation.findUnique({ where: { offeringId_locale: { offeringId: offering.id, locale } } });
    const fill: Partial<Record<TrFields, string>> = {};
    for (const f of TR_FIELDS) {
      const value = c[f]?.[locale];
      if (value && !existing?.[f]) fill[f] = value;
    }
    if (existing) {
      if (Object.keys(fill).length) await db.offeringTranslation.update({ where: { id: existing.id }, data: fill });
    } else {
      // Skip a Bangla slug that would clash with another offering.
      const clash = await db.offeringTranslation.findUnique({ where: { locale_slug: { locale, slug: c.slug } } });
      if (clash) continue;
      await db.offeringTranslation.create({ data: { offeringId: offering.id, locale, slug: c.slug, name, ...fill } });
    }
  }

  for (const [kind, items] of Object.entries(c.items ?? {}) as [OfferingItemKind, Item[]][]) {
    const count = await db.offeringItem.count({ where: { offeringId: offering.id, kind } });
    if (count > 0) continue;
    for (const [i, item] of items.entries()) {
      await db.offeringItem.create({
        data: {
          offeringId: offering.id,
          kind,
          iconName: item.icon ?? null,
          sortOrder: i,
          translations: {
            create: [EN, BN]
              .filter((l) => item.title[l])
              .map((l) => ({ locale: l, title: item.title[l]!, body: item.body?.[l] ?? null })),
          },
        },
      });
    }
  }

  if (PUBLISH.has(c.key) && offering.status !== "PUBLISHED") {
    await db.offering.update({ where: { id: offering.id }, data: { status: "PUBLISHED", publishAt: null } });
  }
  return offering;
}

// ── People ───────────────────────────────────────────────────────────────────

/** Real management names come from prisma/seed.ts. These fill the board until XFL sends details. */
const BOARD_PLACEHOLDERS = [
  { key: "placeholder-chairman", title: t("Chairman", "চেয়ারম্যান") },
  { key: "placeholder-director-1", title: t("Director", "পরিচালক") },
  { key: "placeholder-director-2", title: t("Director", "পরিচালক") },
  { key: "placeholder-director-3", title: t("Director", "পরিচালক") },
  { key: "placeholder-independent-director", title: t("Independent Director", "স্বতন্ত্র পরিচালক") },
];

async function seedPeople() {
  for (const [i, p] of BOARD_PLACEHOLDERS.entries()) {
    const person = await db.person.upsert({ where: { key: p.key }, update: {}, create: { key: p.key, sortOrder: i, status: "PUBLISHED" } });
    for (const locale of [EN, BN]) {
      await db.personTranslation.upsert({
        where: { personId_locale: { personId: person.id, locale } },
        update: {},
        create: { personId: person.id, locale, name: locale === EN ? "Name to be confirmed" : "নাম নিশ্চিত করা হবে" },
      });
    }
    const role = await db.personRole.upsert({
      where: { personId_group: { personId: person.id, group: "BOARD" } },
      update: {},
      create: { personId: person.id, group: "BOARD", sortOrder: i },
    });
    for (const locale of [EN, BN]) {
      const title = p.title[locale];
      if (!title) continue;
      await db.personRoleTranslation.upsert({
        where: { roleId_locale: { roleId: role.id, locale } },
        update: {},
        create: { roleId: role.id, locale, title },
      });
    }
  }
  // Publish the management team already in the database (names from Xpert's own site).
  const updated = await db.person.updateMany({
    where: { status: "DRAFT", deletedAt: null, roles: { some: { group: "MANAGEMENT" } } },
    data: { status: "PUBLISHED" },
  });
  if (updated.count) console.log(`• Published ${updated.count} management profiles`);
}

// ── Consortium and apps ──────────────────────────────────────────────────────

async function seedDeployments() {
  if (!WITH_DEPLOYMENTS) {
    console.log("• Branded apps left as drafts (add --with-deployments to publish them)");
    return;
  }
  const res = await db.deployment.updateMany({ where: { status: "DRAFT", deletedAt: null }, data: { status: "PUBLISHED" } });
  console.log(`• Published ${res.count} branded trading apps`);
}


// ── Milestones: events with confirmed dates ──────────────────────────────────

/** Publishes events whose date and facts are public; fills a summary only where it is empty. */
const EVENT_CONTENT: { key: string; summary: Text }[] = [
  {
    key: "cse-api-agreement-2024",
    summary: t(
      "An API agreement with the Chittagong Stock Exchange was signed with nine TREC holders, connecting their trading to CSE.",
      "নয়টি ট্রেক হোল্ডারের সঙ্গে চট্টগ্রাম স্টক এক্সচেঞ্জের এপিআই চুক্তি স্বাক্ষরিত হয়, যা তাদের লেনদেন সিএসই-র সঙ্গে যুক্ত করে।",
    ),
  },
  {
    key: "ecosoftbd-acquisition",
    summary: t(
      "Xpert Fintech Ltd. acquired EcoSoftBD IT Ltd. to strengthen its digital footprint in the financial sector.",
      "আর্থিক খাতে ডিজিটাল উপস্থিতি জোরদার করতে এক্সপার্ট ফিনটেক লিমিটেড ইকোসফটবিডি আইটি লিমিটেড অধিগ্রহণ করে।",
    ),
  },
];

async function seedMilestones() {
  let published = 0;
  for (const e of EVENT_CONTENT) {
    const event = await db.event.findUnique({ where: { key: e.key }, include: { translations: true } });
    if (!event || !event.startsAt) continue;
    const en = event.translations.find((x) => x.locale === EN);
    if (en && !en.summary) await db.eventTranslation.update({ where: { id: en.id }, data: { summary: e.summary.en } });
    const bn = event.translations.find((x) => x.locale === BN);
    if (bn && !bn.summary && e.summary.bn) await db.eventTranslation.update({ where: { id: bn.id }, data: { summary: e.summary.bn } });
    if (event.status !== "PUBLISHED") {
      await db.event.update({ where: { id: event.id }, data: { status: "PUBLISHED" } });
      published++;
    }
  }
  if (published) console.log(`• Published ${published} milestone event(s)`);
}

// ── Navigation: hide links to pending products ───────────────────────────────

/** Hides menu links to products that are not published (e.g. eKYC), and shows them again once they are. */
async function syncPendingProductLinks() {
  const pending = [{ key: "ekyc", hrefs: ["platform#ekyc", "products/ekyc"] }];
  for (const p of pending) {
    const offering = await db.offering.findUnique({ where: { key: p.key } });
    const live = offering?.status === "PUBLISHED" && !offering.deletedAt;
    const res = await db.navItem.updateMany({ where: { href: { in: p.hrefs }, isHidden: live } , data: { isHidden: !live } });
    if (res.count) console.log(`• ${live ? "Showed" : "Hid"} ${res.count} menu link(s) to ${p.key}`);
  }
}

// ── Navigation: Insights and Careers links ───────────────────────────────────

type NavChild = { href: string; en: string; bn: string; descEn?: string; descBn?: string };

/**
 * Adds missing links under a parent menu item (found by its href, or by label
 * for footer column headings), once. Menus hide links to empty sections, so a
 * link shows only when that section has published content.
 */
async function ensureChildren(menuKey: string, parent: { href?: string; label?: string }, children: NavChild[]) {
  const menu = await db.navMenu.findUnique({ where: { key: menuKey } });
  if (!menu) return 0;
  const parentItem = parent.href
    ? await db.navItem.findFirst({ where: { menuId: menu.id, parentId: null, href: parent.href } })
    : await db.navItem.findFirst({ where: { menuId: menu.id, parentId: null, translations: { some: { locale: EN, label: parent.label } } } });
  if (!parentItem) return 0;
  let added = 0;
  for (const c of children) {
    const exists = await db.navItem.findFirst({ where: { menuId: menu.id, parentId: parentItem.id, href: c.href } });
    if (exists) continue;
    const max = await db.navItem.aggregate({ where: { menuId: menu.id, parentId: parentItem.id }, _max: { sortOrder: true } });
    await db.navItem.create({
      data: {
        menuId: menu.id,
        parentId: parentItem.id,
        linkType: "INTERNAL",
        href: c.href,
        sortOrder: (max._max.sortOrder ?? -1) + 1,
        translations: {
          create: [
            { locale: EN, label: c.en, description: c.descEn ?? null },
            { locale: BN, label: c.bn, description: c.descBn ?? null },
          ],
        },
      },
    });
    added++;
  }
  return added;
}

const INSIGHTS: NavChild[] = [
  { href: "news", en: "News", bn: "সংবাদ", descEn: "Announcements and company news.", descBn: "ঘোষণা ও প্রতিষ্ঠানের সংবাদ।" },
  { href: "events", en: "Events", bn: "ইভেন্ট", descEn: "Milestones, agreements and events.", descBn: "মাইলফলক, চুক্তি ও ইভেন্ট।" },
  { href: "gallery", en: "Gallery", bn: "গ্যালারি", descEn: "Photo albums from events and the office.", descBn: "ইভেন্ট ও অফিসের ছবির অ্যালবাম।" },
  { href: "gallery#videos", en: "Videos", bn: "ভিডিও", descEn: "Walkthroughs, recordings and interviews.", descBn: "ওয়াকথ্রু, রেকর্ডিং ও সাক্ষাৎকার।" },
  { href: "resources", en: "Resources", bn: "রিসোর্স", descEn: "Brochures and product documents.", descBn: "ব্রোশিওর ও পণ্যের নথি।" },
  { href: "case-studies", en: "Case studies", bn: "কেস স্টাডি", descEn: "How brokerages use Xpert.", descBn: "ব্রোকারেজগুলো কীভাবে এক্সপার্ট ব্যবহার করে।" },
];
const CAREERS: NavChild = { href: "careers", en: "Careers", bn: "ক্যারিয়ার", descEn: "Join the team.", descBn: "আমাদের টিমে যোগ দিন।" };

async function seedInsightsLinks() {
  // Earlier seeds described the Gallery as event photos only.
  await db.navItemTranslation.updateMany({ where: { description: "Photos from our events." }, data: { description: "Photo albums from events and the office." } });
  await db.navItemTranslation.updateMany({ where: { description: "আমাদের ইভেন্টের ছবি।" }, data: { description: "ইভেন্ট ও অফিসের ছবির অ্যালবাম।" } });
  let added = 0;
  added += await ensureChildren("header", { href: "events" }, INSIGHTS);
  added += await ensureChildren("header", { href: "company/about" }, [CAREERS]);
  added += await ensureChildren("footer", { label: "Connect" }, INSIGHTS.filter((c) => c.href !== "events"));
  added += await ensureChildren("footer", { label: "Company" }, [CAREERS]);
  if (added) console.log(`• Added ${added} Insights/Careers menu link(s)`);
}

// ── Navigation: Team link under Company (header and footer) ──────────────────

/** Adds a "Team" link right after "Management" in every menu that has one, once. */
async function seedTeamLinks() {
  const managementLinks = await db.navItem.findMany({ where: { href: "company/management", parentId: { not: null } } });
  let added = 0;
  for (const m of managementLinks) {
    const exists = await db.navItem.findFirst({ where: { menuId: m.menuId, parentId: m.parentId, href: "company/team" } });
    if (exists) continue;
    // Make room right after Management.
    await db.navItem.updateMany({
      where: { menuId: m.menuId, parentId: m.parentId, sortOrder: { gt: m.sortOrder } },
      data: { sortOrder: { increment: 1 } },
    });
    await db.navItem.create({
      data: {
        menuId: m.menuId,
        parentId: m.parentId,
        linkType: "INTERNAL",
        href: "company/team",
        sortOrder: m.sortOrder + 1,
        translations: {
          create: [
            { locale: EN, label: "Team", description: "The people who build and run Xpert." },
            { locale: BN, label: "টিম", description: "যাঁরা এক্সপার্ট তৈরি ও পরিচালনা করেন।" },
          ],
        },
      },
    });
    added++;
  }
  if (added) console.log(`• Added the Team link to ${added} menu(s)`);
}

// ── Navigation: Markets link in the header and footer ───────────────────────

/** Adds "Markets" to the header (after Products) and to the footer's first column, once. */
async function seedMarketsLinks() {
  let added = 0;
  const header = await db.navMenu.findUnique({ where: { key: "header" } });
  if (header && !(await db.navItem.findFirst({ where: { menuId: header.id, parentId: null, href: "markets" } }))) {
    const products = await db.navItem.findFirst({ where: { menuId: header.id, parentId: null, href: "products" } });
    const at = (products?.sortOrder ?? 1) + 1;
    await db.navItem.updateMany({ where: { menuId: header.id, parentId: null, sortOrder: { gte: at } }, data: { sortOrder: { increment: 1 } } });
    const item = await db.navItem.create({
      data: {
        menuId: header.id,
        linkType: "INTERNAL",
        href: "markets",
        sortOrder: at,
        translations: {
          create: [
            { locale: EN, label: "Markets", description: "Live DSE and CSE prices, indices and movers." },
            { locale: BN, label: "বাজার", description: "ডিএসই ও সিএসই-এর সরাসরি দাম, সূচক ও মুভার।" },
          ],
        },
      },
    });
    const kids = [
      { href: "markets/dse", en: "DSE board", bn: "ডিএসই বোর্ড", descEn: "Dhaka Stock Exchange prices.", descBn: "ঢাকা স্টক এক্সচেঞ্জের দাম।" },
      { href: "markets/cse", en: "CSE board", bn: "সিএসই বোর্ড", descEn: "Chittagong Stock Exchange prices and indices.", descBn: "চট্টগ্রাম স্টক এক্সচেঞ্জের দাম ও সূচক।" },
    ];
    for (const [i, k] of kids.entries()) {
      await db.navItem.create({
        data: {
          menuId: header.id,
          parentId: item.id,
          linkType: "INTERNAL",
          href: k.href,
          sortOrder: i,
          translations: { create: [{ locale: EN, label: k.en, description: k.descEn }, { locale: BN, label: k.bn, description: k.descBn }] },
        },
      });
    }
    added++;
  }
  const footer = await db.navMenu.findUnique({ where: { key: "footer" } });
  const firstColumn = footer ? await db.navItem.findFirst({ where: { menuId: footer.id, parentId: null }, orderBy: { sortOrder: "asc" } }) : null;
  if (footer && firstColumn && !(await db.navItem.findFirst({ where: { menuId: footer.id, href: "markets" } }))) {
    const max = await db.navItem.aggregate({ where: { parentId: firstColumn.id }, _max: { sortOrder: true } });
    await db.navItem.create({
      data: {
        menuId: footer.id,
        parentId: firstColumn.id,
        linkType: "INTERNAL",
        href: "markets",
        sortOrder: (max._max.sortOrder ?? -1) + 1,
        translations: { create: [{ locale: EN, label: "Markets" }, { locale: BN, label: "বাজার" }] },
      },
    });
    added++;
  }
  if (added) console.log(`• Added the Markets link to ${added} menu(s)`);
}

async function main() {
  const ids = new Map<string, string>();
  for (const c of CONTENT) ids.set(c.key, (await upsertOffering(c)).id);
  for (const c of CONTENT) {
    if (c.parent && ids.get(c.parent)) {
      await db.offering.update({ where: { key: c.key }, data: { parentId: ids.get(c.parent) } });
    }
  }
  console.log(`• Products: ${[...PUBLISH].join(", ")} published`);
  await seedPeople();
  await seedDeployments();
  await seedTeamLinks();
  await seedMilestones();
  await syncPendingProductLinks();
  await seedInsightsLinks();
  await seedMarketsLinks();
  console.log("Content seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
