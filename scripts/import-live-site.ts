/**
 * Copies the content of the current website (www.xpertfintech.com, WordPress)
 * into this site's database, once and for good: every image into the media
 * library, news posts into News (with redirects from their old addresses),
 * and — recognised from the page layouts — people with their photos and
 * titles, client logos and testimonials. Nothing is deleted; re-running only
 * adds what is new. Everything stays editable in the admin.
 *
 *   npm run import:live-site                       import
 *   npm run import:live-site -- --dry              show what would be imported, change nothing
 *   npm run import:live-site -- --allow-expired-certificate
 *        the current site's security certificate has expired; this reads its
 *        public pages anyway (only from xpertfintech.com, read-only)
 *   npm run import:live-site -- --logos-approved   show imported client logos (you confirm
 *                                                  XFL has permission, as the old site shows them)
 *
 * What is recognised automatically is listed in live-site-import/report.md,
 * with every page's text saved next to it for reference.
 *
 * It also adds the portrait photos in prisma/seed-media/people/ to the media
 * library (tagged "portrait"), ready to pick in Admin → People.
 */
import { createHash, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { PrismaClient, type PersonGroup } from "@prisma/client";
import { sniff } from "../src/lib/media/inspect";

const SITE = (process.env.LIVE_SITE_URL || "https://www.xpertfintech.com").replace(/\/+$/, "");
const DRY = process.argv.includes("--dry");
const ALLOW_EXPIRED = process.argv.includes("--allow-expired-certificate");
const LOGOS_APPROVED = process.argv.includes("--logos-approved");
const OUT = path.join(process.cwd(), "live-site-import");
const STORE = path.join(process.cwd(), "storage", "media");
const UA = "Mozilla/5.0 (compatible; XpertFintechSiteImport/1.0)";

const db = new PrismaClient();
const report: string[] = [];
const log = (line: string) => {
  report.push(line);
  console.log(line);
};

// ── HTTP: plain GET with redirects; optionally tolerate the old site's expired certificate ──

const siteHost = new URL(SITE).hostname.replace(/^www\./, "");
function get(url: string, redirects = 5): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === "http:" ? http : https;
    // Only the old site's own hosts may skip the expiry check, and only when asked.
    const lenient = ALLOW_EXPIRED && u.hostname.replace(/^www\./, "") === siteHost;
    const req = lib.get(
      url,
      { headers: { "User-Agent": UA, Accept: "*/*" }, timeout: 30_000, ...(lenient && u.protocol === "https:" ? { rejectUnauthorized: false } : {}) },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
          res.resume();
          return resolve(get(new URL(res.headers.location, url).toString(), redirects - 1));
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (c: Buffer) => {
          size += c.length;
          if (size > 25 * 1024 * 1024) req.destroy(new Error("response too large"));
          else chunks.push(c);
        });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }));
        res.on("error", reject);
      },
    );
    req.on("timeout", () => req.destroy(new Error("timed out")));
    req.on("error", reject);
  });
}

async function getJson<T>(url: string): Promise<{ data: T; totalPages: number }> {
  const r = await get(url);
  if (r.status !== 200) throw new Error(`HTTP ${r.status} from ${url}`);
  return { data: JSON.parse(r.body.toString("utf8")) as T, totalPages: Number(r.headers["x-wp-totalpages"] ?? 1) };
}

async function getAll<T>(endpoint: string, fields: string): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page <= 50; page++) {
    const sep = endpoint.includes("?") ? "&" : "?";
    let res: { data: T[]; totalPages: number };
    try {
      res = await getJson<T[]>(`${SITE}/wp-json/wp/v2/${endpoint}${sep}per_page=100&page=${page}&_fields=${fields}`);
    } catch (error) {
      if (page === 1) throw error;
      break;
    }
    out.push(...res.data);
    if (page >= res.totalPages || res.data.length < 100) break;
  }
  return out;
}

// ── HTML → a flat list of what a reader sees, in order ──

type Item =
  | { t: "img"; src: string; alt: string; ctx: string }
  | { t: "text"; text: string; heading: number; ctx: string }
  | { t: "link"; href: string; text: string; ctx: string };

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", hellip: "…" };
const decode = (s: string) =>
  s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
const attr = (tag: string, name: string) => {
  const m = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
  return m ? decode(m[2] ?? m[3] ?? m[4] ?? "") : "";
};
const BLOCK = /^(p|div|section|article|li|ul|ol|h[1-6]|blockquote|figure|figcaption|td|th|tr|br|header|footer|span)$/i;

function flatten(html: string): Item[] {
  const clean = html.replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ");
  const items: Item[] = [];
  const stack: { tag: string; cls: string }[] = [];
  let buf = "";
  let heading = 0;
  const ctx = () => stack.map((s) => s.cls).join(" ").slice(-400);
  const flush = () => {
    const text = decode(buf).replace(/\s+/g, " ").trim();
    if (text) items.push({ t: "text", text, heading, ctx: ctx() });
    buf = "";
  };
  for (const m of clean.matchAll(/<\/?([a-zA-Z0-9]+)\b[^>]*>|[^<]+/g)) {
    const tok = m[0];
    const tag = m[1]?.toLowerCase();
    if (!tag) {
      buf += tok;
      continue;
    }
    const closing = tok.startsWith("</");
    if (tag === "img") {
      flush();
      const src = attr(tok, "data-src") || attr(tok, "data-lazy-src") || attr(tok, "src") || (attr(tok, "srcset").split(",")[0] ?? "").trim().split(" ")[0] || "";
      if (src && !src.startsWith("data:")) items.push({ t: "img", src: new URL(src, SITE).toString(), alt: attr(tok, "alt"), ctx: ctx() });
      continue;
    }
    if (tag === "a" && !closing) {
      const href = attr(tok, "href");
      if (/^mailto:|linkedin\.com\//i.test(href)) items.push({ t: "link", href, text: "", ctx: ctx() });
    }
    if (BLOCK.test(tag) || tag === "a") {
      if (tag !== "a" && tag !== "span") flush();
      if (/^h[1-6]$/.test(tag)) heading = closing ? 0 : Number(tag[1]);
      if (!closing && !tok.endsWith("/>") && tag !== "br") stack.push({ tag, cls: attr(tok, "class") });
      if (closing) {
        const at = stack.map((s) => s.tag).lastIndexOf(tag);
        if (at >= 0) stack.length = at;
      }
    }
  }
  flush();
  return items;
}

const htmlToText = (html: string) =>
  flatten(html)
    .filter((i): i is Extract<Item, { t: "text" }> => i.t === "text")
    .map((i) => i.text)
    .join("\n\n");

// ── Recognisers ──

const NAME =
  /^(?:(?:Md\.?|Mohammad|Mohammed|Muhammad|Mohd\.?|Mr\.?|Mrs\.?|Ms\.?|Dr\.?|Engr\.?|Prof\.?|Barrister|Syed|Sheikh|Sk\.?)\s+)?[A-Z][A-Za-z.'’-]+(?:\s+(?:[A-Z][A-Za-z.'’-]+|al|bin|ud|uddin)){1,5}$/;
const NOT_NAME = /\b(Ltd|Limited|Securities|Bank|Exchange|Fintech|Board|Team|Management|Committee|Directors?|Services|Solutions|Company|Contact|About|Read|More|Trading|Platform|System|Products?|Our|Home|Policy|Privacy|Terms|Brokerage|Market|Capital|Investment|Consortium|News|Events?|Careers?)\b/;
const ROLE = /\b(Chairman|Chairperson|Vice|Director|Officer|Head|Manager|CEO|CTO|CFO|COO|CIO|CISO|Engineer|Lead|Executive|Secretary|Advis[oe]r|Member|Developer|Analyst|Consultant|President|Founder|Partner|Architect|Designer|Coordinator|Specialist|Administrator|Accountant)\b/i;

const isName = (s: string) => s.length <= 60 && NAME.test(s) && !NOT_NAME.test(s);

type FoundPerson = { name: string; title: string | null; photo: string | null; email: string | null; linkedin: string | null; group: PersonGroup; page: string };
type FoundQuote = { quote: string; name: string; role: string | null; page: string };
type FoundLogo = { name: string; src: string; page: string };

function groupFor(context: string, title: string | null): PersonGroup {
  if (/board|director/i.test(context) && !/management|team/i.test(context)) return "BOARD";
  if (/management|leadership|executive/i.test(context)) return "MANAGEMENT";
  if (/team|people|staff/i.test(context)) return "TEAM";
  if (title && /chairman|independent director|^director$|nominee director/i.test(title)) return "BOARD";
  if (title && /chief|managing director|head|ceo|cto|cfo|coo/i.test(title)) return "MANAGEMENT";
  return "TEAM";
}

const titleCase = (s: string) => s.replace(/\b([a-z])([a-z]*)/g, (_, a: string, b: string) => a.toUpperCase() + b);

function recognise(items: Item[], page: string) {
  const people: FoundPerson[] = [];
  const quotes: FoundQuote[] = [];
  const logos: FoundLogo[] = [];
  const usedImg = new Set<number>();
  const quoteNames = new Set<number>();

  // Section titles (headings) give each item its context: "Board of Directors", "Our clients"…
  const sectionAt: string[] = [];
  let section = page;
  items.forEach((it, i) => {
    if (it.t === "text" && it.heading && it.text.length < 80 && !isName(it.text)) section = `${page} ${it.text}`;
    sectionAt[i] = section;
  });
  const isClientSection = (s: string) => /client|partner|trusted|customer|brokerage houses/i.test(s.replace(page, ""));

  // 1. Testimonials: a long quoted passage followed by who said it.
  items.forEach((it, i) => {
    if (it.t !== "text" || it.text.length < 60) return;
    if (!(/testimonial|review|quote/i.test(it.ctx) || /^[“"]/.test(it.text))) return;
    const at = items.findIndex((x, k) => k > i && k <= i + 3 && x.t === "text" && isName(x.text.replace(/^[-–—]\s*/, "")));
    if (at < 0) return;
    const who = items[at] as Extract<Item, { t: "text" }>;
    const role = items.slice(at + 1, at + 2).find((x): x is Extract<Item, { t: "text" }> => x.t === "text" && x.text.length < 120);
    quoteNames.add(at);
    quotes.push({ quote: it.text.replace(/^[“"]+|[”"]+$/g, "").trim(), name: who.text.replace(/^[-–—]\s*/, ""), role: role?.text ?? null, page });
  });

  // 2. People: a name, a photo just before it, a role just after it (not inside client or testimonial blocks).
  items.forEach((it, i) => {
    if (it.t !== "text" || !isName(it.text) || quoteNames.has(i)) return;
    if (/testimonial|review/i.test(it.ctx) || isClientSection(sectionAt[i]!)) return;
    let photo: string | null = null;
    for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
      const p = items[j]!;
      if (p.t === "img" && !usedImg.has(j)) {
        photo = p.src;
        usedImg.add(j);
        break;
      }
      if (p.t === "text" && isName(p.text)) break;
    }
    const next = items.slice(i + 1, i + 3).find((x): x is Extract<Item, { t: "text" }> => x.t === "text");
    const title = next && next.text.length <= 90 && ROLE.test(next.text) ? next.text : null;
    if (!photo && !title) return; // a name on its own is not enough
    let email: string | null = null;
    let linkedin: string | null = null;
    for (const x of items.slice(i + 1, i + 8)) {
      if (x.t === "text" && isName(x.text)) break;
      if (x.t === "link" && x.href.toLowerCase().startsWith("mailto:")) email ??= x.href.slice(7).split("?")[0]!.trim();
      if (x.t === "link" && /linkedin\.com\//i.test(x.href)) linkedin ??= x.href;
    }
    people.push({ name: it.text, title, photo, email, linkedin, group: groupFor(sectionAt[i]!, title), page });
  });

  // 3. Client logos: images under a heading about clients or partners.
  items.forEach((it, i) => {
    if (it.t !== "img" || usedImg.has(i) || !isClientSection(sectionAt[i]!)) return;
    const fromFile = decodeURIComponent(it.src.split("/").pop() ?? "")
      .replace(/\.(png|jpe?g|webp|gif|svg)$/i, "")
      .replace(/-?\d+x\d+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\blogo\b/gi, "")
      .trim();
    const name = titleCase((it.alt || fromFile).replace(/\blogo\b/gi, "").trim());
    if (name.length >= 2) logos.push({ name, src: it.src, page });
  });
  return { people, quotes, logos };
}

// ── Media library ──

const stats = { media: 0, reused: 0, articles: 0, redirects: 0, people: 0, peopleUpdated: 0, quotes: 0, clients: 0, portraits: 0, skipped: [] as string[] };
const mediaBySrc = new Map<string, string | null>();

async function storeImage(data: Buffer, originalName: string, altText: string, tags: string[]): Promise<string | null> {
  const type = sniff(data);
  if (!type || type.kind !== "IMAGE") return null;
  if (data.length > 10 * 1024 * 1024) {
    stats.skipped.push(`${originalName}: larger than 10 MB`);
    return null;
  }
  const checksum = createHash("sha256").update(data).digest("hex");
  const existing = await db.media.findFirst({ where: { checksum, deletedAt: null }, select: { id: true } });
  if (existing) {
    stats.reused++;
    return existing.id;
  }
  if (DRY) {
    stats.media++;
    return `dry-${checksum.slice(0, 8)}`;
  }
  const storageKey = `${randomUUID()}.${type.ext}`;
  await mkdir(STORE, { recursive: true });
  await writeFile(path.join(STORE, storageKey), data, { flag: "wx" });
  const media = await db.media.create({
    data: {
      kind: "IMAGE",
      storageKey,
      originalName: originalName.slice(0, 200),
      mimeType: type.mimeType,
      sizeBytes: data.length,
      width: type.width ?? null,
      height: type.height ?? null,
      checksum,
      isScanned: true,
      tags,
      translations: { create: { locale: "en", altText: altText.slice(0, 300) } },
    },
  });
  stats.media++;
  return media.id;
}

async function imageFromUrl(src: string, alt: string, tags: string[]): Promise<string | null> {
  if (mediaBySrc.has(src)) return mediaBySrc.get(src)!;
  let id: string | null = null;
  try {
    // Prefer the full-size file over a WordPress thumbnail ("photo-300x300.jpg").
    const full = src.replace(/-\d{2,4}x\d{2,4}(\.(?:png|jpe?g|webp|gif))$/i, "$1");
    let r = await get(full);
    if (r.status !== 200 && full !== src) r = await get(src);
    if (r.status === 200) id = await storeImage(r.body, decodeURIComponent(new URL(src).pathname.split("/").pop() ?? "image"), alt, tags);
    else stats.skipped.push(`${src}: HTTP ${r.status}`);
  } catch (error) {
    stats.skipped.push(`${src}: ${(error as Error).message}`);
  }
  mediaBySrc.set(src, id);
  return id;
}

async function usage(mediaId: string | null, entityType: "PERSON" | "ORGANIZATION" | "ARTICLE", entityId: string, field: string) {
  if (DRY || !mediaId || mediaId.startsWith("dry-")) return;
  await db.mediaUsage.deleteMany({ where: { entityType, entityId, field } });
  await db.mediaUsage.create({ data: { mediaId, entityType, entityId, field } });
}

// ── Importers ──

type WpRendered = { rendered: string };
type WpPost = { id: number; date: string; slug: string; link: string; title: WpRendered; excerpt: WpRendered; content: WpRendered; featured_media: number };
type WpPage = { id: number; slug: string; link: string; title: WpRendered; content: WpRendered };
type WpMedia = { id: number; source_url: string; alt_text: string; title: WpRendered; mime_type: string };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 80);

async function importMediaLibrary(): Promise<Map<number, string | null>> {
  const byWpId = new Map<number, string | null>();
  const items = await getAll<WpMedia>("media", "id,source_url,alt_text,title,mime_type");
  log(`\n## Media library\n\n${items.length} files on the old site.`);
  for (const m of items) {
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(m.mime_type)) continue;
    const alt = m.alt_text || decode(m.title.rendered.replace(/<[^>]+>/g, "")) || "";
    byWpId.set(m.id, await imageFromUrl(m.source_url, alt, ["imported", "old-site"]));
  }
  return byWpId;
}

async function importPosts(mediaIds: Map<number, string | null>) {
  const posts = await getAll<WpPost>("posts", "id,date,slug,link,title,excerpt,content,featured_media");
  log(`\n## News\n\n${posts.length} posts.`);
  for (const p of posts) {
    const title = decode(p.title.rendered.replace(/<[^>]+>/g, "")).trim();
    const slug = slugify(decodeURIComponent(p.slug)) || slugify(title);
    if (!slug || !title) continue;
    const exists = await db.articleTranslation.findFirst({ where: { locale: "en", slug } });
    const oldPath = new URL(p.link).pathname.replace(/\/+$/, "") || "/";
    if (exists) {
      log(`- already here: ${title}`);
    } else {
      const body = htmlToText(p.content.rendered);
      const excerpt = htmlToText(p.excerpt.rendered).slice(0, 600) || body.slice(0, 280);
      const cover = mediaIds.get(p.featured_media) ?? null;
      const date = new Date(p.date);
      log(`- ${p.date.slice(0, 10)} ${title}`);
      stats.articles++;
      if (!DRY) {
        const a = await db.article.create({
          data: {
            status: "PUBLISHED",
            publishAt: date,
            displayDate: date,
            legacyUrl: p.link,
            coverMediaId: cover && !cover.startsWith("dry-") ? cover : null,
            translations: { create: { locale: "en", slug, title: title.slice(0, 200), excerpt: excerpt || null, body: body || null } },
          },
        });
        await usage(cover, "ARTICLE", a.id, "cover");
      }
    }
    // Old address → new address, so links and search results keep working.
    if (oldPath !== "/" && !(await db.redirect.findUnique({ where: { fromPath: oldPath } }))) {
      stats.redirects++;
      if (!DRY) await db.redirect.create({ data: { fromPath: oldPath, toPath: `/en/news/${slug}`, statusCode: 301, note: "Old website news post" } });
    }
  }
}

async function importPages() {
  const pages = await getAll<WpPage>("pages", "id,slug,link,title,content");
  log(`\n## Pages\n\n${pages.length} pages. Their text is saved in live-site-import/pages/.`);
  await mkdir(path.join(OUT, "pages"), { recursive: true });
  const people: FoundPerson[] = [];
  const quotes: FoundQuote[] = [];
  const logos: FoundLogo[] = [];
  for (const p of pages) {
    const title = decode(p.title.rendered.replace(/<[^>]+>/g, "")).trim();
    const items = flatten(p.content.rendered);
    await writeFile(path.join(OUT, "pages", `${p.slug}.txt`), `${title}\n${p.link}\n\n${htmlToText(p.content.rendered)}\n`);
    const found = recognise(items, `${p.slug} ${title}`);
    people.push(...found.people);
    quotes.push(...found.quotes);
    logos.push(...found.logos);
    log(`- ${title} (${p.link}): ${found.people.length} people, ${found.quotes.length} quotes, ${found.logos.length} logos`);
    // Old page address → nearest new page, when the slug says what it is.
    const oldPath = new URL(p.link).pathname.replace(/\/+$/, "") || "/";
    const target = /about/.test(p.slug) ? "/en/company/about" : /board/.test(p.slug) ? "/en/company/board" : /management/.test(p.slug) ? "/en/company/management" : /team/.test(p.slug) ? "/en/company/team" : /contact/.test(p.slug) ? "/en/contact" : /career/.test(p.slug) ? "/en/careers" : /news|blog/.test(p.slug) ? "/en/news" : /product|service|solution/.test(p.slug) ? "/en/products" : null;
    if (target && oldPath !== "/" && !(await db.redirect.findUnique({ where: { fromPath: oldPath } }))) {
      stats.redirects++;
      if (!DRY) await db.redirect.create({ data: { fromPath: oldPath, toPath: target, statusCode: 301, note: `Old website page: ${title}` } });
    }
  }
  return { people, quotes, logos };
}

async function savePeople(found: FoundPerson[]) {
  // One entry per name; the first page that shows the person wins.
  const unique = [...new Map(found.map((p) => [p.name.toLowerCase(), p])).values()];
  log(`\n## People\n\n${unique.length} recognised.`);
  for (const [i, p] of unique.entries()) {
    const existing = await db.person.findFirst({
      where: { deletedAt: null, translations: { some: { locale: "en", name: { equals: p.name, mode: "insensitive" } } } },
      include: { roles: true },
    });
    const photo = p.photo ? await imageFromUrl(p.photo, p.name, ["imported", "old-site", "portrait"]) : null;
    log(`- ${p.name}${p.title ? `, ${p.title}` : ""} [${p.group.toLowerCase()}]${photo ? " · photo" : ""}${p.email ? ` · ${p.email}` : ""}${p.linkedin ? " · LinkedIn" : ""}${existing ? " (updated)" : " (new)"}`);
    if (DRY) continue;
    const photoId = photo && !photo.startsWith("dry-") ? photo : null;
    const data = {
      ...(photoId && { photoMediaId: photoId }),
      ...(p.email && { email: p.email.toLowerCase() }),
      ...(p.linkedin && { linkedinUrl: p.linkedin }),
      isPlaceholder: false,
      status: "PUBLISHED" as const,
    };
    const person = existing
      ? await db.person.update({ where: { id: existing.id }, data })
      : await db.person.create({ data: { ...data, key: slugify(p.name), sortOrder: i, translations: { create: { locale: "en", name: p.name } } } });
    if (existing) stats.peopleUpdated++;
    else stats.people++;
    const role = await db.personRole.upsert({
      where: { personId_group: { personId: person.id, group: p.group } },
      update: {},
      create: { personId: person.id, group: p.group, sortOrder: i },
    });
    if (p.title) {
      await db.personRoleTranslation.upsert({
        where: { roleId_locale: { roleId: role.id, locale: "en" } },
        update: { title: p.title },
        create: { roleId: role.id, locale: "en", title: p.title },
      });
    }
    await usage(photoId, "PERSON", person.id, "photo");
  }
}

async function saveQuotes(found: FoundQuote[]) {
  const unique = [...new Map(found.map((q) => [`${q.name}|${q.quote.slice(0, 40)}`, q])).values()];
  log(`\n## Testimonials\n\n${unique.length} recognised. Imported as drafts: tick “Written approval on file” and publish in Admin → Testimonials.`);
  for (const [i, q] of unique.entries()) {
    const exists = await db.testimonial.findFirst({ where: { personName: q.name, translations: { some: { quote: { startsWith: q.quote.slice(0, 40) } } } } });
    log(`- ${q.name}${q.role ? `, ${q.role}` : ""}: “${q.quote.slice(0, 80)}${q.quote.length > 80 ? "…" : ""}”${exists ? " (already here)" : ""}`);
    if (exists || DRY) continue;
    await db.testimonial.create({
      data: { personName: q.name.slice(0, 120), status: "DRAFT", sortOrder: i, translations: { create: { locale: "en", quote: q.quote.slice(0, 1200), personTitle: q.role?.slice(0, 160) ?? null } } },
    });
    stats.quotes++;
  }
}

async function saveLogos(found: FoundLogo[]) {
  const unique = [...new Map(found.map((l) => [l.name.toLowerCase(), l])).values()];
  log(`\n## Client logos\n\n${unique.length} recognised.${LOGOS_APPROVED ? "" : " Shown by name until “Written permission to show the logo” is ticked (or re-run with --logos-approved)."}`);
  for (const [i, l] of unique.entries()) {
    const existing = await db.organization.findFirst({
      where: { deletedAt: null, translations: { some: { locale: "en", name: { contains: l.name, mode: "insensitive" } } } },
    });
    const logo = await imageFromUrl(l.src, `${l.name} logo`, ["imported", "old-site", "logo"]);
    log(`- ${l.name}${existing ? " (matched an existing organization)" : " (new client)"}`);
    if (DRY) continue;
    const logoId = logo && !logo.startsWith("dry-") ? logo : null;
    const org = existing
      ? await db.organization.update({ where: { id: existing.id }, data: { ...(logoId && !existing.logoMediaId && { logoMediaId: logoId }), ...(LOGOS_APPROVED && { logoPermission: true }) } })
      : await db.organization.create({
          data: {
            kind: "CLIENT",
            status: "PUBLISHED",
            sortOrder: 100 + i,
            logoMediaId: logoId,
            logoPermission: LOGOS_APPROVED,
            translations: { create: { locale: "en", name: l.name.slice(0, 120) } },
          },
        });
    if (!existing) stats.clients++;
    if (logoId && org.logoMediaId === logoId) await usage(logoId, "ORGANIZATION", org.id, "logo");
  }
}

async function importPortraits() {
  const dir = path.join(process.cwd(), "prisma", "seed-media", "people");
  if (!existsSync(dir)) return;
  for (const f of (await readdir(dir)).filter((x) => /\.(png|jpe?g|webp)$/i.test(x)).sort()) {
    const id = await storeImage(await readFile(path.join(dir, f)), f, "Portrait", ["portrait"]);
    if (id) stats.portraits++;
  }
}

async function main() {
  console.log(`\nImporting ${SITE}${DRY ? " (dry run: nothing is changed)" : ""}\n`);
  await mkdir(OUT, { recursive: true });
  report.push(`# Import from ${SITE}\n\n${new Date().toISOString()}${DRY ? " — dry run" : ""}`);
  await importPortraits();
  try {
    await getJson<unknown>(`${SITE}/wp-json/`);
  } catch (error) {
    const msg = (error as Error).message;
    const expired = /expired|CERT_HAS_EXPIRED/i.test(msg) || /CERT_HAS_EXPIRED/.test(String((error as { code?: string }).code));
    console.error(`\n✖ Could not read ${SITE}: ${msg}`);
    if (expired && !ALLOW_EXPIRED) {
      console.error("  The old site's security certificate has expired (visitors see a warning too).");
      console.error("  To import anyway: npm run import:live-site -- --allow-expired-certificate\n");
    }
    process.exitCode = 1;
    return;
  }
  const mediaIds = await importMediaLibrary();
  await importPosts(mediaIds);
  const found = await importPages();
  await savePeople(found.people);
  await saveQuotes(found.quotes);
  await saveLogos(found.logos);
  const summary = `\n## Summary\n\n- Images added to the media library: ${stats.media} (already there: ${stats.reused})\n- Portraits added for Admin → People: ${stats.portraits}\n- News stories: ${stats.articles}\n- Redirects from old addresses: ${stats.redirects}\n- People: ${stats.people} new, ${stats.peopleUpdated} updated\n- Testimonials (drafts): ${stats.quotes}\n- New clients: ${stats.clients}\n${stats.skipped.length ? `\nSkipped:\n${stats.skipped.map((s) => `- ${s}`).join("\n")}\n` : ""}`;
  log(summary);
  await writeFile(path.join(OUT, "report.md"), report.join("\n") + "\n");
  console.log(`Report: ${path.join(OUT, "report.md")}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
