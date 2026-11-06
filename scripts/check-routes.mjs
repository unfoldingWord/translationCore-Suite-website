// Post-build route check (run after `npm run build`), the translationCore
// counterpart of openbiblestories.org's check:routes. Fails when:
//  - a sitemap URL, hreflang alternate, canonical, /llms.txt or /llms-full.txt URL has no
//    built file behind it
//  - an internal link or image (href/src) on any built page does not resolve
//    — including the /tc-help/ pages' own relative links
//  - a /tc-help/ page, the help sitemap or /llms.txt links a help page with
//    its .html extension (Cloudflare Pages 308-redirects /x.html to /x, so
//    such a link costs every visitor a redirect and splits the URL)
//  - a page has no <h1>, more than one, or a canonical that is not its own URL
//  - a localized page is missing a locale, or its hreflang set is incomplete
//  - a _redirects target was not built, or a redirect chains into another
//  - /llms-full.txt has a raw HTML tag, an undecoded entity or unbalanced **
//  - the output passes Cloudflare Pages' 20,000-file limit
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, posix } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');
const SITE = 'https://translationcore.com';
const LOCALES = 16;
const MAX_FILES = 20000;

let errors = 0;
const err = (m) => {
  console.error('ERROR', m);
  errors++;
};

if (!existsSync(DIST)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const files = walk(DIST);
const rel = (p) => '/' + p.slice(DIST.length + 1).split('\\').join('/');

/** Does a site path resolve to a built file, the way Pages serves it? */
function resolves(pathname) {
  const p = decodeURIComponent(pathname.split('#')[0].split('?')[0]);
  if (p.endsWith('/')) return existsSync(join(DIST, p, 'index.html'));
  if (existsSync(join(DIST, p)) && statSync(join(DIST, p)).isFile()) return true;
  return existsSync(join(DIST, p + '.html'));
}

// Redirect sources are valid link targets too (they are real URLs).
const redirects = readFileSync(join(DIST, '_redirects'), 'utf8')
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith('#'))
  .map((l) => l.split(/\s+/));
const redirectSources = new Set(redirects.filter(([from]) => from.startsWith('/')).map(([from]) => from));

if (files.length > MAX_FILES) err(`${files.length} files in dist/ — Cloudflare Pages refuses more than ${MAX_FILES}`);

const htmlFiles = files.filter((f) => f.endsWith('.html'));
const canonicals = new Map();
for (const f of htmlFiles) {
  const path = rel(f);
  const html = readFileSync(f, 'utf8');
  const isHelp = path.startsWith('/tc-help/');
  const pageUrl = path.endsWith('/index.html') ? path.slice(0, -'index.html'.length) : path;

  // Internal links and images. tc-help pages use relative links.
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const raw = m[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:|#)/.test(raw)) continue;
    const target = raw.startsWith('/') ? raw : posix.join(posix.dirname(path), raw);
    const bare = target.split('#')[0].split('?')[0];
    if (!bare) continue;
    if (!resolves(bare) && !redirectSources.has(bare)) err(`${path}: link to ${raw} does not resolve`);
    if (isHelp && /\.html(#|\?|$)/.test(bare)) err(`${path}: link to ${raw} uses .html (Pages redirects it; link /tc-help/x instead)`);
  }
  for (const m of html.matchAll(/https:\/\/translationcore\.com(\/[^"'\s<)]*)/g)) {
    if (!resolves(m[1]) && !redirectSources.has(m[1])) err(`${path}: absolute link ${m[0]} does not resolve`);
  }

  if (isHelp || path === '/404.html' || path === '/404/index.html') continue;
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) err(`${path}: ${h1s} <h1> elements (want exactly 1)`);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (canonical !== SITE + pageUrl) err(`${path}: canonical ${canonical} is not ${SITE + pageUrl}`);
  canonicals.set(pageUrl, html);
  const alts = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];
  if (alts.length) {
    if (alts.length !== LOCALES + 1) err(`${path}: ${alts.length} hreflang links (want ${LOCALES} + x-default)`);
    for (const [, lang, href] of alts) {
      if (!href.startsWith(SITE)) err(`${path}: hreflang ${lang} not on ${SITE}`);
      else if (!resolves(href.slice(SITE.length))) err(`${path}: hreflang ${lang} → ${href} not built`);
    }
    if (!alts.some(([, , href]) => href === SITE + pageUrl)) err(`${path}: hreflang set does not include the page itself`);
  }
}

// Sitemaps
const index = readFileSync(join(DIST, 'sitemap-index.xml'), 'utf8');
const maps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!maps.length) err('sitemap-index.xml lists no sitemaps');
let sitemapUrls = 0;
for (const map of maps) {
  const p = map.slice(SITE.length);
  if (!existsSync(join(DIST, p))) {
    err(`sitemap-index lists ${map}, which was not built`);
    continue;
  }
  const xml = readFileSync(join(DIST, p), 'utf8');
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    sitemapUrls++;
    if (!m[1].startsWith(SITE) || !resolves(m[1].slice(SITE.length))) err(`${p}: ${m[1]} not built`);
    if (/\.html$/.test(m[1])) err(`${p}: ${m[1]} uses .html (Pages redirects it)`);
  }
  for (const m of xml.matchAll(/hreflang="[^"]+" href="([^"]+)"/g)) {
    if (!resolves(m[1].slice(SITE.length))) err(`${p}: alternate ${m[1]} not built`);
  }
}
const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${SITE}/sitemap-index.xml`)) err('robots.txt does not point at the sitemap index');
if (/^\s*(Disallow|Content-Signal)\s*:/im.test(robots)) err('robots.txt carries a Disallow or Content-Signal directive');

// llms.txt
const llms = readFileSync(join(DIST, 'llms.txt'), 'utf8');
for (const m of llms.matchAll(/\((https:\/\/translationcore\.com[^)\s]*)\)/g)) {
  if (!resolves(m[1].slice(SITE.length))) err(`llms.txt: ${m[1]} not built`);
  if (/\.html$/.test(m[1])) err(`llms.txt: ${m[1]} uses .html (Pages redirects it)`);
}

// llms-full.txt: every URL built, and the HTML → Markdown conversion left no
// raw tags, undecoded entities, or unbalanced ** on any line.
const llmsFull = readFileSync(join(DIST, 'llms-full.txt'), 'utf8');
for (const m of llmsFull.matchAll(/\((https:\/\/translationcore\.com[^)\s]*)\)/g)) {
  if (!resolves(m[1].slice(SITE.length))) err(`llms-full.txt: ${m[1]} not built`);
}
llmsFull.split('\n').forEach((line, i) => {
  if (/<\/?[a-z][^>]*>/i.test(line)) err(`llms-full.txt:${i + 1}: raw HTML tag: ${line}`);
  if (/&(#x?[0-9a-f]+|[a-z]+);/i.test(line)) err(`llms-full.txt:${i + 1}: undecoded entity: ${line}`);
  if ((line.match(/\*\*/g) || []).length % 2) err(`llms-full.txt:${i + 1}: unbalanced **: ${line}`);
});

// Redirects: every target built (or external), no chains.
for (const [from, to, status] of redirects) {
  if (!['301', '302'].includes(status)) err(`_redirects: ${from} has status ${status}`);
  const target = to.startsWith(SITE) ? to.slice(SITE.length) : to;
  if (target.startsWith('/')) {
    const t = target.replace(':splat', '');
    if (!resolves(t)) err(`_redirects: ${from} → ${to} not built`);
    if (redirectSources.has(t.split('#')[0])) err(`_redirects: ${from} → ${to} chains into another redirect`);
  }
}

console.log(`${htmlFiles.length} HTML pages, ${files.length} files, ${sitemapUrls} sitemap URLs, ${redirects.length} redirects checked.`);
console.log(errors ? `\n${errors} error(s)` : 'All route checks passed.');
process.exit(errors ? 1 : 0);
