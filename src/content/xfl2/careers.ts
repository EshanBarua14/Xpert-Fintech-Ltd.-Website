/**
 * Open roles supplied by XFL HR (October 2026), in English and Bangla.
 * Added once as PUBLISHED jobs by `npm run db:seed:content`; after that they
 * are edited, closed or removed in Admin → Careers.
 *
 * Lists: one item per line; a line starting with "## " is a small heading.
 */

type L = { en: string; bn: string };
export type CareerSeed = {
  slug: string;
  department: string;
  location: string;
  experience: string | null;
  bdjobsUrl: string | null;
  linkedinUrl: string | null;
  applyEmail: string;
  title: L;
  summary: L;
  about: L;
  responsibilities: L;
  requirements: L;
  benefits: L | null;
};

const COMPANY: L = {
  en: "We, Xpert Fintech Ltd., are a high-growth fintech and SaaS company backed by a consortium of 12 prominent financial organisations in Bangladesh, including UCB, Bank Asia, EBL, Islami Bank and Green Delta.",
  bn: "এক্সপার্ট ফিনটেক লিমিটেড একটি দ্রুত বর্ধনশীল ফিনটেক ও SaaS প্রতিষ্ঠান। ইউসিবি, ব্যাংক এশিয়া, ইবিএল, ইসলামী ব্যাংক ও গ্রিন ডেল্টাসহ বাংলাদেশের ১২টি শীর্ষস্থানীয় আর্থিক প্রতিষ্ঠানের একটি কনসোর্টিয়াম আমাদের পেছনে রয়েছে।",
};

const INFRA_SUMMARY: L = {
  en: "This position plays a vital role in keeping business operations reliable, including DC–DR visits and managing high-end network and server components across our IT infrastructure. It also covers vendor communication, fault detection and keeping network operations at 99.9% uptime.",
  bn: "ব্যবসায়িক কার্যক্রম নির্ভরযোগ্য রাখতে এই পদটি গুরুত্বপূর্ণ ভূমিকা রাখে, যার মধ্যে রয়েছে ডিসি–ডিআর পরিদর্শন এবং আমাদের আইটি অবকাঠামোর উচ্চক্ষমতার নেটওয়ার্ক ও সার্ভার পরিচালনা। ভেন্ডরের সঙ্গে যোগাযোগ, ত্রুটি শনাক্ত করা এবং নেটওয়ার্ক কার্যক্রম ৯৯.৯% সময় সচল রাখাও এই দায়িত্বের অংশ।",
};

const INFRA_PURPOSE: L = {
  en: "The role manages, maintains and supports Xpert Fintech's IT infrastructure, network systems, security operations and cloud services, so that business runs without interruption.",
  bn: "এই পদে এক্সপার্ট ফিনটেকের আইটি অবকাঠামো, নেটওয়ার্ক সিস্টেম, নিরাপত্তা কার্যক্রম ও ক্লাউড সেবা পরিচালনা, রক্ষণাবেক্ষণ ও সহায়তা করতে হবে, যাতে ব্যবসা নিরবচ্ছিন্নভাবে চলে।",
};

export const CAREER_SEED: CareerSeed[] = [
  {
    slug: "technical-project-manager",
    department: "Project Management",
    location: "Dhaka",
    experience: "3–7 years",
    bdjobsUrl: null,
    linkedinUrl: null,
    applyEmail: "career@xpertfintech.com",
    title: { en: "Technical Project Manager", bn: "টেকনিক্যাল প্রজেক্ট ম্যানেজার" },
    summary: {
      en: "Own client relationships, drive delivery with engineering teams, and keep leadership informed with clear plans and progress. You will be the bridge between clients, engineers and management, making sure commitments are realistic, tracked and delivered.",
      bn: "ক্লায়েন্টের সঙ্গে সম্পর্কের দায়িত্ব নিন, ইঞ্জিনিয়ারিং টিমের সঙ্গে প্রজেক্ট ডেলিভারি এগিয়ে নিন এবং স্পষ্ট পরিকল্পনা ও অগ্রগতি দিয়ে ব্যবস্থাপনাকে অবহিত রাখুন। আপনি হবেন ক্লায়েন্ট, ইঞ্জিনিয়ার ও ব্যবস্থাপনার মধ্যে সেতু, যাতে প্রতিটি প্রতিশ্রুতি বাস্তবসম্মত হয়, অনুসরণ করা হয় এবং সময়মতো পূরণ হয়।",
    },
    about: {
      en: `${COMPANY.en}

Career growth: while leading delivery from the front, you will receive direct mentorship and strategic guidance from our internal engineering leader, a seasoned engineer who has built and scaled systems at Microsoft and Atlassian. It is a rare chance to learn global, big-tech engineering methods while running a major technology ecosystem.

We are developing our next-generation stock trading platform and are looking for a skilled, driven Technical Project Manager to join the team. Vacancy: 1.

The role needs strong stakeholder follow-up, hands-on use of modern delivery tools (Jira, Confluence), and enough programming awareness to discuss technical trade-offs and challenge estimates with engineers.`,
      bn: `${COMPANY.bn}

ক্যারিয়ারে এগিয়ে যাওয়ার সুযোগ: সামনে থেকে প্রজেক্ট ডেলিভারির নেতৃত্ব দেওয়ার পাশাপাশি আপনি আমাদের ইঞ্জিনিয়ারিং প্রধানের কাছ থেকে সরাসরি মেন্টরশিপ ও কৌশলগত দিকনির্দেশনা পাবেন। তিনি মাইক্রোসফট ও অ্যাটলাসিয়ানে সিস্টেম তৈরি ও বড় পরিসরে চালানোর অভিজ্ঞতাসম্পন্ন একজন অভিজ্ঞ প্রকৌশলী। একটি বড় প্রযুক্তি ইকোসিস্টেম পরিচালনার সঙ্গে সঙ্গে বিশ্বমানের বড় প্রযুক্তি প্রতিষ্ঠানের কাজের পদ্ধতি শেখার এটি এক বিরল সুযোগ।

আমরা আমাদের পরবর্তী প্রজন্মের স্টক ট্রেডিং প্ল্যাটফর্ম তৈরি করছি এবং দলে যোগ দেওয়ার জন্য একজন দক্ষ ও উদ্যমী টেকনিক্যাল প্রজেক্ট ম্যানেজার খুঁজছি। পদের সংখ্যা: ১।

এই পদে স্টেকহোল্ডারদের সঙ্গে নিয়মিত যোগাযোগ, আধুনিক ডেলিভারি টুল (জিরা, কনফ্লুয়েন্স) ব্যবহারের হাতে-কলমে অভিজ্ঞতা এবং ইঞ্জিনিয়ারদের সঙ্গে প্রযুক্তিগত বিকল্প নিয়ে আলোচনা ও কাজের সময়-অনুমান যাচাই করার মতো প্রোগ্রামিং জ্ঞান প্রয়োজন।`,
    },
    responsibilities: {
      en: `## Client ownership and follow-up
Primary client contact: act as the main point of contact for assigned clients; gather requirements, manage expectations, and run regular status updates, demos and reviews.
Proactive follow-up: keep clients informed throughout the project; escalate risks and change requests early, with clear options.
## Project planning and delivery with engineering
Delivery planning: build and maintain project plans (timeline, milestones, dependencies) and break work into epics, stories and sprints with the engineering team.
Execution and unblocking: run stand-ups, sprint planning and retrospectives; remove blockers and keep priorities clear.
## Management reporting and governance
Leadership visibility: give management concise weekly plans and status covering progress, risks, resource needs and decisions.
Scope and quality control: track scope, schedule, and UAT and release readiness so projects ship with controlled outcomes.`,
      bn: `## ক্লায়েন্টের দায়িত্ব ও ফলো-আপ
প্রধান যোগাযোগকারী: নির্ধারিত ক্লায়েন্টদের প্রধান যোগাযোগের ব্যক্তি হিসেবে কাজ করা; চাহিদা সংগ্রহ, প্রত্যাশা ব্যবস্থাপনা এবং নিয়মিত অগ্রগতি জানানো, ডেমো ও রিভিউ পরিচালনা।
সক্রিয় ফলো-আপ: পুরো প্রজেক্ট জুড়ে ক্লায়েন্টদের অবহিত রাখা; ঝুঁকি ও পরিবর্তনের অনুরোধ আগেভাগে স্পষ্ট বিকল্পসহ ঊর্ধ্বতনদের জানানো।
## ইঞ্জিনিয়ারিং টিমের সঙ্গে পরিকল্পনা ও ডেলিভারি
ডেলিভারি পরিকল্পনা: প্রজেক্ট পরিকল্পনা (সময়সূচি, মাইলফলক, নির্ভরতা) তৈরি ও হালনাগাদ রাখা এবং ইঞ্জিনিয়ারিং টিমের সঙ্গে কাজকে এপিক, স্টোরি ও স্প্রিন্টে ভাগ করা।
বাস্তবায়ন ও বাধা দূর করা: স্ট্যান্ড-আপ, স্প্রিন্ট পরিকল্পনা ও রেট্রোস্পেক্টিভ পরিচালনা; বাধা দূর করা এবং অগ্রাধিকার স্পষ্ট রাখা।
## ব্যবস্থাপনাকে প্রতিবেদন ও তদারকি
ব্যবস্থাপনাকে অবহিত রাখা: অগ্রগতি, ঝুঁকি, জনবল ও সম্পদের প্রয়োজন এবং সিদ্ধান্তসহ সংক্ষিপ্ত সাপ্তাহিক পরিকল্পনা ও অবস্থা জানানো।
পরিধি ও মান নিয়ন্ত্রণ: কাজের পরিধি, সময়সূচি এবং ইউএটি ও রিলিজের প্রস্তুতি অনুসরণ করা, যাতে প্রজেক্ট নিয়ন্ত্রিত ফলাফলে সম্পন্ন হয়।`,
    },
    requirements: {
      en: `## Education
Bachelor's degree in Computer Science, Software Engineering, IT, Business Administration or a related field (BSc in Computer Science or IT).
A master's degree or PMP / Scrum Master certification is a plus.
## Experience
3 to 7 years in project management or technical project management for software delivery, with proven client-facing ownership.
Experience at a software company or an IT-enabled service business.
## Skills
Delivery tools: hands-on with Jira (boards, backlogs, sprints, reporting) and Confluence (specs, meeting notes, project documentation); strong Agile/Scrum familiarity.
Technical awareness: working knowledge of software development and at least one language or stack (for example JavaScript/TypeScript, C#/.NET, Java, Python), enough to read basic code, discuss trade-offs and review estimates.
Stakeholder management: strong written and spoken communication; able to manage clients, engineers and leadership with clear follow-up habits.
Other relevant skills: JavaScript (ES6), React, Node.js, MongoDB, Mongoose, Git and GitHub, Python, .NET Core, project management, Jira.`,
      bn: `## শিক্ষাগত যোগ্যতা
কম্পিউটার সায়েন্স, সফটওয়্যার ইঞ্জিনিয়ারিং, আইটি, বিজনেস অ্যাডমিনিস্ট্রেশন বা সংশ্লিষ্ট বিষয়ে স্নাতক ডিগ্রি (কম্পিউটার সায়েন্স বা আইটিতে বিএসসি)।
স্নাতকোত্তর ডিগ্রি অথবা পিএমপি / স্ক্রাম মাস্টার সনদ থাকলে অগ্রাধিকার।
## অভিজ্ঞতা
সফটওয়্যার ডেলিভারিতে প্রজেক্ট ম্যানেজমেন্ট বা টেকনিক্যাল প্রজেক্ট ম্যানেজমেন্টে ৩ থেকে ৭ বছরের অভিজ্ঞতা, এবং সরাসরি ক্লায়েন্ট সামলানোর প্রমাণিত দক্ষতা।
সফটওয়্যার কোম্পানি বা আইটি-নির্ভর সেবা প্রতিষ্ঠানে কাজের অভিজ্ঞতা।
## দক্ষতা
ডেলিভারি টুল: জিরা (বোর্ড, ব্যাকলগ, স্প্রিন্ট, রিপোর্টিং) ও কনফ্লুয়েন্স (স্পেসিফিকেশন, মিটিং নোট, প্রজেক্ট ডকুমেন্টেশন) ব্যবহারে হাতে-কলমে অভিজ্ঞতা; অ্যাজাইল/স্ক্রাম সম্পর্কে ভালো ধারণা।
প্রযুক্তিগত জ্ঞান: সফটওয়্যার ডেভেলপমেন্টের মৌলিক ধারণা এবং অন্তত একটি প্রোগ্রামিং ভাষা বা স্ট্যাক (যেমন জাভাস্ক্রিপ্ট/টাইপস্ক্রিপ্ট, সি#/.নেট, জাভা, পাইথন) সম্পর্কে এতটা জানা, যাতে সাধারণ কোড পড়া, বিকল্প নিয়ে আলোচনা ও সময়-অনুমান যাচাই করা যায়।
স্টেকহোল্ডার ব্যবস্থাপনা: লিখিত ও মৌখিক যোগাযোগে দক্ষতা; নিয়মিত ফলো-আপের মাধ্যমে ক্লায়েন্ট, ইঞ্জিনিয়ার ও ব্যবস্থাপনাকে সামলানোর সক্ষমতা।
অন্যান্য প্রাসঙ্গিক দক্ষতা: JavaScript (ES6), React, Node.js, MongoDB, Mongoose, Git ও GitHub, Python, .NET Core, প্রজেক্ট ম্যানেজমেন্ট, Jira।`,
    },
    benefits: null,
  },
  {
    slug: "it-infrastructure-cloud-administrator",
    department: "IT Infrastructure",
    location: "Dhaka",
    experience: "At least 8 years",
    bdjobsUrl: null,
    linkedinUrl: null,
    applyEmail: "career@xpertfintech.com",
    title: { en: "IT Infrastructure & Cloud Administrator", bn: "আইটি ইনফ্রাস্ট্রাকচার ও ক্লাউড অ্যাডমিনিস্ট্রেটর" },
    summary: INFRA_SUMMARY,
    about: { en: `${COMPANY.en}\n\n${INFRA_PURPOSE.en}`, bn: `${COMPANY.bn}\n\n${INFRA_PURPOSE.bn}` },
    responsibilities: {
      en: `Lead the strategy, architecture, management and continuous improvement of enterprise IT infrastructure, cloud, network, systems and security operations, so technology services are secure, scalable, resilient and highly available.
Define and carry out IT infrastructure and cloud transformation roadmaps, including data centre modernisation, cloud adoption, virtualisation, compute, storage, networking and hybrid-cloud environments.
Manage enterprise AWS and cloud services: migration, architecture, governance, performance, availability, security and operational maturity.
Ensure the availability, reliability, performance and capacity of business-critical infrastructure through proactive monitoring, observability, SLA/KPI management and capacity planning.
Lead cybersecurity and infrastructure security operations, including privileged access, firewall and network security, endpoint protection, vulnerability management, security monitoring, hardening, patch management and security compliance.
Strengthen cyber resilience through disaster recovery (DR), business continuity planning (BCP), enterprise backup and recovery, redundancy, failover and regular recovery testing.
Lead major incident, problem and change management; carry out root cause analysis (RCA) and put corrective and preventive actions in place to reduce downtime and repeat issues.
Set up centralised monitoring, logging, SIEM, observability and proactive alerting to improve visibility, security-event detection, incident response and reliability.
Make sure infrastructure and cloud environments meet IT governance, cybersecurity, risk management, audit, regulatory and information-security requirements.
Lead cloud and infrastructure cost optimisation (FinOps), including budgeting, forecasting, resource use, licensing, capacity and technology investment planning.
Manage technology vendors, ISPs, cloud providers, managed services, procurement, contracts, SLAs and KPIs for quality, security, performance and value.
Lead, mentor and develop the infrastructure, cloud, network, systems and IT operations teams, with clear accountability, technical standards, procedures and a culture of ownership and continuous improvement.
Work with senior management and the cybersecurity, application, engineering, business and external technology teams to turn business needs into practical, secure and scalable solutions.
Give management clear visibility of infrastructure performance, cybersecurity risks, operational KPIs, technology investments, capacity needs, service availability and improvement plans.`,
      bn: `এন্টারপ্রাইজ আইটি অবকাঠামো, ক্লাউড, নেটওয়ার্ক, সিস্টেম ও নিরাপত্তা কার্যক্রমের কৌশল, কাঠামো, ব্যবস্থাপনা ও ধারাবাহিক উন্নয়নে নেতৃত্ব দেওয়া, যাতে প্রযুক্তি সেবা নিরাপদ, সম্প্রসারণযোগ্য, টেকসই ও সর্বদা সচল থাকে।
আইটি অবকাঠামো ও ক্লাউড রূপান্তরের রোডম্যাপ তৈরি ও বাস্তবায়ন, যার মধ্যে রয়েছে ডেটা সেন্টার আধুনিকায়ন, ক্লাউডে স্থানান্তর, ভার্চুয়ালাইজেশন, কম্পিউট, স্টোরেজ, নেটওয়ার্কিং ও হাইব্রিড-ক্লাউড পরিবেশ।
এন্টারপ্রাইজ AWS ও ক্লাউড সেবা পরিচালনা: মাইগ্রেশন, কাঠামো, তদারকি, পারফরম্যান্স, প্রাপ্যতা, নিরাপত্তা ও কার্যক্রমের পরিপক্বতা।
সক্রিয় মনিটরিং, অবজারভেবিলিটি, SLA/KPI ব্যবস্থাপনা ও সক্ষমতা পরিকল্পনার মাধ্যমে ব্যবসার জন্য গুরুত্বপূর্ণ অবকাঠামোর প্রাপ্যতা, নির্ভরযোগ্যতা, পারফরম্যান্স ও সক্ষমতা নিশ্চিত করা।
সাইবার নিরাপত্তা ও অবকাঠামো নিরাপত্তা কার্যক্রমে নেতৃত্ব দেওয়া, যার মধ্যে রয়েছে বিশেষ অ্যাক্সেস নিয়ন্ত্রণ, ফায়ারওয়াল ও নেটওয়ার্ক নিরাপত্তা, এন্ডপয়েন্ট সুরক্ষা, দুর্বলতা ব্যবস্থাপনা, নিরাপত্তা মনিটরিং, হার্ডেনিং, প্যাচ ব্যবস্থাপনা ও নিরাপত্তা কমপ্লায়েন্স।
ডিজাস্টার রিকভারি (DR), ব্যবসার ধারাবাহিকতা পরিকল্পনা (BCP), এন্টারপ্রাইজ ব্যাকআপ ও পুনরুদ্ধার, রিডানডেন্সি, ফেইলওভার এবং নিয়মিত পুনরুদ্ধার পরীক্ষার মাধ্যমে সাইবার সহনশীলতা জোরদার করা।
বড় ধরনের ঘটনা, সমস্যা ও পরিবর্তন ব্যবস্থাপনায় নেতৃত্ব দেওয়া; মূল কারণ বিশ্লেষণ (RCA) করে সংশোধনমূলক ও প্রতিরোধমূলক ব্যবস্থা নেওয়া, যাতে ডাউনটাইম ও বারবার একই সমস্যা কমে।
কেন্দ্রীয় মনিটরিং, লগিং, SIEM, অবজারভেবিলিটি ও আগাম সতর্কতা ব্যবস্থা চালু করা, যাতে অবকাঠামোর দৃশ্যমানতা, নিরাপত্তাজনিত ঘটনা শনাক্তকরণ, ঘটনার প্রতিক্রিয়া ও নির্ভরযোগ্যতা বাড়ে।
অবকাঠামো ও ক্লাউড পরিবেশ আইটি গভর্ন্যান্স, সাইবার নিরাপত্তা, ঝুঁকি ব্যবস্থাপনা, অডিট, নিয়ন্ত্রক ও তথ্য-নিরাপত্তার শর্ত পূরণ করছে কি না তা নিশ্চিত করা।
ক্লাউড ও অবকাঠামোর ব্যয় সাশ্রয়ে (FinOps) নেতৃত্ব দেওয়া, যার মধ্যে রয়েছে বাজেট, পূর্বাভাস, সম্পদের ব্যবহার, লাইসেন্সিং, সক্ষমতা ও প্রযুক্তি বিনিয়োগ পরিকল্পনা।
প্রযুক্তি ভেন্ডর, আইএসপি, ক্লাউড সেবাদাতা, ম্যানেজড সার্ভিস, ক্রয়, চুক্তি, SLA ও KPI পরিচালনা, যাতে মান, নিরাপত্তা, পারফরম্যান্স ও মূল্য নিশ্চিত হয়।
অবকাঠামো, ক্লাউড, নেটওয়ার্ক, সিস্টেম ও আইটি অপারেশনস টিমকে নেতৃত্ব, পরামর্শ ও দক্ষতা উন্নয়নে সহায়তা দেওয়া; স্পষ্ট জবাবদিহি, প্রযুক্তিগত মানদণ্ড, কার্যপ্রণালী এবং দায়িত্ববোধ ও ধারাবাহিক উন্নয়নের সংস্কৃতি গড়ে তোলা।
ঊর্ধ্বতন ব্যবস্থাপনা এবং সাইবার নিরাপত্তা, অ্যাপ্লিকেশন, ইঞ্জিনিয়ারিং, ব্যবসায়িক ও বাইরের প্রযুক্তি দলের সঙ্গে কাজ করে ব্যবসার চাহিদাকে বাস্তবসম্মত, নিরাপদ ও সম্প্রসারণযোগ্য সমাধানে রূপ দেওয়া।
অবকাঠামোর পারফরম্যান্স, সাইবার ঝুঁকি, কার্যক্রমের KPI, প্রযুক্তি বিনিয়োগ, সক্ষমতার প্রয়োজন, সেবার প্রাপ্যতা ও উন্নয়ন পরিকল্পনা সম্পর্কে ব্যবস্থাপনাকে স্পষ্ট ধারণা দেওয়া।`,
    },
    requirements: {
      en: `## Education
BSc in Computer Science & Engineering, Computer Science or Information Technology.
## Certifications
Fortinet NSE
Certified Ethical Hacker (CEH)
Red Hat Certified Engineer (RHCE)
VMware Certified Professional (VCP)
AWS Certified Solutions Architect – Professional
Cisco CCNA and CCNP
ISO/IEC 27001 Lead Implementer or Lead Auditor
## Experience
At least 8 years of practical experience in IT infrastructure and network management, at an IT-enabled service business or a software company.
Very good knowledge of DC and DR synchronisation and operations.
Strong understanding of network architecture, multicast traffic and stock market network architecture.
Willing to support beyond regular office hours when needed.
Able to work under pressure and manage several projects at once.
## Technical skills
IT infrastructure and data centre operations
Enterprise network administration and engineering
Cisco, firewall, VPN and network security
Windows and Linux server and Microsoft 365 administration
Azure, AWS and hybrid cloud infrastructure
Cybersecurity, SIEM, EDR/XDR and vulnerability management
High availability, disaster recovery (DR) and business continuity (BCP)
Infrastructure monitoring, automation and configuration management
Advanced troubleshooting, incident management and root cause analysis
## Soft skills
Strong communication
Teamwork and collaboration
Problem solving
Customer service orientation
Time management and multitasking
Documentation and reporting`,
      bn: `## শিক্ষাগত যোগ্যতা
কম্পিউটার সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিং, কম্পিউটার সায়েন্স বা ইনফরমেশন টেকনোলজিতে বিএসসি।
## সনদ
Fortinet NSE
Certified Ethical Hacker (CEH)
Red Hat Certified Engineer (RHCE)
VMware Certified Professional (VCP)
AWS Certified Solutions Architect – Professional
Cisco CCNA ও CCNP
ISO/IEC 27001 Lead Implementer অথবা Lead Auditor
## অভিজ্ঞতা
আইটি-নির্ভর সেবা প্রতিষ্ঠান বা সফটওয়্যার কোম্পানিতে আইটি অবকাঠামো ও নেটওয়ার্ক ব্যবস্থাপনায় কমপক্ষে ৮ বছরের বাস্তব অভিজ্ঞতা।
ডিসি ও ডিআর সিনক্রোনাইজেশন ও পরিচালনা সম্পর্কে খুব ভালো জ্ঞান।
নেটওয়ার্ক আর্কিটেকচার, মাল্টিকাস্ট ট্রাফিক এবং শেয়ারবাজারের নেটওয়ার্ক কাঠামো সম্পর্কে গভীর ধারণা।
প্রয়োজনে অফিস সময়ের বাইরেও সহায়তা দেওয়ার মানসিকতা।
চাপের মধ্যে কাজ করা এবং একসঙ্গে একাধিক প্রজেক্ট সামলানোর সক্ষমতা।
## প্রযুক্তিগত দক্ষতা
আইটি অবকাঠামো ও ডেটা সেন্টার পরিচালনা
এন্টারপ্রাইজ নেটওয়ার্ক অ্যাডমিনিস্ট্রেশন ও ইঞ্জিনিয়ারিং
Cisco, ফায়ারওয়াল, ভিপিএন ও নেটওয়ার্ক নিরাপত্তা
উইন্ডোজ ও লিনাক্স সার্ভার এবং Microsoft 365 অ্যাডমিনিস্ট্রেশন
Azure, AWS ও হাইব্রিড ক্লাউড অবকাঠামো
সাইবার নিরাপত্তা, SIEM, EDR/XDR ও দুর্বলতা ব্যবস্থাপনা
হাই অ্যাভেইলেবিলিটি, ডিজাস্টার রিকভারি (DR) ও ব্যবসার ধারাবাহিকতা (BCP)
অবকাঠামো মনিটরিং, অটোমেশন ও কনফিগারেশন ব্যবস্থাপনা
জটিল সমস্যা সমাধান, ঘটনা ব্যবস্থাপনা ও মূল কারণ বিশ্লেষণ
## ব্যক্তিগত দক্ষতা
যোগাযোগে দক্ষতা
দলগত কাজ ও সহযোগিতা
সমস্যা সমাধানের সক্ষমতা
গ্রাহকসেবার মানসিকতা
সময় ব্যবস্থাপনা ও একসঙ্গে একাধিক কাজ সামলানো
ডকুমেন্টেশন ও প্রতিবেদন তৈরি`,
    },
    benefits: {
      en: `Two festival bonuses a year
Provident fund and gratuity fund
Yearly salary review
Two days off each week
Other benefits as per company policy`,
      bn: `বছরে দুটি উৎসব ভাতা
প্রভিডেন্ট ফান্ড ও গ্র্যাচুইটি ফান্ড
প্রতি বছর বেতন পর্যালোচনা
সপ্তাহে দুই দিন ছুটি
কোম্পানির নীতিমালা অনুযায়ী অন্যান্য সুবিধা`,
    },
  },
  {
    slug: "network-infrastructure-engineer",
    department: "IT Infrastructure",
    location: "Dhaka",
    experience: null,
    bdjobsUrl: "https://jobs.bdjobs.com/jobdetails/?id=1538216&fcatId=8&ln=1",
    linkedinUrl: null,
    applyEmail: "career@xpertfintech.com",
    title: { en: "Network & Infrastructure Engineer", bn: "নেটওয়ার্ক ও ইনফ্রাস্ট্রাকচার ইঞ্জিনিয়ার" },
    summary: INFRA_SUMMARY,
    about: {
      en: `${COMPANY.en}\n\n${INFRA_PURPOSE.en}\n\nFull time, working from our office in Dhaka.`,
      bn: `${COMPANY.bn}\n\n${INFRA_PURPOSE.bn}\n\nপূর্ণকালীন, ঢাকায় আমাদের অফিসে কাজ।`,
    },
    responsibilities: {
      en: `Install, configure, maintain, monitor and troubleshoot computer hardware, software, operating systems and networking equipment.
Install, configure, manage and troubleshoot LAN/WAN infrastructure, including routers, switches, firewalls, VPNs and related devices.
Keep connectivity uninterrupted between the company's core network and clients' Cisco, MikroTik and other network devices.
Troubleshoot link-down, packet loss, high latency, bandwidth, routing and other connectivity issues.
Work with ISPs to resolve backbone, upstream, routing and other core network issues.
Find and fix network bottlenecks, faulty equipment, cabling issues and other causes of service degradation.
Coordinate the installation, configuration, testing and commissioning of network equipment.
Install, configure, manage and administer Windows Server and Linux environments.
Implement and maintain backup and disaster recovery (DR) solutions.
Keep systems and the network secure through patch management, security updates and vulnerability fixes.
Troubleshoot server, network, system and application-level issues.
Monitor network and system performance, availability and reliability so critical services run smoothly.
Visit sites when an issue cannot be solved remotely.
Keep accurate inventory records of IT hardware, software, network equipment and other IT assets.
Keep IT equipment checklists and operational records up to date.
Keep system and network documentation, SOPs, configuration records and architecture and network diagrams up to date.
Follow the company's IT policies, security standards, procedures and compliance requirements.
Provide 24/7 support for critical production systems and network incidents when needed.
Take on other IT, network, systems or compliance duties assigned by management.`,
      bn: `কম্পিউটার হার্ডওয়্যার, সফটওয়্যার, অপারেটিং সিস্টেম ও নেটওয়ার্ক যন্ত্রপাতি স্থাপন, কনফিগার, রক্ষণাবেক্ষণ, মনিটর ও সমস্যা সমাধান করা।
রাউটার, সুইচ, ফায়ারওয়াল, ভিপিএন ও সংশ্লিষ্ট যন্ত্রসহ ল্যান/ওয়্যান অবকাঠামো স্থাপন, কনফিগার, পরিচালনা ও সমস্যা সমাধান করা।
কোম্পানির কোর নেটওয়ার্ক এবং ক্লায়েন্টদের সিসকো, মাইক্রোটিক ও অন্যান্য নেটওয়ার্ক যন্ত্রের মধ্যে নিরবচ্ছিন্ন সংযোগ নিশ্চিত করা।
লিংক ডাউন, প্যাকেট লস, উচ্চ ল্যাটেন্সি, ব্যান্ডউইথ, রাউটিং ও অন্যান্য সংযোগ সমস্যার সমাধান করা।
ব্যাকবোন, আপস্ট্রিম, রাউটিং ও অন্যান্য কোর নেটওয়ার্ক সমস্যা সমাধানে আইএসপির সঙ্গে সমন্বয় করা।
নেটওয়ার্কের বাধা, ত্রুটিপূর্ণ যন্ত্র, ক্যাবলিং সমস্যা ও সেবার মান কমার অন্যান্য কারণ খুঁজে বের করে সমাধান করা।
নেটওয়ার্ক যন্ত্রপাতি স্থাপন, কনফিগারেশন, পরীক্ষা ও চালু করার কাজ সমন্বয় করা।
উইন্ডোজ সার্ভার ও লিনাক্স পরিবেশ স্থাপন, কনফিগার, পরিচালনা ও প্রশাসন করা।
ব্যাকআপ ও ডিজাস্টার রিকভারি (DR) সমাধান বাস্তবায়ন ও রক্ষণাবেক্ষণ করা।
প্যাচ ব্যবস্থাপনা, নিরাপত্তা হালনাগাদ ও দুর্বলতা দূর করার মাধ্যমে সিস্টেম ও নেটওয়ার্ক নিরাপদ রাখা।
সার্ভার, নেটওয়ার্ক, সিস্টেম ও অ্যাপ্লিকেশন পর্যায়ের সমস্যার সমাধান করা।
নেটওয়ার্ক ও সিস্টেমের পারফরম্যান্স, প্রাপ্যতা ও নির্ভরযোগ্যতা মনিটর করা, যাতে গুরুত্বপূর্ণ সেবাগুলো নির্বিঘ্নে চলে।
দূর থেকে সমাধান করা না গেলে সরেজমিনে গিয়ে সমস্যার সমাধান করা।
আইটি হার্ডওয়্যার, সফটওয়্যার, নেটওয়ার্ক যন্ত্রপাতি ও অন্যান্য আইটি সম্পদের সঠিক তালিকা রাখা।
আইটি যন্ত্রপাতির চেকলিস্ট ও কার্যক্রমের রেকর্ড নিয়মিত হালনাগাদ রাখা।
সিস্টেম ও নেটওয়ার্ক ডকুমেন্টেশন, এসওপি, কনফিগারেশন রেকর্ড এবং আর্কিটেকচার ও নেটওয়ার্ক ডায়াগ্রাম হালনাগাদ রাখা।
প্রতিষ্ঠানের আইটি নীতিমালা, নিরাপত্তা মানদণ্ড, কার্যপ্রণালী ও কমপ্লায়েন্সের শর্ত মেনে চলা।
প্রয়োজনে গুরুত্বপূর্ণ প্রোডাকশন সিস্টেম ও নেটওয়ার্কের সমস্যায় ২৪/৭ সহায়তা দেওয়া।
ব্যবস্থাপনা কর্তৃক নির্ধারিত অন্যান্য আইটি, নেটওয়ার্ক, সিস্টেম বা কমপ্লায়েন্স-সংক্রান্ত দায়িত্ব পালন করা।`,
    },
    requirements: {
      en: `## Experience
Strong expertise in Windows Server, Linux Server, Active Directory, networking, cloud platforms, virtualisation and IT security management.
Extensive experience with network infrastructure, including switches, routers and firewalls.
Practical experience with enterprise networking and security solutions such as FortiGate, Cisco and HP.
## Skills
IT infrastructure
IT infrastructure and network implementation
Network security
Cyber security and IT security`,
      bn: `## অভিজ্ঞতা
উইন্ডোজ সার্ভার, লিনাক্স সার্ভার, অ্যাক্টিভ ডিরেক্টরি, নেটওয়ার্কিং, ক্লাউড প্ল্যাটফর্ম, ভার্চুয়ালাইজেশন ও আইটি নিরাপত্তা ব্যবস্থাপনায় গভীর দক্ষতা।
সুইচ, রাউটার ও ফায়ারওয়ালসহ নেটওয়ার্ক অবকাঠামোয় ব্যাপক অভিজ্ঞতা।
ফোর্টিগেট, সিসকো ও এইচপির মতো এন্টারপ্রাইজ নেটওয়ার্কিং ও নিরাপত্তা সমাধানে বাস্তব অভিজ্ঞতা।
## দক্ষতা
আইটি অবকাঠামো
আইটি অবকাঠামো ও নেটওয়ার্ক বাস্তবায়ন
নেটওয়ার্ক নিরাপত্তা
সাইবার নিরাপত্তা ও আইটি নিরাপত্তা`,
    },
    benefits: null,
  },
];
