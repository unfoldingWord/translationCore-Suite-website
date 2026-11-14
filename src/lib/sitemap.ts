// Sitemaps (same shape as openbiblestories.org): an index pointing at one
// file for the marketing pages — every locale of every localized page, each
// with the full reciprocal hreflang set + x-default, plus the English-only
// legal pages — and one for the translationCore Desktop help pages under
// /tc-help/ and /{lang}/tc-help/, with the same hreflang set (src/lib/tc-help.ts).
import { locales, defaultLocale, localePath, localizedSlugs, englishOnlySlugs } from '../i18n/config';
import { SITE_URL } from './jsonld';
import { helpPageNames, helpPath } from './tc-help';

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

/** The Desktop help pages (src/tc-help/*.html), so a page added there is
 *  listed without editing this file. The URLs are extensionless: Cloudflare
 *  Pages serves /tc-help/x for x.html and 308-redirects /tc-help/x.html to
 *  it, so the help pages link that way too. The search results page is not a
 *  landing page and is left out. */
function helpLandingPages(): string[] {
  return helpPageNames.filter((p) => p !== 'search');
}

/** The English help URLs (/llms.txt lists these). */
export function helpPages(): string[] {
  return helpLandingPages().map((p) => helpPath(defaultLocale, p));
}

export function helpSitemap(): string {
  const urls: string[] = [];
  for (const page of helpLandingPages()) {
    const alternates = [
      ...locales.map((l) => `    <xhtml:link rel="alternate" hreflang="${l.tag}" href="${SITE}${helpPath(l.code, page)}"/>`),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${helpPath(defaultLocale, page)}"/>`,
    ].join('\n');
    for (const l of locales) urls.push(`  <url>\n    <loc>${SITE}${helpPath(l.code, page)}</loc>\n${alternates}\n  </url>`);
  }
  return `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
}
