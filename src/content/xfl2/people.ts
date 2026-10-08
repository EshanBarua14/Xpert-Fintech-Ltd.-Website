/**
 * Xpert Fintech's people as supplied by XFL (October 2026): the Board and the
 * Management Committee as shown on the previous website, and the staff list
 * (Employee_Name.xlsx). Seeded once by `npm run db:seed:content`; after that
 * Admin → People is the source of truth (the seed never overwrites edits).
 *
 * `rank` orders people by position (1 = most senior); `department` sets the
 * card colour and the filter on the Team page.
 */

export type Department = "Leadership" | "Engineering" | "Support" | "Infrastructure" | "Marketing" | "HR & Admin" | "Operations";

export type RosterPerson = {
  key: string;
  name: string;
  title: string | null;
  department?: Department | null;
  rank: number;
  /** An older spelling to correct in profiles no admin has edited yet. */
  formerName?: string;
  /** An older title to correct in profiles no admin has edited yet. */
  formerTitle?: string;
};

/** Board of Directors, in the order the previous website listed them. */
export const BOARD: RosterPerson[] = [
  { key: "sumon-das", name: "Sumon Das", title: "Chairman", rank: 1 },
  { key: "mohammed-rahmat-pasha", name: "Mohammed Rahmat Pasha", title: "Director", rank: 2 },
  { key: "dilip-kajuri", name: "Dilip Kajuri", title: "Director", rank: 3 },
  { key: "aminul-islam", name: "Aminul Islam", title: "Director", rank: 4 },
  { key: "mohd-shaahed-imran", name: "Mohd. Shaahed Imran", formerName: "Mohd Shaahed Imran", title: "Director", rank: 5 },
  { key: "md-refat-hossen", name: "Md. Refat Hossen", title: "Director", rank: 6 },
  { key: "fakruddin-ali-ahmed-rajib", name: "Fakruddin Ali Ahmed Rajib", title: "Director", rank: 7 },
  { key: "m-shahryar-faiz", name: "M Shahryar Faiz", title: "Director", rank: 8 },
  { key: "bishnu-pada-kunda", name: "Bishnu Pada Kunda", title: "Director", rank: 9 },
];

/** Management Committee (ManCom). */
export const MANAGEMENT: RosterPerson[] = [
  { key: "md-shahinur-rahman", name: "Md. Shahinur Rahman", title: "Managing Director", department: "Leadership", rank: 1 },
  { key: "md-abdur-rahman-rony", name: "Md. Abdur Rahman Rony, FCS", formerName: "Md. Abdur Rahman Rony", title: "CFO & Company Secretary", department: "Leadership", rank: 2 },
  { key: "md-abul-moshad-chowdhury", name: "Md. Abul Moshad Chowdhury", title: "Head of Application Support and Development", department: "Engineering", rank: 3 },
  { key: "muhammad-shamsul-maruf", name: "Mohammad Shamsul Maruf", formerName: "Muhammad Shamsul Maruf", title: "Principal Software Engineer", department: "Engineering", rank: 4 },
];

/** Everyone at Xpert, by position (XFL's staff list, with titles confirmed by XFL). */
/** Consultants (Company → Consultants), as given by XFL (8 Oct 2026); portrait in prisma/seed-media/people/<key>.jpg. */
export const CONSULTANTS: (RosterPerson & { nameBn?: string; affiliation?: { en: string; bn: string } })[] = [
  { key: "mohammad-ali", name: "Mohammad Ali, FCA", formerName: "Mohammad Ali", nameBn: "মোহাম্মদ আলী, এফসিএ", title: "Consultant", rank: 1, affiliation: { en: "Xpert Fintech Ltd.", bn: "এক্সপার্ট ফিনটেক লিমিটেড" } },
];

export const TEAM: RosterPerson[] = [
  { key: "md-shahinur-rahman", name: "Md. Shahinur Rahman", title: "Managing Director", department: "Leadership", rank: 1 },
  { key: "sowkot-osman", name: "Sowkot Osman", title: "Executive Director", department: "Leadership", rank: 2 },
  { key: "md-abdur-rahman-rony", name: "Md. Abdur Rahman Rony, FCS", formerName: "Md. Abdur Rahman Rony", title: "CFO & Company Secretary", department: "Leadership", rank: 3 },
  { key: "md-abul-moshad-chowdhury", name: "Md. Abul Moshad Chowdhury", title: "Head of Application Support and Development", department: "Engineering", rank: 4 },
  { key: "saikat-biswas", name: "Saikat Biswas", title: "Senior Principal Software Engineer", department: "Engineering", rank: 5 },
  { key: "muhammad-shamsul-maruf", name: "Mohammad Shamsul Maruf", formerName: "Muhammad Shamsul Maruf", title: "Principal Software Engineer", department: "Engineering", rank: 6 },
  { key: "mohammad-mehrabul-ferdous", name: "Mohammad Mehrabul Ferdous", title: "Principal Software Engineer", department: "Engineering", rank: 7 },
  { key: "md-sirajul-islam", name: "Md. Sirajul Islam", title: "Support Manager", department: "Support", rank: 8 },
  { key: "shaleh-akram", name: "Shaleh Akram", title: "Marketing Manager", department: "Marketing", rank: 9 },
  { key: "md-yeasin-hossain", name: "Md. Yeasin Hossain", title: "Senior Software Engineer", department: "Engineering", rank: 10 },
  { key: "md-hefaj-uddin", name: "Md. Hefaj Uddin", title: "Senior Software Engineer", department: "Engineering", rank: 11 },
  { key: "mohammad-erfanul-islam", name: "Mohammad Erfanul Islam", title: "Senior Software Engineer", department: "Engineering", rank: 12 },
  { key: "shamsher-morshed", name: "Shamsher Morshed", title: "Network Administrator", department: "Infrastructure", rank: 13 },
  { key: "nafis-hasan-khan", name: "Nafis Hasan Khan", title: "System and Network Engineer", department: "Infrastructure", rank: 14 },
  { key: "talukder-juhaer-hakim", name: "Talukder Juhaer Hakim", title: "Software Engineer", department: "Engineering", rank: 15 },
  { key: "toha-hossain", name: "Toha Hossain", title: "Software Engineer", formerTitle: "Officer", department: "Engineering", rank: 16 },
  { key: "mahmuda-yasmin-farah", name: "Mahmuda Yasmin Farah", title: "Software Engineer", formerTitle: "Officer", department: "Engineering", rank: 17 },
  { key: "najmul-hasan-rifat", name: "Najmul Hasan Rifat", title: "React Native App Developer", department: "Engineering", rank: 18 },
  { key: "md-hasan-uddin", name: "Md. Hasan Uddin", title: "QA Software Engineer", department: "Engineering", rank: 19 },
  { key: "eshan-barua", name: "Eshan Barua", title: "Support Engineer", department: "Support", rank: 20 },
  { key: "md-anzirul-islam", name: "Md. Anzirul Islam", title: "Support Engineer", department: "Support", rank: 21 },
  { key: "md-wahidul-alam", name: "Md. Wahidul Alam", title: "Support Engineer", department: "Support", rank: 22 },
  { key: "ali-hossain-maruf", name: "Ali Hossain Maruf", title: "Senior Executive, HR & Admin", department: "HR & Admin", rank: 23 },
  { key: "kazi-farzana-hamid", name: "Kazi Farzana Hamid", title: "Receptionist", department: "HR & Admin", rank: 24 },
];

/** Departments in display order, as offered in Admin → People. */
export const DEPARTMENTS: Department[] = ["Leadership", "Engineering", "Support", "Infrastructure", "Marketing", "HR & Admin", "Operations"];
