import { htmlToMarkdown } from './_lib/html-to-md';
import { errorResponse, jsonResponse } from './_lib/env';

export const onRequestPost: PagesFunction = async ({ request }) => {
  try {
    const body = (await request.json()) as { html?: string };
    const html = body.html ?? '';
    return jsonResponse({ markdown: htmlToMarkdown(html) });
  } catch (e: any) {
    return errorResponse(e?.message ?? 'convert failed', 500);
  }
};
