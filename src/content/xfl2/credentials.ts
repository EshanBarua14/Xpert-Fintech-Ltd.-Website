/**
 * XFL's memberships and exchange certifications (supplied by XFL, October
 * 2026). The content seed saves them to Admin → Credentials; each names the
 * organization by its key in Admin → Organizations, which supplies the logo,
 * name and website.
 */
export type CredentialSeed = { orgKey: string; en: string; bn: string };

export const CREDENTIALS: CredentialSeed[] = [
  { orgKey: "basis", en: "Associate member", bn: "সহযোগী সদস্য" },
  { orgKey: "cse", en: "FIX & FAST certified", bn: "FIX ও FAST সার্টিফায়েড" },
  { orgKey: "dse", en: "FIX & ITCH certified", bn: "FIX ও ITCH সার্টিফায়েড" },
];
