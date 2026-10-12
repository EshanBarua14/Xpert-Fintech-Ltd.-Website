import type { PrismaClient } from "@prisma/client";

/* eslint-disable @typescript-eslint/no-explicit-any */

const PATH = "risk-management";

type Item = { en: [string, string]; bn: [string, string] };

const ITEMS: Item[] = [
  {
    en: ["Why it matters", "Every order a brokerage sends to DSE or CSE can put a client's money at risk. The Risk Management System (RMS) is built into the Trading OMS, so problems are stopped at the desk, before the order reaches the exchange. It helps protect clients from avoidable losses."],
    bn: ["কেন এটি গুরুত্বপূর্ণ", "ব্রোকারেজ থেকে ডিএসই বা সিএসইতে যাওয়া প্রতিটি অর্ডারে গ্রাহকের অর্থ ঝুঁকিতে পড়তে পারে। আরএমএস ট্রেডিং ওএমএস-এর ভেতরেই যুক্ত, তাই অর্ডার এক্সচেঞ্জে পৌঁছানোর আগেই ডেস্কে সমস্যা আটকে যায়। এটি গ্রাহককে অপ্রয়োজনীয় ক্ষতি থেকে সুরক্ষা দিতে সহায়তা করে।"],
  },
  {
    en: ["Short-sell prevention", "A sell order for shares the client does not hold is stopped before it leaves the brokerage."],
    bn: ["শর্ট সেল প্রতিরোধ", "গ্রাহকের কাছে নেই এমন শেয়ার বিক্রির অর্ডার ব্রোকারেজ থেকে বের হওয়ার আগেই আটকে যায়।"],
  },
  {
    en: ["Buying power and margin limit", "A buy order is checked against the client's available buying power and margin limit."],
    bn: ["ক্রয়ক্ষমতা ও মার্জিন সীমা", "ক্রয়ের অর্ডার গ্রাহকের বিদ্যমান ক্রয়ক্ষমতা ও মার্জিন সীমার সঙ্গে যাচাই হয়।"],
  },
  {
    en: ["Order value and quantity limits", "Orders above the limits set for value or quantity are held back."],
    bn: ["অর্ডারের মূল্য ও পরিমাণের সীমা", "নির্ধারিত মূল্য বা পরিমাণের সীমা ছাড়ানো অর্ডার আটকে রাখা হয়।"],
  },
  {
    en: ["Price band checks", "Orders priced outside a stock's allowed price band are stopped."],
    bn: ["প্রাইস ব্যান্ড যাচাই", "শেয়ারের অনুমোদিত প্রাইস ব্যান্ডের বাইরের দামের অর্ডার আটকে যায়।"],
  },
  {
    en: ["Exposure caps", "Exposure stays within the caps the brokerage sets."],
    bn: ["এক্সপোজার সীমা", "এক্সপোজার ব্রোকারেজের নির্ধারিত সীমার মধ্যে থাকে।"],
  },
  {
    en: ["Blocked BO accounts", "Orders for a blocked BO account are not accepted."],
    bn: ["ব্লকড বিও অ্যাকাউন্ট", "ব্লক করা বিও অ্যাকাউন্টের অর্ডার গ্রহণ করা হয় না।"],
  },
  {
    en: ["Part of the Trading OMS", "RMS is not a separate product. It is built into the Xpert Trading OMS, which sends orders to DSE and CSE."],
    bn: ["ট্রেডিং ওএমএস-এর অংশ", "আরএমএস আলাদা কোনো পণ্য নয়। এটি এক্সপার্ট ট্রেডিং ওএমএস-এর ভেতরেই যুক্ত, যা ডিএসই ও সিএসইতে অর্ডার পাঠায়।"],
  },
];

/**
 * Once: the "Risk checks before every order" page, in English and Bengali.
 * Edit or unpublish it in Admin -> Pages.
 */
export async function seedRiskPage(db: PrismaClient, EN: any, BN: any) {
  if (await db.page.findUnique({ where: { key: PATH } })) return;
  if (await db.pageTranslation.findFirst({ where: { locale: EN, path: PATH } })) return;
  const page = await db.page.create({
    data: {
      key: PATH,
      template: "default",
      status: "PUBLISHED",
      translations: {
        create: [
          { locale: EN, path: PATH, title: "Risk checks before every order", intro: "Risk management (RMS) is built into the Trading OMS. Every order is checked before it reaches DSE or CSE." },
          { locale: BN, path: PATH, title: "প্রতিটি অর্ডারের আগে ঝুঁকি যাচাই", intro: "ঝুঁকি ব্যবস্থাপনা (আরএমএস) ট্রেডিং ওএমএস-এর ভেতরেই যুক্ত। ডিএসই বা সিএসইতে পৌঁছানোর আগে প্রতিটি অর্ডার যাচাই করা হয়।" },
        ],
      },
    },
  });
  const section = await db.pageSection.create({ data: { pageId: page.id, sortOrder: 0 } });
  for (const [i, it] of ITEMS.entries()) {
    await db.contentBlock.create({
      data: {
        sectionId: section.id,
        type: "RICH_TEXT",
        status: "PUBLISHED",
        sortOrder: i,
        translations: {
          create: [
            { locale: EN, title: it.en[0], body: it.en[1] },
            { locale: BN, title: it.bn[0], body: it.bn[1] },
          ],
        },
      },
    });
  }
  console.log("- Risk checks page added at /risk-management (English and Bengali)");
}
