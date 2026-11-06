# tc-website Orchestrator Context

## Overview
Static marketing site for **translationCore** (unfoldingWord). Hosted on **Netlify**, no build step — plain HTML/CSS/JS.

## Pages (3)
| Route | File | Purpose |
|-------|------|---------|
| `/` | `index.html` | Homepage — Tesla-style hero cards: tC App, Translation Helps, Church-Based Training, Foundations BT |
| `/translationcore/` | `translationcore/index.html` | Product page — features, downloads (v3.6.10), testimonial |
| `/translation-helps/` | `translation-helps/index.html` | Resources page — Notes, Words, Source Texts, Questions |

## Shared Assets
- **`style.css`** (1488 lines) — single file, all pages. Avenir Next self-hosted (10 weights). Two design systems: homepage heroes (Tesla-style rounded cards) and subpages (`tc-simple` class, gradient heroes + glassmorphism cards). Uses `clamp()` extensively, BEM-ish naming.
- **`scripts/header-loader.js`** — JS-injected shared header via `#site-header`. Nav + hamburger menu. Loaded by all 3 pages.
- **`scripts/footer-loader.js`** — JS-injected shared footer via `#site-footer`. 4-column layout. Loaded by all 3 pages.
- **`scripts/helps.js`** — Fetches latest release tag from Door43 Gitea API, populates Bible book dropdown, builds PDF URLs. Fallback: `v88`.
- **`scripts/helps-dialog.js`** — Modal dialog for homepage "Download Helps" button.
- **`assets/images/`** — Hero backgrounds, logos (PNG/SVG)
- **`assets/fonts/`** — Avenir Next woff2 (10 variants)

## Footer
JS-loaded via `scripts/footer-loader.js` into `<footer id="site-footer">` placeholder — same pattern as header. Single source of truth.

## Deployment
- `netlify.toml`: `publish = "."`, trailing-slash redirects, cache headers (fonts immutable, images/css/js 1 day).

## Conventions
- No build tools, npm, or bundler
- Vanilla JS, `DOMContentLoaded`, `defer` loading
- Accessibility: aria attributes, keyboard escape, focus management
- External links: `target="_blank" rel="noopener"`
- Nomenclature: "App" (not "Software") for translationCore

## Known Issues (confirmed by user)
1. ~~**Footer is triplicated**~~ — RESOLVED: unified via `footer-loader.js` (branch `feature/unify-footer`).
2. **Hardcoded download URLs** — tC v3.6.10 links in `/translationcore/` are static GitHub URLs with commit hashes. Need a better approach.
3. ~~**Header/footer must stay identical across pages**~~ — RESOLVED: both now JS-loaded from single source.

## Other Fragile Areas
- Door43 API dependency in `helps.js` (has fallback)
- Single CSS file with `!important` overrides in several places
- No tests or CI — only manual Playwright screenshot scripts in `verify_headers_*.py`

## Subagent Rules
These rules apply to every subagent spawned from this orchestrator. Append new rules as the user provides them.

1. **Branch off `develop`** — all feature and bug branches must be created from the `develop` branch, not `main`.
2. **Update `.gitignore` before pushing** — ensure `.gitignore` is current and covers any new artifacts before any push to origin.

## Decisions Log
1. Footer unified via JS loader (`footer-loader.js`) matching header pattern — branch `feature/unify-footer`
2. Header border + hero top margin removed — branch `fix/header-border-hero-margin`
3. Subpage heroes given rounded corners + margins to match homepage Tesla-style cards; `.tc-simple` background changed to white — branch `feature/subpage-style-consistency`
4. Download dialog now dynamically filters books by parsing release assets from Door43 API (only shows books with available PDFs) — branch `feature/dynamic-book-filtering`
5. Logo color palette applied throughout subpages — `--tc-teal: #7EC8C8`, `--tc-blue: #3DB5E5`, `--tc-amber: #E5A54B`, `--tc-dark: #2D2D2D`. tC hero uses blue gradient, Helps hero uses teal gradient, card stripes show all three colors, quote uses dark→teal — branch `feature/logo-color-palette`
