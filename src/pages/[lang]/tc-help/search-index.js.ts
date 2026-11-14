// A locale's help search index, /{lang}/tc-help/search-index.js: the English
// index (public/tc-help/search-index.json, from the upstream help build) with
// every field read from the translated pages.
import type { APIRoute, GetStaticPaths } from 'astro';
import { locales, defaultLocale } from '../../../i18n/config';
import { helpSearchIndex } from '../../../lib/tc-help';
import english from '../../../../public/tc-help/search-index.json';

export const getStaticPaths: GetStaticPaths = () =>
  locales.filter((l) => l.code !== defaultLocale).map((l) => ({ params: { lang: l.code } }));

export const GET: APIRoute = ({ params }) =>
  new Response(`window.TC4_SEARCH_INDEX = ${JSON.stringify(helpSearchIndex(params.lang!, english as any)).replace(/</g, '\\u003c')};\n`, {
    headers: { 'Content-Type': 'text/javascript; charset=utf-8' },
  });
