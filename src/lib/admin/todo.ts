import "server-only";
import { db } from "@/lib/db/client";
import { getFigures } from "@/lib/content/figures";

export type Todo = { label: string; detail: string; href: string; done: boolean };

/**
 * What the website still waits for — the same things the empty slots on the
 * site (outside production) point to. Worked out from the database; ticked
 * off by itself as content is added and published.
 */
export async function contentTodos(): Promise<Todo[]> {
  const live = { status: "PUBLISHED" as const, deletedAt: null };
  const [products, cases, reviews, figures, legal] = await Promise.all([
    db.offering.findMany({
      where: { ...live, hasOwnPage: true },
      orderBy: { sortOrder: "asc" },
      include: {
        translations: { where: { locale: "en" } },
        items: { where: { kind: "CAPABILITY", isHidden: false }, select: { id: true } },
        media: { where: { isHidden: false }, select: { kind: true, device: true, mediaId: true } },
      },
    }),
    db.caseStudy.count({ where: live }),
    db.testimonial.count({ where: { ...live, hasApproval: true } }),
    getFigures(),
    db.page.findMany({ where: { key: { in: ["privacy", "terms", "accessibility", "security"] }, deletedAt: null }, select: { id: true, key: true, status: true } }),
  ]);
  const todos: Todo[] = [];
  for (const p of products) {
    const name = p.translations[0]?.name ?? p.key ?? "Product";
    const shots = p.media.filter((m) => m.kind === "SCREENSHOT" && m.mediaId);
    const missing = [
      p.items.length < 3 && `${3 - p.items.length} more key feature(s)`,
      shots.length < 3 && `${3 - shots.length} more screenshot(s)`,
      !shots.some((m) => m.device === "PHONE") && "a phone screenshot",
      !p.media.some((m) => m.kind === "VIDEO") && "a demo video",
    ].filter(Boolean) as string[];
    todos.push({ label: name, detail: missing.length ? `Add ${missing.join(", ")}.` : "Key features, screenshots and demo video in place.", href: `/admin/products/${p.id}#items`, done: !missing.length });
  }
  todos.push({ label: "Case studies", detail: cases >= 2 ? `${cases} published.` : `${cases} published — add two or three, with each client's approval and real figures.`, href: "/admin/case-studies", done: cases >= 2 });
  todos.push({ label: "Client reviews", detail: reviews >= 3 ? `${reviews} published with approval.` : `${reviews} published with approval — add reviews from member chiefs.`, href: "/admin/testimonials", done: reviews >= 3 });
  todos.push({ label: "Figures", detail: figures.length >= 3 ? `${figures.length} figures with sources.` : `${figures.length} of at least 3 — e.g. orders a day, years live, members on the platform.`, href: "/admin/figures", done: figures.length >= 3 });
  for (const key of ["security", "privacy", "terms", "accessibility"]) {
    const page = legal.find((l) => l.key === key);
    const label = { security: "Security and compliance page", privacy: "Privacy policy", terms: "Terms of use", accessibility: "Accessibility statement" }[key]!;
    todos.push({
      label,
      detail: page?.status === "PUBLISHED" ? "Published." : "Draft — fill in the bracketed facts, have it reviewed, then publish.",
      href: page ? `/admin/pages/${page.id}` : "/admin/pages",
      done: page?.status === "PUBLISHED",
    });
  }
  return todos;
}
