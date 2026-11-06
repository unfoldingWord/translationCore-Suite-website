# translationCore Suite — Website

Static marketing site for the [translationCore® Suite](https://translationcore-website.netlify.app) — a family of tools and resources from unfoldingWord for church-led Bible translation movements. Three pages, no build step, plain HTML/CSS/JS.

## Contents

- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Local development](#local-development)
- [Working with Claude Code](#working-with-claude-code)
- [Common maintenance tasks](#common-maintenance-tasks)
- [Shared header and footer](#shared-header-and-footer)
- [Dynamic data dependencies](#dynamic-data-dependencies)
- [Branch strategy](#branch-strategy)
- [Deploying to Netlify](#deploying-to-netlify)
- [Troubleshooting](#troubleshooting)

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Markup | Plain HTML5 |
| Styles | Single `style.css` (1,800 lines), Avenir Next self-hosted, `clamp()` for responsive sizing |
| Scripts | Vanilla JS, `defer` loaded, no framework or bundler |
| Fonts | Avenir Next woff2 (10 weights), served from `/assets/fonts/` |
| Hosting | [Netlify](https://app.netlify.com) — publish root, no build command |
| AI assistant | Claude Code (Anthropic) |

There is no `package.json`, no npm, and no build step. Editing a file and pushing is all that is needed to ship a change.

---

## Repository layout

```
tc-website/
├── index.html                  # Homepage — hero cards
├── style.css                   # Shared stylesheet (all pages)
├── netlify.toml                # Netlify deployment config
├── ORCHESTRATOR.md             # Architecture notes and decisions log
│
├── translationcore/
│   └── index.html              # translationCore® app product page
│
├── translation-helps/
│   └── index.html              # Translation resources page
│
├── scripts/
│   ├── header-loader.js        # Injects shared sticky header
│   ├── footer-loader.js        # Injects shared footer
│   ├── helps.js                # Book dropdown + PDF download logic (Door43 API)
│   ├── helps-dialog.js         # Modal open/close controller
│   ├── resource-links.js       # Dynamic download links (Door43 API)
│   └── tc-download.js          # Platform-aware tC app download button
│
└── assets/
    ├── fonts/                  # Avenir Next woff2 (10 variants)
    └── images/                 # Hero backgrounds, logos
```

### Pages

| Route | File | Purpose |
|-------|------|---------|
| `/` | `index.html` | Homepage — hero cards for each product/resource |
| `/translationcore/` | `translationcore/index.html` | Product page — features, download, how it works |
| `/translation-helps/` | `translation-helps/index.html` | Resources page — TN, TW, TA, source texts |

---

## Local development

The site is a static file tree. Any HTTP server works. The easiest options:

```bash
# Python (no install required)
python3 -m http.server 8080

# Node http-server (if Node is installed)
npx http-server . -c-1
```

Then open `http://localhost:8080` in a browser.

The `-c-1` flag (http-server) or the default Python server both serve files without caching, which is important when iterating on CSS.

> **Browser cache gotcha** — browsers can serve a stale `style.css` even after you save changes. If a visual change isn't appearing, do a hard-refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`) or open DevTools → Network → check "Disable cache". When shipping a significant CSS change, bump the query string on the stylesheet link in all HTML files (e.g. `style.css?v=3`) to force a fresh load for all visitors.

### Claude Code preview

If you are using Claude Code, a preview server configuration is in `.claude/launch.json`. Claude Code's built-in preview panel will start the server automatically and display a live preview in the sidebar.

---

## Working with Claude Code

This project is maintained with [Claude Code](https://claude.ai/claude-code), Anthropic's AI coding assistant. The `ORCHESTRATOR.md` file at the root contains the site architecture, design decisions log, and rules that all Claude agents follow. **Keep `ORCHESTRATOR.md` up to date** — it is the primary source of context for Claude Code sessions.

### Starting a session

1. Open the repo in Claude Code (`claude` in the terminal from the repo root, or via the IDE extension).
2. Claude Code will load `ORCHESTRATOR.md` automatically.
3. Describe what you want to change in plain language.

### Example prompts

```
Update the subhead on the homepage translationCore hero to: "..."

Add a new section to the translation-helps page for the new glossary resource.

The training hero image should show more of the left side of the photo.

Run a mobile audit on all three pages and fix the most critical issues.
```

### Rules Claude Code follows for this project

These are codified in `ORCHESTRATOR.md` and enforced automatically:

- **Always branch off `develop`** — never work directly on `main`.
- **Update `.gitignore` before pushing** — especially after adding new asset files.
- **No build tools** — changes must remain plain HTML/CSS/JS.
- Use `target="_blank" rel="noopener"` on all external links.
- Use the term **"App"** (not "Software") for translationCore.

---

## Common maintenance tasks

### Updating copy (text)

Open the relevant HTML file and edit the text directly. Header and footer copy lives in `scripts/header-loader.js` and `scripts/footer-loader.js` — edit those files to change nav labels, footer columns, or the brand tagline.

### Changing a hero background image

1. Add the new image to `assets/images/`.
2. In `style.css`, find the hero rule (e.g. `.hero-training`) and update the `background-image` URL.
3. Adjust `background-position` if needed to frame the subject correctly.

```css
/* Example */
.hero-training {
  background-image: url('/assets/images/new-training-photo.jpg');
  background-position: 30% center;
}
```

### Adding a navigation link

Edit `scripts/header-loader.js`. Find the `<nav>` HTML string inside the `DOMContentLoaded` callback and add an `<a>` element. The same change appears on all three pages automatically.

### Updating the color palette

CSS custom properties are defined at the top of `style.css`:

```css
:root {
  --tc-teal:  #7EC8C8;
  --tc-blue:  #3DB5E5;
  --tc-amber: #E5A54B;
  --tc-dark:  #2D2D2D;
  --accent:   var(--tc-teal);
}
```

Change a value here and it propagates everywhere that property is used.

### Adding a new page

1. Create a new directory with an `index.html` (e.g. `new-page/index.html`).
2. Copy the `<head>` boilerplate from an existing page. Keep the `<link rel="stylesheet" href="/style.css?v=...">` path absolute (leading slash) so it works at any depth.
3. Add `<header id="site-header" class="site-header"></header>` and `<footer id="site-footer" class="site-footer"></footer>` placeholders.
4. Load all four shared scripts at the bottom of `<body>`:
   ```html
   <script src="/scripts/footer-loader.js" defer></script>
   <script src="/scripts/header-loader.js" defer></script>
   ```
5. Add a trailing-slash redirect in `netlify.toml` if needed.
6. Add a nav link in `scripts/header-loader.js`.

### Updating the CSS cache-bust version

When shipping a significant CSS change, increment the query string on the stylesheet `<link>` in **all three HTML files**:

```html
<!-- index.html, translationcore/index.html, translation-helps/index.html -->
<link rel="stylesheet" href="/style.css?v=3">
```

---

## Shared header and footer

Both the header and footer are injected by JavaScript rather than duplicated in each HTML file. This means there is a **single source of truth** for both:

| Element | Source file | Injected into |
|---------|------------|---------------|
| Header | `scripts/header-loader.js` | `<header id="site-header">` |
| Footer | `scripts/footer-loader.js` | `<footer id="site-footer">` |

All three HTML pages include both loader scripts with `defer`. To change the nav, footer columns, or any shared element, edit the loader file — the change appears on every page.

The header is sticky (`position: sticky; top: 0`) with a `backdrop-filter: blur` frosted-glass effect. Anchor links on all pages use `scroll-margin-top: 90px` to account for the header height.

---

## Dynamic data dependencies

Several buttons resolve their links at page load time by calling external APIs. The site degrades gracefully if any API is unavailable — links fall back to the static `releases/latest` redirect pages.

### translationCore app download (`scripts/tc-download.js`)

- **API**: GitHub Releases API — `https://api.github.com/repos/unfoldingWord/translationCore/releases/latest`
- **Behavior**: Detects the visitor's OS (Windows/macOS/Linux) from the user-agent, finds the matching platform asset in the latest release, and sets the download button's `href` directly to that file.
- **Fallback**: Links to the GitHub releases page.

### Translation Notes book selector (`scripts/helps.js`)

- **API**: Door43 Gitea API — `https://git.door43.org/api/v1/repos/unfoldingWord/en_tn/releases/latest`
- **Behavior**: Fetches the latest release tag, filters the book list to only books with an available PDF asset, and builds direct PDF download URLs.
- **Fallback tag**: `v88` (hard-coded, used if the API is unreachable).

### Resource download links (`scripts/resource-links.js`)

- **API**: Door43 Gitea API — same base URL, five repos: `en_tw`, `en_ta`, `en_ult`, `en_ust`, `en_tq`
- **Behavior**: Resolves `data-download="en_tw"` and `data-door43="en_tw"` attributes on links to version-specific URLs.
- **Fallback**: Links keep their static `releases/latest` hrefs.

> When Door43 ships a new version of any resource, the download buttons update automatically — no code change required.

---

## Branch strategy

```
main          ← production (Netlify deploys from here)
  └── develop ← integration branch (all work lands here first)
        └── feature/your-feature   ← short-lived branches
        └── fix/your-fix
```

**Rules:**

1. All feature branches are cut from `develop`.
2. Merge feature branches into `develop` when complete.
3. Merge `develop` into `main` to trigger a production deploy.
4. Delete feature branches after merging to keep the branch list clean.

```bash
# Start a new feature
git checkout develop
git pull origin develop
git checkout -b feature/update-hero-copy

# ... make changes, commit ...

git push origin feature/update-hero-copy

# When ready: merge to develop (via PR or directly)
git checkout develop
git merge feature/update-hero-copy
git push origin develop

# When ready to ship: merge develop to main
git checkout main
git merge develop
git push origin main

# Clean up
git push origin --delete feature/update-hero-copy
git branch -d feature/update-hero-copy
```

---

## Deploying to Netlify

The site is hosted at **[translationcore-website.netlify.app](https://translationcore-website.netlify.app)** and managed through [Netlify](https://app.netlify.com).

### How deployment works

Netlify watches the `main` branch. Every push to `main` triggers an automatic deploy with no build command — Netlify publishes the root directory as-is per `netlify.toml`:

```toml
[build]
  publish = "."
```

Deploy previews are generated automatically for pull requests, giving you a live URL to review before merging to `main`.

### Shipping a change

```bash
# 1. Make sure develop is up to date and passing in preview
git checkout develop
git pull origin develop

# 2. Merge to main
git checkout main
git merge develop
git push origin main
```

Netlify picks up the push within seconds. The deploy log is visible in the Netlify dashboard under **Deploys**.

### netlify.toml overview

```toml
[build]
  publish = "."               # No build step — serve root as-is

[[redirects]]                 # Enforce trailing slashes on subpage routes
  from = "/translationcore"
  to   = "/translationcore/"
  status = 301

[[headers]]
  for = "/assets/fonts/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"   # Fonts: 1 year

[[headers]]
  for = "/assets/images/*"
  [headers.values]
    Cache-Control = "public, max-age=86400"                 # Images: 1 day

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=86400"                 # CSS: 1 day
```

Fonts are cached for a year because their filenames are stable; bump the filename if you replace a font file. CSS and images are cached for one day — use the `?v=N` query string technique to bust stale CSS for visitors.

### Environment variables

This site uses no environment variables. All API calls are made client-side to public endpoints with no authentication.

---

## Troubleshooting

### A CSS or JS change isn't showing up in the browser

The browser is serving a cached version. Hard-refresh with `Cmd+Shift+R` (macOS) or `Ctrl+Shift+R` (Windows/Linux). For a persistent fix, increment the `?v=N` query string on the `<link rel="stylesheet">` tag in all HTML files.

### The download button on the homepage shows the wrong platform or a dead link

`tc-download.js` reads `navigator.userAgent` to detect the platform and calls the GitHub API. Check:
1. The GitHub releases page at `https://github.com/unfoldingWord/translationCore/releases` — confirm a release exists and its asset names match the expected pattern (`tC-win-x64-LITE`, `tC-mac-arm64-LITE`, etc.).
2. The browser console for a network error on the GitHub API request.

### The book dropdown in the Translation Notes dialog is empty

`helps.js` is failing to fetch from the Door43 API. Check:
1. The browser console for a CORS or network error.
2. `https://git.door43.org/api/v1/repos/unfoldingWord/en_tn/releases/latest` — confirm the API is reachable and returns a valid JSON response.
3. If the API is down, the dialog falls back to a hard-coded version tag (`v88`). Update that fallback in `helps.js` if the resource has advanced significantly.

### Resource download links on the translation-helps page are going to the wrong version

`resource-links.js` fetches the latest tag for each repo at page load. If it fetched a stale tag:
1. Reload the page — the script runs fresh on every load.
2. Check the Door43 API for each repo: `https://git.door43.org/api/v1/repos/unfoldingWord/en_tw/releases/latest`.

### The header or footer isn't appearing

The header and footer are JS-injected. If they're missing:
1. Check the browser console for a JS error in `header-loader.js` or `footer-loader.js`.
2. Confirm both `<header id="site-header">` and `<footer id="site-footer">` placeholders exist in the HTML.
3. Confirm both scripts are loaded at the bottom of `<body>` with `defer`.

### Netlify deploy failed

Check the **Deploys** tab in the Netlify dashboard for the error log. Common causes:
- A file referenced in HTML doesn't exist in the repo (e.g. a missing image asset).
- A redirect rule in `netlify.toml` has a syntax error.

Since there is no build step, most deploy failures are configuration issues rather than compilation errors.
