// `npm test` — the Desktop help segmenter (src/lib/tc-help-i18n.mjs): a page
// split into strings and put back together must be the page, byte for byte,
// and a translation must land where its English was.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { segment, translatePage, keyOf, pageSegments } from '../src/lib/tc-help-i18n.mjs';
import { englishSegments } from './tc-help-i18n.mjs';

const DIR = new URL('../src/tc-help/', import.meta.url);
const pages = readdirSync(DIR).filter((f) => f.endsWith('.html'));

test('every help page round-trips unchanged through the segmenter', () => {
  assert.ok(pages.length > 50);
  for (const f of pages) {
    const html = readFileSync(new URL(f, DIR), 'utf8');
    assert.equal(translatePage(html, (_k, en) => en), html, f);
  }
});

test('a wrapper around the whole run is peeled off, so labels share one key', () => {
  const a = segment('<li><a href="gs-install" class="current" aria-current="page">Install and start tC4</a></li>');
  const b = segment('<li><a href="gs-install">Install and start tC4</a></li>');
  const key = (parts) => parts.find((p) => typeof p !== 'string').key;
  assert.equal(key(a), keyOf('Install and start tC4'));
  assert.equal(key(a), key(b));
});

test('inline markup stays inside a segment; blocks split segments', () => {
  const parts = segment('<ol><li>Install it:<ul><li><strong>Windows:</strong> run the <code>.exe</code>.</li></ul></li></ol>');
  const segs = parts.filter((p) => typeof p !== 'string').map((p) => p.en);
  assert.deepEqual(segs, ['Install it:', '<strong>Windows:</strong> run the <code>.exe</code>.']);
});

test('code-only and symbol-only runs are not strings to translate', () => {
  const segs = segment('<p><code>./start-tc4.sh</code></p><p>→</p>').filter((p) => typeof p !== 'string');
  assert.equal(segs.length, 0);
});

test('translations replace text and attribute values, and quotes stay escaped', () => {
  const html = '<p>Hello <strong>there</strong></p><img alt="A screen" src="x.png"><input placeholder="Search help">';
  const t = { [keyOf('Hello <strong>there</strong>')]: '¡Hola <strong>a todos</strong>!', [keyOf('A screen')]: 'Una "pantalla"' };
  const out = translatePage(html, (k, en) => t[k] || en);
  assert.equal(out, '<p>¡Hola <strong>a todos</strong>!</p><img alt="Una &quot;pantalla&quot;" src="x.png"><input placeholder="Search help">');
});

test('the sidebar and header are shared strings; every page string is extracted once', () => {
  const { chrome } = pageSegments(readFileSync(new URL('gs-install.html', DIR), 'utf8'));
  assert.ok([...chrome.values()].includes('Getting started'));
  const { shared, perPage } = englishSegments();
  const seen = new Set(shared.keys());
  for (const segs of perPage.values()) for (const k of segs.keys()) {
    assert.ok(!seen.has(k), `duplicate key ${k}`);
    seen.add(k);
  }
});

test('help pages live in src/tc-help/, not public/tc-help/ (a refresh must not put them back)', () => {
  const stray = readdirSync(new URL('../public/tc-help/', import.meta.url)).filter((f) => f.endsWith('.html'));
  assert.deepEqual(stray, [], 'move these to src/tc-help/ (see README → Desktop help)');
});
