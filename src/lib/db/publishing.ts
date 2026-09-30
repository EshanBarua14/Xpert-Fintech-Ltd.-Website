/**
 * The single rule for what visitors may see. Every public query spreads
 * `publishedWhere()` into its `where` clause; admin queries use
 * `notDeletedWhere()` so drafts stay visible to admins.
 */
export function publishedWhere(now: Date = new Date()) {
  return {
    status: "PUBLISHED" as const,
    deletedAt: null,
    OR: [{ publishAt: null }, { publishAt: { lte: now } }],
  };
}

export function notDeletedWhere() {
  return { deletedAt: null };
}
