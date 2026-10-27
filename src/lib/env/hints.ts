/**
 * Editor hints on the public pages: draft labels, "add a photo / email" slots,
 * empty-section notes and media placeholders. Off unless EDITOR_HINTS=on in
 * .env, so pages look exactly like the live site while developing; turn it
 * on to see where content is still missing.
 */
export const editorHints = () => process.env.EDITOR_HINTS === "on" && !isLiveDeployment();

/** The live site: Vercel's production deployment, or a server with APP_ENV=production (Namecheap). */
const isLiveDeployment = () => process.env.VERCEL_ENV === "production" || process.env.APP_ENV === "production";

/**
 * Empty slots for content still to come (screenshots, key features, case
 * studies, figures, reviews…), drawn where it will go so the team sees what
 * to add. Shown only while developing on a computer (`npm run dev`) or with
 * EDITOR_HINTS=on outside Vercel's live deployment; never on a deployed site,
 * so no visitor ever sees a link into the admin.
 */
export const contentSlots = () => editorHints() || (process.env.NODE_ENV === "development" && !isLiveDeployment());

/**
 * Drafts (reviews, leaders' messages, empty menu entries) mixed into public
 * pages for a preview: only under `npm run dev`, never on a deployed site.
 * Earlier this keyed on APP_ENV, which Vercel does not set, so drafts leaked
 * onto the live site.
 */
export const showDrafts = () => process.env.NODE_ENV === "development" && !isLiveDeployment();
