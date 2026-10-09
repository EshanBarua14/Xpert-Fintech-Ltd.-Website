/**
 * Editor hints on the public pages: draft labels, "add a photo / email" slots,
 * empty-section notes and media placeholders. Off unless EDITOR_HINTS=on in
 * .env, so pages look exactly like the live site while developing; turn it
 * on to see where content is still missing.
 */
export const editorHints = () => process.env.EDITOR_HINTS === "on";

/**
 * Empty slots for content still to come (screenshots, key features, case
 * studies, figures, reviews…), drawn where it will go so the team sees what
 * to add. Shown outside the live site (APP_ENV is not "production") or with
 * EDITOR_HINTS=on; never to visitors of the live site.
 */
export const contentSlots = () => editorHints() || process.env.APP_ENV !== "production";
