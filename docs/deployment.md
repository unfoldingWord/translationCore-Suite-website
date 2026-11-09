# Deploying translationcore.com on Cloudflare Pages

**Status:** live since 2026-11-09. Both `translationcore.com` and `www.translationcore.com` are attached to the Pages project, the `www_to_apex` Redirect Rule is in place, and the step 4 checks pass. The steps below record how it was set up, for a rebuild or a similar site.

One-time setup. The repository side (`wrangler.jsonc`, `public/_headers`, `public/_redirects`, `public/robots.txt`) is already in place; these steps are the dashboard side, which cannot be done from the repository. They mirror how openbiblestories.org is deployed (Pages project `obs-website`).

## 1. Create the Pages project

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Pick the GitHub repository **unfoldingWord/translationCore-Suite-website**. If it is not listed, use "Add account" / "Configure GitHub App" to give the Cloudflare app access to it.
3. Set up builds:
   - **Project name:** `translationcore-website`. It must match `name` in `wrangler.jsonc`, or the build fails. If you choose another name, change it there too.
   - **Production branch:** `main`
   - **Framework preset:** Astro
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - Node version comes from `.nvmrc` (22); no environment variable is needed.
4. **Save and Deploy.** The first build publishes `main` to `translationcore-website.pages.dev` (Cloudflare may add a suffix if that name is taken; the project's overview page shows the real URL). Open it and spot-check `/`, `/es/`, `/ar/desktop/`, `/tc-help/` and `/sitemap-index.xml`.

Every other branch and every pull request then gets its own preview at `<branch>.translationcore-website.pages.dev`. Cloudflare sends `X-Robots-Tag: noindex` on preview URLs, so they stay out of search results.

## 2. Attach the domain (this is the go-live step)

Before go-live, translationcore.com served the previous Netlify site. Attaching the domain to the Pages project replaced it.

1. Pages project → **Custom domains** → **Set up a custom domain** → `translationcore.com` → **Continue** → **Activate domain**.
2. Repeat for `www.translationcore.com`. **Both hostnames must be attached**, or `www` does not serve the site at all.
3. DNS:
   - **If the `translationcore.com` zone is on Cloudflare in the same account**, Cloudflare creates the records for you: a CNAME on the apex (flattened) and on `www`, both pointing at `translationcore-website.pages.dev`. Any existing A/AAAA/CNAME records for `@` or `www` pointing at Netlify must be removed first, or the activation stays pending.
   - **If the zone is not on Cloudflare**, either move the domain's nameservers to Cloudflare (recommended: it is required for an apex custom domain), or for `www` only, add a CNAME `www → translationcore-website.pages.dev` at the current DNS host.
4. Wait for both domains to show **Active** (certificate issued). Usually minutes; DNS changes can take longer.
5. Add the `www` → apex redirect as a zone rule (`public/_redirects` cannot do it: Pages ignores domain-level rules there). translationcore.com zone → **Rules → Redirect Rules → Create rule**, matching the `www_to_apex` rule on openbiblestories.org:
   - **Rule name:** `www_to_apex`
   - **If incoming requests match:** Wildcard pattern, request URL `https://www.translationcore.com/*`
   - **Then:** target URL `https://translationcore.com/${1}`, status **301**, **Preserve query string** on
   - **Deploy**
6. After cut-over, remove the custom domain from the old Netlify site so it stops renewing a certificate for it.

Leave the zone's other records alone: `create` (Netlify), `study` (`tc-study.pages.dev`), `admin` (the `tc-admin` Worker), and the MX, SPF and `_github-challenge` records.

## 3. Zone settings that override the repository

- **Bots / AI crawlers:** Security → Settings → **AI Crawler and Agent access policies**: every category (Search, Training, Agents, each personal agent) set to **Allow (do not block)**, and **Bot Preference Sync** turned **off**. With sync on, Cloudflare prepends its own content-signals block to `public/robots.txt` (see README → Crawlers and AI policy). AI Crawl Control → Signals should show "Not set" for each hostname. Bot Fight Mode and AI Labyrinth stay off.
- **Caching:** the zone has no Cache Rules. Public pages should return the `cache-control` from `public/_headers`; if they come back `no-store` or with a different `max-age`, a Cache Rule or the zone's Browser Cache TTL is overriding it. `cf-cache-status: DYNAMIC` on HTML is normal for Pages (openbiblestories.org shows the same). The zone's Browser Cache TTL is 4 hours, and as of go-live it does not override the header; "Respect Existing Headers" would rule that out.

## 4. Verify production

```
curl -sI https://www.translationcore.com/desktop/       # expect 301 -> https://translationcore.com/desktop/ (zone rule)
curl -sI https://translationcore.com/translation-helps/  # expect 301 -> /resources/
curl -sI https://translationcore.com/                    # expect cache-control: public, max-age=300, s-maxage=86400, ...
curl -s  https://translationcore.com/robots.txt | head   # no Disallow, no Content-Signal
curl -s  https://translationcore.com/sitemap-index.xml
```

Then follow `docs/search-visibility.md` (Search Console and Bing).

## Optional: deploy without the Git integration

`npx wrangler pages deploy dist --project-name translationcore-website` uploads a local build. It needs a Cloudflare API token with the *Cloudflare Pages: Edit* permission in `CLOUDFLARE_API_TOKEN` (and `CLOUDFLARE_ACCOUNT_ID`). The Git integration above is the intended path; this is only for emergencies.
