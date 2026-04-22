import { markdownToEditorHtml } from './_lib/md-to-html';
import { parseFrontmatter } from './_lib/frontmatter';
import { getFile, decodeFile } from './_lib/github';
import { getGhConfig, jsonResponse, errorResponse, type AdminEnv } from './_lib/env';

export const onRequestPost: PagesFunction<AdminEnv> = async ({ request, env }) => {
  try {
    const body = (await request.json()) as { path?: string };
    const rel = (body.path ?? '').trim();
    if (!rel) return errorResponse('path is required', 400);

    const cfg = getGhConfig(env);
    const fullPath = `src/content/blog/${rel}`;
    const file = await getFile(cfg, fullPath);
    if (!file) return errorResponse('File not found', 404);

    const raw = await decodeFile(file);
    const { frontmatter, body: mdBody } = parseFrontmatter(raw);
    const ext = rel.endsWith('.mdx') ? 'mdx' : 'md';

    // Separate imports/exports for MDX
    let imports = '';
    let bodyRest = mdBody;
    if (ext === 'mdx') {
      const lines = mdBody.replace(/^\n+/, '').split('\n');
      const importLines: string[] = [];
      const rest: string[] = [];
      let inImports = true;
      for (const line of lines) {
        const isImport = line.startsWith('import ') || line.startsWith('export ');
        const isEmpty = line.trim() === '';
        if (inImports && (isImport || isEmpty)) {
          if (isImport) importLines.push(line);
        } else {
          inImports = false;
          rest.push(line);
        }
      }
      imports = importLines.join('\n');
      bodyRest = rest.join('\n');
    }

    const bodyHtml = markdownToEditorHtml(bodyRest.trim());

    return jsonResponse({
      success: true,
      title: frontmatter.title ?? '',
      description: frontmatter.description ?? '',
      slug: frontmatter.slug ?? '',
      pubDate: (frontmatter.pubDate ?? '').slice(0, 16),
      author: frontmatter.author ?? 'reiblast1123',
      tags: frontmatter.tags ?? [],
      draft: frontmatter.draft ?? false,
      updatedDate: (frontmatter.updatedDate ?? '').slice(0, 16),
      ext,
      imports,
      bodyHtml,
    });
  } catch (e: any) {
    return errorResponse(e?.message ?? 'load failed', 500);
  }
};
