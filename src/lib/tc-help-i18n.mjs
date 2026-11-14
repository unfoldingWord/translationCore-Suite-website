// Localization of the translationCore Desktop help (/tc-help/).
//
// The English help pages are generated upstream (translationCore4's help
// build) and kept here unchanged in src/tc-help/*.html. They are never
// hand-edited, so a refresh is a plain copy. This module splits a page into
// translatable SEGMENTS, and puts a page back together in another language:
//
//   - A text segment is a run of text and inline markup (<a>, <strong>,
//     <code>, <span class="ui">, …) between two block boundaries (<p>, <li>,
//     <h2>, <td>, …). A wrapper that encloses the whole run (<li><a …>Label</a>)
//     is peeled off, so the same label in the sidebar of every page is one
//     segment, whatever its class or aria-current.
//   - An attribute segment is the value of alt, title, aria-label, placeholder,
//     or the meta description's content.
//
// Each segment's key is a hash of its English, so the strings files survive an
// upstream refresh: a paragraph that did not change keeps its translation, a
// changed one falls back to English until it is translated again.
//
// Plain JavaScript (not TypeScript) so the Node scripts (extract, check,
// tests) and the Astro routes share one implementation.
import { createHash } from 'node:crypto';

const INLINE = new Set([
  'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'em', 'i', 'kbd', 'mark', 'q', 's', 'samp',
  'small', 'span', 'strong', 'sub', 'sup', 'u', 'var', 'wbr',
]);
// Inline elements that are laid out as blocks on the Home page's topic cards.
const BLOCK_CLASSES = /\bclass="[^"]*\b(card-title|card-sum|wordmark|reg|brand-rule|brand-text)\b/;
const VOID = new Set(['br', 'wbr', 'img', 'input', 'meta', 'link', 'hr', 'source', 'area', 'base', 'col', 'embed', 'track']);
const TRANSLATED_ATTRS = ['alt', 'title', 'aria-label', 'placeholder'];

/** Tokens: comments, raw-text elements, tags and text, in document order. */
export function tokenize(html) {
  const out = [];
  const re = /<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>|<!doctype[^>]*>|<\/?[a-zA-Z][^>]*>|[^<]+|</gi;
  let m;
  while ((m = re.exec(html))) {
    const s = m[0];
    let type = 'text';
    let name = '';
    let close = false;
    if (s.startsWith('<!--') || /^<!doctype/i.test(s)) type = 'other';
    else if (m[1]) type = 'other';
    else if (/^<\/?[a-zA-Z]/.test(s)) {
      type = 'tag';
      close = s[1] === '/';
      name = s.match(/^<\/?([a-zA-Z][a-zA-Z0-9-]*)/)[1].toLowerCase();
    }
    out.push({ s, type, name, close });
  }
  return out;
}

/** Mark each tag token inline or not. An inline element (<a>, <span>) is
 *  treated as a block when it has a block class or encloses a block, so its
 *  opening and closing tags are both boundaries (a Home topic card is an <a>
 *  around two block-styled <span>s). */
function markInline(toks) {
  const stack = [];
  const opener = new Map();
  toks.forEach((t, i) => {
    if (t.type === 'text') t.inline = true;
    if (t.type !== 'tag') return;
    t.inline = INLINE.has(t.name) && !(!t.close && BLOCK_CLASSES.test(t.s));
    if (VOID.has(t.name) || t.s.endsWith('/>')) return;
    if (!t.close) stack.push(i);
    else {
      // Pop to the matching opener (the pages are well-formed).
      for (let j = stack.length - 1; j >= 0; j--) {
        if (toks[stack[j]].name === t.name) {
          opener.set(i, stack[j]);
          stack.length = j;
          break;
        }
      }
    }
  });
  // A block inside makes every enclosing inline element a block. Walk the
  // closes in order: an element contains a block if any token between its
  // tags is a non-inline tag.
  for (const [close, open] of [...opener].sort((a, b) => a[0] - b[0])) {
    const o = toks[open];
    if (!o.inline) {
      toks[close].inline = false;
      continue;
    }
    let block = false;
    for (let k = open + 1; k < close && !block; k++) if (toks[k].type === 'tag' && !toks[k].inline) block = true;
    if (block) o.inline = toks[close].inline = false;
  }
  return toks;
}

/** Does this markup contain words to translate? (Text outside <code>, with a
 *  letter in it.) */
export function hasWords(html) {
  const text = html
    .replace(/<code\b[^>]*>[\s\S]*?<\/code>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&[#\w]+;/g, ' ');
  return /\p{L}/u.test(text);
}

export function keyOf(english) {
  return createHash('sha1').update(english).digest('hex').slice(0, 12);
}

/** Strip a wrapper element that encloses the whole run, repeatedly.
 *  Returns [prefix, inner, suffix]. */
function peel(tokens) {
  let lo = 0;
  let hi = tokens.length;
  for (;;) {
    if (hi - lo < 2) break;
    const first = tokens[lo];
    const last = tokens[hi - 1];
    if (first.type !== 'tag' || first.close || VOID.has(first.name) || first.name === 'code') break;
    if (last.type !== 'tag' || !last.close || last.name !== first.name) break;
    // The closing tag must match the opening one (not an earlier sibling's).
    let depth = 0;
    let matches = true;
    for (let i = lo; i < hi - 1; i++) {
      const t = tokens[i];
      if (t.type === 'tag' && t.name === first.name) depth += t.close ? -1 : 1;
      if (depth === 0) {
        matches = false;
        break;
      }
    }
    if (!matches) break;
    lo++;
    hi--;
  }
  return [lo, hi];
}

/**
 * Split a page into its parts. Returns a list where each item is either a
 * literal string or a segment { key, en }; joining the literals and each
 * segment's (translated) text gives the page back.
 */
export function segment(html) {
  const toks = markInline(tokenize(html));
  const parts = [];
  let run = [];
  const flush = () => {
    if (!run.length) return;
    // Leading/trailing whitespace stays outside the segment.
    const first = run[0];
    const last = run[run.length - 1];
    let leadWs = '';
    let trailWs = '';
    if (first.type === 'text') leadWs = first.s.match(/^\s*/)[0];
    if (last.type === 'text') trailWs = last.s.match(/\s*$/)[0];
    const whole = run.map((t) => t.s).join('');
    if (!whole.trim()) {
      parts.push(whole);
      run = [];
      return;
    }
    // Re-tokenize the trimmed run so peeling sees exact tokens.
    const inner = whole.slice(leadWs.length, whole.length - trailWs.length);
    if (!hasWords(inner)) {
      // Only code, symbols or numbers: nothing to translate.
      parts.push(whole);
      run = [];
      return;
    }
    const itoks = tokenize(inner);
    const [a, b] = peel(itoks);
    const pre = itoks.slice(0, a).map((t) => t.s).join('');
    const core = itoks.slice(a, b).map((t) => t.s).join('');
    const post = itoks.slice(b).map((t) => t.s).join('');
    // Whitespace just inside a peeled wrapper also stays outside.
    const cLead = core.match(/^\s*/)[0];
    const cTrail = core.slice(cLead.length).match(/\s*$/)[0];
    const en = core.slice(cLead.length, core.length - cTrail.length);
    parts.push(leadWs + pre + cLead);
    if (hasWords(en)) parts.push({ key: keyOf(en), en });
    else parts.push(en);
    parts.push(cTrail + post + trailWs);
    run = [];
  };
  for (const t of toks) {
    if (t.type === 'text' || (t.type === 'tag' && t.inline)) run.push(t);
    else {
      flush();
      parts.push(t.s);
    }
  }
  flush();
  return parts.filter((p) => p !== '');
}

/** Attribute segments: [{ key, en }] for every translatable attribute value. */
export function attributeSegments(html) {
  const out = [];
  for (const t of tokenize(html)) {
    if (t.type !== 'tag' || t.close) continue;
    for (const [, name, value] of t.s.matchAll(/\s([a-zA-Z-]+)="([^"]*)"/g)) {
      const translated =
        TRANSLATED_ATTRS.includes(name) ||
        (name === 'content' && t.name === 'meta' && /\sname="description"/.test(t.s));
      if (translated && hasWords(value)) out.push({ key: keyOf(value), en: value, attr: name });
    }
  }
  return out;
}

/** Rewrite translatable attribute values through lookup(key, en). */
export function translateAttributes(html, lookup) {
  return html.replace(/<[a-zA-Z][^>]*>/g, (tag) => {
    const isDesc = /^<meta\b/i.test(tag) && /\sname="description"/.test(tag);
    return tag.replace(/(\s)([a-zA-Z-]+)="([^"]*)"/g, (m, sp, name, value) => {
      if (!(TRANSLATED_ATTRS.includes(name) || (name === 'content' && isDesc))) return m;
      if (!hasWords(value)) return m;
      return `${sp}${name}="${escapeAttr(lookup(keyOf(value), value))}"`;
    });
  });
}

function escapeAttr(s) {
  // Translations of attribute values are plain text; keep entities the
  // translator wrote, but never let a raw quote end the attribute.
  return String(s).replace(/"/g, '&quot;');
}

/** Translate a whole page: text segments, then attribute values. */
export function translatePage(html, lookup) {
  const body = segment(html)
    .map((p) => (typeof p === 'string' ? p : lookup(p.key, p.en)))
    .join('');
  return translateAttributes(body, lookup);
}

/** Every segment of a page (text and attributes), grouped by region:
 *  'chrome' for the shared header, sidebar and footer; 'page' for the rest. */
export function pageSegments(html) {
  const chromeRanges = [];
  for (const re of [/<header class="topbar">[\s\S]*?<\/header>/, /<nav class="sidebar"[\s\S]*?<\/nav>/, /<footer class="sitefoot">[\s\S]*?<\/footer>/, /<a class="skip"[^>]*>[\s\S]*?<\/a>/]) {
    const m = html.match(re);
    if (m) chromeRanges.push(m[0]);
  }
  const chrome = new Map();
  for (const part of chromeRanges) {
    for (const p of segment(part)) if (typeof p !== 'string') chrome.set(p.key, p.en);
    for (const a of attributeSegments(part)) chrome.set(a.key, a.en);
  }
  const page = new Map();
  for (const p of segment(html)) if (typeof p !== 'string' && !chrome.has(p.key)) page.set(p.key, p.en);
  for (const a of attributeSegments(html)) if (!chrome.has(a.key)) page.set(a.key, a.en);
  return { chrome, page };
}

/** Every opening tag (with attributes) and closing tag, sorted — a
 *  translation must keep exactly these. */
export const tagsOf = (s) => (String(s).match(/<\/?[a-zA-Z][^>]*>/g) || []).sort().join(' ');
/** The contents of every <code> element, sorted: code is never translated. */
export const codeOf = (s) => (String(s).match(/<code\b[^>]*>[\s\S]*?<\/code>/g) || []).sort().join(' ');
