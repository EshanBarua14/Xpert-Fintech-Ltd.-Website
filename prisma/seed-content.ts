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
import { PrismaClient, type Locale, type PersonGroup, type OfferingItemKind, type OfferingType } from "@prisma/client";
import { createHash, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ecosystemEdges, ecosystemFlows, ecosystemNodes } from "../src/content/xfl2/ecosystem";
import { BOARD, CONSULTANTS, MANAGEMENT, TEAM, type RosterPerson } from "../src/content/xfl2/people";
import { LEADER_MESSAGES, MARKET_GOAL } from "../src/content/xfl2/messages";
import { LEGAL_DRAFTS } from "../src/content/xfl2/legal";
import { CLIENT_LOGOS, NOT_CLIENTS, orgNameKey } from "../src/content/xfl2/client-logos";
import { CREDENTIALS } from "../src/content/xfl2/credentials";
import { sniff } from "../src/lib/media/inspect";

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
        { title: t("Pre-trade risk check", "প্রি-ট্রেড ঝুঁকি যাচাই"), body: t("RMS checks the order against configured limits before it leaves the brokerage.", "অর্ডার ব্রোকারেজ থেকে বের হওয়ার আগে আরএমএস নির্ধারিত সীমার সঙ্গে তা যাচাই করে।") },
        { title: t("Exchange", "এক্সচেঞ্জ"), body: t("The order is routed to DSE or CSE.", "অর্ডারটি ডিএসই বা সিএসই-তে পাঠানো হয়।") },
        { title: t("Execution", "সম্পাদন"), body: t("Executions are reported back to the platform.", "সম্পাদিত লেনদেনের তথ্য প্ল্যাটফর্মে ফিরে আসে।") },
        { title: t("Portfolio update", "পোর্টফোলিও হালনাগাদ"), body: t("Holdings and balances update for the investor.", "বিনিয়োগকারীর হোল্ডিং ও ব্যালান্স হালনাগাদ হয়।") },
        { title: t("Back office", "ব্যাক অফিস"), body: t("Trades flow on to settlement and reporting.", "লেনদেন সেটেলমেন্ট ও রিপোর্টিংয়ে চলে যায়।") },
      ],
      ARCHITECTURE_LAYER: [
        { title: t("Channels", "চ্যানেল"), body: t("Web, desktop and branded mobile apps for investors and dealers.", "বিনিয়োগকারী ও ডিলারদের জন্য ওয়েব, ডেস্কটপ ও নিজস্ব ব্র্যান্ডের মোবাইল অ্যাপ।") },
        { title: t("Order management", "অর্ডার ব্যবস্থাপনা"), body: t("Order entry, amendment, cancellation and order book.", "অর্ডার দেওয়া, সংশোধন, বাতিল এবং অর্ডার বুক।") },
        { title: t("Risk controls", "ঝুঁকি নিয়ন্ত্রণ"), body: t("Pre-trade limit checks through RMS.", "আরএমএস-এর মাধ্যমে লেনদেনের আগে সীমা যাচাই।") },
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
        { title: t("Risk checks on every order", "প্রতিটি অর্ডারে ঝুঁকি যাচাই"), body: t("Orders pass RMS checks before reaching the exchange.", "এক্সচেঞ্জে পৌঁছানোর আগে প্রতিটি অর্ডার আরএমএস যাচাই পার হয়।") },
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
  await db.ecosystemNode.updateMany({ where: { key: "rms" }, data: { status: "DRAFT" } });
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
  console.log("• Chairman's and MD's messages saved as drafts (publish in Admin → Messages); market-share goal set");
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
  for (const [i, b] of BOARD.entries()) {
    const person = await db.person.findUnique({ where: { key: b.key } });
    if (!person) continue;
    const exists = await db.testimonial.findFirst({ where: { personName: b.name } });
    if (exists) continue;
    const review = await db.testimonial.create({
      data: {
        personName: b.name,
        photoMediaId: person.photoMediaId,
        status: "DRAFT",
        hasApproval: false,
        sortOrder: i,
        translations: {
          create: { locale: EN, personTitle: null, quote: `[Review from ${b.name}: to be written in their own words, with their title, institution and rating, and approved before publishing.]` },
        },
      },
    });
    if (person.photoMediaId) await db.mediaUsage.create({ data: { mediaId: person.photoMediaId, entityType: "TESTIMONIAL", entityId: review.id, field: "photo" } });
    added++;
  }
  if (added) console.log(`• ${added} review card draft(s) for the board: complete and publish them in Admin → Testimonials`);
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
  { href: "gallery", en: "Gallery", bn: "গ্যালারি", descEn: "Photo albums and videos.", descBn: "ছবির অ্যালবাম ও ভিডিও।" },
  { href: "resources", en: "Resources", bn: "রিসোর্স", descEn: "Brochures and product documents.", descBn: "ব্রোশিওর ও পণ্যের নথি।" },
  { href: "case-studies", en: "Case studies", bn: "কেস স্টাডি", descEn: "How brokerages use Xpert.", descBn: "ব্রোকারেজগুলো কীভাবে এক্সপার্ট ব্যবহার করে।" },
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
  await seedPeople();
  await seedRoster();
  await seedMessagesAndGoal();
  await seedLegalDrafts();
  await mergePlatformIntoProducts();
  await seedClientLogos();
  await seedInstitutions();
  await seedCredentials();
  await seedReviewDrafts();
  await seedDeployments();
  await seedTeamLinks();
  await seedConsultantLinks();
  await seedMilestones();
  await syncPendingProductLinks();
  await seedInsightsLinks();
  await seedMarketsLinks();
  await seedEcosystem();
  console.log("Content seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
