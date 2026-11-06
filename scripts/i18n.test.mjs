// `npm test` — the routing helpers every page depends on. Node strips the
// TypeScript types from src/i18n/config.ts itself (Node 22.18+).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localePath, localizeLinks, fontHrefFor, locales, localizedSlugs, englishOnlySlugs } from '../src/i18n/config.ts';

test('English lives at the root, other locales under /{lang}/', () => {
  assert.equal(localePath('en', 'home'), '/');
  assert.equal(localePath('en', 'desktop'), '/desktop/');
  assert.equal(localePath('es', 'home'), '/es/');
  assert.equal(localePath('ar', 'previous-version'), '/ar/previous-version/');
});

test('English-only pages always resolve to the root', () => {
  for (const slug of englishOnlySlugs) assert.equal(localePath('fr', slug), localePath('en', slug));
});

test('localizeLinks keeps in-copy links inside the locale, fragments included', () => {
  const s = '<a href="/desktop/#downloads">x</a> <a href="/">h</a> <a href="/license/">l</a> <a href="/tc-help/">t</a> <a href="https://x.org/">e</a>';
  assert.equal(
    localizeLinks(s, 'sw'),
    '<a href="/sw/desktop/#downloads">x</a> <a href="/sw/">h</a> <a href="/license/">l</a> <a href="/tc-help/">t</a> <a href="https://x.org/">e</a>'
  );
  assert.equal(localizeLinks(s, 'en'), s);
});

test('Avenir Next covers Latin and Cyrillic; other scripts get a font pack', () => {
  assert.equal(fontHrefFor('vi'), null);
  assert.equal(fontHrefFor('ru'), null);
  assert.equal(fontHrefFor('ur'), '/assets/fonts/nastaliq.css');
  assert.equal(fontHrefFor('zh'), '/assets/fonts/han.css');
});

test('16 locales, 6 localized pages', () => {
  assert.equal(locales.length, 16);
  assert.equal(new Set(locales.map((l) => l.code)).size, 16);
  assert.equal(localizedSlugs.length, 6);
});
