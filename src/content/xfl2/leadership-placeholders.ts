/**
 * Leadership placeholders, seeded with Person.isPlaceholder = true.
 * Replace with real content from XFL. Do not substitute names found in public directories.
 */
import type { I18n } from "./ecosystem";

export type PersonGroup = "BOARD" | "MANAGEMENT";

export interface PlaceholderPerson {
  key: string;
  group: PersonGroup;
  sortOrder: number;
  title: I18n;
  responsibility: I18n;
}

export const PLACEHOLDER_NAME: I18n = { en: "Name to be confirmed", bn: "নাম নিশ্চিত করা হবে" };
export const PLACEHOLDER_BIO: I18n = { en: "Biography will be added soon.", bn: "জীবনী শীঘ্রই যুক্ত করা হবে।" };
export const PLACEHOLDER_PHOTO = "/placeholders/person.svg";

export const leadershipPlaceholders: PlaceholderPerson[] = [
  { key: "placeholder-chairman", group: "BOARD", sortOrder: 1,
    title: { en: "Chairman", bn: "চেয়ারম্যান" },
    responsibility: { en: "Leads the Board and sets the company's strategic direction.", bn: "পরিচালনা পর্ষদের নেতৃত্ব দেন এবং কোম্পানির কৌশলগত দিকনির্দেশনা নির্ধারণ করেন।" } },
  { key: "placeholder-director-1", group: "BOARD", sortOrder: 2,
    title: { en: "Director", bn: "পরিচালক" },
    responsibility: { en: "Represents a consortium member on the Board.", bn: "পর্ষদে একটি কনসোর্টিয়াম সদস্যের প্রতিনিধিত্ব করেন।" } },
  { key: "placeholder-director-2", group: "BOARD", sortOrder: 3,
    title: { en: "Director", bn: "পরিচালক" },
    responsibility: { en: "Represents a consortium member on the Board.", bn: "পর্ষদে একটি কনসোর্টিয়াম সদস্যের প্রতিনিধিত্ব করেন।" } },
  { key: "placeholder-independent-director", group: "BOARD", sortOrder: 4,
    title: { en: "Independent Director", bn: "স্বতন্ত্র পরিচালক" },
    responsibility: { en: "Provides independent oversight of governance.", bn: "সুশাসনের স্বতন্ত্র তদারকি করেন।" } },
  { key: "placeholder-md-ceo", group: "MANAGEMENT", sortOrder: 1,
    title: { en: "Managing Director & CEO", bn: "ব্যবস্থাপনা পরিচালক ও প্রধান নির্বাহী" },
    responsibility: { en: "Leads the company and its delivery to consortium members.", bn: "কোম্পানি এবং কনসোর্টিয়াম সদস্যদের সেবা প্রদানে নেতৃত্ব দেন।" } },
  { key: "placeholder-cto", group: "MANAGEMENT", sortOrder: 2,
    title: { en: "Chief Technology Officer", bn: "প্রধান প্রযুক্তি কর্মকর্তা" },
    responsibility: { en: "Oversees technology strategy and platform delivery.", bn: "প্রযুক্তি কৌশল ও প্ল্যাটফর্ম বাস্তবায়ন তদারকি করেন।" } },
  { key: "placeholder-cfo-cs", group: "MANAGEMENT", sortOrder: 3,
    title: { en: "CFO & Company Secretary", bn: "প্রধান আর্থিক কর্মকর্তা ও কোম্পানি সচিব" },
    responsibility: { en: "Manages finance, reporting and corporate governance.", bn: "আর্থিক ব্যবস্থাপনা, প্রতিবেদন ও কর্পোরেট সুশাসন দেখেন।" } },
  { key: "placeholder-head-operations", group: "MANAGEMENT", sortOrder: 4,
    title: { en: "Head of Operations", bn: "অপারেশনস প্রধান" },
    responsibility: { en: "Runs implementation and day-to-day support for brokerages.", bn: "ব্রোকারেজগুলোর বাস্তবায়ন ও দৈনন্দিন সহায়তা পরিচালনা করেন।" } },
  { key: "placeholder-head-business", group: "MANAGEMENT", sortOrder: 5,
    title: { en: "Head of Business", bn: "ব্যবসা প্রধান" },
    responsibility: { en: "Leads partnerships and new client relationships.", bn: "অংশীদারিত্ব ও নতুন গ্রাহক সম্পর্কের নেতৃত্ব দেন।" } },
];
