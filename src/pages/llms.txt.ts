import type { APIRoute } from 'astro';
import { llmsTxt, textResponse } from '../lib/markdown';

export const GET: APIRoute = () => textResponse(llmsTxt());
