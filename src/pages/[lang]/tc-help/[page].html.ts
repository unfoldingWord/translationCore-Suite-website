// The Desktop help in every other locale, /{lang}/tc-help/{page} (see
// src/lib/tc-help.ts). Strings: src/i18n/{lang}/tc-help/*.json.
import type { APIRoute, GetStaticPaths } from 'astro';
import { locales, defaultLocale } from '../../../i18n/config';
import { helpPageNames, renderHelpPage } from '../../../lib/tc-help';

export const getStaticPaths: GetStaticPaths = () =>
  locales
    .filter((l) => l.code !== defaultLocale)
    .flatMap((l) => helpPageNames.map((page) => ({ params: { lang: l.code, page } })));

export const GET: APIRoute = ({ params }) =>
  new Response(renderHelpPage(params.lang!, params.page!), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
