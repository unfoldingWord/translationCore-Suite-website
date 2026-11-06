// Generate per-script webfont CSS into public/assets/fonts/ (the same script
// openbiblestories.org uses, adapted from churchbased.bible).
//
// The site self-hosts its fonts (no fonts.googleapis.com round trip, no IP
// disclosure to a host that is slow or blocked in parts of the world this
// site serves). The committed Avenir Next woff2 files cover Latin, Latin
// Extended, Vietnamese and Cyrillic; Arabic, Urdu, Persian, Hindi, Bengali,
// Burmese and Chinese need more. Bundling every face would put hundreds of KB
// of @font-face rules on all 16 locales, so this emits one stylesheet per
// script and Base.astro <link>s only the one the current locale needs (see
// fontHrefFor() in src/i18n/config.ts).
//
// Run by `npm run dev` / `npm run build` (pre-scripts); the output
// (public/assets/fonts/*.css and public/assets/fonts/files/) is gitignored.
// The committed AvenirNext-*.woff2 files are NOT touched.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'public/assets/fonts');
const FILES_OUT = join(OUT, 'files');

// script key -> fontsource packages + weights. Keys match the `script`
// field in src/i18n/config.ts and the html[data-script="…"] rules in
// public/assets/css/styles.css.
const PACKS = {
  arabic: [{ pkg: '@fontsource/noto-sans-arabic', weights: [400, 700] }],
  nastaliq: [{ pkg: '@fontsource/noto-nastaliq-urdu', weights: [400, 700] }],
  devanagari: [{ pkg: '@fontsource/noto-sans-devanagari', weights: [400, 700] }],
  bengali: [{ pkg: '@fontsource/noto-sans-bengali', weights: [400, 700] }],
  myanmar: [{ pkg: '@fontsource/noto-sans-myanmar', weights: [400, 700] }],
  han: [{ pkg: '@fontsource/noto-sans-sc', weights: [400, 700] }],
};

// Clean only generated output; keep the committed woff2 files.
rmSync(FILES_OUT, { recursive: true, force: true });
for (const f of existsSync(OUT) ? readdirSync(OUT) : []) {
  if (f.endsWith('.css')) rmSync(join(OUT, f));
}
mkdirSync(FILES_OUT, { recursive: true });

const summary = [];
for (const [script, parts] of Object.entries(PACKS)) {
  let css = '';
  for (const { pkg, weights, subsets } of parts) {
    const pkgDir = join(ROOT, 'node_modules', pkg);
    for (const w of weights) {
      const candidates = subsets ? subsets.map((s) => `${s}-${w}.css`) : [`${w}.css`];
      for (const file of candidates) {
        const p = join(pkgDir, file);
        if (existsSync(p)) css += readFileSync(p, 'utf8') + '\n';
      }
    }
  }
  // Copy only the font files this CSS references, and point at their new home.
  const referenced = new Set();
  css = css.replace(/url\(\.\/files\/([^)]+)\)/g, (_, file) => {
    referenced.add(file);
    return `url(/assets/fonts/files/${file})`;
  });
  for (const { pkg } of parts) {
    const filesDir = join(ROOT, 'node_modules', pkg, 'files');
    for (const file of referenced) {
      const src = join(filesDir, file);
      if (existsSync(src)) copyFileSync(src, join(FILES_OUT, file));
    }
  }
  writeFileSync(join(OUT, `${script}.css`), css);
  summary.push(`${script}: ${referenced.size} file(s)`);
}
console.log('font packs built —', summary.join(', '));
