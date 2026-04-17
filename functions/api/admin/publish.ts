import { findOrCreatePr, getBranchSha } from './_lib/github';
import { getGhConfig, jsonResponse, errorResponse, type AdminEnv } from './_lib/env';

export const onRequestPost: PagesFunction<AdminEnv> = async ({ request, env }) => {
  try {
    const data = (await request.json()) as { slug?: string; title?: string };
    const slug = (data.slug ?? '').trim();
    const title = (data.title ?? '').trim();
    if (!slug) return errorResponse('slug が空です', 400);

    const cfg = getGhConfig(env);
    const branch = `post/${slug}`;

    const sha = await getBranchSha(cfg, branch);
    if (!sha) {
      return errorResponse(
        `branch ${branch} が見つかりません。先に保存してください。`,
        404
      );
    }

    const prTitle = title || `Add post: ${slug}`;
    const prBody = `## 新規記事\n\nslug: \`${slug}\`\n\n🤖 blog-editor から自動作成`;
    const pr = await findOrCreatePr(cfg, branch, prTitle, prBody);

    return jsonResponse({ success: true, prUrl: pr.url, prNumber: pr.number, branch });
  } catch (e: any) {
    return errorResponse(e?.message ?? 'publish failed', 500);
  }
};
