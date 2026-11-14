// Locale integrity check (the same checks as openbiblestories.org, adapted):
//  - every locale has every page file, and the JSON parses
//  - structure (keys, array lengths) matches English
//  - embedded markup is untouched: every tag in an English string — with its
//    attributes, so hrefs and inline styles too — appears in the translation
//  - {placeholders} survive (the Resources download dialog fills them in)
//  - protected names (products, initiatives, the organization) survive
//  - an untranslated-ratio report per locale
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const LOCALES = ['en', 'es', 'fr', 'hi', 'ru', 'ar', 'zh', 'sw', 'pt', 'id', 'vi', 'bn', 'ur', 'fa', 'my', 'nl'];
const PAGES = ['ui', 'home', 'desktop', 'mobile', 'resources', 'training', 'previous-version'];
// Keys whose values must be byte-identical to English (routing data).
const ASSET_KEYS = new Set(['slug']);
import { PROTECTED, HELP_PROTECTED } from './protected-names.mjs';
import { checkHelpLocales } from './tc-help-i18n.mjs';
export { PROTECTED };

let errors = 0;
const err = (m) => {
  console.error('ERROR', m);
  errors++;
};

/** Every opening tag (with attributes) and closing tag, sorted. */
const tagsOf = (s) => (String(s).match(/<\/?[a-zA-Z][^>]*>/g) || []).sort().join(' ');
const placeholdersOf = (s) => (String(s).match(/\{\w+\}/g) || []).sort().join(' ');

function compare(locale, page, base, loc, path) {
  if (Array.isArray(base)) {
    if (!Array.isArray(loc) || loc.length !== base.length) {
      err(`${locale}/${page} ${path}: array length ${loc?.length} != ${base.length}`);
      return;
    }
    base.forEach((v, i) => compare(locale, page, v, loc[i], `${path}[${i}]`));
    return;
  }
  if (base && typeof base === 'object') {
    for (const k of Object.keys(base)) {
      if (!loc || !(k in loc)) {
        err(`${locale}/${page} ${path}.${k}: missing key`);
        continue;
      }
      const b = base[k];
      const l = loc[k];
      if (typeof b === 'string') {
        if (typeof l !== 'string') err(`${locale}/${page} ${path}.${k}: not a string`);
        else if (ASSET_KEYS.has(k) && l !== b) err(`${locale}/${page} ${path}.${k}: routing value changed ("${l}" != "${b}")`);
        else {
          if (tagsOf(b) !== tagsOf(l)) err(`${locale}/${page} ${path}.${k}: markup changed\n    en: ${tagsOf(b)}\n    ${locale}: ${tagsOf(l)}`);
          if (placeholdersOf(b) !== placeholdersOf(l)) err(`${locale}/${page} ${path}.${k}: {placeholders} changed`);
          for (const name of PROTECTED) {
            if (b.includes(name) && !l.includes(name)) err(`${locale}/${page} ${path}.${k}: protected name "${name}" translated or missing`);
          }
        }
      } else compare(locale, page, b, l, `${path}.${k}`);
    }
    for (const k of Object.keys(loc ?? {})) if (!(k in base)) err(`${locale}/${page} ${path}.${k}: key not in English`);
  }
}

for (const locale of LOCALES) {
  for (const page of PAGES) {
    const f = join(ROOT, 'src/i18n', locale, `${page}.json`);
    if (!existsSync(f)) {
      err(`${locale}/${page}.json missing`);
      continue;
    }
    let data;
    try {
      data = JSON.parse(readFileSync(f, 'utf8'));
    } catch (e) {
      err(`${locale}/${page}.json invalid JSON: ${e.message}`);
      continue;
    }
    if (locale === 'en') continue;
    const base = JSON.parse(readFileSync(join(ROOT, 'src/i18n/en', `${page}.json`), 'utf8'));
    compare(locale, page, base, data, '');
    if (/unfolding\s[Ww]ord|Unfoldingword|UnfoldingWord/.test(JSON.stringify(data))) err(`${locale}/${page}: unfoldingWord split or miscased`);
    if (locale === 'bn' && /[ऀ-ॣ०-ॿ]/.test(JSON.stringify(data))) err(`bn/${page}: Devanagari characters in Bengali file`);
  }
}

// The Desktop help strings (src/i18n/{lang}/tc-help/), see scripts/tc-help-i18n.mjs.
const help = checkHelpLocales(LOCALES, HELP_PROTECTED);
for (const e of help.errors) err(e);

console.log('\nUntranslated ratio (identical to English):');
for (const locale of LOCALES.filter((l) => l !== 'en')) {
  let same = 0;
  let total = 0;
  for (const page of PAGES) {
    const f = join(ROOT, 'src/i18n', locale, `${page}.json`);
    if (!existsSync(f)) continue;
    const base = JSON.parse(readFileSync(join(ROOT, 'src/i18n/en', `${page}.json`), 'utf8'));
    const loc = JSON.parse(readFileSync(f, 'utf8'));
    (function walk(b, l, key) {
      if (typeof b === 'string') {
        // Skip routing values and strings that are only names.
        const stripped = PROTECTED.reduce((s, n) => s.split(n).join(''), b.replace(/<[^>]*>|&\w+;|\{\w+\}/g, ''));
        if (ASSET_KEYS.has(key) || !/[a-zA-Z]{3,}/.test(stripped)) return;
        total++;
        if (b === l) same++;
        return;
      }
      if (Array.isArray(b)) b.forEach((v, i) => walk(v, l?.[i], key));
      else if (b && typeof b === 'object') for (const k of Object.keys(b)) walk(b[k], l?.[k], k);
    })(base, loc, '');
  }
  console.log(`  ${locale}: ${total ? ((same / total) * 100).toFixed(1) : '0.0'}% (${same}/${total})`);
}

console.log('\nDesktop help (strings translated):');
for (const line of help.report) console.log(line);

console.log(errors ? `\n${errors} error(s)` : '\nAll locale checks passed.');
process.exit(errors ? 1 : 0);
