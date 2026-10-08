/**
 * Board and management profiles as supplied by XFL (8 Oct 2026), lightly
 * copy-edited (grammar only, no facts changed), with Bangla versions. The
 * content seed fills each person's biography and position at their own
 * organization (affiliation) in Admin → People where those are still empty,
 * or still hold an earlier seeded value (`replaces`).
 */
export type ProfileText = { en: string; bn: string };
export type DirectorProfile = {
  key: string;
  nameBn: string;
  affiliation?: ProfileText;
  bio?: ProfileText;
  /** Earlier seeded affiliations this one supersedes (replaced unless edited in the admin). */
  replaces?: string[];
  linkedinUrl?: string;
};

export const DIRECTOR_PROFILES: DirectorProfile[] = [
  {
    key: "sumon-das",
    nameBn: "সুমন দাস",
    affiliation: { en: "Chief Executive Officer, Bank Asia Securities Ltd.", bn: "প্রধান নির্বাহী কর্মকর্তা, ব্যাংক এশিয়া সিকিউরিটিজ লিমিটেড" },
    replaces: ["CEO & SVP, Bank Asia Securities Limited", "সিইও ও এসভিপি, ব্যাংক এশিয়া সিকিউরিটিজ লিমিটেড"],
    bio: {
      en: "Mr. Sumon Das has been the Chief Executive Officer and Senior Vice President (SVP) of Bank Asia Securities Limited since 2009. He has more than twenty-one years of experience in Bangladesh's capital market.\n\nHe joined The City Bank Limited in 2007 as Vice President and played a vital role in the early stage of launching the formal operations of The City Bank's brokerage house and merchant banking unit. He also worked at Central Depository Bangladesh Limited and Chittagong Stock Exchange Limited (CSE) for several years in different positions.\n\nMr. Das holds a Master of Commerce (Finance & Banking) from the University of Dhaka.",
      bn: "সুমন দাস ২০০৯ সাল থেকে ব্যাংক এশিয়া সিকিউরিটিজ লিমিটেডের প্রধান নির্বাহী কর্মকর্তা ও সিনিয়র ভাইস প্রেসিডেন্ট (এসভিপি)। বাংলাদেশের পুঁজিবাজারে তাঁর একুশ বছরেরও বেশি কাজের অভিজ্ঞতা রয়েছে।\n\n২০০৭ সালে তিনি ভাইস প্রেসিডেন্ট হিসেবে দ্য সিটি ব্যাংক লিমিটেডে যোগ দেন এবং ব্যাংকটির ব্রোকারেজ হাউস ও মার্চেন্ট ব্যাংকিং ইউনিটের আনুষ্ঠানিক কার্যক্রম শুরুর প্রাথমিক পর্যায়ে গুরুত্বপূর্ণ ভূমিকা রাখেন। তিনি সেন্ট্রাল ডিপোজিটরি বাংলাদেশ লিমিটেড ও চট্টগ্রাম স্টক এক্সচেঞ্জ লিমিটেডে (সিএসই) বিভিন্ন পদে কয়েক বছর কাজ করেছেন।\n\nতিনি ঢাকা বিশ্ববিদ্যালয় থেকে বাণিজ্যে স্নাতকোত্তর (ফিন্যান্স অ্যান্ড ব্যাংকিং) ডিগ্রি অর্জন করেন।",
    },
  },
  {
    key: "mohammed-rahmat-pasha",
    nameBn: "মোহাম্মদ রহমত পাশা",
    linkedinUrl: "https://bd.linkedin.com/in/md-rahmat-pasha-9a181959",
    affiliation: { en: "Managing Director & CEO, UCB Stock Brokerage Ltd.", bn: "ব্যবস্থাপনা পরিচালক ও সিইও, ইউসিবি স্টক ব্রোকারেজ লিমিটেড" },
    replaces: ["CEO, UCB Stock Brokerage Limited", "সিইও, ইউসিবি স্টক ব্রোকারেজ লিমিটেড"],
    bio: {
      en: "Mr. Mohammed Rahmat Pasha joined UCB Stock Brokerage Limited as Chief Executive Officer (CEO) on 27 March 2016. Before UCB Stock, he served as CEO of BRAC EPL Stock Brokerage Ltd for five years.\n\nIn 2001 he joined BRAC Bank Limited as Head of Treasury and Financial Institutions, a role he held for ten years. Before BRAC Bank, he worked for eight years at The City Bank Ltd and for five years at Dutch-Bangla Bank Ltd, in Retail Banking, Foreign Exchange, Finance and the International Division, among other divisions.\n\nMr. Pasha has long experience in treasury and financial institutions.",
      bn: "মোহাম্মদ রহমত পাশা ২০১৬ সালের ২৭ মার্চ প্রধান নির্বাহী কর্মকর্তা (সিইও) হিসেবে ইউসিবি স্টক ব্রোকারেজ লিমিটেডে যোগ দেন। এর আগে তিনি পাঁচ বছর ব্র্যাক ইপিএল স্টক ব্রোকারেজ লিমিটেডের সিইও ছিলেন।\n\n২০০১ সালে তিনি ট্রেজারি ও ফাইন্যান্সিয়াল ইনস্টিটিউশনস বিভাগের প্রধান হিসেবে ব্র্যাক ব্যাংক লিমিটেডে যোগ দেন এবং দশ বছর এ দায়িত্ব পালন করেন। ব্র্যাক ব্যাংকে যোগদানের আগে তিনি দ্য সিটি ব্যাংক লিমিটেডে আট বছর এবং ডাচ-বাংলা ব্যাংক লিমিটেডে পাঁচ বছর রিটেইল ব্যাংকিং, বৈদেশিক মুদ্রা, ফাইন্যান্স ও ইন্টারন্যাশনাল ডিভিশনসহ বিভিন্ন বিভাগে কাজ করেছেন।\n\nট্রেজারি ও আর্থিক প্রতিষ্ঠান খাতে তাঁর দীর্ঘ অভিজ্ঞতা রয়েছে।",
    },
  },
  {
    key: "dilip-kajuri",
    nameBn: "দিলীপ কাজুরী",
    affiliation: { en: "CEO & Director, Apex Investments Ltd.", bn: "সিইও ও পরিচালক, অ্যাপেক্স ইনভেস্টমেন্টস লিমিটেড" },
    replaces: ["CEO & Director, Apex Investments Limited", "সিইও ও পরিচালক, অ্যাপেক্স ইনভেস্টমেন্টস লিমিটেড"],
    bio: {
      en: "Mr. Dilip Kajuri has been the CEO & Director of Apex Investments Limited and Chief Financial Officer of Apex Footwear Limited since March 2009. He has more than 25 years of diverse experience in manufacturing and service industries.\n\nFormerly with KPMG Rahman Rahman Huq, Bangladesh, he has wide experience and expertise in budgetary control, corporate finance, auditing, taxation and legal matters. Before joining Apex, he worked for other national and multinational companies in Bangladesh, including ACI Limited and Grey Advertising (Bangladesh) Limited.",
      bn: "দিলীপ কাজুরী ২০০৯ সালের মার্চ থেকে অ্যাপেক্স ইনভেস্টমেন্টস লিমিটেডের সিইও ও পরিচালক এবং অ্যাপেক্স ফুটওয়্যার লিমিটেডের প্রধান আর্থিক কর্মকর্তা। উৎপাদন ও সেবা খাতে তাঁর ২৫ বছরেরও বেশি বৈচিত্র্যময় কাজের অভিজ্ঞতা রয়েছে।\n\nএর আগে তিনি কেপিএমজি রহমান রহমান হক, বাংলাদেশ-এ কাজ করেছেন; বাজেট নিয়ন্ত্রণ, কর্পোরেট ফাইন্যান্স, নিরীক্ষা, কর ও আইনি বিষয়ে তাঁর ব্যাপক অভিজ্ঞতা ও দক্ষতা রয়েছে। অ্যাপেক্সে যোগদানের আগে তিনি এসিআই লিমিটেড ও গ্রে অ্যাডভার্টাইজিং (বাংলাদেশ) লিমিটেডসহ দেশি ও বহুজাতিক বিভিন্ন প্রতিষ্ঠানে কাজ করেছেন।",
    },
  },
  {
    key: "aminul-islam",
    nameBn: "আমিনুল ইসলাম",
    affiliation: { en: "Chief Executive Officer, ONE Securities Ltd.", bn: "প্রধান নির্বাহী কর্মকর্তা, ওয়ান সিকিউরিটিজ লিমিটেড" },
    replaces: ["CEO, ONE Securities Limited", "সিইও, ওয়ান সিকিউরিটিজ লিমিটেড"],
    bio: {
      en: "Mr. Aminul Islam is the Chief Executive Officer of ONE Securities Limited (OSL). He has worked in the investment and banking industry for over 26 years and has completed extensive training and management courses at various institutions. He currently manages OSL's dealer-account portfolios of BDT 2,000 million.\n\nBefore OSL, he worked at ONE Bank Limited for more than five years in various roles in its investment department and capital market operations. Before joining ONE Bank Limited in 2009, he worked at Mutual Trust Bank Limited for six years in the Merchant Banking Division, and at Dhaka Stock Exchange for seven years in the Research & Listing Department.\n\nHe holds a Master's degree in Accounting from the University of Chittagong and an LLM degree.",
      bn: "আমিনুল ইসলাম ওয়ান সিকিউরিটিজ লিমিটেডের (ওএসএল) প্রধান নির্বাহী কর্মকর্তা। বিনিয়োগ ও ব্যাংকিং খাতে তাঁর ২৬ বছরেরও বেশি অভিজ্ঞতা রয়েছে এবং তিনি বিভিন্ন প্রতিষ্ঠানে ব্যাপক প্রশিক্ষণ ও ব্যবস্থাপনা কোর্স সম্পন্ন করেছেন। বর্তমানে তিনি ওএসএল-এর ডিলার অ্যাকাউন্টের ২,০০০ মিলিয়ন টাকার পোর্টফোলিও পরিচালনা করছেন।\n\nওএসএল-এ যোগদানের আগে তিনি ওয়ান ব্যাংক লিমিটেডে পাঁচ বছরেরও বেশি সময় বিনিয়োগ বিভাগ ও পুঁজিবাজার কার্যক্রমে বিভিন্ন দায়িত্বে ছিলেন। ২০০৯ সালে ওয়ান ব্যাংকে যোগদানের আগে তিনি মিউচুয়াল ট্রাস্ট ব্যাংক লিমিটেডের মার্চেন্ট ব্যাংকিং বিভাগে ছয় বছর এবং ঢাকা স্টক এক্সচেঞ্জের রিসার্চ অ্যান্ড লিস্টিং বিভাগে সাত বছর কাজ করেছেন।\n\nতিনি চট্টগ্রাম বিশ্ববিদ্যালয় থেকে হিসাববিজ্ঞানে স্নাতকোত্তর এবং এলএলএম ডিগ্রি অর্জন করেছেন।",
    },
  },
  {
    key: "mohd-shaahed-imran",
    nameBn: "মোহাম্মদ শাহেদ ইমরান",
    affiliation: { en: "Chief Executive Officer, NLI Securities Ltd.", bn: "প্রধান নির্বাহী কর্মকর্তা, এনএলআই সিকিউরিটিজ লিমিটেড" },
    replaces: ["CEO, NLI Securities Limited", "সিইও, এনএলআই সিকিউরিটিজ লিমিটেড"],
    bio: {
      en: "Mr. Mohd. Shaahed Imran has been the Chief Executive Officer of NLI Securities Limited since 2014. He has more than twenty-five years of experience across several areas of Bangladesh's capital market.\n\nHe joined Banque Indosuez as a trainee officer in its Custodian Department in 1995. He later worked at Mita Textiles Limited (Bangas Tallu Group) as Assistant Company Secretary, and at Bangladesh Commerce Bank Limited and Commerce Bank Securities Limited in different positions.\n\nMr. Imran holds a Master's in Bangla, the ACBA certificate from IBA, University of Dhaka, and the CSAA from AAOIFI, Bahrain.",
      bn: "মোহাম্মদ শাহেদ ইমরান ২০১৪ সাল থেকে এনএলআই সিকিউরিটিজ লিমিটেডের প্রধান নির্বাহী কর্মকর্তা। বাংলাদেশের পুঁজিবাজারের বিভিন্ন শাখায় তাঁর পঁচিশ বছরেরও বেশি কাজের অভিজ্ঞতা রয়েছে।\n\n১৯৯৫ সালে তিনি ব্যাংক ইন্দোসুয়েজের কাস্টোডিয়ান বিভাগে ট্রেইনি অফিসার হিসেবে যোগ দেন। পরে তিনি মিতা টেক্সটাইলস লিমিটেডে (বঙ্গাস টালু গ্রুপ) সহকারী কোম্পানি সচিব হিসেবে এবং বাংলাদেশ কমার্স ব্যাংক লিমিটেড ও কমার্স ব্যাংক সিকিউরিটিজ লিমিটেডে বিভিন্ন পদে কাজ করেছেন।\n\nতিনি বাংলায় স্নাতকোত্তর, ঢাকা বিশ্ববিদ্যালয়ের আইবিএ থেকে এসিবিএ সার্টিফিকেট এবং বাহরাইনের এএওআইএফআই থেকে সিএসএএ অর্জন করেছেন।",
    },
  },
  {
    key: "fakruddin-ali-ahmed-rajib",
    nameBn: "ফখরুদ্দিন আলী আহমেদ রাজিব",
    affiliation: { en: "Senior Executive Vice President & Head of Business, Green Delta Securities Ltd.", bn: "সিনিয়র এক্সিকিউটিভ ভাইস প্রেসিডেন্ট ও হেড অব বিজনেস, গ্রিন ডেল্টা সিকিউরিটিজ লিমিটেড" },
    replaces: ["SEVP & Head of Business, Green Delta Securities Ltd.", "এসইভিপি ও হেড অব বিজনেস, গ্রিন ডেল্টা সিকিউরিটিজ লিমিটেড"],
    bio: {
      en: "Mr. Fakruddin Ali Ahmed Rajib is the Senior Executive Vice President & Head of Business of Green Delta Securities Ltd. He was previously Head of Student Banking and Senior Manager, Acquisition, Payroll Banking (AVP) at The City Bank Ltd., and before that an officer at UAE Exchange LLC and Eastern Bank Limited. UAE Exchange's Khorfakkan Branch named him 'Best Branch Employee of the Month'. He has more than 17 years of experience in the field.\n\nAt IBA, University of Dhaka, he completed Competitive Business Strategy & Innovation (CBSI, Batch 2), the Advance Certificate in Business Administration (ACBA, Batch 4) and the Advance Certificate in Managerial Communication (ACMC, Batch 1). His training includes AML protection and serving customers of different nationalities at UAE Exchange, and, at The City Bank Limited, 'Service Quality: Spirit to Serve' customer service, student and medical file operations with related foreign-exchange reporting, product knowledge, and sales and service skills.\n\nHe is a member of the Rotary Club of Dhaka Pacific.",
      bn: "ফখরুদ্দিন আলী আহমেদ রাজিব গ্রিন ডেল্টা সিকিউরিটিজ লিমিটেডের সিনিয়র এক্সিকিউটিভ ভাইস প্রেসিডেন্ট ও হেড অব বিজনেস। এর আগে তিনি দ্য সিটি ব্যাংক লিমিটেডের হেড অব স্টুডেন্ট ব্যাংকিং এবং সিনিয়র ম্যানেজার, অ্যাকুইজিশন, পে-রোল ব্যাংকিং (এভিপি) ছিলেন; তারও আগে ইউএই এক্সচেঞ্জ এলএলসি ও ইস্টার্ন ব্যাংক লিমিটেডে অফিসার হিসেবে কাজ করেন। ইউএই এক্সচেঞ্জের খোরফাক্কান শাখা তাঁকে ‘বেস্ট ব্রাঞ্চ এমপ্লয়ি অব দ্য মান্থ’ সম্মাননা দেয়। এ খাতে তাঁর ১৭ বছরেরও বেশি অভিজ্ঞতা রয়েছে।\n\nঢাকা বিশ্ববিদ্যালয়ের আইবিএ থেকে তিনি কম্পিটিটিভ বিজনেস স্ট্র্যাটেজি অ্যান্ড ইনোভেশন (সিবিএসআই, ব্যাচ-২), অ্যাডভান্স সার্টিফিকেট ইন বিজনেস অ্যাডমিনিস্ট্রেশন (এসিবিএ, ব্যাচ-৪) এবং অ্যাডভান্স সার্টিফিকেট ইন ম্যানেজেরিয়াল কমিউনিকেশন (এসিএমসি, ব্যাচ-১) সম্পন্ন করেছেন। ইউএই এক্সচেঞ্জে এএমএল সুরক্ষা ও বিভিন্ন দেশের গ্রাহকসেবা এবং দ্য সিটি ব্যাংকে গ্রাহকসেবার মান (‘সার্ভিস কোয়ালিটি: স্পিরিট টু সার্ভ’), স্টুডেন্ট ও মেডিকেল ফাইল অপারেশন ও সংশ্লিষ্ট বৈদেশিক মুদ্রা রিপোর্টিং, পণ্য জ্ঞান এবং বিক্রয় ও সেবা দক্ষতা বিষয়ে তিনি প্রশিক্ষণ নিয়েছেন।\n\nতিনি রোটারি ক্লাব অব ঢাকা প্যাসিফিকের সদস্য।",
    },
  },
  {
    key: "md-refat-hossen",
    nameBn: "মো. রেফাত হোসেন",
    affiliation: { en: "Managing Director & CEO (Current Charge), Islami Bank Securities Ltd.", bn: "ব্যবস্থাপনা পরিচালক ও সিইও (চলতি দায়িত্ব), ইসলামী ব্যাংক সিকিউরিটিজ লিমিটেড" },
  },
  {
    key: "m-shahryar-faiz",
    nameBn: "এম শাহরিয়ার ফয়েজ",
    affiliation: { en: "Chief Operating Officer / Acting Managing Director, EBL Securities PLC", bn: "প্রধান পরিচালন কর্মকর্তা / ভারপ্রাপ্ত ব্যবস্থাপনা পরিচালক, ইবিএল সিকিউরিটিজ পিএলসি" },
  },
  {
    key: "bishnu-pada-kunda",
    nameBn: "বিষ্ণু পদ কুন্ড",
    affiliation: { en: "Chief Executive Officer (Current Charge), Shahjalal Islami Bank Securities Ltd.", bn: "প্রধান নির্বাহী কর্মকর্তা (চলতি দায়িত্ব), শাহজালাল ইসলামী ব্যাংক সিকিউরিটিজ লিমিটেড" },
  },
  // Management
  {
    key: "md-shahinur-rahman",
    nameBn: "মো. শাহিনুর রহমান",
    bio: {
      en: "Md. Shahinur Rahman joined Xpert Fintech Ltd. as Managing Director on 3 February 2026, bringing more than 27 years of experience in ICT leadership, cybersecurity governance, digital transformation and strategic business administration.\n\nBefore this role, he was General Manager and Chief Information Technology Officer at Agrani Bank PLC, where he led large-scale technology modernization, including core banking upgrades, mobile banking innovation, ISO certifications, a Security Operations Center (SOC) and the nationwide expansion of IT infrastructure across branches and agent banking networks. Earlier, at Bank Asia Limited and Dhaka Bank Limited, he held senior roles in ICT security, IT governance, audit, risk management and regulatory compliance, working closely with Bangladesh Bank on CBS standardization, PCI-DSS, SWIFT security and enterprise risk frameworks.\n\nHe began his career at LEADS Corporation Limited, one of the country's largest software companies, and then worked with KPMG Bangladesh, gaining extensive experience in IT audit, ERP development and system assurance across the banking and telecom sectors.\n\nA globally certified professional (CISSP, CISA, CDPSE, ISO 27001 Lead Auditor, OCP-DBA), Mr. Rahman holds an MBA from the University of Dhaka and MSc and BSc degrees from the University of Rajshahi. He is an active board member of the (ISC)² Dhaka Chapter.",
      bn: "মো. শাহিনুর রহমান ২০২৬ সালের ৩ ফেব্রুয়ারি ব্যবস্থাপনা পরিচালক হিসেবে এক্সপার্ট ফিনটেক লিমিটেডে যোগ দেন। আইসিটি নেতৃত্ব, সাইবার নিরাপত্তা গভর্ন্যান্স, ডিজিটাল রূপান্তর ও কৌশলগত ব্যবসা প্রশাসনে তাঁর ২৭ বছরেরও বেশি অভিজ্ঞতা রয়েছে।\n\nএর আগে তিনি অগ্রণী ব্যাংক পিএলসি-র মহাব্যবস্থাপক ও প্রধান তথ্যপ্রযুক্তি কর্মকর্তা ছিলেন। সেখানে কোর ব্যাংকিং আধুনিকায়ন, মোবাইল ব্যাংকিং উদ্ভাবন, আইএসও সনদ, সিকিউরিটি অপারেশনস সেন্টার (এসওসি) স্থাপন এবং শাখা ও এজেন্ট ব্যাংকিং নেটওয়ার্কজুড়ে দেশব্যাপী আইটি অবকাঠামো সম্প্রসারণসহ বড় পরিসরের প্রযুক্তি আধুনিকায়নে তিনি নেতৃত্ব দেন। তারও আগে ব্যাংক এশিয়া লিমিটেড ও ঢাকা ব্যাংক লিমিটেডে আইসিটি নিরাপত্তা, আইটি গভর্ন্যান্স, নিরীক্ষা, ঝুঁকি ব্যবস্থাপনা ও নিয়ন্ত্রক পরিপালনে জ্যেষ্ঠ পদে দায়িত্ব পালন করেন এবং সিবিএস মানকরণ, পিসিআই-ডিএসএস, সুইফট নিরাপত্তা ও এন্টারপ্রাইজ ঝুঁকি কাঠামো নিয়ে বাংলাদেশ ব্যাংকের সঙ্গে ঘনিষ্ঠভাবে কাজ করেন।\n\nদেশের অন্যতম বৃহৎ সফটওয়্যার প্রতিষ্ঠান লিডস কর্পোরেশন লিমিটেডে তাঁর কর্মজীবন শুরু। এরপর কেপিএমজি বাংলাদেশে ব্যাংকিং ও টেলিকম খাতে আইটি নিরীক্ষা, ইআরপি উন্নয়ন ও সিস্টেম অ্যাসুরেন্সে তিনি ব্যাপক অভিজ্ঞতা অর্জন করেন।\n\nবৈশ্বিক সনদপ্রাপ্ত এই পেশাজীবী (CISSP, CISA, CDPSE, ISO 27001 Lead Auditor, OCP-DBA) ঢাকা বিশ্ববিদ্যালয় থেকে এমবিএ এবং রাজশাহী বিশ্ববিদ্যালয় থেকে বিএসসি ও এমএসসি ডিগ্রি অর্জন করেছেন। তিনি (ISC)² ঢাকা চ্যাপ্টারের সক্রিয় বোর্ড সদস্য।",
    },
  },
  {
    key: "md-abdur-rahman-rony",
    nameBn: "মো. আবদুর রহমান রনি, এফসিএস",
    bio: {
      en: "Md. Abdur Rahman Rony FCS, a qualified Chartered Secretary and Income Tax Practitioner, is the CFO and Company Secretary of Xpert Fintech Ltd., which he joined in February 2022.\n\nFormerly with Zahur & Mostafiz Chartered Accountants, he has wide experience in manufacturing, trading and service industries, and expertise in budgetary control, corporate finance, auditing, taxation and legal matters.\n\nHe holds a BBA (2011) and an MBA (2012) in Accounting & Information Systems from Jagannath University and an LLB from Bangladesh Law College (2020), and became a Fellow Chartered Secretary (FCS) of the Institute of Chartered Secretaries of Bangladesh (ICSB) in 2024. He has attended many training programs and workshops and is involved with several socio-cultural organizations.",
      bn: "মো. আবদুর রহমান রনি এফসিএস একজন যোগ্যতাসম্পন্ন চার্টার্ড সেক্রেটারি ও আয়কর আইনজীবী। তিনি এক্সপার্ট ফিনটেক লিমিটেডের প্রধান আর্থিক কর্মকর্তা ও কোম্পানি সচিব; ২০২২ সালের ফেব্রুয়ারিতে প্রতিষ্ঠানটিতে যোগ দেন।\n\nএর আগে তিনি জহুর অ্যান্ড মোস্তাফিজ চার্টার্ড অ্যাকাউন্ট্যান্টস-এ কাজ করেছেন। উৎপাদন, বাণিজ্য ও সেবা খাতে তাঁর ব্যাপক অভিজ্ঞতা এবং বাজেট নিয়ন্ত্রণ, কর্পোরেট ফাইন্যান্স, নিরীক্ষা, কর ও আইনি বিষয়ে দক্ষতা রয়েছে।\n\nতিনি জগন্নাথ বিশ্ববিদ্যালয় থেকে হিসাববিজ্ঞান ও তথ্য ব্যবস্থায় বিবিএ (২০১১) ও এমবিএ (২০১২) এবং বাংলাদেশ ল কলেজ থেকে এলএলবি (২০২০) সম্পন্ন করেছেন। ২০২৪ সালে তিনি ইনস্টিটিউট অব চার্টার্ড সেক্রেটারিজ অব বাংলাদেশ (আইসিএসবি)-এর ফেলো চার্টার্ড সেক্রেটারি (এফসিএস) হন। তিনি বহু প্রশিক্ষণ ও কর্মশালায় অংশ নিয়েছেন এবং বিভিন্ন সামাজিক-সাংস্কৃতিক সংগঠনের সঙ্গে যুক্ত।",
    },
  },
  {
    key: "md-abul-moshad-chowdhury",
    nameBn: "মো. আবুল মোশাদ চৌধুরী",
    bio: {
      en: "Md. Abul Moshad Chowdhury joined Xpert Fintech Ltd. in September 2024 as Head of Application Support & Development, bringing more than 15 years of experience as an IT professional. With a proven track record in database administration, software development and team leadership, he has led the development of innovative software solutions and tools throughout his career.\n\nBefore joining Xpert Fintech, he held key positions at Sheltech Brokerage Ltd. (SBL), Apex Investments Ltd. (AIL), BRAC EPL Stock Brokerage Ltd. (BEPL) and LEADS Corporation Ltd. His expertise spans IT infrastructure management, the software development lifecycle and leadership in technology-driven environments.\n\nHe holds a BSc in Computer Science & Engineering from Khulna University of Engineering & Technology (KUET) and an Executive MBA in Finance from Bangladesh University of Professionals (BUP). His certifications and training include Oracle Certified Professional (DBA), Microsoft Certified Technology Specialist (MCTS) – Part 1, Android mobile app development, and Cyber Security and Management in the Capital Market of Bangladesh.",
      bn: "মো. আবুল মোশাদ চৌধুরী ২০২৪ সালের সেপ্টেম্বরে হেড অব অ্যাপ্লিকেশন সাপোর্ট অ্যান্ড ডেভেলপমেন্ট হিসেবে এক্সপার্ট ফিনটেক লিমিটেডে যোগ দেন। আইটি পেশাজীবী হিসেবে তাঁর ১৫ বছরেরও বেশি অভিজ্ঞতা রয়েছে। ডেটাবেস প্রশাসন, সফটওয়্যার উন্নয়ন ও টিম নেতৃত্বে প্রমাণিত সাফল্যের সঙ্গে তিনি কর্মজীবনজুড়ে উদ্ভাবনী সফটওয়্যার সমাধান ও টুল তৈরিতে নেতৃত্ব দিয়েছেন।\n\nএক্সপার্ট ফিনটেকে যোগদানের আগে তিনি শেলটেক ব্রোকারেজ লিমিটেড (এসবিএল), অ্যাপেক্স ইনভেস্টমেন্টস লিমিটেড (এআইএল), ব্র্যাক ইপিএল স্টক ব্রোকারেজ লিমিটেড (বিইপিএল) ও লিডস কর্পোরেশন লিমিটেডে গুরুত্বপূর্ণ পদে কাজ করেছেন। আইটি অবকাঠামো ব্যবস্থাপনা, সফটওয়্যার উন্নয়ন জীবনচক্র এবং প্রযুক্তিনির্ভর পরিবেশে নেতৃত্বে তাঁর দক্ষতা রয়েছে।\n\nতিনি খুলনা প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয় (কুয়েট) থেকে কম্পিউটার সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিংয়ে বিএসসি এবং বাংলাদেশ ইউনিভার্সিটি অব প্রফেশনালস (বিইউপি) থেকে ফাইন্যান্সে এক্সিকিউটিভ এমবিএ অর্জন করেছেন। তাঁর সনদ ও প্রশিক্ষণের মধ্যে রয়েছে Oracle Certified Professional (DBA), Microsoft Certified Technology Specialist (MCTS) – পার্ট ১, অ্যান্ড্রয়েড মোবাইল অ্যাপ উন্নয়ন এবং বাংলাদেশের পুঁজিবাজারে সাইবার নিরাপত্তা ও ব্যবস্থাপনা।",
    },
  },
  {
    key: "muhammad-shamsul-maruf",
    nameBn: "মোহাম্মদ শামসুল মারুফ",
    bio: {
      en: "Mohammad Shamsul Maruf is a results-driven software developer with strong expertise in Java, C#, Spring Boot, .NET Core, Python, Angular, React, Node.js and TypeScript. He builds scalable systems using MongoDB, Elasticsearch, Redis, Kafka and both relational and NoSQL databases.",
      bn: "মোহাম্মদ শামসুল মারুফ ফলাফলমুখী একজন সফটওয়্যার ডেভেলপার; Java, C#, Spring Boot, .NET Core, Python, Angular, React, Node.js ও TypeScript-এ তাঁর গভীর দক্ষতা রয়েছে। MongoDB, Elasticsearch, Redis, Kafka এবং রিলেশনাল ও NoSQL ডেটাবেস ব্যবহার করে তিনি স্কেলযোগ্য সিস্টেম তৈরি করেন।",
    },
  },
];
