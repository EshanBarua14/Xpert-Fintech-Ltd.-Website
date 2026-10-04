import "server-only";
import { toLocalInput } from "@/lib/validation/common";
import { PERSON_GROUPS, type PersonGroupKey } from "@/lib/validation/people";
import type { PersonFormValues } from "@/components/admin/PersonForm";

type Role = { group: PersonGroupKey; sortOrder: number; translations: { locale: string; title: string }[] };

export const emptyPerson: PersonFormValues = {
  status: "DRAFT",
  publishAt: "",
  sortOrder: 0,
  photoMediaId: "",
  linkedinUrl: "",
  email: "",
  isPlaceholder: false,
  enName: "",
  bnName: "",
  enBio: "",
  bnBio: "",
  roles: Object.fromEntries(PERSON_GROUPS.map((g) => [g, { enabled: false, enTitle: "", bnTitle: "", order: 0 }])) as PersonFormValues["roles"],
};

export function toPersonFormValues(p: {
  id: string;
  status: "DRAFT" | "PUBLISHED";
  publishAt: Date | null;
  sortOrder: number;
  photoMediaId: string | null;
  linkedinUrl: string | null;
  email: string | null;
  isPlaceholder: boolean;
  translations: { locale: string; name: string; bio: string | null }[];
  roles: Role[];
}): PersonFormValues {
  const t = (l: string) => p.translations.find((x) => x.locale === l);
  const roles = { ...emptyPerson.roles };
  for (const r of p.roles) {
    roles[r.group] = {
      enabled: true,
      enTitle: r.translations.find((x) => x.locale === "en")?.title ?? "",
      bnTitle: r.translations.find((x) => x.locale === "bn")?.title ?? "",
      order: r.sortOrder,
    };
  }
  return {
    id: p.id,
    status: p.status,
    publishAt: toLocalInput(p.publishAt),
    sortOrder: p.sortOrder,
    photoMediaId: p.photoMediaId ?? "",
    linkedinUrl: p.linkedinUrl ?? "",
    email: p.email ?? "",
    isPlaceholder: p.isPlaceholder,
    enName: t("en")?.name ?? "",
    bnName: t("bn")?.name ?? "",
    enBio: t("en")?.bio ?? "",
    bnBio: t("bn")?.bio ?? "",
    roles,
  };
}
