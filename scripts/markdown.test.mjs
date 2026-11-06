// `npm test` — the inline-HTML → Markdown conversion behind /llms-full.txt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inlineToMarkdown, decodeEntities } from '../src/lib/inline-markdown.ts';

const SITE = 'https://translationcore.com';
const md = (s) => inlineToMarkdown(s, SITE);

test('bold with and without attributes becomes **text**', () => {
  assert.equal(md('<strong>Understand</strong> the passage'), '**Understand** the passage');
  assert.equal(md('<strong style="color:#014263">Start</strong> a project, or import one.'), '**Start** a project, or import one.');
  assert.equal(md('<b class="x">Read</b> the passage aloud.'), '**Read** the passage aloud.');
});

test('links become Markdown links; root-relative targets are made absolute', () => {
  assert.equal(md('See <a href="/previous-version/">Previous version</a>'), `See [Previous version](${SITE}/previous-version/)`);
  assert.equal(md('<a href="https://x.org/" style="color:#fff">x</a>'), '[x](https://x.org/)');
});

test('named and numeric entities are decoded', () => {
  assert.equal(md('System Settings &gt; Privacy &amp; Security'), 'System Settings > Privacy & Security');
  assert.equal(md('Try BT Servant &rarr;'), 'Try BT Servant →');
  assert.equal(md('&ldquo;quote&rdquo; &hellip; &middot; &reg; &#169; &#x2014;'), '“quote” … · ® © —');
  assert.equal(decodeEntities('&unknown;'), '&unknown;');
});

test('no tags survive, whitespace collapses', () => {
  assert.equal(md('a<br>b <span class="y">c</span>\n  d'), 'a b c d');
});
