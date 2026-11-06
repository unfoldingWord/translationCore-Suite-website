import type { APIRoute } from 'astro';
import { helpSitemap, xmlResponse } from '../lib/sitemap';

export const GET: APIRoute = () => xmlResponse(helpSitemap());
