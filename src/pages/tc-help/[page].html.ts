// The English Desktop help, /tc-help/{page} (see src/lib/tc-help.ts).
import type { APIRoute, GetStaticPaths } from 'astro';
import { helpPageNames, renderHelpPage } from '../../lib/tc-help';

export const getStaticPaths: GetStaticPaths = () => helpPageNames.map((page) => ({ params: { page } }));

export const GET: APIRoute = ({ params }) =>
  new Response(renderHelpPage('en', params.page!), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
