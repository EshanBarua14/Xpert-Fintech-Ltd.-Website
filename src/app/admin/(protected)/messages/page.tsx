import { db } from "@/lib/db/client";
import { requireAdmin } from "@/lib/auth/session";
import { LeaderMessageForm } from "@/components/admin/LeaderMessageForm";
import { LEADER_KEYS, readLeaderSetting } from "@/lib/content/leaders";

const TITLES = { chairman: "Chairman's message", md: "Managing Director's message" } as const;
const WHERE = { chairman: "About page", md: "About page" } as const;

export default async function MessagesPage() {
  await requireAdmin();
  const [rows, people] = await Promise.all([
    db.siteSetting.findMany({ where: { key: { in: LEADER_KEYS.map((k) => `message.${k}`) } } }),
    db.person.findMany({
      where: { deletedAt: null, key: { not: null } },
      orderBy: { sortOrder: "asc" },
      include: { translations: { where: { locale: "en" } }, roles: { include: { translations: { where: { locale: "en" } } } } },
    }),
  ]);
  // Board and management first, then everyone else, A–Z.
  const options = people
    .filter((p) => p.translations[0]?.name && !p.isPlaceholder)
    .map((p) => {
      const role = p.roles.find((r) => r.group === "BOARD") ?? p.roles.find((r) => r.group === "MANAGEMENT") ?? p.roles[0];
      const title = role?.translations[0]?.title;
      return { value: p.key!, label: `${p.translations[0]!.name}${title ? ` (${title})` : ""}`, senior: role && (role.group === "BOARD" || role.group === "MANAGEMENT") ? 0 : 1 };
    })
    .sort((a, b) => a.senior - b.senior || a.label.localeCompare(b.label))
    .map(({ value, label }) => ({ value, label }));

  return (
    <div className="flex max-w-5xl flex-col gap-10">
      <div>
        <h1 className="font-display text-3xl font-semibold">Messages</h1>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          The Chairman&rsquo;s and the Managing Director&rsquo;s messages. The text supplied at setup is a draft for them to review; nothing here appears on the website until
          Publish is ticked.
        </p>
      </div>
      {LEADER_KEYS.map((key) => {
        const v = readLeaderSetting(rows.find((r) => r.key === `message.${key}`)?.value);
        return (
          <section key={key} className="flex flex-col gap-4 rounded-card border border-fg/10 p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-xl font-semibold">{TITLES[key]}</h2>
              <span className={"rounded-full border px-3 py-0.5 text-xs " + (v.published ? "border-market-up/40 text-market-up" : "border-gold/40 text-gold")}>
                {v.published ? "Published" : "Draft"}
              </span>
            </div>
            <p className="text-xs text-text-secondary">Shown on the {WHERE[key]}.</p>
            <LeaderMessageForm values={{ key, ...v }} people={options} />
          </section>
        );
      })}
    </div>
  );
}
