// Sitemaps (same shape as openbiblestories.org): an index pointing at one
// file for the marketing pages — every locale of every localized page, each
// with the full reciprocal hreflang set + x-default, plus the English-only
// legal pages — and one for the translationCore Desktop help pages under
// /tc-help/, which are static HTML carried over unchanged.
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { locales, defaultLocale, localePath, localizedSlugs, englishOnlySlugs } from '../i18n/config';
import { SITE_URL } from './jsonld';

const SITE = SITE_URL;

export function xmlResponse(body: string): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${body}`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}

export const SITEMAP_FILES = ['sitemap-pages.xml', 'sitemap-help.xml'];

export function sitemapIndex(): string {
  const items = SITEMAP_FILES.map((f) => `  <sitemap><loc>${SITE}/${f}</loc></sitemap>`).join('\n');
  return `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>\n`;
}

export function pagesSitemap(): string {
  const urls: string[] = [];
  for (const slug of localizedSlugs) {
    const alternates = [
      ...locales.map((l) => `    <xhtml:link rel="alternate" hreflang="${l.tag}" href="${SITE}${localePath(l.code, slug)}"/>`),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${localePath(defaultLocale, slug)}"/>`,
    ].join('\n');
    for (const l of locales) {
      urls.push(`  <url>\n    <loc>${SITE}${localePath(l.code, slug)}</loc>\n${alternates}\n  </url>`);
    }
  }
  for (const slug of englishOnlySlugs) {
    if (slug === '404') continue;
    urls.push(`  <url>\n    <loc>${SITE}${localePath(defaultLocale, slug)}</loc>\n  </url>`);
  }
  return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}

/** Every page of the Desktop help site, read from public/tc-help/ at build
 *  time so a page added there is listed without editing this file. The URLs
 *  are extensionless: Cloudflare Pages serves /tc-help/x for x.html and
 *  308-redirects /tc-help/x.html to it, so the help pages link that way too.
 *  The search results page is not a landing page and is left out. */
export function helpPages(): string[] {
  const dir = fileURLToPath(new URL('../../public/tc-help/', import.meta.url));
  return readdirSync(dir)
    .filter((f) => f.endsWith('.html') && f !== 'search.html')
    .sort()
    .map((f) => (f === 'index.html' ? '/tc-help/' : `/tc-help/${f.slice(0, -'.html'.length)}`));
}

export function helpSitemap(): string {
  const urls = helpPages().map((p) => `  <url>\n    <loc>${SITE}${p}</loc>\n  </url>`);
  return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}
