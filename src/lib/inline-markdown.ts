// Converts the inline HTML carried by the i18n strings (links, bold, the
// occasional <br>, named entities) into plain Markdown for /llms-full.txt.
// Dependency-free so `npm test` can import it directly (see
// scripts/markdown.test.mjs).

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  hellip: '…',
  middot: '·',
  mdash: '—',
  ndash: '–',
  rarr: '→',
  larr: '←',
  reg: '®',
  copy: '©',
  trade: '™',
};

/** Decode named and numeric HTML entities. An unknown named entity is left
 *  as is, so check:routes can flag it. */
export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name: string) => {
    if (name[0] === '#') {
      const code = name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[name.toLowerCase()] ?? whole;
  });
}

/** Inline HTML → Markdown. Root-relative link targets are made absolute
 *  against `siteUrl`. Opening tags may carry attributes (the strings use
 *  `<strong style="…">`), so tags are matched with or without them. */
export function inlineToMarkdown(s: string, siteUrl: string): string {
  return decodeEntities(
    s
      .replace(/<a\b[^>]*\bhref="([^"]+)"[^>]*>(.*?)<\/a>/g, (_m, href: string, text: string) => {
        const url = href.startsWith('/') ? `${siteUrl}${href}` : href;
        return `[${text}](${url})`;
      })
      .replace(/<(strong|b)\b[^>]*>(.*?)<\/\1>/g, (_m, _tag: string, text: string) => (text.trim() ? `**${text}**` : text))
      .replace(/<br\s*\/?>/g, ' ')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/\s+/g, ' ')
    .trim();
}
