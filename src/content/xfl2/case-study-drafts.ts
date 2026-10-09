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
