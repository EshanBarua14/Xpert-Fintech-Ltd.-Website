/**
 * Starting text for the Chairman's and the Managing Director's messages, and
 * Xpert's market-share goal. Seeded once by `npm run db:seed:content` into
 * Settings; edited and published in Admin → Messages.
 *
 * The messages are DRAFTS written for XFL to review: they carry no figures or
 * claims beyond what XFL has stated (the 70%-by-2028 goal) and stay off the
 * website until someone at XFL approves and publishes them.
 */

export type LeaderMessageSeed = { key: "chairman" | "md"; personKey: string; en: string; bn: string };

export const LEADER_MESSAGES: LeaderMessageSeed[] = [
  {
    key: "chairman",
    personKey: "sumon-das",
    en: `Bangladesh's capital market is changing quickly. Investors expect to trade from their phones, regulators expect tighter controls, and brokerage houses need technology they can depend on every trading day.

Xpert Fintech was formed by brokerage houses for exactly that purpose: to give the market a home-grown platform built around how trading in Bangladesh actually works. The Board's role is to keep that purpose in view, through sound governance, careful use of our members' capital and a long-term commitment to the clients who rely on our systems.

On behalf of the Board, I thank our clients, our consortium members, the exchanges and regulators we work alongside, and the team at Xpert whose work keeps the market moving.`,
    bn: `বাংলাদেশের পুঁজিবাজার দ্রুত বদলাচ্ছে। বিনিয়োগকারীরা মোবাইল থেকে লেনদেন করতে চান, নিয়ন্ত্রক সংস্থা আরও কঠোর নিয়ন্ত্রণ প্রত্যাশা করে, আর ব্রোকারেজ হাউসগুলোর প্রয়োজন এমন প্রযুক্তি, যার ওপর প্রতিটি লেনদেন দিবসে নির্ভর করা যায়।

এই লক্ষ্যেই ব্রোকারেজ হাউসগুলো মিলে এক্সপার্ট ফিনটেক গড়ে তুলেছে: বাংলাদেশের বাজারের বাস্তবতা মাথায় রেখে তৈরি একটি দেশীয় প্ল্যাটফর্ম। পরিচালনা পর্ষদের দায়িত্ব এই উদ্দেশ্যকে সামনে রাখা: সুশাসন, সদস্যদের মূলধনের যত্নশীল ব্যবহার এবং আমাদের সিস্টেমের ওপর নির্ভরশীল গ্রাহকদের প্রতি দীর্ঘমেয়াদি অঙ্গীকার।

পরিচালনা পর্ষদের পক্ষ থেকে আমাদের গ্রাহক, কনসোর্টিয়াম সদস্য, স্টক এক্সচেঞ্জ ও নিয়ন্ত্রক সংস্থা এবং এক্সপার্টের পুরো টিমকে ধন্যবাদ জানাই, যাদের কাজে বাজার সচল থাকে।`,
  },
  {
    key: "md",
    personKey: "md-shahinur-rahman",
    en: `Every trading day, brokers and investors across Bangladesh place orders through systems our team builds and supports. We take that responsibility seriously: the platform has to be fast, correct and available from the opening bell to the close.

Our focus is simple. We build the trading, risk, account-opening and back-office tools that brokerage houses need, we keep them connected to DSE and CSE, and we stand behind them with a support team that knows the market. Our goal is for 70% of the market's turnover to run on Xpert by 2028, and we intend to earn it one client at a time.

Thank you to our clients for their trust, and to my colleagues for the care they put into their work.`,
    bn: `প্রতিটি লেনদেন দিবসে বাংলাদেশের ব্রোকার ও বিনিয়োগকারীরা আমাদের টিমের তৈরি ও পরিচালিত সিস্টেমের মাধ্যমে অর্ডার দেন। এই দায়িত্ব আমরা গুরুত্বের সঙ্গে নিই: বাজার খোলা থেকে বন্ধ হওয়া পর্যন্ত প্ল্যাটফর্মকে দ্রুত, নির্ভুল ও সচল থাকতে হবে।

আমাদের মনোযোগ স্পষ্ট। ব্রোকারেজ হাউসের প্রয়োজনীয় ট্রেডিং, ঝুঁকি ব্যবস্থাপনা, অ্যাকাউন্ট খোলা ও ব্যাক-অফিস সমাধান আমরা তৈরি করি, ডিএসই ও সিএসই-এর সঙ্গে সংযুক্ত রাখি, এবং বাজার বোঝে এমন একটি সাপোর্ট টিম নিয়ে পাশে থাকি। ২০২৮ সালের মধ্যে বাজারের লেনদেনের ৭০% এক্সপার্টের প্ল্যাটফর্মে আনা আমাদের লক্ষ্য, আর তা আমরা অর্জন করতে চাই প্রতিটি গ্রাহকের আস্থা জিতে।

আমাদের গ্রাহকদের আস্থার জন্য এবং সহকর্মীদের নিষ্ঠার জন্য ধন্যবাদ।`,
  },
];

/** Share of DSE and CSE turnover Xpert aims to carry, and by when. */
export const MARKET_GOAL = { targetPct: 70, year: 2028, en: "", bn: "" };
