# translationCore website (test build)

## Repository layout

| Folder | What it is |
|---|---|
| `site/` | The website. This is the only folder that is deployed. |
| `site/tc-help/` | The translationCore Desktop help pages, carried over unchanged from the old site (the new Desktop page links to `/tc-help/`). |
| `archive/old-site/` | A snapshot of the previous Netlify site, kept as a record. Not deployed. See `archive/README.md`. |
| `go-live.sh` | Removes the noindex settings from `site/` when you are ready to be found by search engines. |

Everything below describes the `site/` folder.

Static site for translationCore: no build step, no dependencies. Open `index.html` in a browser, or serve the folder with any static host.

| Page | File | Address once live |
|---|---|---|
| Home | `index.html` | `/` |
| translationCore Desktop | `desktop.html` | `/desktop` |
| translationCore Mobile | `mobile.html` | `/mobile` |
| Biblical Resources | `resources.html` | `/resources` |
| Training & Support | `training.html` | `/training` |
| License and Trademark | `license.html` | `/license` |
| Privacy Policy | `privacy.html` | `/privacy` |
| Previous version | `previous-version.html` | `/previous-version` |

Images and fonts are in `assets/`. Scripts are in `scripts/`:

- `helps.js`, `helps-dialog.js`, `resource-links.js`: the Biblical Resources downloads. They look up the latest Door43 release so each button opens the current PDF in one click, and fall back to each resource's "latest release" page if Door43 cannot be reached.
- `analytics.js`: Google Analytics 4 (see below).

All links are relative, so the site works at a domain root or under a repo sub-path such as `https://<org>.github.io/<repo>/`.

## Put it on GitHub

1. Create a new repository (for example `tc-website-v2`).
2. Upload the contents of this folder to the repository root, including the hidden files `.nojekyll` and `.gitignore`. The archive has more than 100 files, so use the command line below rather than drag-and-drop in the browser.
3. Or from the command line:

   ```
   git init
   git add .
   git commit -m "Add translationCore website"
   git branch -M main
   git remote add origin https://github.com/<org>/<repo>.git
   git push -u origin main
   ```

## Publish

**Cloudflare Pages from the repo:** Workers & Pages > Create > Pages > Connect to Git. Framework preset: None. Build command: empty. Build output directory: `site`. Production branch: `main`. Cloudflare also reads `_headers`. Cloudflare serves `desktop.html` at `/desktop`, which matches the canonical addresses below.

`_redirects` keeps the old translationcore.com addresses working (`/translationcore/` and `/tc4/` go to `/desktop`, `/translation-helps/` goes to `/resources`), and `resources.html` carries the old section names as anchors so links like `/translation-helps/#translation-words` still land in the right place. `_headers` sets the security, indexing and caching headers (these replace the old `netlify.toml`).

**GitHub Pages:** GitHub Pages can only publish the repo root or `/docs`, so rename `site/` to `docs/` (or use a GitHub Actions workflow) if you choose it. GitHub ignores `_headers`; the `noindex` meta tag still applies.

## SEO

Every page has a unique title and description, a canonical address, Open Graph and Twitter tags, a social image (`assets/og-image.png`, 1200 x 630), and JSON-LD structured data (unfoldingWord as the organization, translationCore as the website, plus a free software application entry on the Desktop and Mobile pages). Each page has one `h1`, and every image has alt text. `robots.txt` allows all crawlers, names the main AI search crawlers explicitly, and points to `sitemap.xml`.

### AI search (GEO)

These files and tags help AI search tools read and cite the site. They were added after an audit with `geo-optimizer-skill` (homepage went from 57 to 91 out of 100 on the go-live build).

- `llms.txt`: a short Markdown summary of the site with links to every page. `llms-full.txt`: the text of every page in one file. Regenerate `llms-full.txt` when page copy changes.
- `.well-known/ai.txt` and `ai/summary.json`: AI crawler permissions and a machine-readable site summary.
- JSON-LD on every page: the Organization has a logo, contact page, `areaServed` and `sameAs` links (GitHub, Twitter, Facebook); the WebSite has a description and author; each page has a `WebPage` entry with its description and `dateModified`. The Home page also has an `FAQPage` entry that matches the visible FAQ section. Keep the two in step.
- `<meta name="author">` and a link to the translationCore Desktop releases feed on GitHub are in every page's head.
- The footer shows "Last updated". **When you change content, update the date in three places:** the footer `<time>`, `dateModified` in each page's JSON-LD, and `lastmod` in `sitemap.xml`.

To re-run the audit after going live:

```
uvx --from geo-optimizer-skill geo audit --url https://translationcore.com
```

To raise the score further: add `sameAs` links to unfoldingWord's Wikipedia, Wikidata or LinkedIn pages once confirmed (worth up to 4 points; there is no Wikidata item for unfoldingWord or translationCore yet), and add a few concrete figures to the Home page.

The canonical addresses, Open Graph URLs, `robots.txt`, and `sitemap.xml` use **https://translationcore.com**. If the domain changes, search and replace it across the files.

## Go live (turn indexing on)

The test build is hidden from search engines on purpose: each page has `<meta name="robots" content="noindex, nofollow">`, and `_headers` sends `X-Robots-Tag: noindex, nofollow`. When you are ready:

```
sh go-live.sh
git add -A && git commit -m "Go live" && git push
```

`go-live.sh` removes both. Then, after the domain points at the new site: add the site in Google Search Console, submit `https://translationcore.com/sitemap.xml`, and use URL inspection on the home page.

## Google Analytics

`scripts/analytics.js` is linked on every page and is set to the GA4 measurement ID `G-LT1CE2F1PZ`. It records page views (IP anonymization on) and three click events: `download_click` (installer and PDF downloads), `store_click` (Google Play and App Store), and `partner_click` (BT Servant, Foundations BT, Church-Based Training, Open Bible Stories, and Discord).

It only runs on `translationcore.com` and `www.translationcore.com`, so test deployments (for example a `pages.dev` preview) and local files send nothing. To check it on a preview, add that hostname to the `HOSTS` list in the file, then use Realtime in Google Analytics, and remove it again afterwards.

There is no cookie banner, which matches the Open Bible Stories website. The footer links a Privacy Policy page (`privacy.html`), adapted from the unfoldingWord policy used on openbiblestories.org, with a sentence added that names Google Analytics. Have the policy owner review it, and confirm whether EU and UK visitors need a consent step.

## Before going live

- Remove the noindex (see above).
- Check that `/tc-help/` opens on the new deployment (it is served from `site/tc-help/`).
- Confirm the Avenir Next web-font licence covers public use (fonts are in `assets/fonts/`).
- Confirm consent for the photos and quotes on the Home page.
- Add a `LICENSE` file that matches your decision for this repository (the site's License and Trademark page says MIT for software and CC BY-SA 4.0 for content).
- Review `privacy.html` with the policy owner: the "Last revised" date, and wording carried over from the Open Bible Stories policy (it mentions the Door43 Discussion Forums).
- Unverified items: the Mobile "Nairobi workshop" sentence, and the release-notes link (it points to the translationCore4 releases page).

## Editing

Edit the `.html` files in `site/` directly. Brand colours: Inspire `#31ADE3`, Ocean `#014263`, Tech `#231F20`, Cultivate `#70C9CC`, Kindle `#E59D33`.
