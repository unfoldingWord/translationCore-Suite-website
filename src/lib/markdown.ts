// /llms.txt: a markdown index of the site for fetchers that prefer markdown
// (same convention as openbiblestories.org). Google has said no special AI
// file is required and the HTML stays canonical; this restates the same
// public facts and links only URLs this build produces (npm run check:routes
// re-reads the built file and fails on any that is missing).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { localePath, localizedSlugs, englishOnlySlugs, locales, type PageSlug } from '../i18n/config';
import { content } from '../i18n/content';
import { SITE_URL, DEFINITION } from './jsonld';
import { helpPages } from './sitemap';
import { inlineToMarkdown } from './inline-markdown';

export function textResponse(body: string, type = 'text/plain'): Response {
  return new Response(body, { headers: { 'Content-Type': `${type}; charset=utf-8` } });
}

const LEGAL: Record<string, { title: string; description: string }> = {
  license: {
    title: 'License and Trademark',
    description: 'MIT License for the software, CC BY-SA 4.0 for content, and the translationCore trademark.',
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'How unfoldingWord collects, uses, and protects information on the translationCore website.',
  },
};

function helpTitle(path: string): string {
  const file = path === '/tc-help/' ? 'index.html' : `${path.slice('/tc-help/'.length)}.html`;
  const html = readFileSync(fileURLToPath(new URL(`../../public/tc-help/${file}`, import.meta.url)), 'utf8');
  return (html.match(/<title>([^<]*)<\/title>/)?.[1] ?? file).replace(/\s*·\s*translationCore 4 Help$/, '').replace(/&amp;/g, '&');
}

export function llmsTxt(): string {
  const pages = localizedSlugs.map((slug) => {
    const { meta } = content<any>('en', slug);
    return `- [${meta.title}](${SITE_URL}${localePath('en', slug)}): ${meta.description}`;
  });
  const legal = englishOnlySlugs
    .filter((s) => s in LEGAL)
    .map((s) => `- [${LEGAL[s].title}](${SITE_URL}${localePath('en', s as PageSlug)}): ${LEGAL[s].description}`);
  const help = helpPages().map((p) => `- [${helpTitle(p)}](${SITE_URL}${p})`);
  const langs = locales.filter((l) => l.code !== 'en').map((l) => `${l.name} (${SITE_URL}/${l.code}/)`).join(', ');
  return `# translationCore

> ${DEFINITION}

translationCore is an initiative of unfoldingWord (https://unfoldingword.org/). The software is open source under the MIT License; documentation and other content are CC BY-SA 4.0. Both apps are free and work offline.

The site is published in 16 languages. English is at the root; the others are ${langs}.

## Pages

${pages.join('\n')}

## Desktop help

${help.join('\n')}

## Legal

${legal.join('\n')}

## Elsewhere

- [translationCore Desktop source (GitHub)](https://github.com/unfoldingWord/translationCore4)
- [translationCore Mobile source (GitHub)](https://github.com/unfoldingWord/tc-mobile)
- [translationCore Mobile on the web](https://tcmobile.app)
- [unfoldingWord translation resources on Door43](https://git.door43.org/unfoldingWord)
- [Sitemap](${SITE_URL}/sitemap-index.xml)

## Optional

- [Full text of every page](${SITE_URL}/llms-full.txt): the English copy of each page above, in one file.
`;
}

// /llms-full.txt: the full English text of every localized page, in page
// order, built from the same i18n strings the pages render (so it cannot
// drift from the site). The Resources download dialog's book lists and
// status messages ("dialog", "helps") are interface data, not page copy, and
// are left out, as are image alt texts.
const SKIP_SECTIONS = new Set(['meta', 'dialog', 'helps']);

const toMarkdown = (s: string) => inlineToMarkdown(s, SITE_URL);

function pageText(node: unknown, out: string[]): void {
  if (typeof node === 'string') {
    const line = toMarkdown(node);
    if (line) out.push(line);
  } else if (Array.isArray(node)) {
    for (const v of node) pageText(v, out);
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (/^alt\d*$/.test(k)) continue;
      if (typeof v === 'string' && /^h[1-3]\d*$/.test(k)) {
        const level = Number(k[1]) + 1; // page h1 → ##, h2 → ###, h3 → ####
        out.push(`${'#'.repeat(level)} ${toMarkdown(v)}`);
      } else pageText(v, out);
    }
  }
}

export function llmsFullTxt(): string {
  const sections = localizedSlugs.map((slug) => {
    const page = content<any>('en', slug);
    const out: string[] = [];
    for (const [k, v] of Object.entries(page)) if (!SKIP_SECTIONS.has(k)) pageText(v, out);
    return `# ${page.meta.title}\n\nURL: ${SITE_URL}${localePath('en', slug)}\n\n> ${page.meta.description}\n\n${out.join('\n\n')}`;
  });
  return `# translationCore — full text

> ${DEFINITION}

The full English text of every page on ${SITE_URL}/, one section per page. The index of pages is ${SITE_URL}/llms.txt. The License and Privacy pages and the Desktop help are linked from there.

${sections.join('\n\n---\n\n')}
`;
}
