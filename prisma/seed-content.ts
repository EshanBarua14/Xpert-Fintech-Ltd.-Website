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
import { seedRmsVisible } from "./rms-visible";
import { seedOmsLogo } from "./oms-logo";
import { seedRiskChecksBlock, seedRiskChecksGrid, seedRiskPage } from "./risk-page";
import { seedRiskLinks } from "./risk-links";
import { PrismaClient, type Locale, type PersonGroup, type OfferingItemKind, type OfferingType } from "@prisma/client";
import { createHash, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ecosystemEdges, ecosystemFlows, ecosystemNodes } from "../src/content/xfl2/ecosystem";
import { BOARD, CONSULTANTS, MANAGEMENT, TEAM, type RosterPerson } from "../src/content/xfl2/people";
import { LEADER_MESSAGES, MARKET_GOAL } from "../src/content/xfl2/messages";
import { LEGAL_DRAFTS } from "../src/content/xfl2/legal";
import { CLIENT_LOGOS, NOT_CLIENTS, orgNameKey } from "../src/content/xfl2/client-logos";
import { CREDENTIALS } from "../src/content/xfl2/credentials";
import { DIRECTOR_PROFILES } from "../src/content/xfl2/director-profiles";
import { sniff } from "../src/lib/media/inspect";
import { CASE_STUDY_DRAFTS, CLIENT_STORY_DRAFTS } from "../src/content/xfl2/case-study-drafts";
import { CAREER_SEED } from "../src/content/xfl2/careers";
import { MEMBER_PROFILES } from "../src/content/xfl2/member-profiles";
import { PORTRAIT_FOCUS } from "../src/content/xfl2/portrait-focus";
import { PREVIOUS_PORTRAITS } from "../src/content/xfl2/portrait-previous";
import { PRESS_CATEGORY, PRESS_EVENTS, PRESS_STORIES } from "../src/content/xfl2/press";
import { BLOCK_BN, EVENT_BN, ITEM_BN, LEGAL_BN, NAV_BN, NODE_BN, OFFERING_BN, OFFICE_BN, ORG_BN, PAGE_BN, PERSON_BN } from "../src/content/xfl2/bangla";

const db = new PrismaClient();
const EN: Locale = "en";
const BN: Locale = "bn";
const WITH_DEPLOYMENTS = process.argv.includes("--with-deployments");

/** Offerings published by this seed. Everything else stays as it is. */
const PUBLISH = new Set(["trading-platform", "ost", "smart-stock", "back-office", "bo-account-opening", "dms"]);

/**
 * XFL's product line-up (8 Oct 2026), in the order shown everywhere. RMS,
 * Market Data and Exchange Connectivity are no longer listed as products.
 */
const LINEUP = ["trading-platform", "ost", "smart-stock", "back-office", "bo-account-opening", "ekyc", "dms"];
const RETIRED = ["rms", "market-data", "exchange-connectivity"];

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
    targetCustomers: t("TREC-holder brokerage houses, their dealers and their investors.", "ট্রেক (TREC) হোল্ডার ব্রোকারেজ হাউস, তাদের ডিলার ও বিনিয়োগকারীরা।"),
    items: {
      WORKFLOW_STEP: [
        { title: t("Order entry", "অর্ডার প্রদান"), body: t("A dealer or investor enters an order on web, desktop or mobile.", "ডিলার বা বিনিয়োগকারী ওয়েব, ডেস্কটপ বা মোবাইল থেকে অর্ডার দেন।") },
        { title: t("RMS pre-trade check", "আরএমএস প্রি-ট্রেড যাচাই"), body: t("RMS, built into the OMS, checks the order before it leaves: blocked BO account, short sell, buying power and margin, order limits, price band and exposure.", "ওএমএস-এর ভেতরে যুক্ত আরএমএস অর্ডার বের হওয়ার আগে যাচাই করে: ব্লকড বিও অ্যাকাউন্ট, শর্ট সেল, ক্রয়ক্ষমতা ও মার্জিন, অর্ডারের সীমা, প্রাইস ব্যান্ড ও এক্সপোজার।") },
        { title: t("Exchange", "এক্সচেঞ্জ"), body: t("The order is routed to DSE or CSE.", "অর্ডারটি ডিএসই বা সিএসই-তে পাঠানো হয়।") },
        { title: t("Execution", "সম্পাদন"), body: t("Executions are reported back to the platform.", "সম্পাদিত লেনদেনের তথ্য প্ল্যাটফর্মে ফিরে আসে।") },
        { title: t("Portfolio update", "পোর্টফোলিও হালনাগাদ"), body: t("Holdings and balances update for the investor.", "বিনিয়োগকারীর হোল্ডিং ও ব্যালান্স হালনাগাদ হয়।") },
        { title: t("Back office", "ব্যাক অফিস"), body: t("Trades flow on to settlement and reporting.", "লেনদেন সেটেলমেন্ট ও রিপোর্টিংয়ে চলে যায়।") },
      ],
      ARCHITECTURE_LAYER: [
        { title: t("Channels", "চ্যানেল"), body: t("Web, desktop and branded mobile apps for investors and dealers.", "বিনিয়োগকারী ও ডিলারদের জন্য ওয়েব, ডেস্কটপ ও নিজস্ব ব্র্যান্ডের মোবাইল অ্যাপ।") },
        { title: t("Order management", "অর্ডার ব্যবস্থাপনা"), body: t("Order entry, amendment, cancellation and order book.", "অর্ডার দেওয়া, সংশোধন, বাতিল এবং অর্ডার বুক।") },
        { title: t("Risk controls (RMS)", "ঝুঁকি নিয়ন্ত্রণ (আরএমএস)"), body: t("RMS, built into the OMS: pre-trade limit and exposure checks on every order.", "ওএমএস-এর ভেতরেই যুক্ত আরএমএস: প্রতিটি অর্ডারে লেনদেনের আগে সীমা ও এক্সপোজার যাচাই।") },
        { title: t("Market connectivity", "বাজার সংযোগ"), body: t("Connections to Dhaka Stock Exchange and Chittagong Stock Exchange.", "ঢাকা স্টক এক্সচেঞ্জ ও চট্টগ্রাম স্টক এক্সচেঞ্জের সঙ্গে সংযোগ।") },
        { title: t("Back office", "ব্যাক অফিস"), body: t("Settlement, accounts and reporting downstream.", "পরবর্তী ধাপে সেটেলমেন্ট, হিসাব ও রিপোর্টিং।") },
      ],
      INTEGRATION: [
        { title: t("Dhaka Stock Exchange", "ঢাকা স্টক এক্সচেঞ্জ"), body: t("Order routing and market data for DSE.", "ডিএসই-র জন্য অর্ডার রাউটিং ও বাজার তথ্য।"), icon: "exchange" },
        { title: t("Chittagong Stock Exchange", "চট্টগ্রাম স্টক এক্সচেঞ্জ"), body: t("Order routing and market data for CSE.", "সিএসই-র জন্য অর্ডার রাউটিং ও বাজার তথ্য।"), icon: "exchange" },
        { title: t("Brokerage back office", "ব্রোকারেজ ব্যাক অফিস"), body: t("Executed trades handed to back-office systems.", "সম্পাদিত লেনদেন ব্যাক অফিস সিস্টেমে পাঠানো হয়।"), icon: "chart" },
        { title: t("APIs", "এপিআই"), body: t("API-driven, so it can work with a brokerage's existing back-office, risk or reporting systems.", "এপিআই-ভিত্তিক, তাই ব্রোকারেজের বিদ্যমান ব্যাক অফিস, ঝুঁকি বা রিপোর্টিং সিস্টেমের সঙ্গে কাজ করতে পারে।"), icon: "network" },
      ],
      SECURITY: [
        { title: t("Role-based access", "ভূমিকাভিত্তিক প্রবেশাধিকার"), body: t("Dealers, supervisors and investors see only what their role allows.", "ডিলার, সুপারভাইজার ও বিনিয়োগকারীরা শুধু নিজ নিজ ভূমিকায় অনুমোদিত তথ্যই দেখেন।") },
        { title: t("Risk checks on every order", "প্রতিটি অর্ডারে ঝুঁকি যাচাই"), body: t("Every order passes limit and exposure checks before reaching the exchange.", "এক্সচেঞ্জে পৌঁছানোর আগে প্রতিটি অর্ডার সীমা ও এক্সপোজার যাচাই পার হয়।") },
        { title: t("Activity records", "কার্যক্রমের রেকর্ড"), body: t("Order actions are recorded for review.", "পর্যালোচনার জন্য অর্ডার-সংক্রান্ত প্রতিটি কাজ রেকর্ড করা হয়।") },
      ],
      TARGET_USER: [
        { title: t("Investors", "বিনিয়োগকারী"), body: t("Trade and follow their portfolio from mobile, web or desktop.", "মোবাইল, ওয়েব বা ডেস্কটপ থেকে লেনদেন করেন ও পোর্টফোলিও দেখেন।") },
        { title: t("Dealers", "ডিলার"), body: t("Place and manage orders for clients.", "গ্রাহকের পক্ষে অর্ডার দেন ও পরিচালনা করেন।") },
        { title: t("Brokerage management", "ব্রোকারেজ ব্যবস্থাপনা"), body: t("Oversee trading activity across the house.", "পুরো প্রতিষ্ঠানের লেনদেন কার্যক্রম তদারকি করেন।") },
      ],
      FAQ: [
        { title: t("Which exchanges does it connect to?", "এটি কোন কোন এক্সচেঞ্জের সঙ্গে যুক্ত?"), body: t("Dhaka Stock Exchange and Chittagong Stock Exchange.", "ঢাকা স্টক এক্সচেঞ্জ ও চট্টগ্রাম স্টক এক্সচেঞ্জ।") },
        { title: t("Can it work with our existing systems?", "এটি কি আমাদের বিদ্যমান সিস্টেমের সঙ্গে কাজ করবে?"), body: t("Yes. The platform is API-driven and can be fitted to existing back-office, risk or reporting systems.", "হ্যাঁ। প্ল্যাটফর্মটি এপিআই-ভিত্তিক এবং বিদ্যমান ব্যাক অফিস, ঝুঁকি বা রিপোর্টিং সিস্টেমের সঙ্গে যুক্ত করা যায়।") },
        { title: t("Can we offer our own branded app?", "আমরা কি নিজস্ব ব্র্যান্ডের অ্যাপ দিতে পারব?"), body: t("Yes. Several consortium brokerages already offer branded trading apps built on the platform.", "হ্যাঁ। কনসোর্টিয়ামের কয়েকটি ব্রোকারেজ ইতিমধ্যে এই প্ল্যাটফর্মে তৈরি নিজস্ব ব্র্যান্ডের ট্রেডিং অ্যাপ চালু করেছে।") },
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
    problem: t("Without automatic checks, an order that breaches a client's limits can reach the exchange before anyone notices.", "স্বয়ংক্রিয় যাচাই না থাকলে গ্রাহকের সীমা ছাড়ানো অর্ডার কারও নজরে আসার আগেই এক্সচেঞ্জে পৌঁছে যেতে পারে।"),
    solution: t("Limits are configured once and applied to every order automatically. Orders that fail a check are stopped with a reason, so dealers and clients know why.", "সীমা একবার নির্ধারণ করলেই প্রতিটি অর্ডারে স্বয়ংক্রিয়ভাবে প্রয়োগ হয়। যাচাইয়ে আটকে যাওয়া অর্ডার কারণসহ থামানো হয়, ফলে ডিলার ও গ্রাহক কারণটা জানতে পারেন।"),
    targetCustomers: t("Brokerage risk and compliance teams, and supervisors.", "ব্রোকারেজের ঝুঁকি ও কমপ্লায়েন্স টিম এবং সুপারভাইজাররা।"),
    items: {
      WORKFLOW_STEP: [
        { title: t("Order", "অর্ডার") },
        { title: t("Pre-trade check", "প্রি-ট্রেড যাচাই"), body: t("Each order is checked before submission.", "জমা দেওয়ার আগে প্রতিটি অর্ডার যাচাই করা হয়।") },
        { title: t("Limits", "সীমা"), body: t("Configured limits are applied per client and per brokerage.", "নির্ধারিত সীমা প্রতিটি গ্রাহক ও প্রতিটি ব্রোকারেজ অনুযায়ী প্রয়োগ হয়।") },
        { title: t("Decision", "সিদ্ধান্ত"), body: t("The order is accepted, or rejected with a reason.", "অর্ডারটি গৃহীত হয়, অথবা কারণসহ প্রত্যাখ্যাত হয়।") },
        { title: t("Execution", "সম্পাদন") },
        { title: t("Monitoring", "পর্যবেক্ষণ"), body: t("Exposure is followed after execution.", "লেনদেন সম্পাদনের পর এক্সপোজার পর্যবেক্ষণ করা হয়।") },
      ],
      CAPABILITY: [
        { title: t("Pre-trade limit checks", "লেনদেনের আগে সীমা যাচাই"), body: t("Every order is checked before it leaves the brokerage.", "ব্রোকারেজ থেকে বের হওয়ার আগে প্রতিটি অর্ডার যাচাই করা হয়।"), icon: "shield" },
        { title: t("Configurable limits", "নিজের মতো নির্ধারণযোগ্য সীমা"), body: t("Limits set by the brokerage, per client and overall.", "ব্রোকারেজ নিজেই সীমা ঠিক করে, গ্রাহকভিত্তিক ও সামগ্রিকভাবে।"), icon: "lock" },
        { title: t("Clear rejection reasons", "প্রত্যাখ্যানের স্পষ্ট কারণ"), body: t("Rejected orders carry the reason, for dealers and clients.", "প্রত্যাখ্যাত অর্ডারে ডিলার ও গ্রাহকের জন্য কারণ উল্লেখ থাকে।"), icon: "check" },
        { title: t("Exposure monitoring", "এক্সপোজার পর্যবেক্ষণ"), body: t("Risk teams follow positions and exposure after execution.", "লেনদেনের পর ঝুঁকি টিম পজিশন ও এক্সপোজার পর্যবেক্ষণ করে।"), icon: "chart" },
      ],
      TARGET_USER: [
        { title: t("Risk teams", "ঝুঁকি ব্যবস্থাপনা টিম") },
        { title: t("Compliance officers", "কমপ্লায়েন্স কর্মকর্তা") },
        { title: t("Dealing supervisors", "ডিলিং সুপারভাইজার") },
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
    problem: t("Paper forms mean office visits, missing documents and slow back-and-forth before an investor can trade.", "কাগজের ফরম মানে অফিসে যাওয়া, কাগজপত্রের ঘাটতি আর লেনদেন শুরুর আগে দীর্ঘ আসা-যাওয়া।"),
    solution: t("Applications arrive complete and in one queue. Documents are stored with the application in DMS, and every review step is recorded.", "আবেদন সম্পূর্ণ অবস্থায় এক সারিতে জমা হয়। কাগজপত্র আবেদনসহ ডিএমএস-এ সংরক্ষিত থাকে এবং যাচাইয়ের প্রতিটি ধাপ রেকর্ড হয়।"),
    targetCustomers: t("New investors and brokerage operations teams.", "নতুন বিনিয়োগকারী ও ব্রোকারেজের অপারেশনস টিম।"),
    items: {
      WORKFLOW_STEP: [
        { title: t("Start application", "আবেদন শুরু") },
        { title: t("Personal details", "ব্যক্তিগত তথ্য") },
        { title: t("Document upload", "নথি আপলোড"), body: t("Required documents are uploaded and kept in DMS.", "প্রয়োজনীয় কাগজপত্র আপলোড করে ডিএমএস-এ রাখা হয়।") },
        { title: t("Review", "পর্যালোচনা"), body: t("Operations staff check the application.", "অপারেশনস কর্মীরা আবেদন যাচাই করেন।") },
        { title: t("Approval", "অনুমোদন") },
        { title: t("BO account created", "বিও অ্যাকাউন্ট তৈরি") },
        { title: t("Ready to trade", "লেনদেনের জন্য প্রস্তুত") },
      ],
      CAPABILITY: [
        { title: t("Online application", "অনলাইনে আবেদন"), body: t("Investors apply without visiting the office.", "বিনিয়োগকারীরা অফিসে না এসেই আবেদন করেন।"), icon: "users" },
        { title: t("Document upload", "কাগজপত্র আপলোড"), body: t("Documents attached to the application and stored in DMS.", "কাগজপত্র আবেদনের সঙ্গে যুক্ত হয়ে ডিএমএস-এ সংরক্ষিত থাকে।"), icon: "document" },
        { title: t("Review queue", "যাচাইয়ের সারি"), body: t("One queue for operations staff, with correction requests.", "অপারেশনস কর্মীদের জন্য একটি সারি, সংশোধনের অনুরোধসহ।"), icon: "check" },
        { title: t("Status tracking", "অবস্থা অনুসরণ"), body: t("Applicants and staff can see where each application stands.", "আবেদনকারী ও কর্মীরা প্রতিটি আবেদনের বর্তমান অবস্থা দেখতে পারেন।"), icon: "chart" },
      ],
      TARGET_USER: [
        { title: t("New investors", "নতুন বিনিয়োগকারী") },
        { title: t("Operations teams", "অপারেশনস টিম") },
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
    problem: t("Client files spread across cabinets, inboxes and shared drives are hard to find, hard to protect and hard to audit.", "আলমারি, ইনবক্স আর শেয়ার্ড ড্রাইভে ছড়িয়ে থাকা গ্রাহকের ফাইল খুঁজে পাওয়া, সুরক্ষিত রাখা ও নিরীক্ষা করা কঠিন।"),
    solution: t("One store for client documents, linked to the client and to the workflow that created them, with access control and a record of who did what.", "গ্রাহকের সব কাগজপত্রের জন্য একটি ভান্ডার, গ্রাহক ও সংশ্লিষ্ট কার্যপ্রবাহের সঙ্গে যুক্ত, প্রবেশাধিকার নিয়ন্ত্রণ এবং কে কী করেছেন তার রেকর্ডসহ।"),
    targetCustomers: t("Brokerage operations and compliance teams.", "ব্রোকারেজের অপারেশনস ও কমপ্লায়েন্স টিম।"),
    items: {
      WORKFLOW_STEP: [
        { title: t("Capture", "সংগ্রহ") },
        { title: t("Secure storage", "নিরাপদ সংরক্ষণ") },
        { title: t("Controlled access", "নিয়ন্ত্রিত প্রবেশাধিকার"), body: t("Only authorised staff can view or act on documents.", "শুধু অনুমোদিত কর্মীরাই কাগজপত্র দেখতে বা তাতে কাজ করতে পারেন।") },
        { title: t("Approval", "অনুমোদন") },
        { title: t("Audit trail", "অডিট ট্রেইল"), body: t("Every action on a document is recorded.", "কাগজপত্রে করা প্রতিটি কাজ রেকর্ড হয়।") },
      ],
      CAPABILITY: [
        { title: t("Central document store", "কেন্দ্রীয় কাগজপত্র ভান্ডার"), icon: "document" },
        { title: t("Role-based access", "ভূমিকাভিত্তিক প্রবেশাধিকার"), icon: "lock" },
        { title: t("Linked to client records", "গ্রাহকের রেকর্ডের সঙ্গে যুক্ত"), icon: "users" },
        { title: t("Audit trail", "নিরীক্ষার রেকর্ড"), icon: "shield" },
      ],
      SECURITY: [
        { title: t("Access by role", "ভূমিকা অনুযায়ী প্রবেশাধিকার"), body: t("Staff only see documents their role allows.", "কর্মীরা শুধু নিজ ভূমিকায় অনুমোদিত কাগজপত্র দেখেন।") },
        { title: t("Recorded actions", "রেকর্ড করা কার্যক্রম"), body: t("Views, uploads and changes are logged.", "দেখা, আপলোড ও পরিবর্তন সবই লগে থাকে।") },
      ],
    },
  },
  {
    key: "back-office",
    type: "PRODUCT",
    slug: "back-office",
    name: t("Brokerage Back Office", "ব্রোকারেজ ব্যাক অফিস"),
    tagline: t("Accounts, settlement and reporting after the trade.", "লেনদেনের পরে হিসাব, সেটেলমেন্ট ও রিপোর্টিং।"),
    summary: t(
      "The back-office system that takes over once trades are executed: client accounts, settlement with banks and the depository, and the reports brokerages and regulators need.",
      "লেনদেন সম্পন্ন হওয়ার পর যে ব্যাক-অফিস ব্যবস্থা দায়িত্ব নেয়: গ্রাহকের হিসাব, ব্যাংক ও ডিপোজিটরির সঙ্গে সেটেলমেন্ট এবং ব্রোকারেজ ও নিয়ন্ত্রকদের প্রয়োজনীয় রিপোর্ট।",
    ),
    targetCustomers: t("Brokerage accounts, settlement and reporting teams.", "ব্রোকারেজের হিসাব, সেটেলমেন্ট ও রিপোর্টিং টিম।"),
    items: {
      WORKFLOW_STEP: [
        { title: t("Executed trades", "সম্পাদিত লেনদেন") },
        { title: t("Client accounts", "গ্রাহকের হিসাব") },
        { title: t("Settlement", "সেটেলমেন্ট") },
        { title: t("Reporting", "প্রতিবেদন") },
      ],
      CAPABILITY: [
        { title: t("Client accounts and ledgers", "গ্রাহকের হিসাব ও লেজার"), icon: "chart" },
        { title: t("Settlement", "সেটেলমেন্ট"), icon: "exchange" },
        { title: t("Reports", "রিপোর্ট"), icon: "document" },
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
        { title: t("Prices and indices", "মূল্য ও সূচক"), icon: "chart" },
        { title: t("Market breadth", "বাজারের ব্যাপ্তি"), icon: "globe" },
        { title: t("Top gainers and losers", "সর্বোচ্চ বৃদ্ধি ও হ্রাস"), icon: "exchange" },
        { title: t("Watchlists and charts in the apps", "অ্যাপে ওয়াচলিস্ট ও চার্ট"), icon: "users" },
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
        { title: t("DSE (FIX)", "ডিএসই (FIX)"), body: t("FIX connectivity to Dhaka Stock Exchange.", "ঢাকা স্টক এক্সচেঞ্জের সঙ্গে FIX সংযোগ।"), icon: "exchange" },
        { title: t("CSE (API)", "সিএসই (API)"), body: t("API connectivity to Chittagong Stock Exchange.", "চট্টগ্রাম স্টক এক্সচেঞ্জের সঙ্গে API সংযোগ।"), icon: "exchange" },
      ],
    },
  },
  // Confirmed, details pending: created as drafts with names only.
  { key: "smart-stock", type: "PRODUCT", slug: "smart-stock", name: t("Smart Stock", "স্মার্ট স্টক") },
  { key: "ost", type: "PRODUCT", slug: "ost", name: t("Online Share Trading (OST)", "অনলাইন শেয়ার ট্রেডিং (ওএসটি)") },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

type TrFields = "tagline" | "summary" | "problem" | "solution" | "targetCustomers";
const TR_FIELDS: TrFields[] = ["tagline", "summary", "problem", "solution", "targetCustomers"];

let bnItemsAdded = 0;

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
    if (count > 0) {
      // Items already there: add a missing Bangla version to the ones that still read as seeded (same English title).
      for (const item of items) {
        if (!item.title.bn) continue;
        const match = await db.offeringItem.findFirst({
          where: { offeringId: offering.id, kind, translations: { some: { locale: EN, title: item.title.en } } },
          include: { translations: { where: { locale: BN } } },
        });
        if (match && match.translations.length === 0) {
          await db.offeringItemTranslation.create({ data: { itemId: match.id, locale: BN, title: item.title.bn, body: item.body?.bn ?? null } });
          bnItemsAdded++;
        }
      }
      continue;
    }
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

/**
 * Applies the line-up once (a marker in Settings records it), so later edits in
 * Admin → Products are not undone: the seven products published in order, the
 * retired ones moved to drafts, and the ecosystem nodes to match.
 */
async function applyProductLineup() {
  const MARK = "seed.product-lineup-2026-10-08";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  for (const [i, key] of LINEUP.entries()) {
    await db.offering.updateMany({ where: { key, deletedAt: null }, data: { status: "PUBLISHED", publishAt: null, sortOrder: i + 1, parentId: null, hasOwnPage: true } });
  }
  await db.offering.updateMany({ where: { key: { in: RETIRED } }, data: { status: "DRAFT" } });
  // Names XFL uses for them.
  const rename: [string, string, string][] = [
    ["trading-platform", "Xpert Trading OMS", "এক্সপার্ট ট্রেডিং ওএমএস"],
    ["ost", "Online Share Trading (OST)", "অনলাইন শেয়ার ট্রেডিং (ওএসটি)"],
  ];
  for (const [key, en, bn] of rename) {
    const o = await db.offering.findUnique({ where: { key } });
    if (!o) continue;
    await db.offeringTranslation.updateMany({ where: { offeringId: o.id, locale: EN }, data: { name: en } });
    await db.offeringTranslation.updateMany({ where: { offeringId: o.id, locale: BN }, data: { name: bn } });
  }
  await db.ecosystemNode.updateMany({ where: { key: { in: ["ost", "ekyc"] } }, data: { status: "PUBLISHED" } });
  // The Products menu: the seven in order, the retired ones hidden, missing ones added.
  const MENU: Record<string, { en: string; bn: string; descEn: string; descBn: string }> = {
    ost: { en: "Online Share Trading (OST)", bn: "অনলাইন শেয়ার ট্রেডিং (ওএসটি)", descEn: "Online share trading.", descBn: "অনলাইনে শেয়ার লেনদেন।" },
    "smart-stock": { en: "Smart Stock", bn: "স্মার্ট স্টক", descEn: "", descBn: "" },
  };
  const parents = await db.navItem.findMany({ where: { href: "products", parentId: null } });
  for (const parent of parents) {
    const kids = await db.navItem.findMany({ where: { parentId: parent.id } });
    await db.navItem.updateMany({ where: { parentId: parent.id, href: { in: RETIRED.map((k) => `products/${k}`) } }, data: { isHidden: true } });
    for (const [i, key] of LINEUP.entries()) {
      const href = `products/${key}`;
      const kid = kids.find((k) => k.href === href);
      if (kid) {
        await db.navItem.update({ where: { id: kid.id }, data: { sortOrder: i, isHidden: false } });
        if (key === "trading-platform") {
          await db.navItemTranslation.updateMany({ where: { itemId: kid.id, locale: EN }, data: { label: "Xpert Trading OMS" } });
          await db.navItemTranslation.updateMany({ where: { itemId: kid.id, locale: BN }, data: { label: "এক্সপার্ট ট্রেডিং ওএমএস" } });
        }
      }
      else if (MENU[key]) {
        const m = MENU[key]!;
        await db.navItem.create({
          data: {
            menuId: parent.menuId,
            parentId: parent.id,
            linkType: "INTERNAL",
            href,
            sortOrder: i,
            translations: { create: [{ locale: EN, label: m.en, description: m.descEn || null }, { locale: BN, label: m.bn, description: m.descBn || null }] },
          },
        });
      }
    }
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
  console.log(`• Products: ${LINEUP.length} listed in XFL's order; RMS, Market Data and Exchange Connectivity moved to drafts`);
}

// ── People ───────────────────────────────────────────────────────────────────

async function seedPeople() {
  // Publish the management team already in the database (names from Xpert's own site).
  const updated = await db.person.updateMany({
    where: { status: "DRAFT", deletedAt: null, roles: { some: { group: "MANAGEMENT" } } },
    data: { status: "PUBLISHED" },
  });
  if (updated.count) console.log(`• Published ${updated.count} management profiles`);
}

// ── Roster (Board, ManCom and the whole team, from XFL) ──────────────────────

const BN_TITLES: Record<string, string> = {
  Consultant: "পরামর্শক",
  Chairman: "চেয়ারম্যান",
  Director: "পরিচালক",
  "Managing Director": "ব্যবস্থাপনা পরিচালক",
  "Executive Director": "নির্বাহী পরিচালক",
  "CFO & Company Secretary": "সিএফও ও কোম্পানি সচিব",
  "Head of Application Support and Development": "প্রধান, অ্যাপ্লিকেশন সাপোর্ট ও ডেভেলপমেন্ট",
  "Senior Principal Software Engineer": "সিনিয়র প্রিন্সিপাল সফটওয়্যার ইঞ্জিনিয়ার",
  "Principal Software Engineer": "প্রিন্সিপাল সফটওয়্যার ইঞ্জিনিয়ার",
  "Senior Software Engineer": "সিনিয়র সফটওয়্যার ইঞ্জিনিয়ার",
  "Software Engineer": "সফটওয়্যার ইঞ্জিনিয়ার",
  "QA Software Engineer": "কিউএ সফটওয়্যার ইঞ্জিনিয়ার",
  "Business Analyst": "বিজনেস অ্যানালিস্ট",
  "React Native App Developer": "রিঅ্যাক্ট নেটিভ অ্যাপ ডেভেলপার",
  "Support Manager": "সাপোর্ট ম্যানেজার",
  "Support Engineer": "সাপোর্ট ইঞ্জিনিয়ার",
  "Marketing Manager": "মার্কেটিং ম্যানেজার",
  "Network Administrator": "নেটওয়ার্ক অ্যাডমিনিস্ট্রেটর",
  "System and Network Engineer": "সিস্টেম ও নেটওয়ার্ক ইঞ্জিনিয়ার",
  "Senior Executive, HR & Admin": "সিনিয়র এক্সিকিউটিভ, এইচআর ও অ্যাডমিন",
  "Receptionist": "রিসেপশনিস্ট",
};

/** A portrait in prisma/seed-media/people/<key>.(png|jpg) → media library id (same file twice = one item). */
async function portraitFor(key: string, name: string): Promise<string | null> {
  return seedImage("people", key, name, ["portrait"]);
}

/** An image in prisma/seed-media/<folder>/<key>.(png|jpg|webp) → media library id; the same file is stored once. */
let repairedFiles = 0;

/** True when a person's current photo can actually be shown (record live and file on disk). */
async function photoWorks(mediaId: string | null): Promise<boolean> {
  if (!mediaId) return false;
  const m = await db.media.findUnique({ where: { id: mediaId }, select: { deletedAt: true, isScanned: true, storageKey: true, kind: true } });
  return !!m && !m.deletedAt && m.isScanned && m.kind === "IMAGE" && existsSync(path.join(process.cwd(), "storage", "media", m.storageKey));
}

async function seedImage(folder: string, key: string, name: string, tags: string[]): Promise<string | null> {
  const dir = path.join(process.cwd(), "prisma", "seed-media", folder);
  const file = ["png", "jpg", "jpeg", "webp"].map((ext) => path.join(dir, `${key}.${ext}`)).find((f) => existsSync(f));
  if (!file) return null;
  const data = await readFile(file);
  const type = sniff(data);
  if (!type || type.kind !== "IMAGE") return null;
  const checksum = createHash("sha256").update(data).digest("hex");
  const existing = await db.media.findFirst({ where: { checksum, deletedAt: null }, select: { id: true, storageKey: true, isScanned: true } });
  if (existing) {
    // The record exists but its file may not (e.g. a database copied without the storage folder): put it back.
    const onDisk = path.join(process.cwd(), "storage", "media", existing.storageKey);
    if (!existsSync(onDisk)) {
      await mkdir(path.dirname(onDisk), { recursive: true });
      await writeFile(onDisk, data);
      repairedFiles++;
    }
    if (!existing.isScanned) await db.media.update({ where: { id: existing.id }, data: { isScanned: true } });
    return existing.id;
  }
  const storageKey = `${randomUUID()}.${type.ext}`;
  const store = path.join(process.cwd(), "storage", "media");
  await mkdir(store, { recursive: true });
  await writeFile(path.join(store, storageKey), data, { flag: "wx" });
  const media = await db.media.create({
    data: {
      kind: "IMAGE",
      storageKey,
      originalName: path.basename(file),
      mimeType: type.mimeType,
      sizeBytes: data.length,
      width: type.width ?? null,
      height: type.height ?? null,
      checksum,
      isScanned: true,
      tags,
      translations: { create: { locale: EN, altText: name } },
    },
  });
  return media.id;
}

/**
 * Adds everyone XFL listed, in order of position. Matches existing profiles by
 * key or by English name (e.g. people the importer created), and only fills in
 * what is empty: a name, title, department, photo or order changed in
 * Admin → People is never overwritten. Profiles no admin has edited yet are
 * published.
 */
async function seedRoster() {
  const groups: [PersonGroup, RosterPerson[]][] = [
    ["BOARD", BOARD],
    ["MANAGEMENT", MANAGEMENT],
    ["CONSULTANT", CONSULTANTS],
    ["TEAM", TEAM],
  ];
  const byKey = new Map<string, RosterPerson>();
  for (const [, list] of groups) for (const p of list) byKey.set(p.key, { ...byKey.get(p.key), ...p, department: p.department ?? byKey.get(p.key)?.department ?? null });
  let added = 0;
  let photos = 0;
  const ids = new Map<string, string>();
  for (const p of byKey.values()) {
    let person =
      (await db.person.findUnique({ where: { key: p.key } })) ??
      (await db.person.findFirst({
        where: { deletedAt: null, translations: { some: { locale: EN, name: { in: [p.name, ...(p.formerName ? [p.formerName] : [])], mode: "insensitive" } } } },
      }));
    if (!person) {
      person = await db.person.create({ data: { key: p.key, status: "PUBLISHED", sortOrder: p.rank, department: p.department ?? null } });
      added++;
    } else {
      const fresh = !person.updatedById; // never saved in Admin → People
      await db.person.update({
        where: { id: person.id },
        data: {
          ...(!person.key && { key: p.key }),
          ...(!person.department && p.department && { department: p.department }),
          ...(fresh && person.status === "DRAFT" && !person.deletedAt && { status: "PUBLISHED" as const }),
          ...(fresh && { isPlaceholder: false }),
        },
      });
    }
    ids.set(p.key, person.id);
    await db.personTranslation.upsert({
      where: { personId_locale: { personId: person.id, locale: EN } },
      update: {},
      create: { personId: person.id, locale: EN, name: p.name },
    });
    // Correct an older spelling (e.g. from the previous website) unless an admin has edited the profile.
    if (p.formerName && !person.updatedById) {
      await db.personTranslation.updateMany({ where: { personId: person.id, locale: EN, name: p.formerName }, data: { name: p.name } });
    }
    // No photo, or one that cannot be shown (deleted, unapproved or its file missing): use XFL's portrait.
    if (!(await photoWorks(person.photoMediaId))) {
      const photo = await portraitFor(p.key, p.name);
      if (photo) {
        await db.person.update({ where: { id: person.id }, data: { photoMediaId: photo } });
        await db.mediaUsage.deleteMany({ where: { entityType: "PERSON", entityId: person.id, field: "photo" } });
        await db.mediaUsage.create({ data: { mediaId: photo, entityType: "PERSON", entityId: person.id, field: "photo" } });
        photos++;
      }
    }
  }
  for (const [group, list] of groups) {
    for (const p of list) {
      const personId = ids.get(p.key)!;
      // Profiles nobody has saved in Admin → People follow XFL's list: position order and corrected titles.
      const fresh = !(await db.person.findUnique({ where: { id: personId }, select: { updatedById: true } }))?.updatedById;
      const role = await db.personRole.upsert({
        where: { personId_group: { personId, group } },
        update: fresh ? { sortOrder: p.rank } : {},
        create: { personId, group, sortOrder: p.rank },
      });
      if (!p.title) continue;
      if (fresh && p.formerTitle) {
        await db.personRoleTranslation.updateMany({ where: { roleId: role.id, locale: EN, title: p.formerTitle }, data: { title: p.title } });
      }
      const titles: [Locale, string | undefined][] = [
        [EN, p.title],
        [BN, BN_TITLES[p.title]],
      ];
      for (const [locale, title] of titles) {
        if (!title) continue;
        const existing = await db.personRoleTranslation.findUnique({ where: { roleId_locale: { roleId: role.id, locale } } });
        if (!existing) await db.personRoleTranslation.create({ data: { roleId: role.id, locale, title } });
        else if (!existing.title.trim()) await db.personRoleTranslation.update({ where: { id: existing.id }, data: { title } });
      }
    }
  }
  // Consultants: their organization under the title ("Consultant" / "Xpert Fintech Ltd."), unless already filled in.
  for (const c of CONSULTANTS) {
    const personId = ids.get(c.key);
    if (!personId || !c.affiliation) continue;
    for (const [locale, text] of [[EN, c.affiliation.en], [BN, c.affiliation.bn]] as const) {
      const tr = await db.personTranslation.findUnique({ where: { personId_locale: { personId, locale } } });
      if (tr && !tr.affiliation) await db.personTranslation.update({ where: { id: tr.id }, data: { affiliation: text } });
      else if (!tr && locale === BN && c.nameBn) await db.personTranslation.create({ data: { personId, locale: BN, name: c.nameBn, affiliation: text } });
    }
    // The Bangla name follows XFL's spelling (e.g. with "এফসিএ") unless the profile was edited in Admin → People.
    const edited = (await db.person.findUnique({ where: { id: personId }, select: { updatedById: true } }))?.updatedById;
    if (c.nameBn && !edited) {
      await db.personTranslation.updateMany({ where: { personId, locale: BN, NOT: { name: c.nameBn } }, data: { name: c.nameBn } });
    }
  }
  // Board and management biographies and positions (XFL, 8 Oct 2026): filled where still empty, or where an
  // earlier seeded position is still in place; anything written in Admin → People is kept.
  let profiles = 0;
  for (const d of DIRECTOR_PROFILES) {
    const person = ids.get(d.key)
      ? await db.person.findUnique({ where: { id: ids.get(d.key)! } })
      : await db.person.findUnique({ where: { key: d.key } });
    if (!person) continue;
    const personId = person.id;
    if (d.linkedinUrl && !person.linkedinUrl) await db.person.update({ where: { id: personId }, data: { linkedinUrl: d.linkedinUrl } });
    for (const locale of [EN, BN] as const) {
      const lang = locale === EN ? "en" : "bn";
      const tr = await db.personTranslation.findUnique({ where: { personId_locale: { personId, locale } } });
      if (!tr) {
        // No Bangla version yet: create it with the Bangla name, biography and position.
        if (locale === BN) {
          await db.personTranslation.create({ data: { personId, locale: BN, name: d.nameBn, bio: d.bio?.bn ?? null, affiliation: d.affiliation?.bn ?? null } });
          profiles++;
        }
        continue;
      }
      const current = tr.affiliation?.trim() ?? "";
      const data = {
        ...(d.bio && !tr.bio?.trim() && { bio: d.bio[lang] }),
        ...(d.affiliation && (!current || (d.replaces ?? []).includes(current)) && current !== d.affiliation[lang] && { affiliation: d.affiliation[lang] }),
        // The Bangla name follows XFL's spelling unless the profile was edited in the admin.
        ...(locale === BN && !person.updatedById && tr.name !== d.nameBn && { name: d.nameBn }),
      };
      if (Object.keys(data).length) {
        await db.personTranslation.update({ where: { id: tr.id }, data });
        profiles++;
      }
    }
  }
  if (profiles) console.log(`• Board and management profiles: biography, position or Bangla name updated in ${profiles} profile text(s)`);
  // Company websites XFL gave for directors' organizations (kept if already set).
  for (const [key, url] of [["ucb-stock-brokerage", "https://ucbstock.com.bd"], ["nli-securities", "https://nlisecurities.com"]] as const) {
    await db.organization.updateMany({ where: { key, websiteUrl: null }, data: { websiteUrl: url } });
  }
  // The stand-in board cards are no longer needed once the real board is in: move untouched ones to the trash.
  const trashed = await db.person.updateMany({
    where: { key: { startsWith: "placeholder-" }, isPlaceholder: true, deletedAt: null, updatedById: null },
    data: { deletedAt: new Date() },
  });
  const withPhoto = await db.person.count({ where: { deletedAt: null, photoMediaId: { not: null }, roles: { some: { group: { in: ["BOARD", "MANAGEMENT"] } } } } });
  console.log(`• People: ${byKey.size} from XFL's list (${added} new, ${photos} photo${photos === 1 ? "" : "s"} added${repairedFiles ? `, ${repairedFiles} missing image file(s) restored` : ""}; ${withPhoto} board/management profiles have a photo)${trashed.count ? `, ${trashed.count} stand-in profile(s) moved to the trash` : ""}`);
}

/**
 * Chairman's and Managing Director's messages and the market-share goal.
 * The messages are drafts for XFL to approve: they are saved unpublished and
 * appear on the site only after "Publish" is ticked in Admin → Messages.
 */
async function seedMessagesAndGoal() {
  for (const m of LEADER_MESSAGES) {
    await db.siteSetting.upsert({
      where: { key: `message.${m.key}` },
      update: {},
      create: { key: `message.${m.key}`, value: { personKey: m.personKey, published: false, en: m.en, bn: m.bn } },
    });
  }
  await db.siteSetting.upsert({ where: { key: "market.goal" }, update: {}, create: { key: "market.goal", value: MARKET_GOAL } });
  // Overall share of DSE and CSE turnover as given by XFL (8 Oct 2026); editable in Admin → Market data.
  if (!(await db.siteSetting.findUnique({ where: { key: "market.headlineShare" } }))) {
    await db.siteSetting.create({ data: { key: "market.headlineShare", value: { pct: 45, asOf: "2026-10-08" } } });
    console.log("• Overall market share set to 45% (Admin → Market data → Overall market share)");
  }
  // Says what is actually stored (the messages are published by a later step at XFL's instruction).
  const states = await db.siteSetting.findMany({ where: { key: { in: LEADER_MESSAGES.map((m) => `message.${m.key}`) } } });
  const live = states.filter((r) => (r.value as { published?: boolean } | null)?.published === true).length;
  console.log(`• Chairman's and MD's messages: ${live} of ${LEADER_MESSAGES.length} published (Admin → Messages); market-share goal set`);
}

/**
 * Privacy policy, Terms of use and Accessibility statement as DRAFT pages
 * (the footer already links to them). Created once; never published or
 * overwritten by the seed: XFL's legal adviser reviews them in Admin → Pages.
 */
async function seedLegalDrafts() {
  let added = 0;
  for (const d of LEGAL_DRAFTS) {
    const taken = await db.pageTranslation.findFirst({ where: { locale: EN, path: d.path } });
    if (taken || (await db.page.findUnique({ where: { key: d.key } }))) continue;
    const page = await db.page.create({
      data: { key: d.key, template: "legal", status: "DRAFT", translations: { create: { locale: EN, path: d.path, title: d.title, intro: d.intro } } },
    });
    const section = await db.pageSection.create({ data: { pageId: page.id, sortOrder: 0 } });
    for (const [i, part] of d.sections.entries()) {
      await db.contentBlock.create({
        data: { sectionId: section.id, type: "RICH_TEXT", status: "PUBLISHED", sortOrder: i, translations: { create: { locale: EN, title: part.title, body: part.body } } },
      });
    }
    added++;
  }
  if (added) console.log(`• ${added} legal page draft(s) added (Privacy, Terms, Accessibility): review and publish in Admin → Pages`);
}

/**
 * One "Products" menu instead of "Platform" and "Products" side by side (both
 * listed the same modules). The platform overview becomes the first link
 * under Products and the separate Platform item is hidden (not deleted: an
 * admin can show it again in Admin → Navigation). Runs once; skipped if an
 * admin has already hidden or removed either item.
 */
async function mergePlatformIntoProducts() {
  const menu = await db.navMenu.findUnique({ where: { key: "header" } });
  if (!menu) return;
  const platform = await db.navItem.findFirst({ where: { menuId: menu.id, parentId: null, href: "platform", isHidden: false } });
  const products = await db.navItem.findFirst({ where: { menuId: menu.id, parentId: null, href: "products", isHidden: false } });
  if (!platform || !products) return;
  const exists = await db.navItem.findFirst({ where: { menuId: menu.id, parentId: products.id, href: "platform" } });
  if (!exists) {
    const first = await db.navItem.aggregate({ where: { menuId: menu.id, parentId: products.id }, _min: { sortOrder: true } });
    await db.navItem.create({
      data: {
        menuId: menu.id,
        parentId: products.id,
        linkType: "INTERNAL",
        href: "platform",
        sortOrder: (first._min.sortOrder ?? 1) - 1,
        translations: {
          create: [
            { locale: EN, label: "Platform overview", description: "How trading, risk, onboarding and back office work as one." },
            { locale: BN, label: "প্ল্যাটফর্ম পরিচিতি", description: "ট্রেডিং, ঝুঁকি, অনবোর্ডিং ও ব্যাক অফিস যেভাবে এক সঙ্গে কাজ করে।" },
          ],
        },
      },
    });
  }
  await db.navItem.update({ where: { id: platform.id }, data: { isHidden: true } });
  console.log("• Header menu: Platform merged into Products (Platform overview is now the first Products link)");
}

/**
 * Client logos supplied by XFL: attached to the organization with the same key
 * or name (consortium members included); clients not in the database yet are
 * added as published "Client" organizations. Logos set in the admin are kept.
 * XFL supplied these logos for the website, so permission to show them is set.
 */
async function seedClientLogos() {
  const orgs = await db.organization.findMany({ where: { deletedAt: null }, include: { translations: { where: { locale: EN } } } });
  let attached = 0;
  let added = 0;
  for (const [i, c] of CLIENT_LOGOS.entries()) {
    let org = orgs.find((o) => o.key === c.key) ?? orgs.find((o) => o.translations.some((t) => orgNameKey(t.name) === orgNameKey(c.name)));
    if (!org && (await db.organization.findUnique({ where: { key: c.key }, select: { id: true } }))) continue; // deleted in the admin: left alone
    if (!org) {
      const created = await db.organization.create({
        data: { key: c.key, kind: "CLIENT", status: "PUBLISHED", sortOrder: 100 + i, translations: { create: { locale: EN, name: c.name } } },
        include: { translations: { where: { locale: EN } } },
      });
      orgs.push(created);
      org = created;
      added++;
    }
    if (org.logoMediaId) continue;
    const logo = await seedImage("logos", c.key, `${c.name} logo`, ["logo", "client"]);
    if (!logo) continue;
    await db.organization.update({ where: { id: org.id }, data: { logoMediaId: logo, logoPermission: true } });
    await db.mediaUsage.deleteMany({ where: { entityType: "ORGANIZATION", entityId: org.id, field: "logo" } });
    await db.mediaUsage.create({ data: { mediaId: logo, entityType: "ORGANIZATION", entityId: org.id, field: "logo" } });
    attached++;
  }
  if (attached || added) console.log(`• Client logos: ${attached} attached${added ? `, ${added} new client(s) added` : ""}`);
  // Organizations XFL has confirmed are not on its client list: taken off the
  // site (left as drafts, logo kept) unless an editor has already changed them.
  let hidden = 0;
  for (const key of NOT_CLIENTS) {
    const r = await db.organization.updateMany({ where: { key, kind: "CLIENT", status: "PUBLISHED", updatedById: null, deletedAt: null }, data: { status: "DRAFT" } });
    hidden += r.count;
  }
  if (hidden) console.log(`• ${hidden} organization(s) not on XFL's client list moved to drafts`);
  // SkyTrade (com.xfltrade.sky) is Skyline's branded app; it was seeded without its brokerage.
  const skyline = await db.organization.findUnique({ where: { key: "skyline" } });
  if (skyline) {
    const linked = await db.deployment.updateMany({ where: { key: "skytrade", organizationId: null }, data: { organizationId: skyline.id } });
    if (linked.count) console.log("• SkyTrade linked to Skyline");
    // Once (XFL, 17 Oct 2026): Skyline Securities' website. Later changes in the admin are kept.
    const SITE_MARK = "seed.skyline-website-2026-10-17";
    if (!(await db.siteSetting.findUnique({ where: { key: SITE_MARK } }))) {
      await db.organization.update({ where: { id: skyline.id }, data: { websiteUrl: "https://www.skylinesecuritiesbd.com/" } });
      await db.siteSetting.create({ data: { key: SITE_MARK, value: { at: new Date().toISOString() } } });
      console.log("• Skyline Securities: website set to skylinesecuritiesbd.com");
    }
  }
}

/** The market's institutions, drawn on the ecosystem map and the market cards. */
const INSTITUTIONS = [
  { key: "dse", kind: "EXCHANGE", url: "https://www.dsebd.org", en: "Dhaka Stock Exchange", enShort: "DSE", bn: "ঢাকা স্টক এক্সচেঞ্জ", bnShort: "ডিএসই" },
  { key: "cse", kind: "EXCHANGE", url: "https://www.cse.com.bd", en: "Chittagong Stock Exchange", enShort: "CSE", bn: "চট্টগ্রাম স্টক এক্সচেঞ্জ", bnShort: "সিএসই" },
  { key: "bsec", kind: "REGULATOR", url: "https://sec.gov.bd", en: "Bangladesh Securities and Exchange Commission", enShort: "BSEC", bn: "বাংলাদেশ সিকিউরিটিজ অ্যান্ড এক্সচেঞ্জ কমিশন", bnShort: "বিএসইসি" },
  { key: "basis", kind: "PARTNER", url: "https://basis.org.bd", en: "Bangladesh Association of Software and Information Services", enShort: "BASIS", bn: "বাংলাদেশ অ্যাসোসিয়েশন অব সফটওয়্যার অ্যান্ড ইনফরমেশন সার্ভিসেস", bnShort: "বেসিস" },
  { key: "cdbl", kind: "OTHER", url: "https://www.cdbl.com.bd", en: "Central Depository Bangladesh Limited", enShort: "CDBL", bn: "সেন্ট্রাল ডিপোজিটরি বাংলাদেশ লিমিটেড", bnShort: "সিডিবিএল" },
] as const;

/**
 * DSE, CSE, BSEC and CDBL as organizations (keys dse, cse, bsec, cdbl), so
 * their official logos can be uploaded in Admin → Organizations and appear on
 * the ecosystem map and market cards. Adds missing Bangla names; never
 * changes what an editor set. A logo file placed in prisma/seed-media/logos
 * as <key>.png is attached when the organization has none.
 */
async function seedInstitutions() {
  let added = 0;
  let logos = 0;
  for (const [i, o] of INSTITUTIONS.entries()) {
    let org = await db.organization.findUnique({ where: { key: o.key }, include: { translations: true } });
    if (!org) {
      org = await db.organization.create({
        data: {
          key: o.key,
          kind: o.kind,
          websiteUrl: o.url,
          status: "PUBLISHED",
          sortOrder: 200 + i,
          translations: { create: [{ locale: EN, name: o.en, shortName: o.enShort }, { locale: BN, name: o.bn, shortName: o.bnShort }] },
        },
        include: { translations: true },
      });
      added++;
    } else {
      if (!org.translations.some((t) => t.locale === BN)) {
        await db.organizationTranslation.create({ data: { organizationId: org.id, locale: BN, name: o.bn, shortName: o.bnShort } });
      }
      // The official website, unless an editor has already set one.
      if (!org.websiteUrl) await db.organization.update({ where: { id: org.id }, data: { websiteUrl: o.url } });
    }
    if (org.logoMediaId) continue;
    const logo = await seedImage("logos", o.key, `${o.en} logo`, ["logo", "institution"]);
    if (!logo) continue;
    await db.organization.update({ where: { id: org.id }, data: { logoMediaId: logo, logoPermission: true } });
    await db.mediaUsage.deleteMany({ where: { entityType: "ORGANIZATION", entityId: org.id, field: "logo" } });
    await db.mediaUsage.create({ data: { mediaId: logo, entityType: "ORGANIZATION", entityId: org.id, field: "logo" } });
    logos++;
  }
  if (added || logos) console.log(`• Market institutions: ${added} added, ${logos} logo(s) attached`);
}

/** Bangla for the company story (Admin → Settings), added only while the English is still the seeded text. */
const STORY_BN: Record<string, { en: string; bn: string }> = {
  "company.summary": {
    en: "Xpert Fintech Ltd. is a consortium of leading brokerage houses in Bangladesh dedicated to advancing the country's financial technology landscape.",
    bn: "এক্সপার্ট ফিনটেক লিমিটেড বাংলাদেশের শীর্ষস্থানীয় ব্রোকারেজ হাউসগুলোর একটি কনসোর্টিয়াম, যা দেশের আর্থিক প্রযুক্তি খাতকে এগিয়ে নিতে কাজ করে।",
  },
  "company.about": {
    en: "Headquartered at Saiham Sky View Tower, 45 Bijoynagar, Dhaka, we specialize in delivering enterprise-grade software solutions for the capital market, money market, banking, non-banking financial institutions, and the insurance sector. By combining deep industry expertise with cutting-edge technology, we empower financial institutions to operate with greater efficiency, transparency, and security.",
    bn: "ঢাকার বিজয়নগরের সাইহাম স্কাই ভিউ টাওয়ারে (৪৫ বিজয়নগর) আমাদের প্রধান কার্যালয়। পুঁজিবাজার, মানি মার্কেট, ব্যাংক, ব্যাংকবহির্ভূত আর্থিক প্রতিষ্ঠান ও বিমা খাতের জন্য আমরা এন্টারপ্রাইজ-মানের সফটওয়্যার সমাধান তৈরি করি। খাতের গভীর অভিজ্ঞতা ও আধুনিক প্রযুক্তির সমন্বয়ে আমরা আর্থিক প্রতিষ্ঠানগুলোকে আরও দক্ষ, স্বচ্ছ ও নিরাপদভাবে পরিচালিত হতে সহায়তা করি।",
  },
  "company.mission": {
    en: "To deliver innovative, reliable, and secure financial technology solutions that enable our partners to optimize performance, enhance investor confidence, and strengthen Bangladesh's economic ecosystem.",
    bn: "উদ্ভাবনী, নির্ভরযোগ্য ও নিরাপদ আর্থিক প্রযুক্তি সমাধান দেওয়া, যা আমাদের অংশীদারদের কর্মদক্ষতা বাড়ায়, বিনিয়োগকারীর আস্থা দৃঢ় করে এবং বাংলাদেশের অর্থনৈতিক ব্যবস্থাকে শক্তিশালী করে।",
  },
  "company.vision": {
    en: "To be recognized as Bangladesh's leading financial technology innovator, driving digital transformation, global competitiveness, and sustainable growth across the financial sector.",
    bn: "বাংলাদেশের শীর্ষস্থানীয় আর্থিক প্রযুক্তি উদ্ভাবক হিসেবে স্বীকৃতি পাওয়া, যা আর্থিক খাতজুড়ে ডিজিটাল রূপান্তর, বৈশ্বিক প্রতিযোগিতা-সক্ষমতা ও টেকসই প্রবৃদ্ধি এগিয়ে নেবে।",
  },
};

async function seedStoryBangla() {
  let added = 0;
  for (const [key, text] of Object.entries(STORY_BN)) {
    const row = await db.siteSetting.findUnique({ where: { key } });
    const v = row?.value && typeof row.value === "object" && !Array.isArray(row.value) ? (row.value as Record<string, unknown>) : null;
    if (!row || !v || v.en !== text.en || (typeof v.bn === "string" && v.bn.trim())) continue;
    await db.siteSetting.update({ where: { key }, data: { value: { ...v, bn: text.bn } } });
    added++;
  }
  if (added) console.log(`• Bangla added to ${added} company story text(s) (Admin → Settings)`);
}

/** XFL's memberships and certifications (Admin → Credentials), set once; editors' changes are kept. */
async function seedCredentials() {
  const existing = await db.siteSetting.findUnique({ where: { key: "site.credentials" } });
  if (existing) return;
  await db.siteSetting.create({ data: { key: "site.credentials", value: { published: true, items: CREDENTIALS } } });
  console.log(`• Credentials: ${CREDENTIALS.length} saved (BASIS membership, CSE and DSE certifications)`);
}

/**
 * One review card per board director, ready to complete in Admin → Testimonials:
 * photo and name from Admin → People, everything else left for XFL to fill in
 * with the director's own words (title, institution, rating, quote). Saved as
 * drafts without approval, so nothing appears on the live site until each one
 * is completed, approved and published. Created once per director.
 */
async function seedReviewDrafts() {
  let added = 0;
  // A review already written for the person under another spelling ("Mohd" / "Mohd.", "Mohammed" / "Mohammad") counts.
  const key2 = (v: string) => v.toLowerCase().replace(/\b(fca|fcs|fcma|acca|fcca|cfa)\b/g, " ").replace(/[.,]/g, " ").replace(/\s+/g, " ").trim().split(" ").slice(-2).join(" ");
  const written = new Set((await db.testimonial.findMany({ where: { deletedAt: null }, select: { personName: true } })).map((r) => key2(r.personName)));
  for (const [i, b] of BOARD.entries()) {
    const person = await db.person.findUnique({ where: { key: b.key } });
    if (!person) continue;
    if (written.has(key2(b.name))) continue;
    const review = await db.testimonial.create({
      data: {
        personName: b.name,
        photoMediaId: person.photoMediaId,
        // At XFL's instruction (18 Oct 2026): every director has a card on the site, completed in the admin.
        status: "PUBLISHED",
        hasApproval: true,
        sortOrder: i,
        translations: {
          create: { locale: EN, personTitle: null, quote: `[Review from ${b.name}: to be written in their own words, with their title, institution and rating, and approved before publishing.]` },
        },
      },
    });
    if (person.photoMediaId) await db.mediaUsage.create({ data: { mediaId: person.photoMediaId, entityType: "TESTIMONIAL", entityId: review.id, field: "photo" } });
    added++;
  }
  if (added) console.log(`• ${added} review card(s) added for the board: complete them in Admin → Testimonials`);
}

// ── Consortium and apps ──────────────────────────────────────────────────────

async function seedDeployments() {
  if (!WITH_DEPLOYMENTS) {
    const drafts = await db.deployment.count({ where: { status: "DRAFT", deletedAt: null } });
    if (drafts) console.log(`• Branded apps: ${drafts} left as drafts (add --with-deployments to publish them)`);
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
  { href: "gallery", en: "Gallery", bn: "গ্যালারি", descEn: "Photo albums and videos.", descBn: "ছবির অ্যালবাম ও ভিডিও।" },
  { href: "resources", en: "Resources", bn: "রিসোর্স", descEn: "Brochures and product documents.", descBn: "ব্রোশিওর ও পণ্যের নথি।" },
  { href: "success-stories", en: "Success stories", bn: "সাফল্যের গল্প", descEn: "How brokerages use Xpert.", descBn: "ব্রোকারেজগুলো কীভাবে এক্সপার্ট ব্যবহার করে।" },
];
const CAREERS: NavChild = { href: "careers", en: "Careers", bn: "ক্যারিয়ার", descEn: "Join the team.", descBn: "আমাদের টিমে যোগ দিন।" };

async function seedInsightsLinks() {
  // Videos live inside the Gallery page: hide the separate "Videos" menu links (not deleted; Admin → Navigation can show them again).
  const hidden = await db.navItem.updateMany({ where: { href: "gallery#videos", isHidden: false }, data: { isHidden: true } });
  if (hidden.count) console.log(`• Menus: "Videos" now sits under Gallery (${hidden.count} separate link(s) hidden)`);
  await db.navItemTranslation.updateMany({ where: { description: "Photo albums from events and the office." }, data: { description: "Photo albums and videos." } });
  await db.navItemTranslation.updateMany({ where: { description: "ইভেন্ট ও অফিসের ছবির অ্যালবাম।" }, data: { description: "ছবির অ্যালবাম ও ভিডিও।" } });
  // Earlier seeds described the Gallery as event photos only.
  await db.navItemTranslation.updateMany({ where: { description: "Photos from our events." }, data: { description: "Photo albums and videos." } });
  await db.navItemTranslation.updateMany({ where: { description: "আমাদের ইভেন্টের ছবি।" }, data: { description: "ছবির অ্যালবাম ও ভিডিও।" } });
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

// ── Navigation: Consultants link under Company (header and footer) ───────────

/** Adds a "Consultants" link right after "Management" in every menu that has one, once. */
async function seedConsultantLinks() {
  const managementLinks = await db.navItem.findMany({ where: { href: "company/management", parentId: { not: null } } });
  let added = 0;
  for (const m of managementLinks) {
    if (await db.navItem.findFirst({ where: { menuId: m.menuId, parentId: m.parentId, href: "company/consultants" } })) continue;
    await db.navItem.updateMany({ where: { menuId: m.menuId, parentId: m.parentId, sortOrder: { gt: m.sortOrder } }, data: { sortOrder: { increment: 1 } } });
    await db.navItem.create({
      data: {
        menuId: m.menuId,
        parentId: m.parentId,
        linkType: "INTERNAL",
        href: "company/consultants",
        sortOrder: m.sortOrder + 1,
        translations: {
          create: [
            { locale: EN, label: "Consultants", description: "Advisers who bring outside expertise." },
            { locale: BN, label: "পরামর্শক", description: "বাইরের অভিজ্ঞতা নিয়ে পরামর্শ দেন যাঁরা।" },
          ],
        },
      },
    });
    added++;
  }
  if (added) console.log(`• Added the Consultants link to ${added} menu(s)`);
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

// ── Ecosystem (nodes, links and flows behind the ecosystem map) ─────────────

/**
 * Loads the ecosystem from src/content/xfl2/ecosystem.ts into the database
 * the first time. After that the database is the source of truth: nodes,
 * links and flows that already exist (by key) are never overwritten, so
 * edits made in Admin → Ecosystem are kept. New seed items are added.
 */
async function seedEcosystem() {
  const T = (v: { en?: string; bn?: string } | undefined) => v ?? {};
  let nodesAdded = 0;
  let edgesAdded = 0;
  let flowsAdded = 0;
  const ids = new Map<string, string>();
  for (const [i, n] of ecosystemNodes.entries()) {
    const existing = await db.ecosystemNode.findUnique({ where: { key: n.key } });
    if (existing) {
      ids.set(n.key, existing.id);
      continue;
    }
    const offering = n.offeringKey ? await db.offering.findUnique({ where: { key: n.offeringKey } }) : null;
    const translations = (["en", "bn"] as const)
      .filter((l) => T(n.label)[l])
      .map((l) => ({ locale: l === "en" ? EN : BN, label: T(n.label)[l]!, description: T(n.description)[l] ?? null }));
    const row = await db.ecosystemNode.create({
      data: {
        key: n.key,
        layer: n.layer,
        status: n.status,
        offeringId: offering?.id ?? null,
        layoutX: n.layoutX ?? null,
        layoutY: n.layoutY ?? null,
        mobileOrder: n.mobileOrder,
        editorNote: n.editorNote ?? null,
        sortOrder: i,
        translations: { create: translations },
      },
    });
    ids.set(n.key, row.id);
    nodesAdded++;
  }
  const edgeIds = new Map<string, string>();
  for (const [i, e] of ecosystemEdges.entries()) {
    const from = ids.get(e.from);
    const to = ids.get(e.to);
    if (!from || !to) continue;
    const existing = await db.ecosystemEdge.findFirst({ where: { fromNodeId: from, toNodeId: to } });
    if (existing) {
      edgeIds.set(`${e.from}>${e.to}`, existing.id);
      continue;
    }
    const row = await db.ecosystemEdge.create({ data: { fromNodeId: from, toNodeId: to, kind: e.kind, sortOrder: i } });
    edgeIds.set(`${e.from}>${e.to}`, row.id);
    edgesAdded++;
  }
  for (const [i, f] of ecosystemFlows.entries()) {
    if (await db.ecosystemFlow.findUnique({ where: { key: f.key } })) continue;
    const flow = await db.ecosystemFlow.create({
      data: {
        key: f.key,
        status: f.status,
        isPlayback: f.isPlayback,
        sortOrder: i,
        translations: { create: (["en", "bn"] as const).filter((l) => f.name[l]).map((l) => ({ locale: l === "en" ? EN : BN, name: f.name[l]! })) },
      },
    });
    for (const [k, st] of f.steps.entries()) {
      const nodeId = ids.get(st.node);
      if (!nodeId) continue;
      await db.ecosystemFlowStep.create({
        data: {
          flowId: flow.id,
          nodeId,
          edgeId: st.edge ? (edgeIds.get(st.edge) ?? null) : null,
          sortOrder: k,
          translations: {
            create: (["en", "bn"] as const).filter((l) => st.title[l]).map((l) => ({ locale: l === "en" ? EN : BN, title: st.title[l]!, body: st.body?.[l] ?? null })),
          },
        },
      });
    }
    flowsAdded++;
  }
  if (nodesAdded || edgesAdded || flowsAdded) console.log(`• Ecosystem: added ${nodesAdded} node(s), ${edgesAdded} link(s), ${flowsAdded} flow(s)`);
}

/**
 * Once: RMS is no longer a separate product, so limit and exposure checks are
 * described as part of the OMS. Updates the OMS texts, the phone order of the
 * ecosystem products and the two ecosystem flows that stepped through RMS —
 * each only where it still has the seeded wording (admin edits are kept).
 */
async function seedRmsInOms() {
  const MARK = "seed.rms-in-oms-2026-10-08";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const WORDING: [string, string][] = [
    ["RMS checks the order against configured limits before it leaves the brokerage.", "The OMS checks the order against the brokerage's limits and exposure before it leaves."],
    ["অর্ডার ব্রোকারেজ থেকে বের হওয়ার আগে আরএমএস নির্ধারিত সীমার সঙ্গে তা যাচাই করে।", "অর্ডার বের হওয়ার আগে ওএমএস ব্রোকারেজের নির্ধারিত সীমা ও এক্সপোজারের সঙ্গে তা যাচাই করে।"],
    ["Pre-trade limit checks through RMS.", "Pre-trade limit and exposure checks built into the OMS."],
    ["আরএমএস-এর মাধ্যমে লেনদেনের আগে সীমা যাচাই।", "ওএমএস-এর ভেতরেই লেনদেনের আগে সীমা ও এক্সপোজার যাচাই।"],
    ["Orders pass RMS checks before reaching the exchange.", "Every order passes limit and exposure checks before reaching the exchange."],
    ["এক্সচেঞ্জে পৌঁছানোর আগে প্রতিটি অর্ডার আরএমএস যাচাই পার হয়।", "এক্সচেঞ্জে পৌঁছানোর আগে প্রতিটি অর্ডার সীমা ও এক্সপোজার যাচাই পার হয়।"],
  ];
  let texts = 0;
  for (const [from, to] of WORDING) {
    texts += (await db.offeringItemTranslation.updateMany({ where: { body: from }, data: { body: to } })).count;
  }
  for (const n of ecosystemNodes) {
    if (n.layer !== "PRODUCT") continue;
    await db.ecosystemNode.updateMany({ where: { key: n.key, updatedById: null }, data: { mobileOrder: n.mobileOrder } });
  }
  const nodes = new Map((await db.ecosystemNode.findMany({ select: { id: true, key: true } })).map((n) => [n.key, n.id]));
  const edges = await db.ecosystemEdge.findMany({ select: { id: true, fromNodeId: true, toNodeId: true } });
  const edgeId = (key?: string) => {
    if (!key) return null;
    const [a, b] = key.split(">");
    return edges.find((e) => e.fromNodeId === nodes.get(a!) && e.toNodeId === nodes.get(b!))?.id ?? null;
  };
  let flows = 0;
  for (const f of ecosystemFlows.filter((x) => x.key === "order-lifecycle" || x.key === "explore")) {
    const flow = await db.ecosystemFlow.findUnique({ where: { key: f.key } });
    if (!flow || flow.updatedById) continue;
    await db.ecosystemFlowStep.deleteMany({ where: { flowId: flow.id } });
    for (const [k, st] of f.steps.entries()) {
      const nodeId = nodes.get(st.node);
      if (!nodeId) continue;
      await db.ecosystemFlowStep.create({
        data: {
          flowId: flow.id,
          nodeId,
          edgeId: edgeId(st.edge),
          sortOrder: k,
          translations: {
            create: (["en", "bn"] as const).filter((l) => st.title[l]).map((l) => ({ locale: l === "en" ? EN : BN, title: st.title[l]!, body: st.body?.[l] ?? null })),
          },
        },
      });
    }
    flows++;
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
  console.log(`• Risk checks now described inside the OMS: ${texts} product text(s), ${flows} ecosystem flow(s) updated`);
}

/**
 * Product screenshots supplied by XFL, in prisma/seed-media/products as
 * <product key>-<web|tablet|phone>[-<name>].(png|jpg|webp). Each file is added once to
 * that product's screens (Admin → Products → Screens and demo video), after
 * any screens already there; removing it in the admin keeps it removed.
 * Personal details visible in a screenshot are blurred before it is added here.
 */
const PRODUCT_SHOTS: Record<string, { en: string; bn: string }> = {
  "trading-platform-web": {
    en: "Xpert Trading OMS: order entry, portfolio, market depth, order list and order summary on one dealer desk",
    bn: "এক্সপার্ট ট্রেডিং ওএমএস: একই ডিলার ডেস্কে অর্ডার প্রদান, পোর্টফোলিও, মার্কেট ডেপথ, অর্ডার তালিকা ও অর্ডার সারাংশ",
  },
  // Mobile app screens supplied by XFL (19 Oct 2026); the first three fill the home page's floating phones.
  "trading-platform-phone-market": {
    en: "Mobile app: market overview — gainers and losers by change %, and a market map by sector",
    bn: "মোবাইল অ্যাপ: বাজারের সারসংক্ষেপ — পরিবর্তনের হার অনুযায়ী দরবৃদ্ধি ও দরপতন, এবং খাতভিত্তিক মার্কেট ম্যাপ",
  },
  "trading-platform-phone-trade": {
    en: "Mobile app: buy and sell on DSE or CSE with live bid/ask depth, purchase power and order quantity, rate and drip quantity",
    bn: "মোবাইল অ্যাপ: ডিএসই বা সিএসই-তে কেনা-বেচা — লাইভ বিড/আস্ক ডেপথ, ক্রয়ক্ষমতা, অর্ডারের পরিমাণ, দর ও ড্রিপ পরিমাণ",
  },
  "trading-platform-phone-watchlist": {
    en: "Mobile app: watchlists per exchange, with price, change, trades and value for each instrument",
    bn: "মোবাইল অ্যাপ: এক্সচেঞ্জভিত্তিক ওয়াচলিস্ট — প্রতিটি শেয়ারের দর, পরিবর্তন, লেনদেন সংখ্যা ও মূল্য",
  },
  "trading-platform-phone-chart": {
    en: "Mobile app: instrument details with an intraday candlestick chart, moving averages and volume",
    bn: "মোবাইল অ্যাপ: শেয়ারের বিস্তারিত — ইন্ট্রাডে ক্যান্ডেলস্টিক চার্ট, মুভিং অ্যাভারেজ ও ভলিউম",
  },
  "trading-platform-phone-time-sales": {
    en: "Mobile app: time and sales — every trade in an instrument with time, side, quantity and price",
    bn: "মোবাইল অ্যাপ: টাইম অ্যান্ড সেলস — একটি শেয়ারের প্রতিটি লেনদেনের সময়, দিক, পরিমাণ ও দর",
  },
  "trading-platform-phone-portfolio": {
    en: "Mobile app: purchase power, day and unrealised gain, and featured lists — top gainers, losers and value",
    bn: "মোবাইল অ্যাপ: ক্রয়ক্ষমতা, দিনের ও অনাদায়ী লাভ, এবং ফিচার্ড তালিকা — শীর্ষ দরবৃদ্ধি, দরপতন ও মূল্য",
  },
};
async function seedProductScreens() {
  let added = 0;
  for (const [file, caption] of Object.entries(PRODUCT_SHOTS)) {
    const mark = `seed.product-shot.${file}`;
    if (await db.siteSetting.findUnique({ where: { key: mark } })) continue;
    const key = file.replace(/-(web|tablet|phone)(-[a-z0-9-]+)?$/, "");
    const offering = await db.offering.findUnique({ where: { key } });
    if (!offering) continue;
    const mediaId = await seedImage("products", file, caption.en, ["product", "screenshot"]);
    if (!mediaId) continue;
    if (!(await db.offeringMedia.findFirst({ where: { offeringId: offering.id, mediaId } }))) {
      const last = await db.offeringMedia.findFirst({ where: { offeringId: offering.id }, orderBy: { sortOrder: "desc" } });
      await db.offeringMedia.create({
        data: {
          offeringId: offering.id,
          kind: "SCREENSHOT",
          mediaId,
          device: file.match(/-(web|tablet|phone)(-[a-z0-9-]+)?$/)?.[1]?.toUpperCase() ?? null,
          sortOrder: (last?.sortOrder ?? -1) + 1,
          translations: { create: [{ locale: EN, caption: caption.en }, { locale: BN, caption: caption.bn }] },
        },
      });
      added++;
    }
    await db.siteSetting.create({ data: { key: mark, value: { at: new Date().toISOString() } } });
  }
  if (added) console.log(`• Product screens: added ${added} screenshot(s) supplied by XFL`);
}

/**
 * Bangla wherever content still has only English (src/content/xfl2/bangla.ts):
 * menu labels, product names and items, events, institution and team names,
 * the office address, page titles, the about page's values and the legal
 * pages. Runs every time but only adds what is missing; an existing Bangla
 * text, or an English text an editor has changed, is never touched.
 */
async function seedBanglaGaps() {
  let added = 0;
  const has = (rows: { locale: string }[]) => rows.some((r) => r.locale === BN);
  for (const item of await db.navItem.findMany({ include: { translations: true } })) {
    const en = item.translations.find((t) => t.locale === EN);
    const bn = en && NAV_BN[en.label];
    if (!bn || has(item.translations)) continue;
    await db.navItemTranslation.create({ data: { itemId: item.id, locale: BN, label: bn, description: null } });
    added++;
  }
  for (const [key, v] of Object.entries(OFFERING_BN)) {
    const o = await db.offering.findUnique({ where: { key }, include: { translations: true } });
    const en = o?.translations.find((t) => t.locale === EN);
    if (!o || !en || has(o.translations)) continue;
    await db.offeringTranslation.create({ data: { offeringId: o.id, locale: BN, slug: en.slug, name: v.name, tagline: v.tagline ?? null } });
    added++;
  }
  for (const t of await db.offeringItemTranslation.findMany({ where: { locale: EN, title: { in: Object.keys(ITEM_BN) } } })) {
    if (await db.offeringItemTranslation.findFirst({ where: { itemId: t.itemId, locale: BN } })) continue;
    await db.offeringItemTranslation.create({ data: { itemId: t.itemId, locale: BN, title: ITEM_BN[t.title]! } });
    added++;
  }
  for (const [key, v] of Object.entries(EVENT_BN)) {
    const e = await db.event.findUnique({ where: { key }, include: { translations: true } });
    const en = e?.translations.find((t) => t.locale === EN);
    if (!e || !en || has(e.translations)) continue;
    await db.eventTranslation.create({ data: { eventId: e.id, locale: BN, slug: en.slug, title: v.title, summary: v.summary } });
    added++;
  }
  for (const [key, name] of Object.entries(ORG_BN)) {
    const o = await db.organization.findUnique({ where: { key }, include: { translations: true } });
    if (!o || has(o.translations)) continue;
    await db.organizationTranslation.create({ data: { organizationId: o.id, locale: BN, name } });
    added++;
  }
  for (const [key, name] of Object.entries(PERSON_BN)) {
    const p = await db.person.findUnique({ where: { key }, include: { translations: true } });
    if (!p || has(p.translations)) continue;
    await db.personTranslation.create({ data: { personId: p.id, locale: BN, name } });
    added++;
  }
  for (const [key, v] of Object.entries(NODE_BN)) {
    const n = await db.ecosystemNode.findUnique({ where: { key }, include: { translations: true } });
    if (!n || has(n.translations)) continue;
    await db.ecosystemNodeTranslation.create({ data: { nodeId: n.id, locale: BN, label: v.label, description: v.description ?? null } });
    added++;
  }
  for (const t of await db.officeTranslation.findMany({ where: { locale: EN } })) {
    const v = OFFICE_BN[t.address.trim()];
    if (!v || (await db.officeTranslation.findFirst({ where: { officeId: t.officeId, locale: BN } }))) continue;
    await db.officeTranslation.create({ data: { officeId: t.officeId, locale: BN, name: v.name, address: v.address, hours: null } });
    added++;
  }
  const pageKeys = [...Object.keys(PAGE_BN), ...Object.keys(LEGAL_BN)];
  for (const page of await db.page.findMany({ where: { key: { in: pageKeys } }, include: { translations: true, sections: { orderBy: { sortOrder: "asc" }, include: { blocks: { orderBy: { sortOrder: "asc" }, include: { translations: true } } } } } })) {
    const en = page.translations.find((t) => t.locale === EN);
    if (!en || has(page.translations)) continue;
    const legal = LEGAL_BN[page.key ?? ""];
    const head = legal ?? PAGE_BN[page.key ?? ""]!;
    await db.pageTranslation.create({ data: { pageId: page.id, locale: BN, path: en.path, title: head.title, intro: head.intro ?? null } });
    added++;
    if (!legal) continue;
    // Legal text blocks, in the order of the English drafts, while their English is unchanged.
    const draft = LEGAL_DRAFTS.find((d) => d.key === page.key);
    const blocks = page.sections.flatMap((s) => s.blocks);
    for (const [i, b] of blocks.entries()) {
      const enB = b.translations.find((t) => t.locale === EN);
      const part = legal.sections[i];
      if (!part || !enB || enB.title !== draft?.sections[i]?.title || has(b.translations)) continue;
      await db.contentBlockTranslation.create({ data: { blockId: b.id, locale: BN, title: part.title, body: part.body } });
      added++;
    }
  }
  for (const t of await db.contentBlockTranslation.findMany({ where: { locale: EN, title: { in: Object.keys(BLOCK_BN) } } })) {
    if (await db.contentBlockTranslation.findFirst({ where: { blockId: t.blockId, locale: BN } })) continue;
    const v = BLOCK_BN[t.title!]!;
    await db.contentBlockTranslation.create({ data: { blockId: t.blockId, locale: BN, title: v.title ?? null, body: v.body ?? null } });
    added++;
  }
  for (const t of await db.blockItemTranslation.findMany({ where: { locale: EN, title: { in: Object.keys(BLOCK_BN) } } })) {
    if (await db.blockItemTranslation.findFirst({ where: { itemId: t.itemId, locale: BN } })) continue;
    const v = BLOCK_BN[t.title!]!;
    await db.blockItemTranslation.create({ data: { itemId: t.itemId, locale: BN, title: v.title ?? null, body: v.body ?? null } });
    added++;
  }
  if (added) console.log(`• Bangla added to ${added} item(s) that had English only (menus, products, events, names, address, pages)`);
}

/**
 * Menu links for pages added later: Security and compliance (footer, next to
 * the legal pages) and Case studies (under Insights). Each is added once if
 * missing; a link shows on the site only once its page is published.
 */
async function seedNavAdditions() {
  const add = async (menuKey: string, parentHref: string | null, parentLabel: string | null, href: string, label: string) => {
    const menu = await db.navMenu.findUnique({ where: { key: menuKey } });
    if (!menu) return;
    if (await db.navItem.findFirst({ where: { menuId: menu.id, href } })) return;
    let parentId: string | null = null;
    if (parentHref || parentLabel) {
      const parent = parentHref
        ? await db.navItem.findFirst({ where: { menuId: menu.id, children: { some: { href: parentHref } } } })
        : await db.navItem.findFirst({ where: { menuId: menu.id, parentId: null, translations: { some: { locale: EN, label: parentLabel! } } } });
      if (!parent) return;
      parentId = parent.id;
    }
    const last = await db.navItem.findFirst({ where: { menuId: menu.id, parentId }, orderBy: { sortOrder: "desc" } });
    await db.navItem.create({
      data: { menuId: menu.id, parentId, linkType: "INTERNAL", href, sortOrder: (last?.sortOrder ?? -1) + 1, translations: { create: { locale: EN, label } } },
    });
    console.log(`• Menu: added “${label}” (shows once its page is published)`);
  };
  await add("footer-legal", null, null, "security", "Security and compliance");
  await add("header", "events", null, "success-stories", "Success stories");
}

/**
 * Draft case studies for three member brokerages (src/content/xfl2/case-study-drafts.ts),
 * added once, as DRAFT: results, figures and the quote stay in [brackets] until
 * the client confirms them. Not shown on the live site until an editor publishes.
 */
async function seedCaseStudyDrafts() {
  const MARK = "seed.case-study-drafts-2026-10-09";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  let added = 0;
  for (const [i, c] of CASE_STUDY_DRAFTS.entries()) {
    if (await db.caseStudyTranslation.findFirst({ where: { slug: c.slug } })) continue;
    await db.caseStudy.create({
      data: {
        status: "DRAFT",
        sortOrder: i,
        translations: {
          create: (["en", "bn"] as const).map((l) => ({
            locale: l === "en" ? EN : BN,
            slug: c.slug,
            title: c.title[l],
            summary: c.summary[l],
            challenge: c.challenge[l],
            solution: c.solution[l],
            outcome: c.outcome[l],
          })),
        },
      },
    });
    added++;
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
  if (added) console.log(`• ${added} draft success stories added: fill in the [bracketed] results with each client and publish in Admin → Success stories`);
}

/**
 * The open roles from XFL HR (src/content/xfl2/careers.ts), added once as
 * published jobs in English and Bangla. A job already there with the same
 * address is left alone; after this they are managed in Admin → Careers.
 */
async function seedCareers() {
  const MARK = "seed.careers-2026-10-09";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  let added = 0;
  for (const [i, c] of CAREER_SEED.entries()) {
    if (await db.careerTranslation.findFirst({ where: { slug: c.slug } })) continue;
    await db.career.create({
      data: {
        status: "PUBLISHED",
        publishAt: new Date(),
        sortOrder: i,
        department: c.department,
        location: c.location,
        employmentType: "FULL_TIME",
        experience: c.experience,
        linkedinUrl: c.linkedinUrl,
        bdjobsUrl: c.bdjobsUrl,
        applyEmail: c.applyEmail,
        translations: {
          create: (["en", "bn"] as const).map((l) => ({
            locale: l === "en" ? EN : BN,
            slug: c.slug,
            title: c.title[l],
            summary: c.summary[l],
            about: c.about[l],
            responsibilities: c.responsibilities[l],
            requirements: c.requirements[l],
            benefits: c.benefits?.[l] ?? null,
          })),
        },
      },
    });
    added++;
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
  if (added) console.log(`• ${added} open role(s) added to Careers`);
}

/**
 * Store links checked on 9 October 2026 against Google Play (developer "Xpert
 * Fintech") and the App Store:
 * - Rem is now listed as "RemX" (com.xfltrade.rem).
 * - UTrade by UCB STOCK runs on Xpert (package com.xfltrade.ubr) and is on both
 *   Google Play and the App Store; it is added, published like the other apps.
 * - None of the other ten apps has an App Store listing yet.
 * Fills only what an editor has not changed.
 */
const STORE_LINKS: { key: string; appName: string; org: string | null; play: string; ios: string | null }[] = [
  { key: "ebl-fast-trade", appName: "EBL Fast Trade", org: null, play: "com.xfltrade.ebs", ios: null },
  { key: "shahjalal-trade", appName: "Shahjalal Trade", org: null, play: "com.xfltrade.sjb", ios: null },
  { key: "ail-trade", appName: "AIL Trade", org: null, play: "com.xfltrade.snm", ios: null },
  { key: "gds-trade", appName: "GDS TRADE", org: null, play: "com.xfltrade.gdf", ios: null },
  { key: "nls-smarttrade", appName: "NLS SmartTrade", org: null, play: "com.xfltrade.nls", ios: null },
  { key: "ba-secure-trade", appName: "BA SECURE TRADE", org: null, play: "com.xfltrade.bal", ios: null },
  { key: "tradeibs", appName: "TradeiBS", org: null, play: "com.xfltrade.ibb", ios: null },
  { key: "one-trade", appName: "ONE TRADE", org: null, play: "com.xfltrade.one", ios: null },
  { key: "rem", appName: "RemX", org: null, play: "com.xfltrade.rem", ios: null },
  { key: "skytrade", appName: "SkyTrade", org: null, play: "com.xfltrade.sky", ios: null },
  { key: "utrade-ucb-stock", appName: "UTrade by UCB STOCK", org: "ucb-stock-brokerage", play: "com.xfltrade.ubr", ios: "https://apps.apple.com/us/app/utrade-by-ucb-stock/id6753627888" },
];

async function seedStoreLinks() {
  const MARK = "seed.store-links-2026-10-09";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const existing = await db.deployment.findMany({ where: { deletedAt: null }, select: { status: true } });
  // New apps follow the others: published if the branded apps are already shown on the site.
  const shown = existing.some((d) => d.status === "PUBLISHED");
  const offering = await db.offering.findUnique({ where: { key: "trading-platform" }, select: { id: true } });
  let added = 0;
  let updated = 0;
  for (const [i, a] of STORE_LINKS.entries()) {
    const playStoreUrl = `https://play.google.com/store/apps/details?id=${a.play}`;
    const d = await db.deployment.findUnique({ where: { key: a.key } });
    if (!d) {
      const org = a.org ? await db.organization.findUnique({ where: { key: a.org }, select: { id: true } }) : null;
      await db.deployment.create({
        data: {
          key: a.key,
          appName: a.appName,
          androidPackage: a.play,
          playStoreUrl,
          appStoreUrl: a.ios,
          organizationId: org?.id ?? null,
          offeringId: offering?.id ?? null,
          linksCheckedAt: new Date("2026-10-09"),
          status: shown ? "PUBLISHED" : "DRAFT",
          sortOrder: i,
        },
      });
      added++;
      continue;
    }
    if (d.updatedById) continue;
    const data = {
      ...(d.appName !== a.appName && { appName: a.appName }),
      ...(!d.playStoreUrl && { playStoreUrl }),
      ...(!d.androidPackage && { androidPackage: a.play }),
      ...(!d.appStoreUrl && a.ios && { appStoreUrl: a.ios }),
    };
    await db.deployment.update({ where: { id: d.id }, data: { ...data, linksCheckedAt: new Date("2026-10-09") } });
    if (Object.keys(data).length) updated++;
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
  if (added || updated) console.log(`• Branded apps: ${added} added, ${updated} updated from Google Play and the App Store`);
}

/**
 * Website, DSE/CSE TREC numbers and a one-line description for each member
 * brokerage house (src/content/xfl2/member-profiles.ts), added once and only
 * where the field is still empty.
 */
/**
 * Once: IDLC Securities is a client again (XFL, 15 Oct 2026). Brings it back
 * on the site as a published client with its verified facts, unless an editor
 * has changed it since. A new client is added if it is not in the database.
 */
async function seedIdlcClient() {
  const MARK = "seed.idlc-client-2026-10-15";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const p = MEMBER_PROFILES.find((m) => m.key === "idlc-securities")!;
  const names = { en: "IDLC Securities Limited", bn: "আইডিএলসি সিকিউরিটিজ লিমিটেড" };
  let org = await db.organization.findUnique({ where: { key: p.key }, include: { translations: true } });
  if (!org) {
    org = await db.organization.create({
      data: {
        key: p.key,
        kind: "CLIENT",
        status: "PUBLISHED",
        sortOrder: 120,
        websiteUrl: p.website,
        dseTrec: p.dseTrec,
        cseTrec: p.cseTrec,
        translations: {
          create: [
            { locale: EN, name: names.en, shortName: "IDLC Securities", description: p.description.en },
            { locale: BN, name: names.bn, shortName: "আইডিএলসি সিকিউরিটিজ", description: p.description.bn },
          ],
        },
      },
      include: { translations: true },
    });
    console.log("• IDLC Securities added as a client");
  } else if (!org.updatedById) {
    await db.organization.update({
      where: { id: org.id },
      data: {
        status: "PUBLISHED",
        deletedAt: null,
        ...(org.kind !== "CONSORTIUM_MEMBER" && { kind: "CLIENT" }),
        ...(!org.websiteUrl && { websiteUrl: p.website }),
        ...(!org.dseTrec && { dseTrec: p.dseTrec }),
        ...(!org.cseTrec && { cseTrec: p.cseTrec }),
      },
    });
    for (const l of ["en", "bn"] as const) {
      const tr = org.translations.find((t) => t.locale === (l === "en" ? EN : BN));
      if (!tr) await db.organizationTranslation.create({ data: { organizationId: org.id, locale: l === "en" ? EN : BN, name: names[l], description: p.description[l] } });
      else if (!tr.description) await db.organizationTranslation.update({ where: { id: tr.id }, data: { description: p.description[l] } });
    }
    console.log("• IDLC Securities shown again as a client");
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
}

/**
 * Once: the OMS's workflow and architecture name RMS as the built-in risk
 * check, where they still have the seeded wording (admin edits are kept).
 */
async function seedRmsWording() {
  const MARK = "seed.rms-wording-2026-10-15";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const BODY: [string, string][] = [["The OMS checks the order against the brokerage's limits and exposure before it leaves.", "RMS, built into the OMS, checks the order before it leaves: blocked BO account, short sell, buying power and margin, order limits, price band and exposure."], ["অর্ডার বের হওয়ার আগে ওএমএস ব্রোকারেজের নির্ধারিত সীমা ও এক্সপোজারের সঙ্গে তা যাচাই করে।", "ওএমএস-এর ভেতরে যুক্ত আরএমএস অর্ডার বের হওয়ার আগে যাচাই করে: ব্লকড বিও অ্যাকাউন্ট, শর্ট সেল, ক্রয়ক্ষমতা ও মার্জিন, অর্ডারের সীমা, প্রাইস ব্যান্ড ও এক্সপোজার।"], ["Pre-trade limit and exposure checks built into the OMS.", "RMS, built into the OMS: pre-trade limit and exposure checks on every order."], ["ওএমএস-এর ভেতরেই লেনদেনের আগে সীমা ও এক্সপোজার যাচাই।", "ওএমএস-এর ভেতরেই যুক্ত আরএমএস: প্রতিটি অর্ডারে লেনদেনের আগে সীমা ও এক্সপোজার যাচাই।"]];
  const TITLE: [string, string][] = [["Pre-trade risk check", "RMS pre-trade check"], ["প্রি-ট্রেড ঝুঁকি যাচাই", "আরএমএস প্রি-ট্রেড যাচাই"], ["Risk controls", "Risk controls (RMS)"], ["ঝুঁকি নিয়ন্ত্রণ", "ঝুঁকি নিয়ন্ত্রণ (আরএমএস)"]];
  let n = 0;
  const oms = { item: { offering: { key: "trading-platform" } } };
  for (const [from, to] of BODY) n += (await db.offeringItemTranslation.updateMany({ where: { body: from, ...oms }, data: { body: to } })).count;
  for (const [from, to] of TITLE) n += (await db.offeringItemTranslation.updateMany({ where: { title: from, ...oms }, data: { title: to } })).count;
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
  if (n) console.log(`• OMS workflow and architecture name RMS as the built-in risk check (${n} text(s))`);
}

/**
 * Once: "Case studies" are now "Success stories". Menu links to the old
 * address move to the new one, and labels still reading as seeded are renamed
 * (labels changed in Admin → Navigation are kept). The old address redirects.
 */
async function renameCaseStudies() {
  const MARK = "seed.success-stories-2026-10-15";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const moved = await db.navItem.updateMany({ where: { href: "case-studies" }, data: { href: "success-stories" } });
  const en = await db.navItemTranslation.updateMany({ where: { locale: EN, label: "Case studies" }, data: { label: "Success stories" } });
  const bn = await db.navItemTranslation.updateMany({ where: { locale: BN, label: "কেস স্টাডি" }, data: { label: "সাফল্যের গল্প" } });
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
  if (moved.count || en.count || bn.count) console.log(`• Case studies renamed Success stories (${moved.count} menu link(s) moved, ${en.count + bn.count} label(s) renamed)`);
}

/**
 * Once (XFL, 17 Oct 2026): publish the drafted success stories with only what
 * is on record. Every [bracketed] part comes out, with the challenge (the
 * client's own words) and the results and quote, which return once each client
 * approves them. A story with nothing left beyond its name (no app on record)
 * stays a draft. Stories already published, edited into another state or in
 * the trash are left alone.
 */
async function publishFactOnlyStories() {
  const MARK = "seed.publish-fact-only-stories-2026-10-17";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const strip = (v: string | null | undefined) => {
    const out = (v ?? "").replace(/\s*\[[^\]]*\]/g, "").replace(/[ \t]+\n/g, "\n").replace(/\s+$/g, "").trim();
    return out.replace(/[:\s]+$/, "") || null;
  };
  let published = 0;
  let kept = 0;
  for (const d of [...CASE_STUDY_DRAFTS, ...CLIENT_STORY_DRAFTS]) {
    const tr = await db.caseStudyTranslation.findFirst({ where: { slug: d.slug, locale: EN }, select: { caseStudyId: true } });
    if (!tr) continue;
    const story = await db.caseStudy.findUnique({ where: { id: tr.caseStudyId }, include: { translations: true } });
    if (!story || story.status !== "DRAFT" || story.deletedAt) continue;
    const solutionEn = strip(story.translations.find((t) => t.locale === EN)?.solution);
    if (!solutionEn) {
      kept++;
      continue;
    }
    for (const t of story.translations) {
      await db.caseStudyTranslation.update({
        where: { id: t.id },
        data: { title: strip(t.title) ?? t.title, summary: strip(t.summary), challenge: null, solution: strip(t.solution), outcome: null },
      });
    }
    await db.caseStudy.update({ where: { id: story.id }, data: { status: "PUBLISHED", publishAt: null } });
    published++;
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString(), published, kept } } });
  console.log(`• Success stories: ${published} published with only what is on record${kept ? `; ${kept} kept as drafts (no app or products on record yet)` : ""}`);
}

/**
 * Once (XFL, 18 Oct 2026): every client's app and website, checked on Google Play,
 * the App Store (Apple's lookup by app ID) and each house's own site that day.
 *  - Mika Securities' app: Amar Biniyog, on Google Play (net.mikasecurities.oms) and the
 *    App Store (id6504787994); XFL confirms it runs on Xpert.
 *  - UCB Stock Brokerage's app is now "UGrow" on Google Play and "UGrow by UCBSTOCK" on the
 *    App Store (same app, com.xfltrade.ubr).
 *  - Websites: AB Securities (absecuritiesltd.com), First Capital Securities (fcslbd.com).
 *  - Names: "Skyline Securities" (its own site), "Remons Investment & Securities Ltd.".
 * The other ten apps have no App Store listing (Apple's lookup, 18 Oct 2026).
 */
async function seedClientApps() {
  const MARK = "seed.client-apps-2026-10-18";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const notes: string[] = [];
  const checked = new Date("2026-10-18");

  // Names
  const rename = async (key: string, en: string, bn: string | null) => {
    const org = await db.organization.findUnique({ where: { key }, include: { translations: true } });
    if (!org) return;
    for (const t of org.translations) {
      const name = t.locale === EN ? en : bn;
      if (name && t.name !== name) await db.organizationTranslation.update({ where: { id: t.id }, data: { name } });
    }
    notes.push(en);
  };
  await rename("skyline", "Skyline Securities", "স্কাইলাইন সিকিউরিটিজ");
  await rename("remons-investment", "Remons Investment & Securities Ltd.", null);

  // Websites (kept when one is already set in the admin)
  for (const [key, url] of [["ab-securities", "https://absecuritiesltd.com"], ["first-capital-securities", "https://fcslbd.com"]] as const) {
    const r = await db.organization.updateMany({ where: { key, OR: [{ websiteUrl: null }, { websiteUrl: "" }] }, data: { websiteUrl: url } });
    if (r.count) notes.push(`${key} website`);
  }

  // UCB's app, renamed by UCB
  const ucb = await db.deployment.findUnique({ where: { key: "utrade-ucb-stock" } });
  if (ucb) {
    await db.deployment.update({
      where: { id: ucb.id },
      data: { appName: "UGrow by UCBSTOCK", appStoreUrl: "https://apps.apple.com/us/app/ugrow-by-ucbstock/id6753627888", linksCheckedAt: checked },
    });
    notes.push("UGrow by UCBSTOCK");
  }

  // Mika Securities' app
  const mika = await db.organization.findUnique({ where: { key: "mika-securities" }, select: { id: true } });
  if (mika && !(await db.deployment.findFirst({ where: { OR: [{ key: "amar-biniyog" }, { androidPackage: "net.mikasecurities.oms" }] } }))) {
    const offering = await db.offering.findUnique({ where: { key: "trading-platform" }, select: { id: true } });
    const last = await db.deployment.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
    await db.deployment.create({
      data: {
        key: "amar-biniyog",
        appName: "Amar Biniyog",
        androidPackage: "net.mikasecurities.oms",
        playStoreUrl: "https://play.google.com/store/apps/details?id=net.mikasecurities.oms",
        appStoreUrl: "https://apps.apple.com/us/app/amar-biniyog/id6504787994",
        organizationId: mika.id,
        offeringId: offering?.id ?? null,
        linksCheckedAt: checked,
        status: "PUBLISHED",
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
    });
    notes.push("Amar Biniyog (Mika Securities)");
  }

  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString(), notes } } });
  if (notes.length) console.log(`• Client apps and websites updated: ${notes.join(", ")}`);
}

/**
 * Once (XFL, 18 Oct 2026): First Capital Securities' app, Puji, on Google Play
 * (com.ecosoftbd.puji): "introduced by First Capital Securities Limited &
 * developed by EcoSoftBD IT Limited" (its store listing, checked 18 Oct 2026).
 */
async function seedFirstCapitalApp() {
  const MARK = "seed.first-capital-app-2026-10-18";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const org = await db.organization.findUnique({ where: { key: "first-capital-securities" }, select: { id: true } });
  let added = false;
  if (org && !(await db.deployment.findFirst({ where: { OR: [{ key: "puji" }, { androidPackage: "com.ecosoftbd.puji" }] } }))) {
    const offering = await db.offering.findUnique({ where: { key: "trading-platform" }, select: { id: true } });
    const last = await db.deployment.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
    await db.deployment.create({
      data: {
        key: "puji",
        appName: "Puji",
        androidPackage: "com.ecosoftbd.puji",
        playStoreUrl: "https://play.google.com/store/apps/details?id=com.ecosoftbd.puji",
        organizationId: org.id,
        offeringId: offering?.id ?? null,
        linksCheckedAt: new Date("2026-10-18"),
        status: "PUBLISHED",
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
    });
    added = true;
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString(), added } } });
  if (added) console.log("• First Capital Securities: Puji (Google Play) added to the live apps");
}

/**
 * Once (XFL, 18 Oct 2026): clickable sources, and success stories told from what is on record.
 *  - News stories from the press get their report's address (src/content/xfl2/press.ts).
 *  - Events get the report that describes them.
 *  - Each client's success story is rewritten from verified facts only: the house's own
 *    description (member-profiles.ts), its app and the stores it is on (Admin → App
 *    deployments), the exchanges it trades on; its store page is the source. Stories for
 *    Mika Securities (Amar Biniyog) and First Capital Securities (Puji) are published too.
 *    A story already edited in the admin is left alone.
 */
async function seedSourcesAndStories() {
  const MARK = "seed.sources-stories-2026-10-18";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  let articles = 0;
  let events = 0;
  let stories = 0;
  for (const p of PRESS_STORIES) {
    const tr = await db.articleTranslation.findFirst({ where: { locale: EN, slug: p.slug.en }, select: { articleId: true } });
    if (!tr) continue;
    const r = await db.article.updateMany({ where: { id: tr.articleId, sourceUrl: null }, data: { sourceUrl: p.sourceUrl, authorName: p.source } });
    articles += r.count;
    // The fuller text, re-read from the report (18 Oct 2026), where no editor has changed the story.
    const article = await db.article.findUnique({ where: { id: tr.articleId }, include: { translations: true } });
    if (article && !article.updatedById) {
      for (const t of article.translations) {
        const l = t.locale === BN ? "bn" : "en";
        if (t.body !== p.body[l]) await db.articleTranslation.update({ where: { id: t.id }, data: { body: p.body[l], excerpt: p.excerpt[l] } });
      }
    }
  }
  const bySlug = (slug: string) => PRESS_STORIES.find((p) => p.slug.en === slug);
  const EVENT_SOURCES: Record<string, string> = {
    "seminar-capital-market-digitization-2026": "xpert-fintech-one-stop-service-capital-market",
    "stakeholders-dayout-2026": "stakeholders-dayout-2026",
    "ecosoftbd-mou-signing": "xpert-fintech-acquires-ecosoftbd-new-nation",
  };
  for (const [key, story] of Object.entries(EVENT_SOURCES)) {
    const p = bySlug(story);
    if (!p) continue;
    const r = await db.event.updateMany({ where: { key, sourceUrl: null }, data: { sourceName: p.source, sourceUrl: p.sourceUrl } });
    events += r.count;
  }

  const drafts = [...CASE_STUDY_DRAFTS, ...CLIENT_STORY_DRAFTS];
  for (const d of drafts) {
    const tr = await db.caseStudyTranslation.findFirst({ where: { slug: d.slug, locale: EN }, select: { caseStudyId: true } });
    if (!tr) continue;
    const story = await db.caseStudy.findUnique({ where: { id: tr.caseStudyId }, include: { translations: true } });
    if (!story || story.deletedAt || story.updatedById) continue;
    const org = await db.organization.findUnique({ where: { key: d.key }, include: { translations: true } });
    const app = org ? await db.deployment.findFirst({ where: { organizationId: org.id, status: "PUBLISHED", deletedAt: null, appName: { not: null } }, orderBy: { sortOrder: "asc" } }) : null;
    if (!org || !app?.appName) continue; // no app on record: the story stays as it is
    const profile = MEMBER_PROFILES.find((m) => m.key === d.key);
    const nameOf = (l: "en" | "bn") => org.translations.find((t) => t.locale === (l === "en" ? EN : BN))?.name ?? org.translations[0]?.name ?? "";
    const member = org.kind === "CONSORTIUM_MEMBER";
    const dse = Boolean(org.dseTrec ?? profile?.dseTrec);
    const cse = Boolean(org.cseTrec ?? profile?.cseTrec);
    const exch = { en: dse && cse ? "DSE and CSE" : cse ? "CSE" : "DSE", bn: dse && cse ? "ডিএসই ও সিএসই" : cse ? "সিএসই" : "ডিএসই" };
    const stores = { en: app.appStoreUrl ? "Google Play and the App Store" : "Google Play", bn: app.appStoreUrl ? "গুগল প্লে ও অ্যাপ স্টোর" : "গুগল প্লে" };
    const trec = [org.dseTrec ?? profile?.dseTrec ? `DSE TREC ${org.dseTrec ?? profile?.dseTrec}` : null, org.cseTrec ?? profile?.cseTrec ? `CSE TREC ${org.cseTrec ?? profile?.cseTrec}` : null].filter(Boolean).join(", ");
    const ecosoft = app.androidPackage?.startsWith("com.ecosoftbd.");
    const text = {
      en: {
        title: `${nameOf("en")}: ${app.appName} on ${member ? "the shared Xpert platform" : "Xpert's platform"}`,
        summary: `${nameOf("en")}${member ? ", a member of the consortium that owns Xpert Fintech," : ""} gives its investors ${app.appName}, a trading app on ${stores.en}${ecosoft ? ", developed by EcoSoftBD IT Limited, the order management system company Xpert Fintech acquired" : " built on the Xpert platform"}.`,
        solution: [
          profile?.description.en ?? null,
          `Investors trade from ${app.appName}; every order passes the risk checks built into the Xpert Trading OMS before it reaches ${exch.en}.`,
          trec ? `${nameOf("en")} holds ${trec}.` : null,
        ].filter(Boolean).join(" "),
      },
      bn: {
        title: `${nameOf("bn")}: ${member ? "শেয়ার করা এক্সপার্ট প্ল্যাটফর্মে" : "এক্সপার্টের প্ল্যাটফর্মে"} ${app.appName}`,
        summary: `${nameOf("bn")}${member ? " — এক্সপার্ট ফিনটেকের মালিক কনসোর্টিয়ামের সদস্য —" : ""} তাদের বিনিয়োগকারীদের দেয় ${app.appName}, ${stores.bn}-তে পাওয়া একটি ট্রেডিং অ্যাপ${ecosoft ? ", যা তৈরি করেছে এক্সপার্ট ফিনটেকের অধিগ্রহণ করা অর্ডার ম্যানেজমেন্ট সিস্টেম প্রতিষ্ঠান ইকোসফটবিডি আইটি লিমিটেড" : ", এক্সপার্ট প্ল্যাটফর্মে তৈরি"}।`,
        solution: [
          profile?.description.bn ?? null,
          `বিনিয়োগকারীরা ${app.appName} থেকে লেনদেন করেন; প্রতিটি অর্ডার ${exch.bn}-তে পৌঁছানোর আগে এক্সপার্ট ট্রেডিং ওএমএস-এর ভেতরের ঝুঁকি যাচাই পার হয়।`,
          trec ? `${trec}।` : null,
        ].filter(Boolean).join(" "),
      },
    };
    for (const t of story.translations) {
      const l = t.locale === BN ? "bn" : "en";
      await db.caseStudyTranslation.update({
        where: { id: t.id },
        data: { title: text[l].title, summary: text[l].summary, challenge: null, solution: text[l].solution, outcome: null },
      });
    }
    await db.caseStudy.update({
      where: { id: story.id },
      data: { status: "PUBLISHED", publishAt: null, sourceName: "Google Play", sourceUrl: app.playStoreUrl ?? app.appStoreUrl ?? null },
    });
    stories++;
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString(), articles, events, stories } } });
  console.log(`• Sources: ${articles} news stor${articles === 1 ? "y" : "ies"} and ${events} event(s) link to their report; ${stories} success stories told from what is on record, each with its store page as source`);
}

/**
 * Once (CTO decision, 18 Oct 2026):
 *  - Market share: the figure on the site is DSE's. Arthosuchak (20 Aug and 21 Sep 2026,
 *    the second from XFL's press release) reports 45-47% of DSE's daily turnover through
 *    Xpert's OMS, up to 57% on the busiest days. Shown as DSE 45% (the low end), as of
 *    21 Sep 2026, with the range as a note and the report as source; CSE stays "to be
 *    published". Applied only if the figure on the site is still the earlier "combined 45%"
 *    (or none), so a figure entered in the admin is kept.
 *  - Clients: Innova Securities and Wifang Securities, named among the 16 brokerage houses
 *    using Xpert's OMS (Arthosuchak, 20 Aug 2026), are published; with IDLC Securities they
 *    are the 17 the company reported on 21 Sep 2026.
 */
async function seedShareAndClients() {
  const MARK = "seed.share-clients-2026-10-18";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const notes: string[] = [];
  const row = await db.siteSetting.findUnique({ where: { key: "market.headlineShare" } });
  const v = (row?.value ?? null) as { pct?: number | null; dse?: number; cse?: number } | null;
  const earlier = !v || (Number(v.pct) === 45 && v.dse === undefined && v.cse === undefined);
  if (earlier) {
    const report = PRESS_STORIES.find((p) => p.slug.en === "stakeholders-dayout-2026");
    const value = {
      pct: null,
      asOf: "2026-09-21",
      dse: 45,
      source: "Arthosuchak",
      ...(report && { sourceUrl: report.sourceUrl }),
      note: {
        en: "45–47% of DSE's daily turnover on a typical day, up to 57% on the busiest (company figures).",
        bn: "সাধারণ দিনে ডিএসইর দৈনিক লেনদেনের ৪৫–৪৭%, সবচেয়ে ব্যস্ত দিনে ৫৭% পর্যন্ত (প্রতিষ্ঠানের তথ্য)।",
      },
    };
    await db.siteSetting.upsert({ where: { key: "market.headlineShare" }, update: { value }, create: { key: "market.headlineShare", value } });
    notes.push("market share: DSE 45% (Arthosuchak, 21 Sep 2026)");
  }
  for (const key of ["innova-securities", "wifang-securities"]) {
    const r = await db.organization.updateMany({ where: { key, deletedAt: null, status: "DRAFT" }, data: { status: "PUBLISHED", kind: "CLIENT" } });
    if (r.count) notes.push(`${key} published`);
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString(), notes } } });
  if (notes.length) console.log(`• ${notes.join("; ")}`);
}

/**
 * Once (XFL, 18 Oct 2026): Innova Securities Ltd. is live on Xpert.
 *  - Android app "Innova OMS" (com.innovaoms.oms), linked from Innova's own website
 *    (innovasecurities.com.bd) and described on Google Play as "OMS application for
 *    Innova Securities Ltd."; no App Store listing found.
 *  - Web trading: the OMS login Innova's website links to (ibl.xfltrade.com, Xpert-hosted).
 *  - Website innovasecurities.com.bd and DSE TREC No. 302, as its website states,
 *    set only where the admin has none.
 */
async function seedInnovaApp() {
  const MARK = "seed.innova-app-2026-10-18";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const notes: string[] = [];
  const org = await db.organization.findUnique({ where: { key: "innova-securities" }, select: { id: true, websiteUrl: true, dseTrec: true } });
  if (org) {
    const data: { websiteUrl?: string; dseTrec?: string } = {};
    if (!org.websiteUrl) data.websiteUrl = "https://innovasecurities.com.bd/";
    if (!org.dseTrec) data.dseTrec = "302";
    if (Object.keys(data).length) {
      await db.organization.update({ where: { id: org.id }, data });
      notes.push(`details: ${Object.keys(data).join(", ")}`);
    }
    if (!(await db.deployment.findFirst({ where: { OR: [{ key: "innova-oms" }, { androidPackage: "com.innovaoms.oms" }] } }))) {
      const offering = await db.offering.findUnique({ where: { key: "trading-platform" }, select: { id: true } });
      const last = await db.deployment.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
      await db.deployment.create({
        data: {
          key: "innova-oms",
          appName: "Innova OMS",
          androidPackage: "com.innovaoms.oms",
          playStoreUrl: "https://play.google.com/store/apps/details?id=com.innovaoms.oms",
          webUrl: "https://ibl.xfltrade.com/app/Login",
          organizationId: org.id,
          offeringId: offering?.id ?? null,
          linksCheckedAt: new Date("2026-10-18"),
          status: "PUBLISHED",
          sortOrder: (last?.sortOrder ?? 0) + 1,
        },
      });
      notes.push("Innova OMS (Google Play, web) added to the live apps");
    }
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString(), notes } } });
  if (notes.length) console.log(`• Innova Securities: ${notes.join("; ")}`);
}

/**
 * Once (XFL, 18 Oct 2026): Thea Securities Ltd. confirmed as a client, listed with
 * IDLC Securities under "Also running on Xpert". Name and DSE TREC No. 130 as on DSE's
 * TREC holder list; no website found, so its name is not a link. An organization
 * edited in the admin keeps its name.
 */
async function seedTheaClient() {
  const MARK = "seed.thea-client-2026-10-18";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const names = { en: "Thea Securities Ltd.", bn: "থিয়া সিকিউরিটিজ লিমিটেড" };
  let org = await db.organization.findUnique({ where: { key: "thia-securities" }, include: { translations: true } });
  if (!org) {
    org = await db.organization.create({
      data: { key: "thia-securities", kind: "CLIENT", status: "PUBLISHED", sortOrder: 130, dseTrec: "130", translations: { create: [{ locale: EN, name: names.en }, { locale: BN, name: names.bn }] } },
      include: { translations: true },
    });
  } else {
    await db.organization.update({
      where: { id: org.id },
      data: { status: "PUBLISHED", deletedAt: null, ...(org.kind !== "CONSORTIUM_MEMBER" && { kind: "CLIENT" }), ...(!org.dseTrec && { dseTrec: "130" }) },
    });
    if (!org.updatedById) {
      for (const l of ["en", "bn"] as const) {
        const locale = l === "en" ? EN : BN;
        const tr = org.translations.find((t) => t.locale === locale);
        if (tr) await db.organizationTranslation.update({ where: { id: tr.id }, data: { name: names[l] } });
        else await db.organizationTranslation.create({ data: { organizationId: org.id, locale, name: names[l] } });
      }
    }
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
  console.log("• Thea Securities Ltd. listed as a client (DSE TREC 130)");
}

/**
 * XFL, 19 Oct 2026: Bluechip Securities Ltd. and Square Securities Management Ltd.
 * are clients. Their logos are taken from their own websites the first time the
 * seed runs on a machine with internet (saved to prisma/seed-media/logos, then
 * attached like the other client logos); if that fails, the name shows until a
 * logo is uploaded in Admin → Organizations.
 */
const NEW_CLIENT_LOGO_SOURCES: { key: string; site: string; logo?: string; alts?: string[] }[] = [
  { key: "bluechip-securities", site: "https://bluechipsecuritiesltd.com/", logo: "https://bluechipsecuritiesltd.com/wp-content/uploads/2020/01/Logo-Bluechip-Final.jpg" },
  // Its site redirects HTTPS to HTTP, so the plain-HTTP addresses are tried too.
  { key: "square-securities", site: "https://www.ssml.com.bd/", alts: ["https://ssml.com.bd/", "http://www.ssml.com.bd/", "http://ssml.com.bd/"] },
];
async function fetchNewClientLogos() {
  const dir = path.join(process.cwd(), "prisma", "seed-media", "logos");
  for (const c of NEW_CLIENT_LOGO_SOURCES) {
    if (["png", "jpg", "jpeg", "webp"].some((ext) => existsSync(path.join(dir, `${c.key}.${ext}`)))) continue;
    const org = await db.organization.findUnique({ where: { key: c.key }, select: { logoMediaId: true } });
    if (org?.logoMediaId) continue;
    try {
      let url = c.logo;
      if (!url) {
        // The first image on the home page whose address or alt text says "logo" (each address tried in turn).
        for (const site of [c.site, ...(c.alts ?? [])]) {
          try {
            const html = await (await fetch(site, { signal: AbortSignal.timeout(15000), redirect: "follow" })).text();
            const img = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]).find((tag) => /logo/i.test(tag));
            const src = img?.match(/\bsrc=["']([^"']+)["']/i)?.[1];
            if (src) {
              url = new URL(src, site).toString();
              break;
            }
          } catch {
            // try the next address
          }
        }
      }
      if (!url) throw new Error("no logo found on the home page");
      const data = Buffer.from(await (await fetch(url, { signal: AbortSignal.timeout(15000) })).arrayBuffer());
      const type = sniff(data);
      if (!type || type.kind !== "IMAGE" || type.ext === "gif") throw new Error(`not a PNG, JPEG or WebP image: ${url}`);
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, `${c.key}.${type.ext}`), data);
      console.log(`• ${c.key}: logo taken from ${url} — check it in Admin → Organizations`);
    } catch (e) {
      console.log(`• ${c.key}: logo could not be fetched (${(e as Error).message}); upload it in Admin → Organizations`);
    }
  }
}

/**
 * Once (XFL, 19 Oct 2026): details for the two new clients, where the admin has none.
 *  - Bluechip Securities Ltd.: bluechipsecuritiesltd.com; DSE TREC No. 47 (its corporate profile page).
 *  - Square Securities Management Ltd.: ssml.com.bd; DSE TREC No. 076 (DSE TREC holder list,
 *    as republished by NRBC Bank Securities).
 * Bangla names added; names edited in the admin are kept.
 */
async function seedBluechipSquare() {
  const MARK = "seed.bluechip-square-2026-10-19";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const rows = [
    { key: "bluechip-securities", website: "https://bluechipsecuritiesltd.com/", dseTrec: "47", en: "Bluechip Securities Ltd.", bn: "ব্লুচিপ সিকিউরিটিজ লিমিটেড" },
    { key: "square-securities", website: "https://www.ssml.com.bd/", dseTrec: "076", en: "Square Securities Management Ltd.", bn: "স্কয়ার সিকিউরিটিজ ম্যানেজমেন্ট লিমিটেড" },
  ];
  for (const r of rows) {
    const org = await db.organization.findUnique({ where: { key: r.key }, include: { translations: true } });
    if (!org || org.deletedAt) continue;
    await db.organization.update({
      where: { id: org.id },
      data: { status: "PUBLISHED", ...(org.kind !== "CONSORTIUM_MEMBER" && { kind: "CLIENT" }), ...(!org.websiteUrl && { websiteUrl: r.website }), ...(!org.dseTrec && { dseTrec: r.dseTrec }) },
    });
    if (!org.translations.some((t) => t.locale === BN)) await db.organizationTranslation.create({ data: { organizationId: org.id, locale: BN, name: r.bn } });
    if (!org.translations.some((t) => t.locale === EN)) await db.organizationTranslation.create({ data: { organizationId: org.id, locale: EN, name: r.en } });
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
  console.log("• Bluechip Securities (DSE TREC 47) and Square Securities Management (DSE TREC 076) listed as clients");
}

/**
 * Once each (XFL, 19 Oct 2026): consortium houses' representatives with no seat at
 * Xpert, so no positions: they show only on the consortium map, under their house
 * (matched by the position). Contact details and photos can be changed in Admin → People.
 *  - Wasif Zaman, Deputy Managing Director, Mika Securities Limited.
 *  - Md. Mofizuddin, Chairman & Managing Director, Remons Investment & Securities Ltd.
 *  - Asaduzzaman, Chief Executive Officer, AB Securities Limited.
 *  Photos supplied by XFL, unedited: prisma/seed-media/people/<key>.jpg.
 */
const REPRESENTATIVES = [
  { key: "wasif-zaman", mark: "seed.mika-rep-2026-10-19", en: "Wasif Zaman", bn: "ওয়াসিফ জামান", aff: { en: "Deputy Managing Director, Mika Securities Limited", bn: "উপ-ব্যবস্থাপনা পরিচালক, মিকা সিকিউরিটিজ লিমিটেড" } },
  {
    key: "md-mofizuddin",
    mark: "seed.remons-rep-2026-10-19",
    en: "Md. Mofizuddin",
    bn: "মো. মফিজউদ্দিন",
    aff: { en: "Chairman & Managing Director, Remons Investment & Securities Ltd.", bn: "চেয়ারম্যান ও ব্যবস্থাপনা পরিচালক, রেমন্স ইনভেস্টমেন্ট অ্যান্ড সিকিউরিটিজ লিমিটেড" },
  },
  {
    key: "asaduzzaman",
    mark: "seed.ab-rep-2026-10-19",
    en: "Asaduzzaman",
    bn: "আসাদুজ্জামান",
    aff: { en: "Chief Executive Officer, AB Securities Limited", bn: "প্রধান নির্বাহী কর্মকর্তা, এবি সিকিউরিটিজ লিমিটেড" },
  },
];
async function seedRepresentatives() {
  for (const r of REPRESENTATIVES) {
    // A photo supplied after the person was added is attached once, unless one was set in the admin.
    const existing = await db.person.findUnique({ where: { key: r.key }, select: { id: true, photoMediaId: true } });
    if (existing && !existing.photoMediaId) {
      const photo = await seedImage("people", r.key, r.en, ["person", "portrait"]);
      if (photo) {
        await db.person.update({ where: { id: existing.id }, data: { photoMediaId: photo } });
        await db.mediaUsage.create({ data: { mediaId: photo, entityType: "PERSON", entityId: existing.id, field: "photo" } });
        console.log(`• ${r.en}: photo added`);
      }
    }
    if (await db.siteSetting.findUnique({ where: { key: r.mark } })) continue;
    if (!existing) {
      const photo = await seedImage("people", r.key, r.en, ["person", "portrait"]);
      const person = await db.person.create({
        data: {
          key: r.key,
          status: "PUBLISHED",
          photoMediaId: photo,
          translations: {
            create: [
              { locale: EN, name: r.en, affiliation: r.aff.en },
              { locale: BN, name: r.bn, affiliation: r.aff.bn },
            ],
          },
        },
      });
      if (photo) await db.mediaUsage.create({ data: { mediaId: photo, entityType: "PERSON", entityId: person.id, field: "photo" } });
    }
    await db.siteSetting.create({ data: { key: r.mark, value: { at: new Date().toISOString() } } });
    console.log(`• ${r.en} added as representative of ${r.aff.en.split(", ").slice(1).join(", ")} (consortium map)`);
  }
}

/** Once (XFL, 18 Oct 2026): Wifang Securities Ltd.'s website (wifangbd.com, titled "Wifang Securities Ltd."), where the admin has none. */
async function seedWifangWebsite() {
  const MARK = "seed.wifang-website-2026-10-18";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const r = await db.organization.updateMany({ where: { key: "wifang-securities", websiteUrl: null }, data: { websiteUrl: "https://wifangbd.com/" } });
  const e = await db.organization.updateMany({ where: { key: "wifang-securities", websiteUrl: "" }, data: { websiteUrl: "https://wifangbd.com/" } });
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
  if (r.count + e.count) console.log("• Wifang Securities: website set to wifangbd.com");
}

/**
 * Once (XFL, 18 Oct 2026): the IDLC logo XFL supplied replaces the one on IDLC Securities'
 * card (the client-logo step only fills empty logos, and IDLC already had a placeholder).
 */
async function seedIdlcLogo() {
  const MARK = "seed.idlc-logo-2026-10-18";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const org = await db.organization.findUnique({ where: { key: "idlc-securities" }, select: { id: true } });
  const logo = org ? await seedImage("logos", "idlc-securities", "IDLC logo", ["logo", "client"]) : null;
  if (!org || !logo) return; // tried again on the next run
  await db.organization.update({ where: { id: org.id }, data: { logoMediaId: logo, logoPermission: true } });
  await db.mediaUsage.deleteMany({ where: { entityType: "ORGANIZATION", entityId: org.id, field: "logo" } });
  await db.mediaUsage.create({ data: { mediaId: logo, entityType: "ORGANIZATION", entityId: org.id, field: "logo" } });
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
  console.log("• IDLC Securities: logo replaced with the one XFL supplied (run npm run media:to-db next)");
}

/**
 * Once (XFL, 18 Oct 2026, at XFL's instruction): the board's review cards published as
 * approved, so the reviews section shows; XFL completes each card (the director's own
 * words, title and rating) in Admin → Testimonials. Cards still carrying the bracketed
 * placeholder show it as written until edited.
 */
async function publishReviewCards() {
  const MARK = "seed.publish-review-cards-2026-10-18";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const r = await db.testimonial.updateMany({ where: { deletedAt: null, status: "DRAFT" }, data: { status: "PUBLISHED", hasApproval: true } });
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString(), published: r.count } } });
  if (r.count) console.log(`• ${r.count} review card(s) published as approved: complete them in Admin → Testimonials`);
}

/**
 * Once (XFL, 18 Oct 2026, at XFL's instruction): show on the site what XFL will edit in the admin.
 *  - The Chairman's and the Managing Director's messages published (Admin → Messages).
 *  - The cost savings graphic published with XFL's figure, an 80% lower cost, drawn to scale
 *    (no amounts until XFL enters the before and with-Xpert costs in Admin → Home highlights).
 *    A graphic already filled in the admin is left alone.
 */
async function showForEditing() {
  const MARK = "seed.show-for-editing-2026-10-18";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const notes: string[] = [];
  for (const key of ["message.chairman", "message.md"]) {
    const row = await db.siteSetting.findUnique({ where: { key } });
    const v = row?.value as Record<string, unknown> | undefined;
    if (v && v.published !== true) {
      await db.siteSetting.update({ where: { key }, data: { value: { ...v, published: true } } });
      notes.push(`${key.replace("message.", "")} message published`);
    }
  }
  const savings = await db.siteSetting.findUnique({ where: { key: "home.savings" } });
  const sv = savings?.value as Record<string, unknown> | undefined;
  if (!sv || (sv.published !== true && sv.before == null && sv.after == null)) {
    const value = {
      ...(sv ?? {}),
      published: true,
      pct: 80,
      titleEn: "{pct}% lower technology cost",
      titleBn: "প্রযুক্তি ব্যয় {pct}% কম",
      bodyEn: "Brokerage houses on Xpert share one platform instead of each paying for its own systems.",
      bodyBn: "এক্সপার্টে থাকা ব্রোকারেজ হাউসগুলো প্রত্যেকে আলাদা সিস্টেমের খরচ না দিয়ে একটি প্ল্যাটফর্ম ভাগ করে নেয়।",
      beforeLabelEn: "Before Xpert",
      beforeLabelBn: "এক্সপার্টের আগে",
      afterLabelEn: "With Xpert",
      afterLabelBn: "এক্সপার্টের সঙ্গে",
      source: "Xpert Fintech Ltd.",
    };
    await db.siteSetting.upsert({ where: { key: "home.savings" }, update: { value }, create: { key: "home.savings", value } });
    notes.push("cost savings graphic published (80%)");
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString(), notes } } });
  if (notes.length) console.log(`• ${notes.join("; ")}: edit in the admin`);
}

/**
 * Once (XFL, 19 Oct 2026): the WhatsApp number for demo requests, +880 1684-810100, with a
 * demo-request message typed in for the visitor. Set only where Admin → Home highlights has
 * no number yet; change it there at any time.
 */
async function seedWhatsAppNumber() {
  const MARK = "seed.whatsapp-number-2026-10-19";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const row = await db.siteSetting.findUnique({ where: { key: "site.whatsapp" } });
  const v = (row?.value && typeof row.value === "object" && !Array.isArray(row.value) ? row.value : {}) as Record<string, unknown>;
  let changed = false;
  if (!String(v.number ?? "").replace(/\D/g, "")) {
    const value = {
      ...v,
      number: "+880 1684-810100",
      labelEn: v.labelEn || "Chat on WhatsApp",
      labelBn: v.labelBn || "হোয়াটসঅ্যাপে কথা বলুন",
      messageEn: "Hello Xpert Fintech, I would like to request a demo of your brokerage platform. Please let me know a convenient time.",
      messageBn: "হ্যালো এক্সপার্ট ফিনটেক, আমি আপনাদের ব্রোকারেজ প্ল্যাটফর্মের একটি ডেমো দেখতে চাই। অনুগ্রহ করে সুবিধাজনক সময় জানাবেন।",
    };
    await db.siteSetting.upsert({ where: { key: "site.whatsapp" }, update: { value }, create: { key: "site.whatsapp", value } });
    changed = true;
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString(), changed } } });
  if (changed) console.log("• WhatsApp button: +880 1684-810100 (Admin → Home highlights)");
}

/** Copy of DEFAULT_STRENGTHS (src/lib/content/highlights.ts is server-only). */
const DEFAULT_STRENGTHS_SEED = {
  titleEn: "Built by brokers. *Trusted* by brokers.",
  titleBn: "ব্রোকারদের হাতে গড়া। ব্রোকারদের *আস্থায়*।",
  introEn: "Five reasons the houses that own Xpert also run their business on it.",
  introBn: "যে হাউসগুলো এক্সপার্টের মালিক, তারাই কেন এতে তাদের ব্যবসা চালায়: পাঁচটি কারণ।",
  items: [
    {
      icon: "users",
      titleEn: "Built by the market's top brokers",
      titleBn: "বাজারের শীর্ষ ব্রোকারদের হাতে গড়া",
      bodyEn: "Designed with the brokerage houses that own Xpert and trade on it every day, so every screen follows how a dealing desk really works.",
      bodyBn: "এক্সপার্টের মালিক ও প্রতিদিন এতে লেনদেনকারী ব্রোকারেজ হাউসগুলোর সঙ্গে মিলে তৈরি, তাই প্রতিটি স্ক্রিন ডিলিং ডেস্কের বাস্তব কাজের ধারা মেনে চলে।",
    },
    {
      icon: "shield",
      titleEn: "Enterprise-grade security",
      titleBn: "এন্টারপ্রাইজ-মানের নিরাপত্তা",
      bodyEn: "Access controls on every desk, encrypted connections and pre-trade risk checks protect each account and every order.",
      bodyBn: "প্রতিটি ডেস্কে প্রবেশাধিকার নিয়ন্ত্রণ, এনক্রিপ্টেড সংযোগ ও লেনদেনের আগে ঝুঁকি যাচাই প্রতিটি অ্যাকাউন্ট ও অর্ডার সুরক্ষিত রাখে।",
    },
    {
      icon: "network",
      titleEn: "High-availability network",
      titleBn: "উচ্চ প্রাপ্যতার নেটওয়ার্ক",
      bodyEn: "A redundant network built to keep orders flowing to DSE and CSE through the busiest hours of the trading day.",
      bodyBn: "লেনদেনের সবচেয়ে ব্যস্ত সময়েও ডিএসই ও সিএসইতে অর্ডার পৌঁছে দিতে তৈরি রিডানড্যান্ট নেটওয়ার্ক।",
    },
    {
      icon: "briefcase",
      titleEn: "Owned by leading institutions",
      titleBn: "শীর্ষস্থানীয় প্রতিষ্ঠানের মালিকানাধীন",
      bodyEn: "A capital-market fintech owned by a consortium of the country's leading bank-backed and independent brokerage houses.",
      bodyBn: "দেশের শীর্ষস্থানীয় ব্যাংক-সমর্থিত ও স্বতন্ত্র ব্রোকারেজ হাউসগুলোর একটি কনসোর্টিয়ামের মালিকানাধীন পুঁজিবাজার ফিনটেক।",
    },
    {
      icon: "cloud",
      titleEn: "Institutional-grade infrastructure",
      titleBn: "প্রাতিষ্ঠানিক মানের অবকাঠামো",
      bodyEn: "Data-centre hosting, monitoring and backups built for regulated institutions, not for a single office.",
      bodyBn: "একটি অফিসের জন্য নয়, নিয়ন্ত্রিত প্রতিষ্ঠানের জন্য তৈরি ডেটা সেন্টার হোস্টিং, পর্যবেক্ষণ ও ব্যাকআপ।",
    },
  ],
};

/**
 * Once (XFL, 19 Oct 2026): core strengths led by who owns Xpert, with real numbers.
 * Paid-up capital ৳33 crore as stated by XFL. The 12 owner houses, by parent
 * (checked 19 Oct 2026; src/content/xfl2/member-profiles.ts and parents' own pages):
 *  - banks (7): Bank Asia (Bank Asia Securities), Eastern Bank (EBL Securities, fully owned),
 *    Islami Bank Bangladesh (Islami Bank Securities), ONE Bank (ONE Securities; ONE Bank annual
 *    report 2016), Shahjalal Islami Bank (SJIBSL, sole subsidiary since 2011, its own site),
 *    United Commercial Bank (UCB Stock Brokerage), AB Bank (AB Securities; AB Bank's listing);
 *  - insurers (2): Green Delta Insurance (Green Delta Securities, fully owned; green-delta.com),
 *    National Life Insurance (NLI Securities; nlibd.com);
 *  - corporate group (1): Apex group (Apex Investments).
 *  Mika Securities and Remons Investment are not counted under any parent (none confirmed).
 *  Board: nine directors, each a senior executive of an owner house (Admin → People).
 * Placed first; existing cards are kept after them (edits included), the old "Owned by
 * leading institutions" card is replaced, and the two infrastructure cards are merged
 * while they still have their original text. At most 10 cards (Admin → Home highlights).
 * Also adds "৳33 crore paid-up capital" to Admin → Figures when there is room.
 */
async function seedInstitutionStrengths() {
  const MARK = "seed.institution-strengths-2026-10-19";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  type Item = { icon: string; titleEn: string; titleBn: string; bodyEn: string; bodyBn: string; statEn?: string; statBn?: string };
  const row = await db.siteSetting.findUnique({ where: { key: "home.strengths" } });
  const cur = (row?.value as { items?: Item[]; introEn?: string; introBn?: string } | undefined) ?? undefined;
  const existing: Item[] = cur?.items ?? [];
  const lead: Item[] = [
    {
      icon: "building",
      titleEn: "Owned by the country's leading institutions",
      titleBn: "দেশের শীর্ষস্থানীয় প্রতিষ্ঠানগুলোর মালিকানাধীন",
      statEn: "৳33 cr",
      statBn: "৳৩৩ কোটি",
      bodyEn: "A capital-market fintech with ৳33 crore paid-up capital, owned by 12 brokerage houses backed by the country's banks, insurers and corporate groups.",
      bodyBn: "৳৩৩ কোটি পরিশোধিত মূলধনের পুঁজিবাজার ফিনটেক, যার মালিক দেশের ব্যাংক, বিমা প্রতিষ্ঠান ও করপোরেট গ্রুপ-সমর্থিত ১২টি ব্রোকারেজ হাউস।",
    },
    {
      icon: "landmark",
      titleEn: "Bank subsidiaries",
      titleBn: "ব্যাংকের সাবসিডিয়ারি",
      statEn: "7",
      statBn: "৭",
      bodyEn: "Seven owners are brokerage subsidiaries of banks: Bank Asia, Eastern Bank, Islami Bank Bangladesh, ONE Bank, Shahjalal Islami Bank, United Commercial Bank and AB Bank.",
      bodyBn: "সাতটি মালিক প্রতিষ্ঠান ব্যাংকের ব্রোকারেজ সাবসিডিয়ারি: ব্যাংক এশিয়া, ইস্টার্ন ব্যাংক, ইসলামী ব্যাংক বাংলাদেশ, ওয়ান ব্যাংক, শাহজালাল ইসলামী ব্যাংক, ইউনাইটেড কমার্শিয়াল ব্যাংক ও এবি ব্যাংক।",
    },
    {
      icon: "shield",
      titleEn: "Insurance companies",
      titleBn: "বিমা প্রতিষ্ঠান",
      statEn: "2",
      statBn: "২",
      bodyEn: "Green Delta Securities and NLI Securities, the brokerage subsidiaries of Green Delta Insurance and National Life Insurance, are among the owners.",
      bodyBn: "গ্রিন ডেল্টা ইন্স্যুরেন্স ও ন্যাশনাল লাইফ ইন্স্যুরেন্সের ব্রোকারেজ সাবসিডিয়ারি গ্রিন ডেল্টা সিকিউরিটিজ ও এনএলআই সিকিউরিটিজ মালিকদের মধ্যে রয়েছে।",
    },
    {
      icon: "briefcase",
      titleEn: "Corporate companies",
      titleBn: "করপোরেট প্রতিষ্ঠান",
      bodyEn: "Apex Investments, the brokerage house of the Apex group, a Syed Manzur Elahi enterprise, is an owner, alongside independent brokerage houses.",
      bodyBn: "সৈয়দ মঞ্জুর এলাহীর প্রতিষ্ঠান অ্যাপেক্স গ্রুপের ব্রোকারেজ হাউস অ্যাপেক্স ইনভেস্টমেন্টস স্বতন্ত্র ব্রোকারেজ হাউসগুলোর পাশাপাশি একজন মালিক।",
    },
    {
      icon: "users",
      titleEn: "Institutional governance",
      titleBn: "প্রাতিষ্ঠানিক সুশাসন",
      statEn: "9",
      statBn: "৯",
      bodyEn: "A nine-member board, each director a chief executive or senior leader of an owner house, so the institutions that trade on Xpert set its direction.",
      bodyBn: "নয় সদস্যের পরিচালনা পর্ষদ, প্রত্যেক পরিচালক একটি মালিক হাউসের প্রধান নির্বাহী বা জ্যেষ্ঠ কর্মকর্তা; তাই এক্সপার্টে লেনদেনকারী প্রতিষ্ঠানগুলোই এর দিকনির্দেশনা ঠিক করে।",
    },
    {
      icon: "award",
      titleEn: "Backed by top institutions",
      titleBn: "শীর্ষ প্রতিষ্ঠানগুলোর সমর্থনপুষ্ট",
      statEn: "10",
      statBn: "১০",
      bodyEn: "Behind the owner houses stand ten parent institutions: seven banks, two insurers and the Apex group.",
      bodyBn: "মালিক হাউসগুলোর পেছনে রয়েছে দশটি মূল প্রতিষ্ঠান: সাতটি ব্যাংক, দুটি বিমা প্রতিষ্ঠান ও অ্যাপেক্স গ্রুপ।",
    },
    {
      icon: "check",
      titleEn: "Compliance built into every order",
      titleBn: "প্রতিটি অর্ডারে কমপ্লায়েন্স",
      bodyEn: "Every order passes pre-trade checks before it leaves the brokerage: no short selling, buying power and margin limits, value and quantity caps, and the price band.",
      bodyBn: "ব্রোকারেজ থেকে বের হওয়ার আগে প্রতিটি অর্ডার যাচাই হয়: শর্ট সেল প্রতিরোধ, ক্রয়ক্ষমতা ও মার্জিন সীমা, মূল্য ও পরিমাণের সীমা এবং প্রাইস ব্যান্ড।",
    },
  ];
  const D = DEFAULT_STRENGTHS_SEED;
  const same = (a: Item | undefined, b: Item | undefined) => !!a && !!b && a.titleEn === b.titleEn && a.bodyEn === b.bodyEn;
  let rest = (existing.length ? existing : D.items).filter((i) => i.titleEn !== "Owned by leading institutions" && !lead.some((l) => l.titleEn === i.titleEn));
  const net = rest.find((i) => same(i, D.items[2]));
  const infra = rest.find((i) => same(i, D.items[4]));
  if (net && infra) {
    rest = rest
      .filter((i) => i !== net)
      .map((i) =>
        i === infra
          ? {
              ...i,
              bodyEn: "Data-centre hosting, a redundant network to DSE and CSE, monitoring and backups, built for regulated institutions and the busiest trading hours.",
              bodyBn: "ডেটা সেন্টার হোস্টিং, ডিএসই ও সিএসই পর্যন্ত রিডানড্যান্ট নেটওয়ার্ক, পর্যবেক্ষণ ও ব্যাকআপ; নিয়ন্ত্রিত প্রতিষ্ঠান ও সবচেয়ে ব্যস্ত লেনদেনের সময়ের জন্য তৈরি।",
            }
          : i,
      );
  }
  const items = [...lead, ...rest].slice(0, 10);
  const dropped = [...lead, ...rest].slice(10).map((i) => i.titleEn);
  const intro =
    !cur?.introEn || cur.introEn.startsWith("Five reasons")
      ? { introEn: "Who stands behind Xpert, in numbers, and why its owners run their business on it.", introBn: "এক্সপার্টের পেছনে কারা, সংখ্যায়, আর কেন এর মালিকরাই এতে তাদের ব্যবসা চালায়।" }
      : {};
  const value = { titleEn: D.titleEn, titleBn: D.titleBn, introEn: D.introEn, introBn: D.introBn, ...(cur ?? {}), ...intro, items };
  await db.siteSetting.upsert({ where: { key: "home.strengths" }, update: { value }, create: { key: "home.strengths", value } });
  // Paid-up capital among the figures, with its source.
  const fig = await db.siteSetting.findUnique({ where: { key: "site.figures" } });
  const figures = Array.isArray(fig?.value) ? (fig!.value as { value?: string; labelEn?: string }[]) : [];
  let figNote = "";
  if (!figures.some((f) => /paid-up capital/i.test(f.labelEn ?? "")) && figures.length < 6) {
    const next = [...figures, { value: "৳33 crore", labelEn: "Paid-up capital", labelBn: "পরিশোধিত মূলধন", source: "Xpert Fintech Ltd.", asOf: null }];
    await db.siteSetting.upsert({ where: { key: "site.figures" }, update: { value: next }, create: { key: "site.figures", value: next } });
    figNote = "; paid-up capital added to Figures";
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString(), dropped } } });
  console.log(`• Core strengths: ${items.length} cards, led by ownership (৳33 cr capital, 7 bank and 2 insurer subsidiaries, 9-member board)${figNote}${dropped.length ? `; over the limit, not added: ${dropped.join(", ")}` : ""}`);
}

/**
 * Once (XFL, 19 Oct 2026): the growth journey on the success stories page, each
 * milestone from a press report already on the site (src/content/xfl2/press.ts):
 * founded 2021 and 16 houses on the OMS (Arthosuchak, 20 Aug 2026), ten houses
 * building their own OMS (The Financial Express, 25 Aug 2023), EcoSoftBD acquired
 * (The New Nation, 11 May 2025), 12 owners and 17 houses (Arthosuchak, 21 Sep 2026).
 * Kept as edited afterwards in Admin → Success stories → Growth journey.
 */
async function seedJourney() {
  const MARK = "seed.journey-2026-10-19";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  if (!(await db.siteSetting.findUnique({ where: { key: "stories.journey" } }))) {
    const url = (slug: string) => PRESS_STORIES.find((p) => p.slug.en === slug)?.sourceUrl ?? "";
    const seminar = url("xpert-fintech-one-stop-service-capital-market");
    const dayout = url("stakeholders-dayout-2026");
    const value = {
      titleEn: "How Xpert grew, milestone by milestone",
      titleBn: "এক্সপার্ট যেভাবে বেড়েছে, ধাপে ধাপে",
      introEn: "From a consortium of ten brokerage houses to the OMS behind almost half of DSE's turnover, each step as it was reported.",
      introBn: "দশটি ব্রোকারেজ হাউসের কনসোর্টিয়াম থেকে ডিএসইর লেনদেনের প্রায় অর্ধেকের পেছনের ওএমএস পর্যন্ত, প্রতিটি ধাপ যেমন প্রকাশিত হয়েছে।",
      metricEn: "Brokerage houses on Xpert",
      metricBn: "এক্সপার্টে ব্রোকারেজ হাউস",
      steps: [
        {
          date: "2021",
          value: null,
          titleEn: "Founded by DSE's leading brokerage houses",
          titleBn: "ডিএসইর শীর্ষ ব্রোকারেজ হাউসগুলোর উদ্যোগে প্রতিষ্ঠা",
          bodyEn: "Xpert Fintech Ltd. is set up by leading brokerage houses of the Dhaka Stock Exchange.",
          bodyBn: "ঢাকা স্টক এক্সচেঞ্জের শীর্ষ ব্রোকারেজ হাউসগুলোর উদ্যোগে এক্সপার্ট ফিনটেক লিমিটেড গঠিত হয়।",
          source: "Arthosuchak",
          sourceUrl: seminar,
        },
        {
          date: "2023-08-25",
          value: 10,
          titleEn: "Ten brokerage houses build their own OMS",
          titleBn: "দশটি ব্রোকারেজ হাউসের নিজস্ব ওএমএস",
          bodyEn: "Through Xpert, ten brokerage houses set out to give their clients direct access to trading on DSE and CSE.",
          bodyBn: "এক্সপার্টের মাধ্যমে দশটি ব্রোকারেজ হাউস গ্রাহকদের ডিএসই ও সিএসইতে সরাসরি লেনদেনের সুযোগ দিতে উদ্যোগ নেয়।",
          source: "The Financial Express",
          sourceUrl: url("ten-brokers-consortium-own-trading-platform"),
        },
        {
          date: "2025-04-22",
          value: null,
          titleEn: "EcoSoftBD IT acquired",
          titleBn: "ইকোসফটবিডি আইটি অধিগ্রহণ",
          bodyEn: "Xpert acquires EcoSoftBD IT Ltd., an order management system vendor already serving brokerages.",
          bodyBn: "ব্রোকারেজ হাউসে আগে থেকেই সেবা দেওয়া ওএমএস নির্মাতা ইকোসফটবিডি আইটি লিমিটেড অধিগ্রহণ করে এক্সপার্ট।",
          source: "The New Nation",
          sourceUrl: url("xpert-fintech-acquires-ecosoftbd-new-nation"),
        },
        {
          date: "2026-08-19",
          value: 16,
          titleEn: "OMS live at 16 brokerage houses",
          titleBn: "১৬টি ব্রোকারেজ হাউসে ওএমএস",
          bodyEn: "45–47% of DSE's turnover passes through Xpert's OMS, up to 57% at its peak (company figures).",
          bodyBn: "ডিএসইর লেনদেনের ৪৫–৪৭% এক্সপার্টের ওএমএসের মাধ্যমে হয়, সর্বোচ্চ ৫৭% পর্যন্ত (প্রতিষ্ঠানের তথ্য)।",
          source: "Arthosuchak",
          sourceUrl: seminar,
        },
        {
          date: "2026-09-21",
          value: 17,
          titleEn: "Twelve owners, seventeen houses",
          titleBn: "বারো মালিক, সতেরো হাউস",
          bodyEn: "Owners grew from ten to twelve, and seventeen of the country's leading brokerage houses now use the OMS.",
          bodyBn: "মালিক প্রতিষ্ঠান দশ থেকে বারোতে উন্নীত, আর দেশের শীর্ষ সতেরোটি ব্রোকারেজ হাউস এখন ওএমএস ব্যবহার করছে।",
          source: "Arthosuchak",
          sourceUrl: dayout,
        },
      ],
    };
    await db.siteSetting.create({ data: { key: "stories.journey", value } });
    console.log("• Success stories: growth journey added (5 sourced milestones)");
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
}

/**
 * Once (XFL, 19 Oct 2026): "Who owns Xpert" on Home and About.
 *  - Paid-up capital ৳33 crore (stated by XFL), published.
 *  - Each consortium house's parent (Admin → Organizations → Owned by), where not set;
 *    sources as in seedInstitutionStrengths. Mika Securities and Remons Investment are
 *    left "not stated" (shown as other owner houses) until their ownership is confirmed.
 */
const OWNER_PARENTS: { key: string; type: "BANK" | "INSURANCE" | "CORPORATE"; en: string; bn: string }[] = [
  { key: "bank-asia-securities", type: "BANK", en: "Bank Asia PLC", bn: "ব্যাংক এশিয়া পিএলসি" },
  { key: "ebl-securities", type: "BANK", en: "Eastern Bank PLC", bn: "ইস্টার্ন ব্যাংক পিএলসি" },
  { key: "islami-bank-securities", type: "BANK", en: "Islami Bank Bangladesh PLC", bn: "ইসলামী ব্যাংক বাংলাদেশ পিএলসি" },
  { key: "one-securities", type: "BANK", en: "ONE Bank PLC", bn: "ওয়ান ব্যাংক পিএলসি" },
  { key: "sjibl-securities", type: "BANK", en: "Shahjalal Islami Bank PLC", bn: "শাহজালাল ইসলামী ব্যাংক পিএলসি" },
  { key: "ucb-stock-brokerage", type: "BANK", en: "United Commercial Bank PLC", bn: "ইউনাইটেড কমার্শিয়াল ব্যাংক পিএলসি" },
  { key: "ab-securities", type: "BANK", en: "AB Bank PLC", bn: "এবি ব্যাংক পিএলসি" },
  { key: "green-delta-securities", type: "INSURANCE", en: "Green Delta Insurance PLC", bn: "গ্রিন ডেল্টা ইন্স্যুরেন্স পিএলসি" },
  { key: "nli-securities", type: "INSURANCE", en: "National Life Insurance PLC", bn: "ন্যাশনাল লাইফ ইন্স্যুরেন্স পিএলসি" },
  { key: "apex-investments", type: "CORPORATE", en: "the Apex group", bn: "অ্যাপেক্স গ্রুপ" },
];
async function seedOwnership() {
  const MARK = "seed.ownership-2026-10-19";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  let set = 0;
  for (const p of OWNER_PARENTS) {
    const r = await db.organization.updateMany({ where: { key: p.key, parentType: null }, data: { parentType: p.type, parentName: p.en, parentNameBn: p.bn } });
    set += r.count;
  }
  if (!(await db.siteSetting.findUnique({ where: { key: "home.ownership" } }))) {
    await db.siteSetting.create({
      data: {
        key: "home.ownership",
        value: {
          published: true,
          titleEn: "Who owns *Xpert*",
          titleBn: "এক্সপার্টের *মালিক* কারা",
          introEn: "The capital behind the platform and the institutions that own it, house by house.",
          introBn: "প্ল্যাটফর্মের পেছনের মূলধন এবং এর মালিক প্রতিষ্ঠানগুলো, হাউস ধরে ধরে।",
          capitalCrore: 33,
          capitalSource: "Xpert Fintech Ltd.",
          capitalAsOf: "",
        },
      },
    });
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
  console.log(`• Who owns Xpert: ৳33 crore paid-up capital published; parent institution set for ${set} house(s)`);
}

/**
 * Once (XFL, 19 Oct 2026): Moshad, Saikat, Maruf and Mehrabul also show under Leadership
 * in the Team page's department filter ("Engineering, Leadership"; Engineering still
 * colours their cards). Only where the department is still the seeded "Engineering".
 */
async function seedLeadershipFilter() {
  const MARK = "seed.leadership-filter-2026-10-19";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const r = await db.person.updateMany({
    where: { key: { in: ["md-abul-moshad-chowdhury", "saikat-biswas", "muhammad-shamsul-maruf", "mohammad-mehrabul-ferdous"] }, department: "Engineering" },
    data: { department: "Engineering, Leadership" },
  });
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString(), count: r.count } } });
  if (r.count) console.log(`• Team page: ${r.count} engineering lead(s) also listed under Leadership`);
}

/**
 * Once (XFL, 19 Oct 2026): "Who owns Xpert" now shows the capital, the owner houses by
 * basis and their parents, so Key strengths no longer repeats them: the capital, bank,
 * insurer, corporate and parent-institution cards are removed (matched by their seeded
 * titles), and the strengths are told as qualities, in this order: built by brokers,
 * governance, compliance, security, infrastructure (other cards keep their place after).
 */
async function seedStrengthsDedup() {
  const MARK = "seed.strengths-dedup-2026-10-19";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const row = await db.siteSetting.findUnique({ where: { key: "home.strengths" } });
  const v = row?.value as { items?: { titleEn: string }[]; introEn?: string; introBn?: string } | undefined;
  if (row && v?.items) {
    const drop = new Set(["Owned by the country's leading institutions", "Bank subsidiaries", "Insurance companies", "Corporate companies", "Backed by top institutions"]);
    const order = ["Built by the market's top brokers", "Institutional governance", "Compliance built into every order", "Enterprise-grade security", "Institutional-grade infrastructure"];
    const kept = v.items.filter((i) => !drop.has(i.titleEn));
    const rank = (t: string) => (order.includes(t) ? order.indexOf(t) : order.length);
    const items = kept.map((i, k) => ({ i, k })).sort((a, b) => rank(a.i.titleEn) - rank(b.i.titleEn) || a.k - b.k).map((x) => x.i);
    const intro =
      v.introEn === "Who stands behind Xpert, in numbers, and why its owners run their business on it."
        ? { introEn: "Why the brokerage houses that own Xpert also run their business on it.", introBn: "যে ব্রোকারেজ হাউসগুলো এক্সপার্টের মালিক, তারাই কেন এতে তাদের ব্যবসা চালায়।" }
        : {};
    await db.siteSetting.update({ where: { key: "home.strengths" }, data: { value: { ...v, ...intro, items } } });
    console.log(`• Core strengths: ${v.items.length - items.length} card(s) now shown in "Who owns Xpert" removed; ${items.length} left`);
  }
  // The capital is told in "Who owns Xpert"; the copy added to Admin → Figures earlier today goes.
  const fig = await db.siteSetting.findUnique({ where: { key: "site.figures" } });
  if (Array.isArray(fig?.value)) {
    const list = fig!.value as { value?: string; labelEn?: string; source?: string }[];
    const next = list.filter((f) => !(f.labelEn === "Paid-up capital" && f.value === "৳33 crore" && f.source === "Xpert Fintech Ltd."));
    if (next.length !== list.length) await db.siteSetting.update({ where: { key: "site.figures" }, data: { value: next } });
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
}

/**
 * Once (19 Oct 2026): a short FAQ at the end of the home page (Admin → Pages → Home),
 * answered only with facts already on the site and their sources: owners and founding
 * (Arthosuchak, Aug and Sep 2026), DSE and CSE, the published products, branded apps
 * (Admin → Deployments) and market share (Arthosuchak, Sep 2026, company figures).
 */
const HOME_FAQ: { q: [string, string]; a: [string, string] }[] = [
  {
    q: ["Who owns Xpert Fintech?", "এক্সপার্ট ফিনটেকের মালিক কারা?"],
    a: [
      "Twelve brokerage houses of the Dhaka Stock Exchange, most of them the brokerage arms of banks and insurers. Leading DSE brokerage houses set the company up in 2021.",
      "ঢাকা স্টক এক্সচেঞ্জের বারোটি ব্রোকারেজ হাউস, যাদের বেশির ভাগ ব্যাংক ও বিমা প্রতিষ্ঠানের ব্রোকারেজ প্রতিষ্ঠান। ডিএসইর শীর্ষ ব্রোকারেজ হাউসগুলো ২০২১ সালে প্রতিষ্ঠানটি গঠন করে।",
    ],
  },
  {
    q: ["Which exchanges does the platform connect to?", "প্ল্যাটফর্মটি কোন কোন এক্সচেঞ্জে যুক্ত?"],
    a: ["Both of Bangladesh's stock exchanges: the Dhaka Stock Exchange (DSE) and the Chittagong Stock Exchange (CSE).", "বাংলাদেশের দুই স্টক এক্সচেঞ্জেই: ঢাকা স্টক এক্সচেঞ্জ (ডিএসই) ও চট্টগ্রাম স্টক এক্সচেঞ্জ (সিএসই)।"],
  },
  {
    q: ["What does the platform cover?", "প্ল্যাটফর্মে কী কী আছে?"],
    a: [
      "Trading and order management with pre-trade risk checks, online share trading, BO account opening with eKYC, document management and back-office software. Each product has its own page under Products.",
      "লেনদেনের আগে ঝুঁকি যাচাইসহ ট্রেডিং ও অর্ডার ব্যবস্থাপনা, অনলাইন শেয়ার ট্রেডিং, ই-কেওয়াইসিসহ বিও অ্যাকাউন্ট খোলা, ডকুমেন্ট ব্যবস্থাপনা ও ব্যাক-অফিস সফটওয়্যার। প্রতিটি পণ্যের আলাদা পাতা পণ্য অংশে আছে।",
    ],
  },
  {
    q: ["Can our brokerage house have its own branded app?", "আমাদের ব্রোকারেজ হাউস কি নিজস্ব ব্র্যান্ডের অ্যাপ পেতে পারে?"],
    a: [
      "Yes. Brokerage houses on Xpert run their own branded trading apps on the platform; the live ones are listed, with their store links, on the Consortium page.",
      "হ্যাঁ। এক্সপার্টের ব্রোকারেজ হাউসগুলো প্ল্যাটফর্মে নিজস্ব ব্র্যান্ডের ট্রেডিং অ্যাপ চালায়; চালু অ্যাপগুলো স্টোর লিংকসহ কনসোর্টিয়াম পাতায় দেওয়া আছে।",
    ],
  },
  {
    q: ["How much of the market runs through Xpert?", "বাজারের কতটা এক্সপার্টের মাধ্যমে চলে?"],
    a: [
      "45–47% of DSE's daily turnover on a typical day and up to 57% on the busiest days, according to company figures reported by Arthosuchak in September 2026.",
      "অর্থসূচকে সেপ্টেম্বর ২০২৬-এ প্রকাশিত প্রতিষ্ঠানের তথ্য অনুযায়ী, সাধারণ দিনে ডিএসইর দৈনিক লেনদেনের ৪৫–৪৭% এবং সবচেয়ে ব্যস্ত দিনে ৫৭% পর্যন্ত।",
    ],
  },
  {
    q: ["How do we get started?", "কীভাবে শুরু করব?"],
    a: [
      "Request a demo. Our team walks you through the platform, screen by screen, for the way your brokerage house works.",
      "ডেমোর অনুরোধ করুন। আপনার ব্রোকারেজ হাউসের কাজের ধরন অনুযায়ী আমাদের টিম প্ল্যাটফর্মটি স্ক্রিন ধরে ধরে দেখাবে।",
    ],
  },
];
async function seedHomeFaq() {
  const MARK = "seed.home-faq-2026-10-19";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const page = await db.page.findUnique({ where: { key: "home" }, include: { sections: { include: { blocks: true } } } });
  if (page && !page.sections.some((sec) => sec.blocks.some((b) => b.type === "FAQ"))) {
    const last = page.sections.reduce((m, sec) => Math.max(m, sec.sortOrder), -1);
    const section = await db.pageSection.create({ data: { pageId: page.id, sortOrder: last + 1 } });
    const block = await db.contentBlock.create({
      data: {
        sectionId: section.id,
        type: "FAQ",
        status: "PUBLISHED",
        sortOrder: 0,
        props: {},
        translations: { create: [{ locale: EN, title: "Questions brokerage houses ask" }, { locale: BN, title: "ব্রোকারেজ হাউসগুলো যা জানতে চায়" }] },
      },
    });
    for (const [i, f] of HOME_FAQ.entries()) {
      await db.blockItem.create({
        data: { blockId: block.id, sortOrder: i, translations: { create: [{ locale: EN, title: f.q[0], body: f.a[0] }, { locale: BN, title: f.q[1], body: f.a[1] }] } },
      });
    }
    console.log(`• Home page: FAQ with ${HOME_FAQ.length} questions added (Admin → Pages → Home)`);
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString(), added: Boolean(page) } } });
}

/** Once (XFL, 19 Oct 2026): back to the earlier home order; an order saved in Admin → Design before now is cleared so the default applies. */
async function seedHomeOrderReset() {
  const MARK = "seed.home-order-reset-2026-10-19";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const row = await db.siteSetting.findUnique({ where: { key: "site.design" } });
  const v = row?.value as Record<string, unknown> | undefined;
  if (row && v && "order" in v) {
    const rest = { ...v };
    delete rest.order;
    await db.siteSetting.update({ where: { key: "site.design" }, data: { value: rest as object } });
    console.log("• Home page: section order back to the default");
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
}

/**
 * Once (XFL, 19 Oct 2026): sharper headlines for the core strengths and the cost savings
 * graphic, where the admin still has the earlier wording (anything edited is kept).
 */
async function seedSharperHeadlines() {
  const MARK = "seed.sharper-headlines-2026-10-19";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const notes: string[] = [];
  const st = await db.siteSetting.findUnique({ where: { key: "home.strengths" } });
  const sv = st?.value as Record<string, unknown> | undefined;
  if (sv && (sv.titleEn === "Our core strengths" || !sv.titleEn)) {
    await db.siteSetting.update({
      where: { key: "home.strengths" },
      data: {
        value: {
          ...sv,
          titleEn: "Built by brokers. *Trusted* by brokers.",
          titleBn: "ব্রোকারদের হাতে গড়া। ব্রোকারদের *আস্থায়*।",
          introEn: "Five reasons the houses that own Xpert also run their business on it.",
          introBn: "যে হাউসগুলো এক্সপার্টের মালিক, তারাই কেন এতে তাদের ব্যবসা চালায়: পাঁচটি কারণ।",
        },
      },
    });
    notes.push("core strengths");
  }
  const sa = await db.siteSetting.findUnique({ where: { key: "home.savings" } });
  const av = sa?.value as Record<string, unknown> | undefined;
  if (av && av.titleEn === "{pct}% lower technology cost") {
    await db.siteSetting.update({
      where: { key: "home.savings" },
      data: {
        value: {
          ...av,
          titleEn: "Same market. *{pct}% less* to run it.",
          titleBn: "একই বাজার। চালাতে খরচ *{pct}% কম*।",
          bodyEn: "Instead of every brokerage paying for its own systems, the houses on Xpert share one platform and split the bill.",
          bodyBn: "প্রতিটি ব্রোকারেজ আলাদা সিস্টেমের খরচ না দিয়ে, এক্সপার্টের হাউসগুলো একটি প্ল্যাটফর্ম ভাগ করে নেয়, খরচও ভাগ হয়ে যায়।",
        },
      },
    });
    notes.push("cost savings");
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString(), notes } } });
  if (notes.length) console.log(`• Sharper headlines: ${notes.join(", ")}`);
}

/**
 * Once: a draft success story for every client that has none yet (each with
 * only what is on record; results, figures and the quote in [brackets]).
 * Drafts never show on the live site; fill them in with each client and
 * publish in Admin → Success stories.
 */
async function seedClientStoryDrafts() {
  const MARK = "seed.client-story-drafts-2026-10-15";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const last = await db.caseStudy.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  let order = (last?.sortOrder ?? 0) + 1;
  let added = 0;
  for (const c of CLIENT_STORY_DRAFTS) {
    if (await db.caseStudyTranslation.findFirst({ where: { slug: c.slug } })) continue;
    await db.caseStudy.create({
      data: {
        status: "DRAFT",
        sortOrder: order++,
        translations: {
          create: (["en", "bn"] as const).map((l) => ({
            locale: l === "en" ? EN : BN,
            slug: c.slug,
            title: c.title[l],
            summary: c.summary[l],
            challenge: c.challenge[l],
            solution: c.solution[l],
            outcome: c.outcome[l],
          })),
        },
      },
    });
    added++;
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
  if (added) console.log(`• ${added} draft success stories added, one per client: fill in the [bracketed] parts with each client and publish in Admin → Success stories`);
}

/**
 * The face point of each portrait XFL supplied (src/content/xfl2/portrait-focus.ts),
 * set on those exact files (matched by checksum) where none is set yet, so
 * every crop centres on the face. Points set in Admin → Media are kept.
 */
async function seedPortraitFocus() {
  const dir = path.join(process.cwd(), "prisma", "seed-media", "people");
  let set = 0;
  for (const file of await readdir(dir).catch(() => [] as string[])) {
    const focus = PORTRAIT_FOCUS[file.replace(/\.[a-z]+$/i, "")];
    if (!focus) continue;
    const checksum = createHash("sha256").update(await readFile(path.join(dir, file))).digest("hex");
    const r = await db.media.updateMany({
      where: { checksum, focalX: null },
      data: { focalX: focus.x, focalY: focus.y, focalZoom: focus.zoom ?? null },
    });
    set += r.count;
  }
  if (set) console.log(`• Portraits: face point set on ${set} photo(s), so every crop centres on the face`);
}

/**
 * Xpert in the press (src/content/xfl2/press.ts): news stories under "In the
 * press", written from the published reports and credited, and the events
 * they describe. Each is added once; one whose address already exists (or
 * that was deleted in the admin) is left alone.
 */
async function seedPress() {
  let cat = await db.articleCategory.findUnique({ where: { key: PRESS_CATEGORY.key } });
  if (!cat) {
    cat = await db.articleCategory.create({
      data: {
        key: PRESS_CATEGORY.key,
        sortOrder: 50,
        translations: {
          create: [
            { locale: EN, slug: PRESS_CATEGORY.en.slug, name: PRESS_CATEGORY.en.name },
            { locale: BN, slug: PRESS_CATEGORY.bn.slug, name: PRESS_CATEGORY.bn.name },
          ],
        },
      },
    });
  }
  let stories = 0;
  for (const p of PRESS_STORIES) {
    if (await db.articleTranslation.findFirst({ where: { OR: [{ locale: EN, slug: p.slug.en }, { locale: BN, slug: p.slug.bn }] } })) continue;
    await db.article.create({
      data: {
        categoryId: cat.id,
        authorName: p.source,
        displayDate: new Date(`${p.date}T09:00:00+06:00`),
        status: "PUBLISHED",
        translations: {
          create: (["en", "bn"] as const).map((l) => ({
            locale: l === "en" ? EN : BN,
            slug: p.slug[l],
            title: p.title[l],
            excerpt: p.excerpt[l],
            body: p.body[l],
          })),
        },
      },
    });
    stories++;
  }
  let events = 0;
  for (const e of PRESS_EVENTS) {
    if (await db.event.findUnique({ where: { key: e.key } })) continue;
    if (await db.eventTranslation.findFirst({ where: { OR: [{ locale: EN, slug: e.slug.en }, { locale: BN, slug: e.slug.bn }] } })) continue;
    await db.event.create({
      data: {
        key: e.key,
        startsAt: new Date(e.startsAt),
        dateIsApprox: e.approx ?? false,
        status: "PUBLISHED",
        translations: {
          create: (["en", "bn"] as const).map((l) => ({
            locale: l === "en" ? EN : BN,
            slug: e.slug[l],
            title: e.title[l],
            summary: e.summary[l],
            body: e.body[l],
            location: e.location[l],
          })),
        },
      },
    });
    events++;
  }
  if (stories || events) console.log(`• In the press: ${stories} news stor${stories === 1 ? "y" : "ies"} and ${events} event(s) added, each crediting its source`);
}

/**
 * The portraits were re-made at 2160 pixels tall (15 October 2026). Every
 * media file that is still an earlier version (matched by its fingerprint)
 * gets the new file in place: same media record, so people, crops and face
 * points stay as they are. The file goes to storage/media and into the
 * database's file store (what the live site on Vercel reads).
 */
async function upgradePortraits() {
  const dir = path.join(process.cwd(), "prisma", "seed-media", "people");
  const store = path.join(process.cwd(), "storage", "media");
  let swapped = 0;
  let current = 0;
  for (const file of await readdir(dir).catch(() => [] as string[])) {
    const key = file.replace(/\.[a-z]+$/i, "");
    const previous = PREVIOUS_PORTRAITS[key];
    if (!previous) continue;
    const data = await readFile(path.join(dir, file));
    const type = sniff(data);
    if (!type || type.kind !== "IMAGE") continue;
    const checksum = createHash("sha256").update(data).digest("hex");
    current += await db.media.count({ where: { checksum } });
    // The old file, by its checksum or (if it was saved again somewhere along the way) by its file name and smaller size.
    const rows = await db.media.findMany({
      where: {
        checksum: { not: checksum },
        OR: [
          { checksum: { in: ([] as string[]).concat(previous) } },
          { originalName: { in: [`${key}.png`, `${key}.jpg`, `${key}.jpeg`, `${key}.webp`] }, OR: [{ height: null }, { height: { lt: type.height ?? 2160 } }] },
        ],
      },
      select: { id: true },
    });
    if (!rows.length) continue;
    for (const row of rows) {
      const storageKey = `${randomUUID()}.${type.ext}`;
      await mkdir(store, { recursive: true });
      await writeFile(path.join(store, storageKey), data, { flag: "wx" });
      await db.storedFile.upsert({ where: { key: storageKey }, update: {}, create: { key: storageKey, data, size: data.length } });
      await db.media.update({
        where: { id: row.id },
        data: {
          storageKey,
          originalName: file,
          mimeType: type.mimeType,
          sizeBytes: data.length,
          width: type.width ?? null,
          height: type.height ?? null,
          checksum,
          // The face point measured on the new file (a re-framed photo moves it).
          ...(PORTRAIT_FOCUS[key] && { focalX: PORTRAIT_FOCUS[key].x, focalY: PORTRAIT_FOCUS[key].y, focalZoom: PORTRAIT_FOCUS[key].zoom ?? null }),
        },
      });
      swapped++;
    }
  }
  console.log(
    swapped
      ? `• Portraits: ${swapped} photo(s) replaced with the latest 2160-pixel versions`
      : `• Portraits: ${current} already at 2160 pixels; nothing to replace`,
  );
}

/**
 * Once (XFL, 15 Oct 2026): the member houses' trading apps are shown on the
 * site, with their Google Play and App Store links. Publishes the apps still
 * in draft; an app an editor has trashed stays trashed.
 */
async function showMemberApps() {
  const MARK = "seed.apps-shown-2026-10-15";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const res = await db.deployment.updateMany({ where: { status: "DRAFT", deletedAt: null }, data: { status: "PUBLISHED" } });
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString(), published: res.count } } });
  console.log(`• Branded apps: ${res.count} published with their Google Play / App Store links`);
}

/** Once: websites added to member profiles after the first fill (e.g. Bank Asia Securities), where still empty. */
async function fillMemberWebsites() {
  const MARK = "seed.member-websites-2026-10-15";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  let filled = 0;
  for (const m of MEMBER_PROFILES) {
    if (!m.website) continue;
    const res = await db.organization.updateMany({ where: { key: m.key, OR: [{ websiteUrl: null }, { websiteUrl: "" }] }, data: { websiteUrl: m.website } });
    filled += res.count;
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString(), filled } } });
  if (filled) console.log(`• Member websites: ${filled} added (e.g. Bank Asia Securities)`);
}

/**
 * Once (XFL, 15 Oct 2026): UCB, Bank Asia and ONE Bank's brokerages come
 * first, in that order, wherever members, clients and apps are listed; UCB's
 * app is featured (shown large above the others) while it leads. Everything
 * else keeps its order after them. Change both in Admin → Organizations and
 * Admin → Deployments (Order, Featured).
 */
const PRIORITY_ORGS = ["ucb-stock-brokerage", "bank-asia-securities", "one-securities"];
const PRIORITY_APPS = ["utrade-ucb-stock", "ba-secure-trade", "one-trade"];
async function prioritiseLeadClients() {
  const MARK = "seed.priority-ucb-bank-asia-one-2026-10-15";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const reorder = <T extends { id: string; key: string | null }>(rows: T[], first: string[]): T[] => [
    ...first.map((k) => rows.find((r) => r.key === k)).filter((r): r is T => Boolean(r)),
    ...rows.filter((r) => !r.key || !first.includes(r.key)),
  ];
  const orgs = await db.organization.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, key: true } });
  for (const [i, o] of reorder(orgs, PRIORITY_ORGS).entries()) await db.organization.update({ where: { id: o.id }, data: { sortOrder: i } });
  const apps = await db.deployment.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: { id: true, key: true } });
  for (const [i, d] of reorder(apps, PRIORITY_APPS).entries()) await db.deployment.update({ where: { id: d.id }, data: { sortOrder: i, featured: d.key === PRIORITY_APPS[0] } });
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
  console.log("• Order: UCB, Bank Asia, ONE first (members, clients, apps); UCB's app featured");
}

/**
 * Once: UCB Stock Brokerage's ranking. Its own website (ucbstock.com.bd,
 * About us, read 15 Oct 2026) says it reached #1 among DSE brokers in
 * December 2021 and "to date maintains the #1 ranking among all the brokers";
 * XFL confirms it leads (15 Oct 2026). Other houses' rankings are added in
 * Admin → Organizations when the current list is to hand.
 */
async function seedUcbRank() {
  const MARK = "seed.ucb-rank-2026-10-15";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const res = await db.organization.updateMany({
    where: { key: "ucb-stock-brokerage", dseRank: null },
    data: { dseRank: 1, rankAsOf: "October 2026", rankSource: "UCB Stock Brokerage (ucbstock.com.bd)" },
  });
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
  if (res.count) console.log("• Ranking: UCB Stock Brokerage #1 on DSE (its own statement); add others in Admin → Organizations");
}

/** Once: Xpert's Facebook page beside LinkedIn and email (footer, contact). Kept if an editor already added one. */
async function addFacebookLink() {
  const MARK = "seed.facebook-link-2026-10-15";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const URL_FB = "https://www.facebook.com/XpertFintechLtd";
  const row = await db.siteSetting.findUnique({ where: { key: "social.links" } });
  const links = Array.isArray(row?.value) ? (row!.value as { label: string; url: string }[]) : [];
  if (!links.some((l) => /facebook\.com|fb\.com/i.test(l?.url ?? ""))) {
    const value = [...links, { label: "Facebook", url: URL_FB }];
    await db.siteSetting.upsert({ where: { key: "social.links" }, update: { value }, create: { key: "social.links", value } });
    console.log("• Social links: Facebook added beside LinkedIn and email");
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
}

/** Once (XFL, 15 Oct 2026): Saikat Biswas before Mohammad Shamsul Maruf, in the Management Committee and the team. */
async function saikatBeforeMaruf() {
  const MARK = "seed.saikat-before-maruf-2026-10-15";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const [saikat, maruf] = await Promise.all(["saikat-biswas", "muhammad-shamsul-maruf"].map((key) => db.person.findUnique({ where: { key }, include: { roles: true } })));
  let moved = 0;
  if (saikat && maruf) {
    for (const r of maruf.roles) {
      const s = saikat.roles.find((x) => x.group === r.group);
      if (!s || s.sortOrder < r.sortOrder) continue;
      // Swap their positions in this group.
      await db.personRole.update({ where: { id: s.id }, data: { sortOrder: r.sortOrder } });
      await db.personRole.update({ where: { id: r.id }, data: { sortOrder: s.sortOrder === r.sortOrder ? r.sortOrder + 1 : s.sortOrder } });
      moved++;
    }
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString(), moved } } });
  if (moved) console.log(`• People: Saikat Biswas placed before Mohammad Shamsul Maruf (${moved} list(s))`);
}

/** Once (XFL, 15 Oct 2026): Sowkot Osman, Executive Director, first in the team, before the Managing Director. */
async function sowkotFirst() {
  const MARK = "seed.sowkot-first-2026-10-15";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  const sowkot = await db.person.findUnique({ where: { key: "sowkot-osman" }, include: { roles: true } });
  let moved = 0;
  for (const r of sowkot?.roles ?? []) {
    const first = await db.personRole.findFirst({ where: { group: r.group, id: { not: r.id } }, orderBy: { sortOrder: "asc" } });
    if (!first || r.sortOrder < first.sortOrder) continue;
    // Everyone before him moves down one; he takes the first place.
    await db.personRole.updateMany({ where: { group: r.group, id: { not: r.id }, sortOrder: { lt: r.sortOrder } }, data: { sortOrder: { increment: 1 } } });
    await db.personRole.update({ where: { id: r.id }, data: { sortOrder: first.sortOrder } });
    moved++;
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString(), moved } } });
  if (moved) console.log("• People: Sowkot Osman (Executive Director) placed first, before the Managing Director");
}

async function seedMemberProfiles() {
  const MARK = "seed.member-profiles-2026-10-15";
  if (await db.siteSetting.findUnique({ where: { key: MARK } })) return;
  let filled = 0;
  for (const m of MEMBER_PROFILES) {
    const org = await db.organization.findUnique({ where: { key: m.key }, include: { translations: true } });
    if (!org) continue;
    const data = {
      ...(!org.websiteUrl && m.website && { websiteUrl: m.website }),
      ...(!org.dseTrec && m.dseTrec && { dseTrec: m.dseTrec }),
      ...(!org.cseTrec && m.cseTrec && { cseTrec: m.cseTrec }),
    };
    if (Object.keys(data).length) await db.organization.update({ where: { id: org.id }, data });
    for (const l of ["en", "bn"] as const) {
      const tr = org.translations.find((t) => t.locale === (l === "en" ? EN : BN));
      if (tr && !tr.description) await db.organizationTranslation.update({ where: { id: tr.id }, data: { description: m.description[l] } });
    }
    filled++;
  }
  await db.siteSetting.create({ data: { key: MARK, value: { at: new Date().toISOString() } } });
  if (filled) console.log(`• Member houses: website, TREC numbers and description added where empty (${filled})`);
}

/** Older databases: mark seeded stand-in profiles as placeholders (until an editor changes that). */
async function markPlaceholders() {
  const res = await db.person.updateMany({ where: { key: { startsWith: "placeholder-" }, isPlaceholder: false, translations: { some: { name: "Name to be confirmed" } } }, data: { isPlaceholder: true } });
  if (res.count) console.log(`• Marked ${res.count} stand-in profile(s) as placeholders`);
}

async function main() {
  const ids = new Map<string, string>();
  for (const c of CONTENT) ids.set(c.key, (await upsertOffering(c)).id);
  for (const c of CONTENT) {
    if (c.parent && ids.get(c.parent) && !LINEUP.includes(c.key)) {
      await db.offering.update({ where: { key: c.key }, data: { parentId: ids.get(c.parent) } });
    }
  }
  console.log(`• Products: ${[...PUBLISH].join(", ")} published${bnItemsAdded ? `; Bangla added to ${bnItemsAdded} product item(s)` : ""}`);
  await applyProductLineup();
  await markPlaceholders();
  await upgradePortraits();
  await seedPeople();
  await seedRoster();
  await saikatBeforeMaruf();
  await sowkotFirst();
  await seedRepresentatives();
  await seedPortraitFocus();
  await seedMessagesAndGoal();
  await seedLegalDrafts();
  await mergePlatformIntoProducts();
  await fetchNewClientLogos();
  await seedClientLogos();
  await seedInstitutions();
  await seedCredentials();
  await seedStoryBangla();
  await seedReviewDrafts();
  await seedStoreLinks();
  await showMemberApps();
  await prioritiseLeadClients();
  await seedUcbRank();
  await addFacebookLink();
  await seedDeployments();
  await seedTeamLinks();
  await seedConsultantLinks();
  await seedMilestones();
  await seedPress();
  await syncPendingProductLinks();
  await renameCaseStudies(); // before the menu additions, so no duplicate link is added
  await seedInsightsLinks();
  await seedMarketsLinks();
  await seedEcosystem();
  await seedRmsInOms();
  await seedRmsVisible(db, EN, BN);
  await seedOmsLogo(db, seedImage);
  await seedRiskPage(db, EN, BN);
  await seedRiskChecksBlock(db, EN, BN);
  await seedRiskChecksGrid(db, EN, BN);
  await seedRmsWording();
  await seedRiskLinks(db, EN, BN);
  await seedProductScreens();
  await seedNavAdditions();
  await seedCaseStudyDrafts();
  await seedClientStoryDrafts();
  await publishFactOnlyStories();
  await seedClientApps();
  await seedFirstCapitalApp();
  await seedSourcesAndStories();
  await seedShareAndClients();
  await seedInnovaApp();
  await seedTheaClient();
  await seedBluechipSquare();
  await seedWifangWebsite();
  await seedIdlcLogo();
  await publishReviewCards();
  await showForEditing();
  await seedWhatsAppNumber();
  await seedSharperHeadlines();
  await seedInstitutionStrengths();
  await seedJourney();
  await seedOwnership();
  await seedLeadershipFilter();
  await seedStrengthsDedup();
  await seedHomeFaq();
  await seedHomeOrderReset();
  await seedCareers();
  await seedMemberProfiles();
  await fillMemberWebsites();
  await seedIdlcClient();
  await seedBanglaGaps();
  // What is in place: the one-time steps already applied (each runs once, so later runs print nothing for them).
  const done = await db.siteSetting.findMany({ where: { key: { startsWith: "seed." } }, select: { key: true }, orderBy: { updatedAt: "desc" }, take: 12 });
  if (done.length) console.log(`Latest one-time steps applied: ${done.map((d) => d.key.replace(/^seed\./, "")).join(", ")}`);
  console.log("Content seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
