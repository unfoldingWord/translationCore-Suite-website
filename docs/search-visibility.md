# Search visibility

What to do once translationcore.com is served by the new site (see `deployment.md`).

## Search Console and Bing

1. Google Search Console → **Add property** → **Domain** → `translationcore.com` (verify with the DNS TXT record Cloudflare can add for you). A domain property covers `www` and both protocols.
2. **Sitemaps** → submit `https://translationcore.com/sitemap-index.xml`. It lists `sitemap-pages.xml` (the 6 localized pages in 16 languages, with hreflang, plus the 2 legal pages) and `sitemap-help.xml` (the Desktop help pages).
3. **URL inspection** on `/`, `/desktop/` and one locale (for example `/es/`) → Request indexing.
4. Bing Webmaster Tools → **Import from Google Search Console** (or add the site and submit the same sitemap). Bing also feeds DuckDuckGo and ChatGPT search.
5. Cloudflare → translationcore.com → **Caching → Configuration → Crawler Hints**: on (since Nov 9, 2026). Cloudflare sends IndexNow notices to Bing, Yandex and the other IndexNow engines when pages change, so no IndexNow key file is needed in `public/`.

## What to watch

- **Pages → Not found (404):** every URL there is either an old link that needs a `_redirects` rule, or a typo elsewhere. The old Netlify addresses (`/translationcore/`, `/tc4/`, `/translation-helps/`) and the `.html` names are already redirected.
- **Pages → Alternate page with proper canonical / Duplicate:** should list only URLs that redirect; anything else means a canonical is wrong (`check:routes` asserts canonicals at build time).
- **International targeting / hreflang errors:** should be none; `check:routes` asserts every page carries all 16 alternates plus `x-default` and that each resolves.
- **Enhancements → Software apps:** the Desktop and Mobile `SoftwareApplication` / `MobileApplication` structured data shows up here. Google's rich-result support for software apps is limited, so warnings about missing `aggregateRating` are expected and should not be "fixed" with invented ratings.

## Generative answers (GEO)

Run the open-source audit against production after any change to `<head>`, JSON-LD or `robots.txt`:

```
uvx --from geo-optimizer-skill geo audit --url https://translationcore.com
```

openbiblestories.org keeps this in the 90s. A pages.dev preview scores lower because of its `noindex` header; audit production only.
