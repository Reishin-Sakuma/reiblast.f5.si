import { htmlToMarkdown } from './_lib/html-to-md';
import { buildFrontmatter } from './_lib/frontmatter';
import {
  ensureBranch,
  resetBranchToDefault,
  commitFiles,
  getBranchSha,
} from './_lib/github';
import { getGhConfig, jsonResponse, errorResponse, type AdminEnv } from './_lib/env';

interface SaveRequest {
  slug: string;
  title: string;
  description: string;
  pubDate: string;
  author?: string;
  tags?: string[];
  draft?: boolean;
  updatedDate?: string;
  ext: 'md' | 'mdx';
  imports?: string;
  body: string;
  originalPath?: string;
}

function datePath(pubDate: string): string {
  // Extract YYYY/MM/DD from ISO pubDate; fall back to today UTC on failure
  const d = new Date(pubDate);
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${String(
      now.getUTCDate()
    ).padStart(2, '0')}`;
  }
  return `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(
    d.getUTCDate()
  ).padStart(2, '0')}`;
}

export const onRequestPost: PagesFunction<AdminEnv> = async ({ request, env }) => {
  try {
    const data = (await request.json()) as SaveRequest;
    const slug = (data.slug ?? '').trim();
    if (!slug) return errorResponse('slug が空です', 400);

    const cfg = getGhConfig(env);
    const ext = data.ext === 'mdx' ? 'mdx' : 'md';
    const fm = buildFrontmatter({
      title: data.title,
      description: data.description,
      pubDate: data.pubDate,
      slug,
      author: data.author ?? 'reiblast1123',
      tags: data.tags ?? [],
      draft: data.draft ?? false,
      updatedDate: data.updatedDate,
    });
    const bodyMd = htmlToMarkdown(data.body ?? '');

    const parts = [fm, ''];
    if (ext === 'mdx' && data.imports?.trim()) {
      parts.push(data.imports.trim());
      parts.push('');
    }
    parts.push(bodyMd);
    const content = parts.join('\n');

    const dpath = datePath(data.pubDate);
    const newPath = `src/content/blog/${dpath}/${slug}/index.${ext}`;

    const branch = `post/${slug}`;

    // Ensure branch exists; if it did not, ensureBranch returned the base SHA as a side-signal.
    const preexisting = await getBranchSha(cfg, branch);
    if (preexisting) {
      // Reset to default-branch HEAD so stale content is dropped before re-committing.
      await resetBranchToDefault(cfg, branch);
    } else {
      await ensureBranch(cfg, branch);
    }

    const filesToDelete: string[] = [];
    if (data.originalPath) {
      const origFull = `src/content/blog/${data.originalPath.replace(/^\/+/, '')}`;
      if (origFull !== newPath) filesToDelete.push(origFull);
    }

    const commitSha = await commitFiles(
      cfg,
      branch,
      [{ path: newPath, content }],
      `draft: ${data.title?.trim() || slug}`,
      filesToDelete
    );

    return jsonResponse({
      success: true,
      path: newPath,
      commitSha,
      gitCommitted: true,
      gitMessage: 'コミット完了',
      gitBranch: branch,
      // OGP generation happens asynchronously via GitHub Actions on push to post/** branches.
      ogpGenerated: false,
      ogpMessage: 'OGP画像は GitHub Actions で自動生成されます（約1分後に反映）',
    });
  } catch (e: any) {
    return errorResponse(e?.message ?? 'save failed', 500);
  }
};
