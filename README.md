# translationCore — website

Static site for [translationcore.com](https://translationcore.com) (unfoldingWord), built with [Astro](https://astro.build) and deployed to Cloudflare Pages. Astro is used only for shared layouts and localization: the output is plain HTML/CSS/JS with no client framework.

The engineering follows [openbiblestories.org](https://github.com/unfoldingWord/obs-website) (same Astro setup, same 16 locales and URL scheme, same Cloudflare Pages deployment, same SEO/GEO plumbing). The design, copy and layout are translationCore's own. They were carried over verbatim from the hand-written static build this repository used to hold, which is now in git history and `archive/` (see "Migration" below).

## Local development

```
npm install
npm run dev      # dev server at http://localhost:4321/
npm run build    # builds the site into dist/
npm run preview  # serves the built dist/
```

Requires Node 18.20+ (Astro's minimum); `.nvmrc` pins 22, which `npm test` needs.

Checks (CI runs all four on every pull request, `.github/workflows/checks.yml`):

```
npm test               # unit tests for the routing helpers
npm run check:locales  # every locale has every string, markup and names intact
npm run build
npm run check:routes   # after a build: every link, sitemap and hreflang URL resolves
```

## Repository layout

| Path | What it is |
|---|---|
| `src/pages/` | One `.astro` file per route. English at `src/pages/{page}/index.astro`, the other 15 locales from `src/pages/[lang]/{page}.astro`. Also the sitemaps, `/llms.txt` and `/ai/summary.json`. |
| `src/components/pages/` | The page markup, one component per localized page, rendered once per locale. |
| `src/components/` | `Header.astro` (nav, language switcher, "An initiative of" bar), `Footer.astro`, `LanguageSwitcher.astro`, `GoogleAnalytics.astro`. |
| `src/layouts/Base.astro` | The page shell: `<head>` (canonical, Open Graph, hreflang, JSON-LD), header, footer, scripts. |
| `src/i18n/` | `config.ts` (locales, routes), `content.ts` (English fallback merge), and the strings: `en/*.json` plus one folder per locale. |
| `src/lib/` | `jsonld.ts` (structured data), `sitemap.ts`, `markdown.ts` (`/llms.txt`). |
| `public/` | Copied to the site root verbatim: `assets/img/`, `assets/fonts/` (Avenir Next), `assets/css/styles.css`, `assets/js/`, `tc-help/`, `_headers`, `_redirects`, `robots.txt`. |
| `public/tc-help/` | The translationCore Desktop help pages, carried over unchanged from the old site (English only). |
| `scripts/` | Font-pack build, the check scripts, the review-sheet generator, tests. |
| `docs/` | `deployment.md` (Cloudflare setup), `search-visibility.md`, `native-review.md`. |
| `archive/old-site/` | A snapshot of the previous Netlify site, kept as a record. Not deployed. |

## Pages

| Page | English URL | Localized | Source |
|---|---|---|---|
| Home | `/` | yes | `HomePage.astro`, `home.json` |
| translationCore Desktop | `/desktop/` | yes | `DesktopPage.astro`, `desktop.json` |
| translationCore Mobile | `/mobile/` | yes | `MobilePage.astro`, `mobile.json` |
| Biblical Resources | `/resources/` | yes | `ResourcesPage.astro`, `resources.json` |
| Training & Support | `/training/` | yes | `TrainingPage.astro`, `training.json` |
| Previous version | `/previous-version/` | yes | `PreviousVersionPage.astro`, `previous-version.json` |
| License and Trademark | `/license/` | English only | `src/pages/license/index.astro` |
| Privacy Policy | `/privacy/` | English only | `src/pages/privacy/index.astro` |
| Desktop help | `/tc-help/` | English only | `public/tc-help/` (static) |
| Not found | any missing URL | English only | `src/pages/404.astro` |

## Localization

The site is published in the same 16 languages as openbiblestories.org and churchbased.bible. English lives at `/`, every other locale at `/{lang}/` (for example `/es/desktop/`). The locales are en, es, fr, hi, ru, ar, zh, sw, pt, id, vi, bn, ur, fa, my and nl, defined in `src/i18n/config.ts`.

- `src/i18n/en/*.json` holds the English source strings: one file per page plus `ui.json` (nav, footer, shared strings). `src/i18n/{lang}/*.json` holds the translations. Missing keys fall back to English automatically (deep merge in `src/i18n/content.ts`), so a partly translated locale still renders completely.
- Strings are keyed by page section and element (`downloads.h2`, `how.span3`). Many carry inline HTML from the original design, such as `<strong style="color:#014263">Start</strong> a project, or import one.` They are rendered with `set:html`, and `check:locales` fails if a translation changes any tag or attribute.
- Root-relative links inside strings (`/desktop/#downloads`) are rewritten to the current locale by `localizeLinks()`. The legal pages and `/tc-help/` stay at the root.
- **Names that are never translated** are listed in `PROTECTED` in `scripts/check-locales.mjs`: translationCore, unfoldingWord, translationNotes and the other camelCase resource names, BT Servant, Foundations BT, Open Bible Stories, Church-Based Training, Door43, ULT/UST, and so on. The check fails if a translation drops one.
- The Resources download dialog's book names, book groups and status messages are in `resources.json` → `helps`. The page renders them as JSON for `public/assets/js/helps.js`.
- **Fonts.** Avenir Next (self-hosted, `public/assets/fonts/`) covers Latin, Latin Extended, Vietnamese and Cyrillic. Arabic, Persian, Urdu (Nastaliq), Hindi, Bengali, Burmese and Chinese each get a self-hosted Noto pack. `scripts/build-font-css.mjs` builds these from `@fontsource` packages before every dev/build run, and `Base.astro` links only the current locale's pack. The overrides in `styles.css` are keyed on `<html data-script="…">`. ar, fa and ur render right-to-left.
- **The interface language is a visitor preference.** On a first visit, `public/assets/js/locale.js` matches `navigator.languages` against the 16 locales. A pick from the language switcher overrides that and is remembered in `localStorage` under `tc.locale`. Redirects happen only from the un-prefixed English URL, and only to a variant the page was built in (its hreflang cluster). A prefixed URL such as `/fr/desktop/` is someone's explicit choice and is never redirected away from.
- The legal pages, the 404 and `/tc-help/` are English only: no `/{lang}/` variants, no hreflang and no switcher (as on openbiblestories.org).
- `npm run check:locales` verifies that every locale has every file, that the structure matches English, that markup, `{placeholders}` and protected names are intact, and prints an untranslated ratio per locale.
- `npm run review -- es` (or `--priority`) writes a review sheet for a native reader: key, English, current translation, a blank column, and flags. **No translation has had a native review yet.** See `docs/native-review.md`.

Adding a string: add it to the English file, render it from the page component, and add it to each locale (or let it fall back to English until it is translated). Adding a page: a component in `src/components/pages/`, an English route, a `[lang]` route, a slug in `src/i18n/config.ts`, and an English JSON file. The sitemap, hreflang, `/llms.txt` and the switcher pick it up from the config.

## SEO and GEO

- **One JSON-LD `@graph` per page** (`src/lib/jsonld.ts`, emitted by `Base.astro`). Every page has `Organization` (unfoldingWord, with the same confirmed `sameAs` profiles openbiblestories.org uses) and `WebSite` (translationCore). Home, Desktop and Mobile also carry `SoftwareApplication` (Desktop: version, OS, download URLs, MIT license) and `MobileApplication` (Mobile: OS requirements, install URLs). The previous-version page describes the earlier release. Every fact in the structured data is stated in the page copy. **When the Desktop release changes, update `DESKTOP_VERSION` in `jsonld.ts` along with the download links in `desktop.json`/`DesktopPage.astro`.**
- **Canonical host is the bare domain** `https://translationcore.com`: the `site` in `astro.config.mjs`, every canonical/hreflang/sitemap/JSON-LD URL, and the target of the `www` redirect in `_redirects`. URLs end in `/` (`trailingSlash: 'always'`); the old `.html` and Netlify addresses 301 to them.
- **hreflang:** the full reciprocal 16-locale set plus `x-default` (→ English) on every localized page, also in `sitemap-pages.xml`. `og:locale` and `og:locale:alternate` are emitted per locale.
- **Sitemaps:** `sitemap-index.xml` → `sitemap-pages.xml` (every locale of every localized page, plus the legal pages) and `sitemap-help.xml` (every page under `/tc-help/`, read from `public/tc-help/` at build time). `robots.txt` points at the index.
- **`/llms.txt`** is a markdown index of the pages, the Desktop help and the legal pages, for fetchers that prefer markdown. **`/ai/summary.json`** restates the same public facts as JSON. Both come from the same strings and constants as the HTML, so they cannot drift. `check:routes` fails if `/llms.txt` lists a URL that was not built.
- Every page keeps its unique title and description, one `h1` (checked by `check:routes`), alt text on every image, and the 1200 × 630 social image (`assets/img/og-image.png`).
- **The GEO score.** openbiblestories.org keeps its [geo-optimizer](https://github.com/auriti-labs/geo-optimizer-skill) score in the 90s. Run the same audit against production (not a pages.dev preview, which sends `X-Robots-Tag: noindex`) after changes to `<head>`, JSON-LD or `robots.txt`:

  ```
  uvx --from geo-optimizer-skill geo audit --url https://translationcore.com
  ```

## Crawlers and AI policy

`public/robots.txt` allows **every** crawler: search engines, live-retrieval agents (OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot, …) and bulk training crawlers (GPTBot, Google-Extended, ClaudeBot, CCBot, …), each named in its own group. This is the policy openbiblestories.org adopted in [unfoldingWord/obs-website#15](https://github.com/unfoldingWord/obs-website/issues/15). The software is MIT and the content CC BY-SA 4.0, and the site exists to be found. If translationCore needs a different policy, change it here and in the Cloudflare dashboard together.

Cloudflare's **managed robots.txt** / "block AI bots" settings can prepend `Disallow` and `Content-Signal` lines ahead of this file. They must be off for the zone (Security → Bots) for the served file to match. Verify after go-live:

```
curl -fsS https://translationcore.com/robots.txt > /tmp/robots.txt \
  && ! grep -Ei '^[[:space:]]*(Disallow|Content-Signal)[[:space:]]*:' /tmp/robots.txt \
  && echo "OK: served robots.txt has no Disallow or Content-Signal directive"
```

## Google Analytics

`src/components/GoogleAnalytics.astro` loads `public/assets/js/analytics.js` in production builds only, with GA4 measurement ID `G-LT1CE2F1PZ` (override with `PUBLIC_GA_MEASUREMENT_ID`). The script records page views (IP anonymization on) and three click events: `download_click` (installer and PDF downloads), `store_click` (Google Play and App Store) and `partner_click` (BT Servant, Foundations BT, Church-Based Training, Open Bible Stories and Discord). It runs only on `translationcore.com` and `www.translationcore.com`, so pages.dev previews send nothing. To check the tag on a preview, add that hostname to `HOSTS` in the script, use Realtime in Google Analytics, and remove it again.

There is no cookie banner, which matches openbiblestories.org. The footer links the Privacy Policy, which names Google Analytics.

## Caching and redirects (`public/_headers`, `public/_redirects`)

- HTML: `public, max-age=300, s-maxage=86400, stale-while-revalidate=86400`. Browsers revalidate after five minutes, and the edge holds pages until the next deploy purges them.
- `/assets/img/*` and `/assets/fonts/*`: one year, `immutable`. `/assets/js/*` and `/assets/css/*`: `no-cache` plus `s-maxage`, because they are edited in place under the same filenames.
- `https://www.translationcore.com/*` → apex (301). This rule fires only when both hostnames are attached to the Pages project.
- Old Netlify-site addresses: `/translationcore/` and `/tc4/` → `/desktop/`; `/translation-helps/` → `/resources/`. `/resources/` keeps the old section anchors (`#translation-words`, …), so deep links still land on the right section. The static test build's `*.html` names → their trailing-slash URLs.
- Retiring a route is a two-part change: delete the page **and** add a `_redirects` rule. `check:routes` fails on a redirect whose target was not built, or one that chains.

## Deployment

Deployed to **Cloudflare Pages**: project `translationcore-website`, production branch `main`, via the Git integration. Build command `npm run build`, output directory `dist` (also declared in `wrangler.jsonc`). Every other branch gets a preview deployment at `<branch>.translationcore-website.pages.dev`.

The one-time setup (creating the project, attaching `translationcore.com` and `www.translationcore.com`, the bot settings) is in **`docs/deployment.md`**. There is no nightly rebuild: unlike openbiblestories.org, nothing on this site is read from Door43 at build time. The Resources page looks up the latest release links in the browser.

## Migration from the static build

Until this change, the repository held a hand-written static site in `site/`. It had no build step, no shared layout (each page repeated the same `<style>` block, header and footer) and English only. It was turned into this Astro project mechanically:

- Each page's markup was carried over verbatim, inline styles included, into `src/components/pages/*.astro` (localized pages) or `src/pages/{license,privacy}/index.astro`. Each visible string and `alt`/`aria-label` went into `src/i18n/en/*.json`. The shared `<style>` block became `public/assets/css/styles.css`, and the inline page script became `public/assets/js/site.js`.
- **Verified:** with the language switcher hidden, every English page renders pixel-identical to the original at 1280 px and 390 px (Chromium full-page screenshots, 0 differing pixels on all 8 pages). The switcher is the one visible addition.
- Behavioural changes: the noindex tags and `go-live.sh` are gone (production is meant to be indexed; pages.dev previews are noindexed by Cloudflare). URLs gained trailing slashes. Pages gained a skip link and a `<main>` landmark. The footer's legal links and the 404 now follow the site's routes.

## Before going live

- Confirm the Avenir Next web-font licence covers public use (fonts are in `public/assets/fonts/`).
- Confirm consent for the photos and quotes on the Home page.
- Add a `LICENSE` file that matches your decision for this repository (the License and Trademark page says MIT for software and CC BY-SA 4.0 for content).
- Review the Privacy Policy with the policy owner: the "Last revised" date, and wording carried over from the Open Bible Stories policy (it mentions the Door43 Discussion Forums).
- Unverified items carried over: the Mobile "Nairobi workshop" sentence, and the release-notes link (it points to the translationCore4 releases page).
- Native review of the translations (`docs/native-review.md`).

## Editing

Edit copy in `src/i18n/en/*.json` (and the matching key in each locale) and markup in `src/components/pages/*.astro`. Brand colours: Inspire `#31ADE3`, Ocean `#014263`, Tech `#231F20`, Cultivate `#70C9CC`, Kindle `#E59D33`.
