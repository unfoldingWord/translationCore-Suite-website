import type { APIRoute } from 'astro';
import { llmsFullTxt, textResponse } from '../lib/markdown';

export const GET: APIRoute = () => textResponse(llmsFullTxt());
