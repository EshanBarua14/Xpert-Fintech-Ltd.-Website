# What the admin controls (checked 15 October 2026)

Every part of the public website, where it is edited, and what can be done
with it. **C** create · **E** edit (English and Bangla) · **D** delete
(trash, restore, delete for good where the item has a trash) · **O** reorder ·
**S** show/hide or publish/unpublish. Every change in every row can be undone
and redone (Undo / Redo at the top of each admin page, Ctrl+Z / Ctrl+Shift+Z),
restored from Admin → History, and is included in the daily backup (Admin →
Backups).

| On the website | Admin → | C | E | D | O | S |
|---|---|---|---|---|---|---|
| Pages (home, about, legal, risk checks, any new page) and their sections, blocks and cards | Pages | ✓ | ✓ | ✓ | ✓ | ✓ |
| Home page flagship sections (clients, market, showcase, roles, reviews, apps, order flow, risk checks, consortium, principles, events) | Design → Home sections | – | order | – | ✓ | ✓ |
| Colours, product looks | Design | – | ✓ | reset | – | – |
| Header, footer and legal menus (links, dropdowns, descriptions) | Navigation | ✓ | ✓ | ✓ | ✓ | ✓ |
| Every interface word (buttons, headings, captions, RMS panel, consortium labels…) | Site text | – | ✓ | reset | – | – |
| Products, their features, workflow, architecture, integrations, security, use cases, users, FAQs, screenshots, demo video | Products | ✓ | ✓ | ✓ | ✓ | ✓ |
| Branded apps (Google Play, App Store and web links) | Deployments | ✓ | ✓ | ✓ | ✓ | ✓ |
| Organizations: consortium members, clients, exchanges, regulators (logo, website, TREC numbers, description) | Organizations | ✓ | ✓ | ✓ | ✓ | ✓ |
| People: board, management, consultants, team (photo, face position, roles, bio, contacts) | People, Media | ✓ | ✓ | ✓ | ✓ | ✓ |
| Chairman's and MD's messages | Messages | – | ✓ | – | – | ✓ |
| Figures ("Xpert in numbers") | Figures | ✓ | ✓ | ✓ | ✓ | – |
| Credentials (footer and home badges) | Credentials | ✓ | ✓ | ✓ | ✓ | ✓ |
| Success stories | Success stories | ✓ | ✓ | ✓ | ✓ | ✓ |
| Client reviews | Testimonials | ✓ | ✓ | ✓ | ✓ | ✓ |
| News, categories, tags | News | ✓ | ✓ | ✓ | ✓ | ✓ |
| Events (cover, gallery, participants, video) | Events | ✓ | ✓ | ✓ | ✓ | ✓ |
| Photo albums, videos | Albums, Videos | ✓ | ✓ | ✓ | ✓ | ✓ |
| Resources (brochures, documents) | Resources | ✓ | ✓ | ✓ | ✓ | ✓ |
| Careers and applications | Careers, Applications | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ecosystem map: boxes, links, guided flows | Ecosystem | ✓ | ✓ | ✓ | ✓ | ✓ |
| Market data source, Xpert's market share, goal, refresh, trading hours | Market | ✓ | ✓ | ✓ | – | ✓ |
| Company details, office, map, hours, social links, alert e-mails | Settings | – | ✓ | ✓ | – | – |
| Files and images (alt text, captions, face position) | Media | ✓ | ✓ | ✓ | – | – |
| Redirects from old addresses | Redirects | ✓ | ✓ | ✓ | – | – |
| Leads (enquiries) and their notes | Leads | ✓ | ✓ | ✓ | – | – |
| Admin accounts | Users | ✓ | ✓ | ✓ | – | ✓ |

## Built into the code (not content)

These are the design of the site rather than its content; their words are
all in Site text, but their structure changes only with a code update:

- the RMS panel's six sample orders (fictional stock and prices);
- the ecosystem map's four scenes (their captions are in Site text, the boxes
  and flows in Admin → Ecosystem);
- which product appears at which step of the order-flow story (product names,
  logos and links come from Admin → Products);
- the capability cards on the platform page (their text is in Site text).

## Undo, redo, history and backups

- **Undo / Redo** (top of every admin page; Ctrl+Z / Ctrl+Shift+Z when not
  typing in a field): steps back and forward through your own changes. One
  step is one save with everything it touched; adding, changing, trashing and
  deleting for good can all be undone. A new change clears Redo.
- **History**: every version of every item, by anyone; restore any of them
  (that restore can be undone too).
- **Backups**: a full copy of all content every day (kept 14 days), on demand
  (kept 30) and before every restore (kept 10). Download a backup to keep it
  elsewhere; restore one (or an uploaded file) to put all content back as it was.
