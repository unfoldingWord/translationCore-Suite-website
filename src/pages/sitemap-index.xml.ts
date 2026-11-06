import type { APIRoute } from 'astro';
import { sitemapIndex, xmlResponse } from '../lib/sitemap';

export const GET: APIRoute = () => xmlResponse(sitemapIndex());
