import { mergePr, deleteBranch, findOrCreatePr } from './_lib/github';
import { getGhConfig, jsonResponse, errorResponse, type AdminEnv } from './_lib/env';

export const onRequestPost: PagesFunction<AdminEnv> = async ({ request, env }) => {
  try {
    const data = (await request.json()) as { branch?: string };
    const branch = (data.branch ?? '').trim();
    if (!branch) return errorResponse('branch が空です', 400);

    const cfg = getGhConfig(env);

    // Locate PR by branch (will find existing without creating)
    const pr = await findOrCreatePr(
      cfg,
      branch,
      `Auto: ${branch}`,
      `マージ用 PR（${branch}）`
    );

    await mergePr(cfg, pr.number);
    await deleteBranch(cfg, branch);

    return jsonResponse({ success: true });
  } catch (e: any) {
    return errorResponse(e?.message ?? 'merge failed', 500);
  }
};
