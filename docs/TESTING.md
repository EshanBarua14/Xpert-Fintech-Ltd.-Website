# Testing

Automated browser tests (Playwright) cover the journeys that matter most:

| File | What it proves |
| --- | --- |
| `e2e/home.spec.ts` | Home page loads (desktop and phone) with headline, menu, diagram and demo button; no browser errors; skip link works; `/` picks a language; unknown pages give 404; `/api/health` reports the database |
| `e2e/switching.spec.ts` | Switching to বাংলা keeps the page and is remembered; the theme switch toggles light/dark and survives a reload |
| `e2e/lead.spec.ts` | A demo request sent from the website appears in **Admin → Leads** (then moves it to the trash) |
| `e2e/admin-2fa.spec.ts` | An admin turns on two-factor sign-in, a wrong code is refused, a correct code signs in, and two-factor is switched off again |
| `e2e/a11y.spec.ts` | axe accessibility scan (WCAG 2.2 A/AA) of 10 pages in dark and light mode: no serious or critical issues |

## One-time setup

```bash
npm install
npm run test:e2e:install      # downloads the test browser (Chromium)
```

The lead and two-factor tests sign in to the admin. Use a **dedicated test
admin** (create it in Admin → Admins) with two-factor **off**, and give the
tests its details for the session:

```bash
export E2E_ADMIN_EMAIL=e2e-admin@xpertfintech.com
export E2E_ADMIN_PASSWORD='a-long-test-password-1'
```

(In PowerShell: `$env:E2E_ADMIN_EMAIL="…"`.) Without them those two tests are skipped.

## Running

```bash
npm run test:e2e              # all journeys; starts `npm run dev` if the site isn't running
npm run test:a11y             # accessibility scan only
npx playwright show-report    # open the HTML report with screenshots of any failure
BASE_URL=https://staging.xpertfintech.com npm run test:e2e   # against another server
```

Notes:

- The demo form accepts 5 valid requests per hour from one address. If you run
  the lead test many times in a row, restart `npm run dev` to reset the limit.
- The two-factor test waits for a fresh 30-second code, so it takes up to a minute.
- Never point the tests at the live site with a real admin account.
