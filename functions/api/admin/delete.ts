import { commitFiles, ensureBranch, getBranchSha, resetBranchToDefault } from './_lib/github';
import { getGhConfig, jsonResponse, errorResponse, type AdminEnv } from './_lib/env';

export const onRequestPost: PagesFunction<AdminEnv> = async ({ request, env }) => {
  try {
    const data = (await request.json()) as { path?: string; slug?: string };
    const rel = (data.path ?? '').trim();
    if (!rel) return errorResponse('path is required', 400);

    const cfg = getGhConfig(env);
    const fullPath = `src/content/blog/${rel.replace(/^\/+/, '')}`;

    // Extract slug from path if not provided: .../<slug>/index.md(x)
    const slugFromPath = rel.split('/').slice(-2)[0];
    const slug = (data.slug ?? slugFromPath).trim();
    if (!slug) return errorResponse('slug を特定できません', 400);

    const branch = `delete/${slug}`;
    const pre = await getBranchSha(cfg, branch);
    if (pre) {
      await resetBranchToDefault(cfg, branch);
    } else {
      await ensureBranch(cfg, branch);
    }

    await commitFiles(
      cfg,
      branch,
      [],
      `chore: delete ${rel}`,
      [fullPath]
    );

    return jsonResponse({
      success: true,
      branch,
      message: `delete ブランチ ${branch} を作成しました。PR を作ってマージしてください。`,
    });
  } catch (e: any) {
    return errorResponse(e?.message ?? 'delete failed', 500);
  }
};
