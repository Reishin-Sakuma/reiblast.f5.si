import { markdownToEditorHtml } from './_lib/md-to-html';
import { parseFrontmatter } from './_lib/frontmatter';
import { getFile, decodeFile } from './_lib/github';
import { getGhConfig, jsonResponse, type AdminEnv } from './_lib/env';

export const onRequestGet: PagesFunction<AdminEnv> = async ({ env }) => {
  try {
    const cfg = getGhConfig(env);
    const file = await getFile(cfg, 'blog-template.md');
    if (!file) {
      return jsonResponse({ bodyHtml: '', success: true });
    }
    const raw = await decodeFile(file);
    const { body } = parseFrontmatter(raw);
    const stripped = body.replace(/<!--[\s\S]*?-->/g, '');
    const bodyHtml = markdownToEditorHtml(stripped.trim());
    return jsonResponse({ bodyHtml, success: true });
  } catch (e: any) {
    return jsonResponse({ bodyHtml: '', success: false, error: e?.message });
  }
};
