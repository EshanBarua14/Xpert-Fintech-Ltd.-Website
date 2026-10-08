/**
 * Editor hints on the public pages: draft labels, "add a photo / email" slots,
 * empty-section notes and media placeholders. Off unless EDITOR_HINTS=on in
 * .env, so pages look exactly like the live site while developing; turn it
 * on to see where content is still missing.
 */
export const editorHints = () => process.env.EDITOR_HINTS === "on";
