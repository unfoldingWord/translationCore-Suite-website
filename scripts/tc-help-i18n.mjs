// Strings for the localized Desktop help (/tc-help/, /{lang}/tc-help/).
//
//   npm run tc-help:extract          rebuild src/i18n/en/tc-help/*.json from src/tc-help/*.html
//   npm run tc-help:extract -- --prune   …and drop keys English no longer has from every locale
//   npm run tc-help:todo -- es       list the strings es has not translated yet
//   npm run tc-help:check -- es      check es's help strings (markup, code, names)
//
// See README → "Desktop help" for the refresh workflow. The integrity check
// (markup, code and protected names intact) is checkHelpLocales(), run by
// `npm run check:locales`.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pageSegments, tagsOf, codeOf } from '../src/lib/tc-help-i18n.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
export const HELP_SRC = join(ROOT, 'src/tc-help');
const I18N = join(ROOT, 'src/i18n');
export const SHARED = '_shared';
export const UI = '_ui';

export function helpFiles() {
  return readdirSync(HELP_SRC)
    .filter((f) => f.endsWith('.html'))
    .sort()
    .map((f) => f.slice(0, -'.html'.length));
}

const readJson = (f) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {});
const writeJson = (f, data) => writeFileSync(f, JSON.stringify(data, null, 2) + '\n');

/** English segments per page, with the shared ones (sidebar, header, footer,
 *  and anything on two or more pages) pulled out into _shared. */
export function englishSegments() {
  const shared = new Map();
  const perPage = new Map();
  const seen = new Map();
  for (const page of helpFiles()) {
    const { chrome, page: segs } = pageSegments(readFileSync(join(HELP_SRC, `${page}.html`), 'utf8'));
    for (const [k, v] of chrome) shared.set(k, v);
    perPage.set(page, segs);
    for (const k of segs.keys()) seen.set(k, (seen.get(k) || 0) + 1);
  }
  for (const [page, segs] of perPage) {
    for (const [k, v] of segs) {
      if (shared.has(k) || seen.get(k) > 1) {
        shared.set(k, v);
        segs.delete(k);
      }
    }
    void page;
  }
  return { shared, perPage };
}

function extract(prune) {
  const { shared, perPage } = englishSegments();
  const dir = join(I18N, 'en', 'tc-help');
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(dir)) {
    const name = f.replace(/\.json$/, '');
    if (name !== SHARED && name !== UI && !perPage.has(name)) console.warn(`en/tc-help/${f}: page no longer exists (delete it)`);
  }
  writeJson(join(dir, `${SHARED}.json`), Object.fromEntries(shared));
  for (const [page, segs] of perPage) writeJson(join(dir, `${page}.json`), Object.fromEntries(segs));
  const chars = [...shared.values(), ...[...perPage.values()].flatMap((m) => [...m.values()])].reduce((a, s) => a + s.length, 0);
  console.log(`${perPage.size} pages, ${shared.size} shared + ${[...perPage.values()].reduce((a, m) => a + m.size, 0)} page strings (${chars} characters).`);

  if (!prune) return;
  const all = new Set([...shared.keys(), ...[...perPage.values()].flatMap((m) => [...m.keys()])]);
  for (const locale of readdirSync(I18N)) {
    const ldir = join(I18N, locale, 'tc-help');
    if (locale === 'en' || !existsSync(ldir)) continue;
    // A translation is kept wherever its English still is: a paragraph that
    // moved between a page and _shared keeps its translation.
    const pool = {};
    for (const f of readdirSync(ldir)) if (f !== `${UI}.json`) Object.assign(pool, readJson(join(ldir, f)));
    const files = [[SHARED, shared], ...perPage];
    let dropped = 0;
    for (const [name, segs] of files) {
      const out = {};
      for (const k of segs.keys()) if (k in pool) out[k] = pool[k];
      if (Object.keys(out).length) writeJson(join(ldir, `${name}.json`), out);
    }
    for (const k of Object.keys(pool)) if (!all.has(k)) dropped++;
    for (const f of readdirSync(ldir)) {
      const name = f.replace(/\.json$/, '');
      if (name !== UI && name !== SHARED && !perPage.has(name)) writeFileSync(join(ldir, f), '{}\n');
    }
    if (dropped) console.log(`${locale}: dropped ${dropped} translation(s) of English that changed or was removed`);
  }
}

/** The merged translations of a locale: key → text. */
export function localeStrings(locale) {
  const dir = join(I18N, locale, 'tc-help');
  const out = {};
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) if (f !== `${UI}.json`) Object.assign(out, readJson(join(dir, f)));
  return out;
}

/**
 * Integrity of every locale's help strings. Returns { errors, report }.
 * Same rules as the site strings: every tag (with its attributes) kept,
 * <code> untouched, protected names verbatim; plus no key English lacks.
 */
export function checkHelpLocales(locales, protectedNames) {
  const errors = [];
  const report = [];
  const enDir = join(I18N, 'en', 'tc-help');
  const english = {};
  const fileOf = {};
  for (const f of readdirSync(enDir)) {
    if (f === `${UI}.json`) continue;
    const data = readJson(join(enDir, f));
    for (const k of Object.keys(data)) {
      english[k] = data[k];
      fileOf[k] = f;
    }
  }
  const enUi = readJson(join(enDir, `${UI}.json`));
  const total = Object.keys(english).length;
  for (const locale of locales) {
    if (locale === 'en') continue;
    const dir = join(I18N, locale, 'tc-help');
    if (!existsSync(dir)) {
      report.push(`  ${locale}: 0/${total} help strings translated`);
      continue;
    }
    let done = 0;
    for (const f of readdirSync(dir)) {
      let data;
      try {
        data = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      } catch (e) {
        errors.push(`${locale}/tc-help/${f}: invalid JSON: ${e.message}`);
        continue;
      }
      if (f === `${UI}.json`) {
        for (const [k, v] of Object.entries(data)) {
          if (!(k in enUi)) errors.push(`${locale}/tc-help/${f} ${k}: key not in English`);
          else if ((enUi[k].match(/\{\w+\}/g) || []).sort().join() !== (String(v).match(/\{\w+\}/g) || []).sort().join())
            errors.push(`${locale}/tc-help/${f} ${k}: {placeholders} changed`);
        }
        continue;
      }
      for (const [k, v] of Object.entries(data)) {
        const where = `${locale}/tc-help/${f} ${k}`;
        if (!(k in english)) {
          errors.push(`${where}: key not in English (run npm run tc-help:extract -- --prune)`);
          continue;
        }
        if (typeof v !== 'string' || !v.trim()) {
          errors.push(`${where}: empty`);
          continue;
        }
        const en = english[k];
        if (tagsOf(en) !== tagsOf(v)) errors.push(`${where}: markup changed\n    en: ${tagsOf(en)}\n    ${locale}: ${tagsOf(v)}`);
        if (codeOf(en) !== codeOf(v)) errors.push(`${where}: <code> contents changed`);
        for (const name of protectedNames) if (en.includes(name) && !v.includes(name)) errors.push(`${where}: protected name "${name}" translated or missing`);
        if (/[<>]/.test(v.replace(/<\/?[a-zA-Z][^>]*>/g, ''))) errors.push(`${where}: stray < or > (write &lt; / &gt;)`);
        if (/unfolding\s[Ww]ord|Unfoldingword|UnfoldingWord/.test(v)) errors.push(`${where}: unfoldingWord split or miscased`);
        done++;
      }
    }
    report.push(`  ${locale}: ${done}/${total} help strings translated`);
  }
  return { errors, report };
}

function todo(locale) {
  const have = localeStrings(locale);
  const { shared, perPage } = englishSegments();
  let n = 0;
  for (const [name, segs] of [[SHARED, shared], ...perPage]) {
    const missing = [...segs].filter(([k]) => !(k in have));
    if (!missing.length) continue;
    console.log(`\n## ${name}.json`);
    for (const [k, v] of missing) console.log(`${k}\t${v}`);
    n += missing.length;
  }
  console.log(`\n${n} string(s) to translate for ${locale}.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === 'extract') extract(rest.includes('--prune'));
  else if (cmd === 'todo' && rest[0]) todo(rest[0]);
  else if (cmd === 'check' && rest[0]) {
    const { HELP_PROTECTED } = await import('./protected-names.mjs');
    const { errors, report } = checkHelpLocales([rest[0]], HELP_PROTECTED);
    for (const e of errors) console.error('ERROR', e);
    console.log(report.join('\n'));
    console.log(errors.length ? `${errors.length} error(s)` : 'No errors.');
    process.exit(errors.length ? 1 : 0);
  }
  else {
    console.error('usage: node scripts/tc-help-i18n.mjs extract [--prune] | todo <locale> | check <locale>');
    process.exit(1);
  }
}
