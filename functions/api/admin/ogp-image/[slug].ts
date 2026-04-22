import { listBlobsUnder, getFile } from '../_lib/github';
import { getGhConfig, errorResponse, type AdminEnv } from '../_lib/env';

export const onRequestGet: PagesFunction<AdminEnv> = async ({ params, env }) => {
  try {
    const slug = String(params.slug ?? '').trim();
    if (!slug) return errorResponse('slug required', 400);

    const cfg = getGhConfig(env);
    const files = await listBlobsUnder(cfg, 'src/content/blog/');
    const match = files.find(
      (f) => f.path.endsWith(`/${slug}/ogp.png`)
    );
    if (!match) return errorResponse('not found', 404);

    const file = await getFile(cfg, match.path);
    if (!file) return errorResponse('not found', 404);

    const bin = atob((file.content as string).replace(/\n/g, ''));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (e: any) {
    return errorResponse(e?.message ?? 'ogp fetch failed', 500);
  }
};
