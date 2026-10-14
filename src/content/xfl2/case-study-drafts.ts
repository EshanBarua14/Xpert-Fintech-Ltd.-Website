/**
 * Draft case studies built from what is already known about three member
 * brokerages whose chiefs give reviews: their branded trading app on the Xpert
 * platform (public on Google Play) and their chief's position. Everything only
 * the client can confirm — results, figures, dates, the quote — is in
 * [square brackets] to be filled in with the client and approved before an
 * editor publishes. Seeded once as DRAFT: never shown on the live site as is.
 */
type T = { en: string; bn: string };
export type CaseStudyDraft = { key: string; slug: string; title: T; summary: T; challenge: T; solution: T; outcome: T };

const outcome = (who: T): T => ({
  en: `• [Result 1 with a real figure, e.g. share of orders now placed online.]\n• [Result 2, e.g. time from decision to launch.]\n• [Result 3, e.g. investors active on the app.]\n\n“[Quote in their own words, approved.]” — ${who.en}`,
  bn: `• [প্রকৃত সংখ্যাসহ ফলাফল ১, যেমন এখন অনলাইনে দেওয়া অর্ডারের অংশ।]\n• [ফলাফল ২, যেমন সিদ্ধান্ত থেকে চালু হতে লাগা সময়।]\n• [ফলাফল ৩, যেমন অ্যাপে সক্রিয় বিনিয়োগকারী।]\n\n“[নিজের ভাষায় উক্তি, অনুমোদিত।]” — ${who.bn}`,
});

export const CASE_STUDY_DRAFTS: CaseStudyDraft[] = [
  {
    key: "bank-asia-securities",
    slug: "bank-asia-securities-branded-trading-app",
    title: { en: "Bank Asia Securities: its own trading app on the shared Xpert platform", bn: "ব্যাংক এশিয়া সিকিউরিটিজ: শেয়ার করা এক্সপার্ট প্ল্যাটফর্মে নিজস্ব ট্রেডিং অ্যাপ" },
    summary: {
      en: "Bank Asia Securities offers its investors BA SECURE TRADE, a branded trading app built on the Xpert platform and connected to DSE and CSE.",
      bn: "ব্যাংক এশিয়া সিকিউরিটিজ তাদের বিনিয়োগকারীদের দেয় BA SECURE TRADE — এক্সপার্ট প্ল্যাটফর্মে তৈরি, ডিএসই ও সিএসই-তে যুক্ত নিজস্ব ব্র্যান্ডের ট্রেডিং অ্যাপ।",
    },
    challenge: {
      en: "[In the client's words: what trading looked like before — channels, manual steps, what investors asked for.] Building and certifying an order system and an app alone is costly for a single brokerage.",
      bn: "[গ্রাহকের ভাষায়: আগে লেনদেন কেমন ছিল — চ্যানেল, হাতে করা ধাপ, বিনিয়োগকারীরা কী চাইতেন।] একক ব্রোকারেজের পক্ষে নিজে অর্ডার সিস্টেম ও অ্যাপ তৈরি ও সনদ নেওয়া ব্যয়বহুল।",
    },
    solution: {
      en: "Bank Asia Securities runs on the consortium's shared platform: investors trade through its own app, BA SECURE TRADE, while orders pass the Xpert OMS — limits and exposure checked — on their way to DSE or CSE. [Add when it went live and which other Xpert products the house uses.]",
      bn: "ব্যাংক এশিয়া সিকিউরিটিজ কনসোর্টিয়ামের শেয়ার করা প্ল্যাটফর্মে চলে: বিনিয়োগকারীরা নিজস্ব অ্যাপ BA SECURE TRADE-এ লেনদেন করেন, আর অর্ডার এক্সপার্ট ওএমএস-এ লিমিট ও এক্সপোজার যাচাই পার হয়ে ডিএসই বা সিএসই-তে যায়। [কবে চালু হয়েছে এবং আর কোন এক্সপার্ট পণ্য ব্যবহার করে, যোগ করুন।]",
    },
    outcome: outcome({ en: "Sumon Das, Chief Executive Officer, Bank Asia Securities Ltd.", bn: "সুমন দাস, প্রধান নির্বাহী কর্মকর্তা, ব্যাংক এশিয়া সিকিউরিটিজ লিমিটেড" }),
  },
  {
    key: "one-securities",
    slug: "one-securities-one-trade",
    title: { en: "ONE Securities: ONE TRADE for investors, one platform behind it", bn: "ওয়ান সিকিউরিটিজ: বিনিয়োগকারীদের জন্য ONE TRADE, পেছনে এক প্ল্যাটফর্ম" },
    summary: {
      en: "ONE Securities brought its investors ONE TRADE, a branded trading app on the Xpert platform with live DSE and CSE markets.",
      bn: "ওয়ান সিকিউরিটিজ তাদের বিনিয়োগকারীদের জন্য এনেছে ONE TRADE — এক্সপার্ট প্ল্যাটফর্মে ডিএসই ও সিএসই-র সরাসরি বাজারসহ নিজস্ব ব্র্যান্ডের ট্রেডিং অ্যাপ।",
    },
    challenge: {
      en: "[In the client's words: why the house wanted its own app, and what had to change for dealers and back office.]",
      bn: "[গ্রাহকের ভাষায়: কেন প্রতিষ্ঠানটি নিজস্ব অ্যাপ চেয়েছিল, এবং ডিলার ও ব্যাক অফিসের জন্য কী বদলাতে হয়েছিল।]",
    },
    solution: {
      en: "ONE TRADE gives investors portfolio balances, order entry, charts, market depth and watchlists, as listed on its public store page, on the same platform the house's dealers use. Orders reach DSE and CSE through the Xpert OMS. [Add go-live date and products in use.]",
      bn: "ONE TRADE বিনিয়োগকারীদের দেয় পোর্টফোলিও ব্যালান্স, অর্ডার প্রদান, চার্ট, মার্কেট ডেপথ ও ওয়াচলিস্ট — অ্যাপ স্টোরের পাতায় যেমন দেওয়া — প্রতিষ্ঠানের ডিলাররা যে প্ল্যাটফর্ম ব্যবহার করেন, সেখানেই। অর্ডার এক্সপার্ট ওএমএস হয়ে ডিএসই ও সিএসই-তে পৌঁছায়। [চালুর তারিখ ও ব্যবহৃত পণ্য যোগ করুন।]",
    },
    outcome: outcome({ en: "Aminul Islam, Chief Executive Officer, ONE Securities Ltd.", bn: "আমিনুল ইসলাম, প্রধান নির্বাহী কর্মকর্তা, ওয়ান সিকিউরিটিজ লিমিটেড" }),
  },
  {
    key: "green-delta-securities",
    slug: "green-delta-securities-gds-trade",
    title: { en: "Green Delta Securities: GDS TRADE on the Xpert platform", bn: "গ্রিন ডেল্টা সিকিউরিটিজ: এক্সপার্ট প্ল্যাটফর্মে GDS TRADE" },
    summary: {
      en: "Green Delta Securities serves its investors through GDS TRADE, a branded trading app built on the Xpert platform.",
      bn: "গ্রিন ডেল্টা সিকিউরিটিজ এক্সপার্ট প্ল্যাটফর্মে তৈরি নিজস্ব ব্র্যান্ডের ট্রেডিং অ্যাপ GDS TRADE-এর মাধ্যমে বিনিয়োগকারীদের সেবা দেয়।",
    },
    challenge: {
      en: "[In the client's words: the business goal — e.g. reaching investors outside branch hours or regions — and what stood in the way.]",
      bn: "[গ্রাহকের ভাষায়: ব্যবসার লক্ষ্য — যেমন শাখার সময় বা এলাকার বাইরের বিনিয়োগকারীদের কাছে পৌঁছানো — এবং বাধা কী ছিল।]",
    },
    solution: {
      en: "GDS TRADE runs on the consortium's shared platform, so the house offers its own brand to investors without running exchange connectivity alone. Orders pass the Xpert OMS on their way to DSE or CSE. [Add go-live date and products in use.]",
      bn: "GDS TRADE কনসোর্টিয়ামের শেয়ার করা প্ল্যাটফর্মে চলে, তাই এক্সচেঞ্জ সংযোগ একা চালানো ছাড়াই প্রতিষ্ঠানটি বিনিয়োগকারীদের নিজস্ব ব্র্যান্ড দেয়। অর্ডার এক্সপার্ট ওএমএস হয়ে ডিএসই বা সিএসই-তে যায়। [চালুর তারিখ ও ব্যবহৃত পণ্য যোগ করুন।]",
    },
    outcome: outcome({ en: "[Name, title], Green Delta Securities Ltd.", bn: "[নাম, পদবি], গ্রিন ডেল্টা সিকিউরিটিজ লিমিটেড" }),
  },
];

/*
 * One draft success story for every other client (XFL's client list, October
 * 2026), built only from what is on record: the client's name, whether it is a
 * consortium member, its branded app on Xpert's Google Play page (if any) and
 * the exchanges it holds a TREC on. The story itself — challenge, products in
 * use, results, figures and the quote — is left in [square brackets] for the
 * client to confirm. Seeded once as DRAFT: never on the live site as is.
 */
type ClientRow = { key: string; slug: string; short: T; name: T; member: boolean; app: string | null; cse: boolean | null };

const CLIENTS: ClientRow[] = [
  { key: "apex-investments", slug: "apex-investments-ail-trade", short: { en: "Apex Investments", bn: "এপেক্স ইনভেস্টমেন্টস" }, name: { en: "Apex Investments Ltd.", bn: "এপেক্স ইনভেস্টমেন্টস লিমিটেড" }, member: true, app: "AIL Trade", cse: false },
  { key: "ebl-securities", slug: "ebl-securities-ebl-fast-trade", short: { en: "EBL Securities", bn: "ইবিএল সিকিউরিটিজ" }, name: { en: "EBL Securities PLC", bn: "ইবিএল সিকিউরিটিজ পিএলসি" }, member: true, app: "EBL Fast Trade", cse: true },
  { key: "islami-bank-securities", slug: "islami-bank-securities-tradeibs", short: { en: "Islami Bank Securities", bn: "ইসলামী ব্যাংক সিকিউরিটিজ" }, name: { en: "Islami Bank Securities Ltd.", bn: "ইসলামী ব্যাংক সিকিউরিটিজ লিমিটেড" }, member: true, app: "TradeiBS", cse: true },
  { key: "nli-securities", slug: "nli-securities-nls-smarttrade", short: { en: "NLI Securities", bn: "এনএলআই সিকিউরিটিজ" }, name: { en: "NLI Securities Ltd.", bn: "এনএলআই সিকিউরিটিজ লিমিটেড" }, member: true, app: "NLS SmartTrade", cse: false },
  { key: "sjibl-securities", slug: "shahjalal-islami-bank-securities-shahjalal-trade", short: { en: "Shahjalal Islami Bank Securities", bn: "শাহজালাল ইসলামী ব্যাংক সিকিউরিটিজ" }, name: { en: "Shahjalal Islami Bank Securities Ltd.", bn: "শাহজালাল ইসলামী ব্যাংক সিকিউরিটিজ লিমিটেড" }, member: true, app: "Shahjalal Trade", cse: true },
  { key: "ucb-stock-brokerage", slug: "ucb-stock-brokerage-utrade", short: { en: "UCB Stock Brokerage", bn: "ইউসিবি স্টক ব্রোকারেজ" }, name: { en: "UCB Stock Brokerage Ltd.", bn: "ইউসিবি স্টক ব্রোকারেজ লিমিটেড" }, member: true, app: "UTrade by UCB STOCK", cse: true },
  { key: "mika-securities", slug: "mika-securities-on-xpert", short: { en: "Mika Securities", bn: "মিকা সিকিউরিটিজ" }, name: { en: "Mika Securities Ltd.", bn: "মিকা সিকিউরিটিজ লিমিটেড" }, member: true, app: null, cse: false },
  { key: "ab-securities", slug: "ab-securities-on-xpert", short: { en: "AB Securities", bn: "এবি সিকিউরিটিজ" }, name: { en: "AB Securities Limited", bn: "এবি সিকিউরিটিজ লিমিটেড" }, member: true, app: null, cse: true },
  { key: "remons-investment", slug: "remons-investment-remx", short: { en: "Remons Investment & Securities", bn: "রেমন্স ইনভেস্টমেন্ট অ্যান্ড সিকিউরিটিজ" }, name: { en: "Remons Investment & Securities Ltd", bn: "রেমন্স ইনভেস্টমেন্ট অ্যান্ড সিকিউরিটিজ লিমিটেড" }, member: true, app: "RemX", cse: true },
  { key: "skyline", slug: "skyline-skytrade", short: { en: "Skyline", bn: "স্কাইলাইন" }, name: { en: "Skyline", bn: "স্কাইলাইন" }, member: false, app: "SkyTrade", cse: null },
  { key: "first-capital-securities", slug: "first-capital-securities-on-xpert", short: { en: "First Capital Securities", bn: "ফার্স্ট ক্যাপিটাল সিকিউরিটিজ" }, name: { en: "First Capital Securities Limited", bn: "ফার্স্ট ক্যাপিটাল সিকিউরিটিজ লিমিটেড" }, member: false, app: null, cse: null },
  { key: "idlc-securities", slug: "idlc-securities-on-xpert", short: { en: "IDLC Securities", bn: "আইডিএলসি সিকিউরিটিজ" }, name: { en: "IDLC Securities Limited", bn: "আইডিএলসি সিকিউরিটিজ লিমিটেড" }, member: false, app: null, cse: true },
];

function clientDraft(c: ClientRow): CaseStudyDraft {
  const exch: T = c.cse === true ? { en: "DSE and CSE", bn: "ডিএসই ও সিএসই" } : c.cse === false ? { en: "DSE", bn: "ডিএসই" } : { en: "DSE or CSE", bn: "ডিএসই বা সিএসই" };
  const who: T = c.member
    ? { en: `${c.name.en}, a member of the consortium that owns Xpert Fintech`, bn: `${c.name.bn}, এক্সপার্ট ফিনটেকের মালিক কনসোর্টিয়ামের সদস্য` }
    : { en: `${c.name.en}, an Xpert client`, bn: `${c.name.bn}, এক্সপার্টের গ্রাহক` };
  return {
    key: c.key,
    slug: c.slug,
    title: c.app
      ? { en: `${c.short.en}: ${c.app} on the Xpert platform`, bn: `${c.short.bn}: এক্সপার্ট প্ল্যাটফর্মে ${c.app}` }
      : { en: `${c.short.en} on Xpert: [headline result in a few words]`, bn: `এক্সপার্টে ${c.short.bn}: [কয়েক শব্দে মূল ফলাফল]` },
    summary: c.app
      ? {
          en: `${who.en}, serves its investors through ${c.app}, a branded trading app built on the Xpert platform. [One line on the result, approved by the client.]`,
          bn: `${who.bn}, এক্সপার্ট প্ল্যাটফর্মে তৈরি নিজস্ব ব্র্যান্ডের ট্রেডিং অ্যাপ ${c.app}-এর মাধ্যমে বিনিয়োগকারীদের সেবা দেয়। [ফলাফল নিয়ে এক লাইন, গ্রাহকের অনুমোদিত।]`,
        }
      : {
          en: `${who.en}, trades on ${exch.en}. [Which Xpert products the house uses, and one line on the result, approved by the client.]`,
          bn: `${who.bn}, ${exch.bn}-তে লেনদেন করে। [প্রতিষ্ঠানটি কোন এক্সপার্ট পণ্য ব্যবহার করে, এবং ফলাফল নিয়ে এক লাইন, গ্রাহকের অনুমোদিত।]`,
        },
    challenge: {
      en: "[In the client's words: what trading and operations looked like before — channels, manual steps, what investors and dealers asked for — and what stood in the way.]",
      bn: "[গ্রাহকের ভাষায়: আগে লেনদেন ও অপারেশন কেমন ছিল — চ্যানেল, হাতে করা ধাপ, বিনিয়োগকারী ও ডিলাররা কী চাইতেন — এবং বাধা কী ছিল।]",
    },
    solution: c.app
      ? {
          en: `${c.app} runs on the consortium's shared platform: investors trade through ${c.short.en}'s own app, and every order passes the RMS checks built into the Xpert Trading OMS on its way to ${exch.en}. [Add when it went live and which other Xpert products the house uses.]`,
          bn: `${c.app} কনসোর্টিয়ামের শেয়ার করা প্ল্যাটফর্মে চলে: বিনিয়োগকারীরা ${c.short.bn}-এর নিজস্ব অ্যাপে লেনদেন করেন, আর প্রতিটি অর্ডার এক্সপার্ট ট্রেডিং ওএমএস-এর ভেতরের আরএমএস যাচাই পার হয়ে ${exch.bn}-তে যায়। [কবে চালু হয়েছে এবং আর কোন এক্সপার্ট পণ্য ব্যবহার করে, যোগ করুন।]`,
        }
      : {
          en: `[Which Xpert products ${c.short.en} uses — for example the Trading OMS with its built-in RMS checks, BO Account Opening or Back Office — since when, and how they fit the house's work on ${exch.en}.]`,
          bn: `[${c.short.bn} কোন এক্সপার্ট পণ্য ব্যবহার করে — যেমন ভেতরে আরএমএস যাচাইসহ ট্রেডিং ওএমএস, বিও অ্যাকাউন্ট খোলা বা ব্যাক অফিস — কবে থেকে, এবং ${exch.bn}-তে প্রতিষ্ঠানের কাজে কীভাবে যুক্ত।]`,
        },
    outcome: outcome({ en: `[Name, title], ${c.name.en}`, bn: `[নাম, পদবি], ${c.name.bn}` }),
  };
}

export const CLIENT_STORY_DRAFTS: CaseStudyDraft[] = CLIENTS.map(clientDraft);
