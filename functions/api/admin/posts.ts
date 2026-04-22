import { listBlobsUnder, getFile, decodeFile } from './_lib/github';
import { getGhConfig, jsonResponse, errorResponse, type AdminEnv } from './_lib/env';

export const onRequestGet: PagesFunction<AdminEnv> = async ({ env }) => {
  try {
    const cfg = getGhConfig(env);
    const files = await listBlobsUnder(cfg, 'src/content/blog/');
    const indexes = files.filter(
      (f) => f.path.endsWith('/index.md') || f.path.endsWith('/index.mdx')
    );

    const posts: Array<{ path: string; title: string; ext: string }> = [];
    for (const f of indexes) {
      const file = await getFile(cfg, f.path);
      if (!file) continue;
      const raw = await decodeFile(file);
      const m = raw.match(/^title:\s*["']?(.+?)["']?\s*$/m);
      const title = m ? m[1] : 'Untitled';
      const ext = f.path.endsWith('.mdx') ? '.mdx' : '.md';
      // Path relative to src/content/blog/
      const rel = f.path.replace(/^src\/content\/blog\//, '');
      posts.push({ path: rel, title, ext });
    }
    posts.sort((a, b) => (a.path < b.path ? 1 : a.path > b.path ? -1 : 0));
    return jsonResponse(posts);
  } catch (e: any) {
    return errorResponse(e?.message ?? 'posts failed', 500);
  }
};
