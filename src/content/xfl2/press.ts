/**
 * Xpert Fintech in the press, written in our own words from the published
 * reports (each credited, with the date it appeared) and checked against them
 * on 15 October 2026. Figures are the company's own, as the reports say.
 * Seeded once by `npm run db:seed:content`: news stories under "In the
 * press" and the events they describe. A story or event whose address
 * already exists is left alone; all are editable in the admin.
 */
type T = { en: string; bn: string };

export type PressStory = {
  slug: { en: string; bn: string };
  date: string; // when it was published
  source: string; // publication, credited as the author line
  sourceUrl: string;
  title: T;
  excerpt: T;
  body: T;
};

export type PressEvent = {
  key: string;
  slug: { en: string; bn: string };
  startsAt: string;
  approx?: boolean;
  title: T;
  summary: T;
  body: T;
  location: T;
};

export const PRESS_CATEGORY = { key: "press", en: { slug: "in-the-press", name: "In the press" }, bn: { slug: "songbadmadhyome", name: "সংবাদমাধ্যমে" } };

export const PRESS_STORIES: PressStory[] = [
  {
    slug: { en: "ten-brokers-consortium-own-trading-platform", bn: "dosh-brokerage-consortium-nijossho-trading-platform" },
    date: "2023-08-25",
    source: "The Financial Express",
    sourceUrl: "https://thefinancialexpress.com.bd/economy/10-brokers-to-give-clients-direct-access-to-trading-platform",
    title: {
      en: "Ten brokerage houses team up to give clients direct access to trading",
      bn: "গ্রাহকদের সরাসরি লেনদেনের সুযোগ দিতে একজোট দশ ব্রোকারেজ হাউস",
    },
    excerpt: {
      en: "Through their consortium, Xpert Fintech Ltd, ten brokerage houses are installing their own order management system for trading on DSE and CSE.",
      bn: "নিজেদের কনসোর্টিয়াম এক্সপার্ট ফিনটেক লিমিটেডের মাধ্যমে দশটি ব্রোকারেজ হাউস ডিএসই ও সিএসইতে লেনদেনের জন্য নিজস্ব অর্ডার ম্যানেজমেন্ট সিস্টেম স্থাপন করছে।",
    },
    body: {
      en: [
        "Ten brokerage houses are setting up their own order management system (OMS) so that their clients can trade on the Dhaka and Chittagong stock exchanges directly, The Financial Express reported on 25 August 2023.",
        "The brokers named were EBL Securities, Bank Asia Securities, Shahjalal Islami Bank Securities, ONE Securities, Islami Bank Securities, Green Delta Securities, NLI Securities, Apex Investments, Monarch Holdings and UCB Stock Brokerage. Their consortium, Xpert Fintech Ltd, signed an agreement with SK Advisory FZ LLC, a Dubai-based IT firm, for technical support.",
        "The report put the cost of the services at about Tk 3 crore and said other brokers could join later at a lower cost. It noted that most brokers relied on systems provided by the exchanges, which can be overloaded at busy times, and that an own OMS also helps stop trades being placed without a client's consent.",
        "Md. Sayadur Rahman, Chief Executive Officer of EBL Securities, told the paper that clients would be able to trade faster from home once the consortium's OMS was installed.",
        "Source: The Financial Express, 25 August 2023.",
      ].join("\n\n"),
      bn: [
        "গ্রাহকেরা যাতে ঢাকা ও চট্টগ্রাম স্টক এক্সচেঞ্জে সরাসরি লেনদেন করতে পারেন, সে জন্য দশটি ব্রোকারেজ হাউস নিজস্ব অর্ডার ম্যানেজমেন্ট সিস্টেম (ওএমএস) স্থাপন করছে বলে ২০২৩ সালের ২৫ আগস্ট দ্য ফিন্যান্সিয়াল এক্সপ্রেস জানায়।",
        "প্রতিবেদনে উল্লিখিত ব্রোকারেজগুলো হলো ইবিএল সিকিউরিটিজ, ব্যাংক এশিয়া সিকিউরিটিজ, শাহজালাল ইসলামী ব্যাংক সিকিউরিটিজ, ওয়ান সিকিউরিটিজ, ইসলামী ব্যাংক সিকিউরিটিজ, গ্রিন ডেল্টা সিকিউরিটিজ, এনএলআই সিকিউরিটিজ, এপেক্স ইনভেস্টমেন্টস, মোনার্ক হোল্ডিংস ও ইউসিবি স্টক ব্রোকারেজ। তাদের কনসোর্টিয়াম এক্সপার্ট ফিনটেক লিমিটেড কারিগরি সহায়তার জন্য দুবাইভিত্তিক আইটি প্রতিষ্ঠান এসকে অ্যাডভাইজরি এফজেড এলএলসির সঙ্গে চুক্তি করেছে।",
        "প্রতিবেদন অনুযায়ী সেবার ব্যয় প্রায় ৩ কোটি টাকা, এবং পরে অন্য ব্রোকাররাও কম খরচে যুক্ত হতে পারবে। বেশির ভাগ ব্রোকার এক্সচেঞ্জের দেওয়া সিস্টেমের ওপর নির্ভর করে, যা ব্যস্ত সময়ে চাপে পড়ে; নিজস্ব ওএমএস গ্রাহকের সম্মতি ছাড়া লেনদেন ঠেকাতেও সাহায্য করে।",
        "ইবিএল সিকিউরিটিজের প্রধান নির্বাহী কর্মকর্তা মো. সায়াদুর রহমান পত্রিকাটিকে বলেন, কনসোর্টিয়ামের ওএমএস চালু হলে গ্রাহকেরা ঘরে বসে আরও দ্রুত লেনদেন করতে পারবেন।",
        "সূত্র: দ্য ফিন্যান্সিয়াল এক্সপ্রেস, ২৫ আগস্ট ২০২৩।",
      ].join("\n\n"),
    },
  },
  {
    slug: { en: "xpert-fintech-one-stop-service-capital-market", bn: "punjibajare-one-stop-sheba-expert-fintech" },
    date: "2026-08-20",
    source: "Arthosuchak",
    sourceUrl:
      "https://www.arthosuchak.com/archives/970892/%E0%A6%AA%E0%A7%81%E0%A6%81%E0%A6%9C%E0%A6%BF%E0%A6%AC%E0%A6%BE%E0%A6%9C%E0%A6%BE%E0%A6%B0%E0%A7%87-%E0%A6%93%E0%A6%AF%E0%A6%BC%E0%A6%BE%E0%A6%A8-%E0%A6%B8%E0%A7%8D%E0%A6%9F%E0%A6%AA-%E0%A6%B8/",
    title: {
      en: "Xpert Fintech to offer a one-stop service for the capital market",
      bn: "পুঁজিবাজারে ওয়ান স্টপ সেবা দেবে এক্সপার্ট ফিনটেক",
    },
    excerpt: {
      en: "At a seminar on capital-market digitisation, Xpert Fintech set out its plans: back-office software awaiting approval, a matching engine for the exchange, and a one-stop service.",
      bn: "পুঁজিবাজার ডিজিটালাইজেশন নিয়ে এক সেমিনারে এক্সপার্ট ফিনটেক তাদের পরিকল্পনা তুলে ধরে: অনুমোদনের অপেক্ষায় থাকা ব্যাক অফিস সফটওয়্যার, এক্সচেঞ্জের জন্য ম্যাচিং ইঞ্জিন এবং ওয়ান স্টপ সেবা।",
    },
    body: {
      en: [
        "Xpert Fintech Limited, set up in 2021 by leading brokerage houses of the Dhaka Stock Exchange, presented its work and plans at a seminar titled “Bangladesh Capital Market Digitization and Future Challenges” at a hotel in Dhaka on 19 August 2026, Arthosuchak reported.",
        "According to the company, its order management system is in use at 16 brokerage houses, and 45 to 47 percent of DSE's total turnover passes through it, reaching 57 percent at its peak. Its back-office software for brokerages is built and will be released once the regulator approves it. The company also plans a matching engine for the stock exchange and a one-stop service in the capital market, and, later, to become a public limited company and list through an IPO.",
        "Chairman Sumon Das, Chief Executive Officer of Bank Asia Securities, gave the welcome speech, saying local providers cost less than foreign ones and save foreign currency. Director Mohammad Rahmat Pasha, Managing Director and CEO of UCB Stock Brokerage, closed the seminar, saying the company's main aim is to strengthen the market's technical capacity rather than profit.",
        "DSE Brokers Association President Saiful Islam, DSE shareholder director Minhaj Mannan Emon and former DSE president Shakil Rizvi also spoke or attended.",
        "Source: Arthosuchak, 20 August 2026.",
      ].join("\n\n"),
      bn: [
        "ঢাকা স্টক এক্সচেঞ্জের শীর্ষ ব্রোকারেজ হাউসগুলোর উদ্যোগে ২০২১ সালে গঠিত এক্সপার্ট ফিনটেক লিমিটেড ২০২৬ সালের ১৯ আগস্ট ঢাকার একটি হোটেলে “বাংলাদেশ পুঁজিবাজার ডিজিটালাইজেশন ও ভবিষ্যৎ চ্যালেঞ্জ” শীর্ষক সেমিনারে তাদের কাজ ও পরিকল্পনা তুলে ধরে বলে অর্থসূচক জানায়।",
        "প্রতিষ্ঠানটির তথ্য অনুযায়ী, তাদের অর্ডার ম্যানেজমেন্ট সিস্টেম ১৬টি ব্রোকারেজ হাউসে ব্যবহৃত হচ্ছে এবং ডিএসইর মোট লেনদেনের ৪৫ থেকে ৪৭ শতাংশ এর মাধ্যমে সম্পন্ন হয়, সর্বোচ্চ ৫৭ শতাংশ পর্যন্ত। ব্রোকারেজের জন্য ব্যাক অফিস সফটওয়্যার তৈরি হয়েছে, নিয়ন্ত্রক সংস্থার অনুমোদন পেলেই তা চালু হবে। এক্সচেঞ্জের জন্য ম্যাচিং ইঞ্জিন ও পুঁজিবাজারে ওয়ান স্টপ সেবা চালুর পরিকল্পনাও রয়েছে, পরে পাবলিক লিমিটেড কোম্পানিতে রূপান্তর ও আইপিওর মাধ্যমে তালিকাভুক্তির লক্ষ্য রয়েছে।",
        "স্বাগত বক্তব্য দেন চেয়ারম্যান সুমন দাস, যিনি ব্যাংক এশিয়া সিকিউরিটিজের প্রধান নির্বাহী কর্মকর্তা; তিনি বলেন, দেশীয় সেবাদাতার খরচ বিদেশিদের চেয়ে কম এবং এতে বৈদেশিক মুদ্রা সাশ্রয় হয়। সমাপনী বক্তব্যে পরিচালক মোহাম্মদ রহমত পাশা, ইউসিবি স্টক ব্রোকারেজের ব্যবস্থাপনা পরিচালক ও প্রধান নির্বাহী কর্মকর্তা, বলেন মুনাফা নয়, বাজারের কারিগরি সক্ষমতা বাড়ানোই প্রতিষ্ঠানের মূল লক্ষ্য।",
        "ডিএসই ব্রোকারস অ্যাসোসিয়েশনের সভাপতি সাইফুল ইসলাম, ডিএসইর শেয়ারহোল্ডার পরিচালক মিনহাজ মান্নান ইমন এবং ডিএসইর সাবেক সভাপতি শাকিল রিজভীও উপস্থিত ছিলেন।",
        "সূত্র: অর্থসূচক, ২০ আগস্ট ২০২৬।",
      ].join("\n\n"),
    },
  },
  {
    slug: { en: "stakeholders-dayout-2026", bn: "stakeholders-dayout-2026-songbad" },
    date: "2026-09-21",
    source: "Arthosuchak",
    sourceUrl:
      "https://www.arthosuchak.com/archives/974490/%E0%A6%8F%E0%A6%95%E0%A7%8D%E0%A6%B8%E0%A6%AA%E0%A6%BE%E0%A6%B0%E0%A7%8D%E0%A6%9F-%E0%A6%AB%E0%A6%BF%E0%A6%A8%E0%A6%9F%E0%A7%87%E0%A6%95-%E0%A6%B2%E0%A6%BF%E0%A6%AE%E0%A6%BF%E0%A6%9F%E0%A7%87%E0%A6%A1/",
    title: {
      en: "Stakeholders Dayout 2026: Xpert Fintech shares its progress and roadmap",
      bn: "স্টেকহোল্ডারস ডেআউট ২০২৬: অগ্রগতি ও ভবিষ্যৎ রূপরেখা তুলে ধরল এক্সপার্ট ফিনটেক",
    },
    excerpt: {
      en: "Board members, shareholders and market leaders met for a day; Remons Investment & Securities was welcomed as a new institutional shareholder.",
      bn: "পরিচালনা পর্ষদ, শেয়ারহোল্ডার ও বাজারসংশ্লিষ্টরা এক দিনের আয়োজনে মিলিত হন; নতুন প্রাতিষ্ঠানিক শেয়ারহোল্ডার হিসেবে স্বাগত জানানো হয় রেমন্স ইনভেস্টমেন্ট অ্যান্ড সিকিউরিটিজকে।",
    },
    body: {
      en: [
        "Xpert Fintech Limited held “Stakeholders Dayout 2026”, a full-day gathering at a resort near Dhaka, to mark its business growth and set out its roadmap, Arthosuchak reported on 21 September 2026 from the company's press release.",
        "The company started with ten brokerage houses, grew to twelve, and, it says, now has seventeen of the country's leading brokerage houses using its OMS, which handles 45 to 47 percent of DSE's daily turnover and up to 57 percent on the busiest days. It also announced plans to build its own high-capacity matching engine for the stock exchange.",
        "Remons Investment & Securities Ltd. was welcomed as a new institutional shareholder: Chairman Sumon Das handed a symbolic share certificate to its representative, Md. Mofiz Uddin.",
        "Also present were Director and Executive Committee Chairman Mohammad Rahmat Pasha, Director and Audit Committee Chairman Aminul Islam, Managing Director Md. Shahinur Rahman, Company Secretary Md. Abdur Rahman Rony FCS, and adviser Mohammad Ali FCA, with board members, institutional shareholders and capital-market leaders.",
        "Source: Arthosuchak, 21 September 2026.",
      ].join("\n\n"),
      bn: [
        "ব্যবসায়িক প্রবৃদ্ধি উদ্‌যাপন ও ভবিষ্যৎ রূপরেখা নির্ধারণে এক্সপার্ট ফিনটেক লিমিটেড ঢাকার কাছে একটি রিসোর্টে দিনব্যাপী “স্টেকহোল্ডারস ডেআউট ২০২৬” আয়োজন করে বলে প্রতিষ্ঠানটির সংবাদ বিজ্ঞপ্তির বরাতে ২০২৬ সালের ২১ সেপ্টেম্বর অর্থসূচক জানায়।",
        "দশটি ব্রোকারেজ হাউস নিয়ে যাত্রা শুরু করে পরে বারোটিতে উন্নীত প্রতিষ্ঠানটির তথ্যমতে, এখন দেশের শীর্ষ সতেরোটি ব্রোকারেজ হাউস তাদের ওএমএস ব্যবহার করছে, যার মাধ্যমে ডিএসইর দৈনিক লেনদেনের ৪৫ থেকে ৪৭ শতাংশ এবং সবচেয়ে ব্যস্ত দিনে ৫৭ শতাংশ পর্যন্ত সম্পন্ন হয়। স্টক এক্সচেঞ্জের জন্য নিজস্ব উচ্চক্ষমতার ম্যাচিং ইঞ্জিন তৈরির পরিকল্পনাও ঘোষণা করা হয়।",
        "নতুন প্রাতিষ্ঠানিক শেয়ারহোল্ডার হিসেবে রেমন্স ইনভেস্টমেন্ট অ্যান্ড সিকিউরিটিজ লিমিটেডকে স্বাগত জানানো হয়; চেয়ারম্যান সুমন দাস প্রতিষ্ঠানটির প্রতিনিধি মো. মফিজ উদ্দিনের হাতে প্রতীকী শেয়ার সনদ তুলে দেন।",
        "উপস্থিত ছিলেন পরিচালক ও নির্বাহী কমিটির চেয়ারম্যান মোহাম্মদ রহমত পাশা, পরিচালক ও অডিট কমিটির চেয়ারম্যান আমিনুল ইসলাম, ব্যবস্থাপনা পরিচালক মো. শাহিনুর রহমান, কোম্পানি সচিব মো. আব্দুর রহমান রনি এফসিএস এবং উপদেষ্টা মোহাম্মদ আলী এফসিএ, সঙ্গে পরিচালনা পর্ষদের সদস্য, প্রাতিষ্ঠানিক শেয়ারহোল্ডার ও পুঁজিবাজারসংশ্লিষ্টরা।",
        "সূত্র: অর্থসূচক, ২১ সেপ্টেম্বর ২০২৬।",
      ].join("\n\n"),
    },
  },
];

export const PRESS_EVENTS: PressEvent[] = [
  {
    key: "seminar-capital-market-digitization-2026",
    slug: { en: "seminar-capital-market-digitization-2026", bn: "punjibajar-digitalization-seminar-2026" },
    startsAt: "2026-08-19T10:00:00+06:00",
    title: {
      en: "Seminar: Bangladesh Capital Market Digitization and Future Challenges",
      bn: "সেমিনার: বাংলাদেশ পুঁজিবাজার ডিজিটালাইজেশন ও ভবিষ্যৎ চ্যালেঞ্জ",
    },
    summary: {
      en: "Xpert Fintech presented its OMS, back-office software and plans for a matching engine and a one-stop capital-market service.",
      bn: "এক্সপার্ট ফিনটেক তাদের ওএমএস, ব্যাক অফিস সফটওয়্যার এবং ম্যাচিং ইঞ্জিন ও পুঁজিবাজারে ওয়ান স্টপ সেবার পরিকল্পনা তুলে ধরে।",
    },
    body: {
      en: "Chairman Sumon Das welcomed guests and Director Mohammad Rahmat Pasha closed the seminar. DSE Brokers Association President Saiful Islam, DSE shareholder director Minhaj Mannan Emon and former DSE president Shakil Rizvi took part. (Reported by Arthosuchak, 20 August 2026.)",
      bn: "অতিথিদের স্বাগত জানান চেয়ারম্যান সুমন দাস, সমাপনী বক্তব্য দেন পরিচালক মোহাম্মদ রহমত পাশা। অংশ নেন ডিএসই ব্রোকারস অ্যাসোসিয়েশনের সভাপতি সাইফুল ইসলাম, ডিএসইর শেয়ারহোল্ডার পরিচালক মিনহাজ মান্নান ইমন ও ডিএসইর সাবেক সভাপতি শাকিল রিজভী। (অর্থসূচক, ২০ আগস্ট ২০২৬)",
    },
    location: { en: "Dhaka", bn: "ঢাকা" },
  },
  {
    key: "stakeholders-dayout-2026",
    slug: { en: "stakeholders-dayout-2026", bn: "stakeholders-dayout-2026" },
    startsAt: "2026-09-01T10:00:00+06:00",
    approx: true,
    title: { en: "Stakeholders Dayout 2026", bn: "স্টেকহোল্ডারস ডেআউট ২০২৬" },
    summary: {
      en: "A day with board members, shareholders and market leaders; Remons Investment & Securities welcomed as a new institutional shareholder.",
      bn: "পরিচালনা পর্ষদ, শেয়ারহোল্ডার ও বাজারসংশ্লিষ্টদের নিয়ে এক দিন; নতুন প্রাতিষ্ঠানিক শেয়ারহোল্ডার হিসেবে রেমন্স ইনভেস্টমেন্ট অ্যান্ড সিকিউরিটিজকে স্বাগত।",
    },
    body: {
      en: "Xpert Fintech shared its growth and roadmap, including plans for its own high-capacity matching engine. Chairman Sumon Das handed a symbolic share certificate to Md. Mofiz Uddin of Remons Investment & Securities. (Reported by Arthosuchak, 21 September 2026.)",
      bn: "এক্সপার্ট ফিনটেক তাদের প্রবৃদ্ধি ও ভবিষ্যৎ রূপরেখা তুলে ধরে, যার মধ্যে নিজস্ব উচ্চক্ষমতার ম্যাচিং ইঞ্জিন তৈরির পরিকল্পনা রয়েছে। চেয়ারম্যান সুমন দাস রেমন্স ইনভেস্টমেন্ট অ্যান্ড সিকিউরিটিজের মো. মফিজ উদ্দিনের হাতে প্রতীকী শেয়ার সনদ তুলে দেন। (অর্থসূচক, ২১ সেপ্টেম্বর ২০২৬)",
    },
    location: { en: "A resort near Dhaka", bn: "ঢাকার কাছের একটি রিসোর্ট" },
  },
];
