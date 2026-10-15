/**
 * Editor hints on the public pages: draft labels, "add a photo / email" slots,
 * empty-section notes and media placeholders. Off unless EDITOR_HINTS=on in
 * .env, so pages look exactly like the live site while developing; turn it
 * on to see where content is still missing.
 */
export const editorHints = () => process.env.EDITOR_HINTS === "on" && !isLiveDeployment();

/** Vercel's production deployment (the live site), whatever else is set. */
const isLiveDeployment = () => process.env.VERCEL_ENV === "production";

/**
 * Empty slots for content still to come (screenshots, key features, case
 * studies, figures, reviews…), drawn where it will go so the team sees what
 * to add. Shown only while developing on a computer (`npm run dev`) or with
 * EDITOR_HINTS=on outside Vercel's live deployment; never on a deployed site,
 * so no visitor ever sees a link into the admin.
 */
export const contentSlots = () => editorHints() || (process.env.NODE_ENV === "development" && !isLiveDeployment());
