// Renders the translationCore Desktop help in every locale.
//
// Source: the English pages in src/tc-help/*.html, exactly as translationCore4's
// help build wrote them (never hand-edited, so a refresh is a copy). Strings:
// src/i18n/{lang}/tc-help/*.json, keyed by a hash of the English (see
// src/lib/tc-help-i18n.mjs). A string with no translation stays English, so a
// partly translated locale still renders every page.
//
// English is served at /tc-help/, every other locale at /{lang}/tc-help/, with
// extensionless URLs (/es/tc-help/gs-install), the way Cloudflare Pages serves
// x.html. Each rendered page gains what the rest of the site has: <html lang
// dir data-script>, a canonical URL, the reciprocal hreflang set, the locale's
// font pack, the language menu and the visitor-preference redirect
// (public/assets/js/locale.js). Screenshots and the help's CSS/JS stay in
// public/tc-help/ and are shared by every locale.
import { locales, byCode, defaultLocale, fontHrefFor, localePath } from '../i18n/config';
import { translatePage, keyOf } from './tc-help-i18n.mjs';
import { SITE_URL } from './jsonld';

const sources = import.meta.glob<string>('../tc-help/*.html', { query: '?raw', import: 'default', eager: true });
const stringFiles = import.meta.glob<Record<string, string>>('../i18n/*/tc-help/*.json', { import: 'default', eager: true });

/** The help pages, by file name without .html ('index', 'gs-install', …). */
export const helpPageNames: string[] = Object.keys(sources)
  .map((p) => p.replace(/^.*\/([^/]+)\.html$/, '$1'))
  .sort();

export function helpSource(page: string): string {
  const html = sources[`../tc-help/${page}.html`];
  if (html === undefined) throw new Error(`No help page ${page}`);
  return html;
}

/** Translations of a locale (every page file plus _shared merged): key → text. */
function strings(locale: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, data] of Object.entries(stringFiles)) {
    const [, loc, file] = path.match(/\/i18n\/([^/]+)\/tc-help\/([^/]+)\.json$/)!;
    if (loc === locale && file !== '_ui') Object.assign(out, data);
  }
  return out;
}

/** The hand-written interface strings (language menu, search messages, the
 *  Contents rail), English underneath. */
export function helpUi(locale: string): Record<string, string> {
  const en = stringFiles['../i18n/en/tc-help/_ui.json'] ?? {};
  const loc = locale === defaultLocale ? {} : stringFiles[`../i18n/${locale}/tc-help/_ui.json`] ?? {};
  return { ...en, ...Object.fromEntries(Object.entries(loc).filter(([, v]) => v)) };
}

const cache = new Map<string, Record<string, string>>();
function lookupFor(locale: string) {
  if (!cache.has(locale)) cache.set(locale, locale === defaultLocale ? {} : strings(locale));
  const dict = cache.get(locale)!;
  return (key: string, en: string) => dict[key] || en;
}

/** Translate one English string of the help (plain lookup, for the search index). */
export function helpString(locale: string, en: string): string {
  return lookupFor(locale)(keyOf(en), en);
}

/** Path of a help page in a locale: /tc-help/, /es/tc-help/gs-install. */
export function helpPath(locale: string, page: string): string {
  const base = locale === defaultLocale ? '/tc-help/' : `/${locale}/tc-help/`;
  return page === 'index' ? base : base + page;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function languageMenu(locale: string, page: string, label: string): string {
  const current = byCode(locale);
  const items = locales
    .map(
      (l) =>
        `<li><a href="${helpPath(l.code, page)}" data-locale="${l.code}" lang="${l.tag}" dir="${l.dir}"${l.code === locale ? ' aria-current="true"' : ''}>${l.name}</a></li>`
    )
    .join('');
  return `<details class="help-lang"><summary aria-label="${esc(label)}: ${esc(current.name)}"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 6h-2.95a15.7 15.7 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.9 8ZM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96ZM4.26 14a7.8 7.8 0 0 1 0-4h3.38a16.5 16.5 0 0 0 0 4H4.26Zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 0 1 5.08 16Zm2.95-8H5.08a7.99 7.99 0 0 1 4.33-3.56A15.7 15.7 0 0 0 8.03 8ZM12 19.96A14.1 14.1 0 0 1 10.09 16h3.82A14.1 14.1 0 0 1 12 19.96ZM14.34 14H9.66a14.7 14.7 0 0 1 0-4h4.68a14.7 14.7 0 0 1 0 4Zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56ZM16.36 14a16.5 16.5 0 0 0 0-4h3.38a7.8 7.8 0 0 1 0 4h-3.38Z"/></svg><span>${current.name}</span></summary><ul>${items}</ul></details>`;
}

/** One help page, rendered for a locale. */
export function renderHelpPage(locale: string, page: string): string {
  const def = byCode(locale);
  const ui = helpUi(locale);
  let html = translatePage(helpSource(page), lookupFor(locale));
  const local = locale !== defaultLocale;

  if (local) {
    // Shared files stay at /tc-help/; page links and the help home follow
    // the locale; the site link goes to the locale's home page.
    html = html
      .replace(/(\shref)="\/tc-help\/([^"]*)"/g, `$1="/${locale}/tc-help/$2"`)
      .replace(/(\s(?:href|src))="((?:img|assets)\/[^"]*)"/g, '$1="/tc-help/$2"')
      .replace(/(\shref)="\/"/g, `$1="${localePath(locale, 'home')}"`);
  }

  html = html.replace(/<html lang="en">/, `<html lang="${def.tag}" dir="${def.dir}" data-script="${def.script}">`);

  // <head>: canonical and hreflang (search is not a landing page: noindex),
  // the font pack, the help's localization styles, and the preference redirect.
  const font = fontHrefFor(locale);
  const alternates =
    page === 'search'
      ? '<meta name="robots" content="noindex">'
      : [
          `<link rel="canonical" href="${SITE_URL}${helpPath(locale, page)}">`,
          ...locales.map((l) => `<link rel="alternate" hreflang="${l.tag}" href="${SITE_URL}${helpPath(l.code, page)}">`),
          `<link rel="alternate" hreflang="x-default" href="${SITE_URL}${helpPath(defaultLocale, page)}">`,
        ].join('\n');
  const localeMeta = JSON.stringify({
    locale,
    defaultLocale,
    alternates: page !== 'search',
    locales: locales.map((l) => l.code),
    tags: Object.fromEntries(locales.map((l) => [l.code, l.tag])),
  });
  const head = [
    alternates,
    font ? `<link rel="stylesheet" href="${font}">` : '',
    '<link rel="stylesheet" href="/assets/css/help-i18n.css">',
    `<script>window.__tcLocale=${localeMeta};window.TC4_HELP_I18N=${JSON.stringify({ lang: locale, ...ui }).replace(/</g, '\\u003c')}</script>`,
    '<script src="/assets/js/locale.js"></script>',
  ]
    .filter(Boolean)
    .join('\n');
  html = html.replace(/(<link rel="stylesheet" href="[^"]*assets\/style\.css">)/, `$1\n${head}`);

  // The language menu, in the top bar before the link to translationcore.com.
  html = html.replace(/(\n\s*<a class="site-link")/, `\n  ${languageMenu(locale, page, ui.language)}$1`);

  // A locale's search reads its own index (search-index.js, relative); the
  // help menu toggle closes the language menu on Escape / outside click.
  html = html.replace(/(<script src="[^"]*assets\/page-toc\.js"><\/script>)/, '$1\n<script src="/assets/js/help-i18n.js"></script>');
  return html;
}

const decode = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
const plain = (s: string) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

interface IndexDoc {
  id: string;
  url: string;
  title: string;
  section: string;
  status: string;
  kind: string;
  summary: string;
  where: string;
  headings: string[];
  labels: string[];
  text: string;
}

/** The search index for a locale, in the shape of the English one
 *  (public/tc-help/search-index.json, written by the upstream build), with
 *  every field read from the translated page. English UI labels stay in, so
 *  a search for the English name of a button still finds its page. */
export function helpSearchIndex(locale: string, english: { built: string; build: string; docs: IndexDoc[] }) {
  const docs = english.docs.map((d) => {
    let html: string;
    try {
      html = translatePage(helpSource(d.id), lookupFor(locale));
    } catch {
      return d;
    }
    const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
    const ui = [...main.matchAll(/<span class="ui">([\s\S]*?)<\/span>/g)].map((m) => plain(m[1]));
    return {
      ...d,
      title: plain(main.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? d.title),
      section: helpString(locale, d.section),
      summary: plain(main.match(/<p class="lede">([\s\S]*?)<\/p>/)?.[1] ?? d.summary),
      headings: [...main.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => plain(m[1])),
      labels: [...new Set([...d.labels, ...ui])],
      text: plain(main.replace(/<!--[\s\S]*?-->/g, '')),
    };
  });
  return { built: english.built, build: english.build, lang: locale, docs };
}
