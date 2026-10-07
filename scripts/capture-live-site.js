/*
 * Captures the live website (www.xpertfintech.com) so its content can be
 * moved into the new site's CMS. The live site builds its pages in the
 * browser, so this runs in the browser:
 *
 *   1. Open https://www.xpertfintech.com in Chrome and wait for it to load.
 *   2. Press F12 → Console. (If Chrome asks, type "allow pasting" first.)
 *   3. Paste this whole file and press Enter.
 *   4. Wait until it says "Done": a file "xfl-live-site.json" downloads.
 *
 * It visits every page linked from the site (same domain only), one at a
 * time in a hidden frame, and records each page's headings, text, images
 * (with alt text and size) and links. Nothing is sent anywhere; it only
 * downloads a file to your computer.
 */
(async () => {
  const origin = location.origin;
  const MAX_PAGES = 150;
  const WAIT_MS = 3500; // time for each page to render
  const skip = /\.(pdf|jpe?g|png|gif|webp|svg|zip|docx?|xlsx?)(\?|$)|^mailto:|^tel:|\/wp-admin|\/admin|logout/i;
  const norm = (href) => {
    try {
      const u = new URL(href, origin);
      if (u.origin !== origin) return null;
      u.hash = "";
      return u.href.replace(/\/$/, "") || origin;
    } catch {
      return null;
    }
  };

  const extract = (doc, url) => {
    const pick = (sel) => [...doc.querySelectorAll(sel)];
    const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
    const main = doc.querySelector("main") || doc.body;
    return {
      url,
      title: doc.title,
      metaDescription: doc.querySelector('meta[name="description"]')?.content || "",
      headings: pick("h1,h2,h3,h4").map((h) => ({ level: h.tagName, text: clean(h.textContent) })).filter((h) => h.text),
      // Text in reading order, block by block.
      blocks: pick("h1,h2,h3,h4,h5,p,li,blockquote,td,th,figcaption,dt,dd,address,button,label")
        .filter((el) => main.contains(el) || el.closest("footer"))
        .map((el) => ({ tag: el.tagName, text: clean(el.innerText || el.textContent) }))
        .filter((b, i, a) => b.text && b.text.length > 1 && (i === 0 || a[i - 1].text !== b.text)),
      images: pick("img")
        .map((img) => ({ src: img.currentSrc || img.src, alt: clean(img.alt), title: clean(img.title), width: img.naturalWidth, height: img.naturalHeight, inLink: img.closest("a")?.href || null }))
        .filter((i) => i.src && !i.src.startsWith("data:")),
      backgroundImages: pick("[style*='background']")
        .map((el) => (el.getAttribute("style").match(/url\(["']?([^"')]+)/) || [])[1])
        .filter(Boolean)
        .map((u) => new URL(u, origin).href),
      links: pick("a[href]").map((a) => ({ text: clean(a.innerText || a.getAttribute("aria-label") || a.title), href: a.href })),
      navigation: pick("nav, header").map((n) => clean(n.innerText)).filter(Boolean),
      footer: clean(doc.querySelector("footer")?.innerText),
      videos: pick("iframe[src], video[src], video source[src]").map((v) => v.src),
    };
  };

  const frame = document.createElement("iframe");
  frame.style.cssText = "position:fixed;left:-10000px;top:0;width:1366px;height:900px;";
  document.body.appendChild(frame);
  const load = (url) =>
    new Promise((resolve) => {
      const done = () => setTimeout(resolve, WAIT_MS);
      frame.onload = done;
      frame.src = url;
      setTimeout(resolve, WAIT_MS * 4); // give up on pages that never finish
    });

  const queue = [norm(location.href)];
  const seen = new Set(queue);
  const pages = [];
  while (queue.length && pages.length < MAX_PAGES) {
    const url = queue.shift();
    console.log(`Capturing ${pages.length + 1}: ${url}`);
    await load(url);
    let doc;
    try {
      doc = frame.contentDocument;
    } catch {
      doc = null;
    }
    if (!doc) {
      pages.push({ url, error: "could not read this page" });
      continue;
    }
    // Scroll to the bottom so lazy-loaded sections and logos appear.
    try {
      for (let y = 0; y < doc.body.scrollHeight; y += 700) {
        frame.contentWindow.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
    } catch {}
    const page = extract(doc, url);
    pages.push(page);
    for (const l of page.links) {
      const n = norm(l.href);
      if (n && !seen.has(n) && !skip.test(l.href)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
  frame.remove();
  const blob = new Blob([JSON.stringify({ capturedAt: new Date().toISOString(), origin, pages }, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "xfl-live-site.json";
  a.click();
  console.log(`Done: ${pages.length} pages captured into xfl-live-site.json`);
})();
