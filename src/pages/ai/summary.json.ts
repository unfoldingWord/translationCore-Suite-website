import type { APIRoute } from 'astro';
import { SITE_URL, PRODUCT_NAME, DEFINITION, SOFTWARE_LICENSE_URL, CONTENT_LICENSE_URL, DESKTOP_VERSION } from '../../lib/jsonld';
import { locales } from '../../i18n/config';

// A machine-readable summary for answer engines that look for
// /ai/summary.json (as on openbiblestories.org). Not a standard Google uses —
// the JSON-LD on every page is the real entity markup — so this only restates
// the same public facts from src/lib/jsonld.ts.
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        name: PRODUCT_NAME,
        description: DEFINITION,
        url: `${SITE_URL}/`,
        publisher: { name: 'unfoldingWord', url: 'https://unfoldingword.org/' },
        license: { software: SOFTWARE_LICENSE_URL, content: CONTENT_LICENSE_URL },
        isAccessibleForFree: true,
        products: [
          { name: 'translationCore Desktop', url: `${SITE_URL}/desktop/`, platforms: ['Windows', 'macOS', 'Linux'], version: DESKTOP_VERSION },
          { name: 'translationCore Mobile', url: `${SITE_URL}/mobile/`, platforms: ['Android', 'iOS', 'Web'] },
        ],
        languages: locales.map((l) => l.tag),
        links: {
          resources: `${SITE_URL}/resources/`,
          training: `${SITE_URL}/training/`,
          help: `${SITE_URL}/tc-help/`,
          llms: `${SITE_URL}/llms.txt`,
          sitemap: `${SITE_URL}/sitemap-index.xml`,
        },
      },
      null,
      2
    ),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
  );
