/**
 * Facts about the consortium's member brokerage houses, checked on 15 October
 * 2026 against their own websites, the Chittagong Stock Exchange's member pages
 * and the Dhaka Stock Exchange's list of TREC holders. Added by
 * `npm run db:seed:content` only where the field is still empty, so anything
 * edited in Admin → Organizations is never overwritten. Only what a source
 * states is here; a field left out was not found.
 *
 * Sources:
 *  - websites: each house's own site (and CSE member pages: EBL, GDSL, Remons)
 *  - DSE TREC: stockchartbd.com/brokers.php (licensed brokers list) and the DSE TREC holders list
 *  - CSE TREC: cse.com.bd/stockbroker/memberDetails/<no.> (and the GDSL logo, "CSE TREC # 130")
 *  - IDLC Securities (a client, not a consortium member): DSE TREC 058 from the
 *    licensed brokers list; CSE TREC 119 from cse.com.bd/stockbroker/memberDetails/119
 *    and BSEC's registration notice; wholly owned by IDLC Finance PLC; its page
 *    on the IDLC group site is idlc.com/securities. No app of its own is on
 *    Xpert Fintech's Google Play developer page, so none is listed.
 */
type L = { en: string; bn: string };
export type MemberProfile = { key: string; website?: string; dseTrec?: string; cseTrec?: string; description: L };

export const MEMBER_PROFILES: MemberProfile[] = [
  {
    key: "apex-investments",
    website: "https://www.ail-bd.com",
    dseTrec: "007",
    description: {
      en: "Brokerage house of the Apex group, a Syed Manzur Elahi enterprise.",
      bn: "এপেক্স গ্রুপের ব্রোকারেজ হাউস, সৈয়দ মঞ্জুর এলাহীর একটি প্রতিষ্ঠান।",
    },
  },
  {
    key: "bank-asia-securities",
    // Its own site: company name, Dilkusha head office and info@basl-bd.com (checked 15 Oct 2026).
    website: "https://www.basl-bd.com",
    dseTrec: "237",
    cseTrec: "149",
    description: {
      en: "Brokerage subsidiary of Bank Asia PLC, trading on DSE and CSE.",
      bn: "ব্যাংক এশিয়া পিএলসির ব্রোকারেজ সহযোগী প্রতিষ্ঠান, ডিএসই ও সিএসইতে লেনদেন করে।",
    },
  },
  {
    key: "ebl-securities",
    website: "https://www.eblsecurities.com",
    dseTrec: "026",
    cseTrec: "021",
    description: {
      en: "Stockbroker and dealer, a fully owned subsidiary of Eastern Bank PLC, also licensed as a depository participant.",
      bn: "স্টক ব্রোকার ও ডিলার, ইস্টার্ন ব্যাংক পিএলসির সম্পূর্ণ মালিকানাধীন সহযোগী প্রতিষ্ঠান; ডিপোজিটরি পার্টিসিপ্যান্ট হিসেবেও লাইসেন্সপ্রাপ্ত।",
    },
  },
  {
    key: "green-delta-securities",
    website: "https://www.gdslbd.com",
    dseTrec: "059",
    cseTrec: "130",
    description: {
      en: "Brokerage house offering trading, depository services and online IPO applications.",
      bn: "লেনদেন, ডিপোজিটরি সেবা ও অনলাইনে আইপিও আবেদনের সুবিধা দেওয়া ব্রোকারেজ হাউস।",
    },
  },
  {
    key: "islami-bank-securities",
    website: "https://www.islamibanksecurities.com",
    dseTrec: "107",
    cseTrec: "146",
    description: {
      en: "Brokerage subsidiary of Islami Bank Bangladesh PLC, offering IPO applications, BO accounts and retail brokerage.",
      bn: "ইসলামী ব্যাংক বাংলাদেশ পিএলসির ব্রোকারেজ সহযোগী প্রতিষ্ঠান; আইপিও আবেদন, বিও অ্যাকাউন্ট ও খুচরা ব্রোকারেজ সেবা দেয়।",
    },
  },
  {
    key: "nli-securities",
    website: "https://nlisecurities.com",
    dseTrec: "244",
    description: {
      en: "Stock brokerage company trading on the Dhaka Stock Exchange.",
      bn: "ঢাকা স্টক এক্সচেঞ্জে লেনদেনকারী স্টক ব্রোকারেজ প্রতিষ্ঠান।",
    },
  },
  {
    key: "one-securities",
    website: "https://www.onesecuritiesbd.com",
    dseTrec: "241",
    description: {
      en: "Stockbroker offering online trading on DSE and CSE, research, and guidance for foreign investors.",
      bn: "ডিএসই ও সিএসইতে অনলাইন লেনদেন, গবেষণা এবং বিদেশি বিনিয়োগকারীদের জন্য দিকনির্দেশনা দেওয়া স্টক ব্রোকার।",
    },
  },
  {
    key: "sjibl-securities",
    website: "https://www.shahjalalbanksecurities.com.bd",
    dseTrec: "233",
    cseTrec: "134",
    description: {
      en: "Brokerage offering Shariah-based investment, BO accounts and trading on DSE and CSE.",
      bn: "শরিয়াহভিত্তিক বিনিয়োগ, বিও অ্যাকাউন্ট এবং ডিএসই ও সিএসইতে লেনদেনের সুবিধা দেওয়া ব্রোকারেজ।",
    },
  },
  {
    key: "ucb-stock-brokerage",
    website: "https://ucbstock.com.bd",
    dseTrec: "181",
    cseTrec: "015",
    description: {
      en: "Brokerage subsidiary of United Commercial Bank PLC, serving individual, corporate, institutional and foreign investors.",
      bn: "ইউনাইটেড কমার্শিয়াল ব্যাংক পিএলসির ব্রোকারেজ সহযোগী প্রতিষ্ঠান; ব্যক্তি, কর্পোরেট, প্রাতিষ্ঠানিক ও বিদেশি বিনিয়োগকারীদের সেবা দেয়।",
    },
  },
  {
    key: "mika-securities",
    website: "https://www.mikasecurities.net",
    dseTrec: "215",
    description: {
      en: "DSE brokerage since 2005, offering stock trading, IPO applications, treasury bonds and depository services.",
      bn: "২০০৫ সাল থেকে ডিএসইর ব্রোকারেজ; শেয়ার লেনদেন, আইপিও আবেদন, ট্রেজারি বন্ড ও ডিপোজিটরি সেবা দেয়।",
    },
  },
  {
    key: "ab-securities",
    dseTrec: "201",
    cseTrec: "101",
    description: {
      en: "Brokerage house trading on DSE and CSE.",
      bn: "ডিএসই ও সিএসইতে লেনদেনকারী ব্রোকারেজ হাউস।",
    },
  },
  {
    key: "remons-investment",
    website: "https://www.remons.org",
    dseTrec: "108",
    cseTrec: "042",
    description: {
      en: "Brokerage house trading on DSE and CSE.",
      bn: "ডিএসই ও সিএসইতে লেনদেনকারী ব্রোকারেজ হাউস।",
    },
  },
  {
    key: "idlc-securities",
    website: "https://idlc.com/securities",
    dseTrec: "058",
    cseTrec: "119",
    description: {
      en: "Stock brokerage arm of IDLC Finance PLC, which owns it fully. Trades on DSE and CSE for resident, non-resident and institutional investors.",
      bn: "আইডিএলসি ফাইন্যান্স পিএলসির সম্পূর্ণ মালিকানাধীন স্টক ব্রোকারেজ প্রতিষ্ঠান। দেশি, প্রবাসী ও প্রাতিষ্ঠানিক বিনিয়োগকারীদের জন্য ডিএসই ও সিএসইতে লেনদেন করে।",
    },
  },
];
