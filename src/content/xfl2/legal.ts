/**
 * Starting drafts for the Privacy policy, Terms of use, Accessibility
 * statement and Security and compliance page linked from the footer. They describe what THIS website does
 * (forms, cookies, storage) and nothing else. Each section becomes a text
 * block: a heading and paragraphs (lines starting with • read as a list).
 * Seeded once as DRAFT pages by `npm run db:seed:content`: XFL's legal adviser must review them before they
 * are published in Admin → Pages. Bracketed text marks facts only XFL can fill in.
 */

export type LegalDraft = { key: string; path: string; title: string; intro: string; sections: { title: string; body: string }[] };

export const LEGAL_DRAFTS: LegalDraft[] = [
  {
    "key": "privacy",
    "path": "privacy",
    "title": "Privacy policy",
    "intro": "What this website collects, why, and how to reach us about it.",
    "sections": [
      {
        "title": "Who we are",
        "body": "This website is run by Xpert Fintech Ltd., Saiham Sky View Tower (13-A), 45 Bijoynagar, Dhaka-1000, Bangladesh. For any question about your information, write to info@xpertfintech.com."
      },
      {
        "title": "What we collect",
        "body": "• Demo and contact forms: your name, work email, phone number (if given), organisation, your message and how you prefer to be contacted, the page you sent it from, and the time.\n• Job applications: the details you enter and the CV you upload.\n• Spam protection: the network (IP) address and browser type of each form submission, used only to block abuse.\n\nBrowsing the website does not require you to give us any personal information. We do not use advertising or tracking cookies. [Confirm whether any analytics service is added later.]"
      },
      {
        "title": "Why we use it",
        "body": "To answer your enquiry, arrange a demo, consider your job application, and keep the website secure. We ask for your consent on each form and do not use your details for anything else, and we do not sell them."
      },
      {
        "title": "Cookies and storage in your browser",
        "body": "• locale cookie: remembers the language you chose (one year).\n• theme (stored in your browser): remembers light or dark mode.\n• Watchlist (stored in your browser): the stocks you star on the Markets pages. It never leaves your device."
      },
      {
        "title": "How long we keep it",
        "body": "[Set the retention period, for example: enquiries for 24 months after our last contact; job applications for 12 months.] Deleted records are removed permanently from the trash after 30 days."
      },
      {
        "title": "Who can see it",
        "body": "Only authorised Xpert staff, through a password-protected admin area with an activity log. Our email and hosting providers process data on our behalf. [List the hosting and email providers.]"
      },
      {
        "title": "Your choices",
        "body": "You can ask to see, correct or delete the information we hold about you by writing to info@xpertfintech.com. We reply within [30] days."
      },
      {
        "title": "Changes",
        "body": "We will update this page if anything changes and show the date of the last change. Last updated: [date]."
      }
    ]
  },
  {
    "key": "terms",
    "path": "terms",
    "title": "Terms of use",
    "intro": "The rules for using this website.",
    "sections": [
      {
        "title": "About this website",
        "body": "This website gives information about Xpert Fintech Ltd. and its products. It is not a trading platform, and nothing on it is investment advice or an offer to buy or sell securities."
      },
      {
        "title": "Market data",
        "body": "Prices, indices and other market figures are shown for information only. They may be delayed or incomplete and come from the Dhaka Stock Exchange, the Chittagong Stock Exchange or a licensed provider, as stated next to them. Do not rely on them to make trading decisions; use your broker's trading platform."
      },
      {
        "title": "Market share figures",
        "body": "Xpert's market share is calculated from turnover traded through Xpert's platform and the exchange's total turnover for the day shown, with the source stated."
      },
      {
        "title": "Content and trademarks",
        "body": "The text, design, the Xpert Fintech name and logo, and product names belong to Xpert Fintech Ltd. Client and member names and logos belong to their owners and are shown with their permission."
      },
      {
        "title": "Links to other websites",
        "body": "Links to app stores, exchanges and other sites are provided for convenience. We are not responsible for their content."
      },
      {
        "title": "Liability",
        "body": "[To be completed by Xpert's legal adviser.]"
      },
      {
        "title": "Governing law",
        "body": "These terms are governed by the laws of Bangladesh. [Confirm with legal adviser.]"
      },
      {
        "title": "Contact",
        "body": "Questions about these terms: info@xpertfintech.com. Last updated: [date]."
      }
    ]
  },
  {
    "key": "accessibility",
    "path": "accessibility",
    "title": "Accessibility",
    "intro": "How we make this website usable for everyone.",
    "sections": [
      {
        "title": "Our aim",
        "body": "We want everyone to be able to use this website, in English and in Bangla, with a mouse, a keyboard, a screen reader or a phone. We work to the Web Content Accessibility Guidelines (WCAG) 2.2, level AA."
      },
      {
        "title": "What we have done",
        "body": "• Every page works with the keyboard, with a visible focus outline and a “Skip to content” link.\n• Text and controls meet the AA contrast ratio in both the light and the dark theme.\n• Moving parts (the price ticker, sliders, logo strips) can be paused, and stop moving if your device is set to reduce motion.\n• Charts and diagrams have a text description, and price changes are shown with arrows as well as colour.\n• Pages adapt to any screen size down to 320 pixels wide without sideways scrolling."
      },
      {
        "title": "Known limits",
        "body": "Some embedded content from other providers, such as maps and videos, may not be fully accessible. [List anything else found in testing.]"
      },
      {
        "title": "Tell us about a problem",
        "body": "If something on this website is hard to use, write to info@xpertfintech.com and tell us the page and what happened. We will reply within [5] working days. Last reviewed: [date]."
      }
    ]
  },
  {
    "key": "security",
    "path": "security",
    "title": "Security and compliance",
    "intro": "How Xpert protects brokerage and investor data, and the rules it works under.",
    "sections": [
      {
        "title": "The rules we work under",
        "body": "Xpert's products serve brokerage houses licensed by the Bangladesh Securities and Exchange Commission (BSEC) and connect to the Dhaka Stock Exchange, the Chittagong Stock Exchange and CDBL. Exchange connections are certified as listed on our Credentials. [List any BSEC, DSE or CSE approvals with their dates.]"
      },
      {
        "title": "Where data is hosted",
        "body": "[Name the data centre(s) and country, and say whether client data stays in Bangladesh.]"
      },
      {
        "title": "How data is protected",
        "body": "• [Encryption in transit and at rest.]\n• [Who can reach production systems, and how access is granted and removed.]\n• [Backups: how often, where they are kept, and how restores are tested.]"
      },
      {
        "title": "Monitoring and activity records",
        "body": "[Two-step sign-in for staff, what is logged, and how long logs are kept.]"
      },
      {
        "title": "Certifications and audits",
        "body": "[Only certifications Xpert actually holds — for example ISO/IEC 27001 — with the certificate number, scope and expiry, and the date of the latest independent audit.]"
      },
      {
        "title": "Business continuity",
        "body": "[Uptime target, the disaster-recovery site, and how brokerages are told about an incident.]"
      },
      {
        "title": "Report a security issue",
        "body": "Write to [security@xpertfintech.com] with what you found and how to reproduce it. We will acknowledge within [2] working days."
      }
    ]
  }
];
