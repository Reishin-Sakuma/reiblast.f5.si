/**
 * Cloudflare Pages Function: /api/likes
 *
 * GET    ?path=/blog/xxx          → 現在のいいね数を返す
 * GET    ?paths=/blog/a,/blog/b   → 複数記事のいいね数を一括返す { "/blog/a": N, ... }
 * POST   ?path=/blog/xxx          → いいね数をインクリメントして新しい数を返す
 *
 * KV キーは "like:<path>" 形式（例: "like:/blog/hajimemashite"）
 * PAGEVIEWS namespace を再利用するため wrangler.toml の変更は不要。
 */
export async function onRequest(context) {
  const { request, env } = context;

  if (!env.PAGEVIEWS) {
    return new Response(JSON.stringify({ error: 'KV not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };

  if (request.method === 'GET') {
    // 複数パス一括取得
    const paths = url.searchParams.get('paths');
    if (paths) {
      const pathList = paths.split(',').slice(0, 100);
      const entries = await Promise.all(
        pathList.map(async (p) => {
          const val = await env.PAGEVIEWS.get('like:' + p);
          return [p, parseInt(val || '0')];
        })
      );
      return new Response(JSON.stringify(Object.fromEntries(entries)), { headers });
    }

    // 単件取得
    const path = url.searchParams.get('path');
    if (!path) {
      return new Response(JSON.stringify({ error: 'path parameter required' }), {
        status: 400,
        headers,
      });
    }
    const val = await env.PAGEVIEWS.get('like:' + path);
    return new Response(JSON.stringify({ count: parseInt(val || '0') }), { headers });
  }

  if (request.method === 'POST') {
    const path = url.searchParams.get('path');
    if (!path) {
      return new Response(JSON.stringify({ error: 'path parameter required' }), {
        status: 400,
        headers,
      });
    }
    const val = await env.PAGEVIEWS.get('like:' + path);
    const count = parseInt(val || '0') + 1;
    await env.PAGEVIEWS.put('like:' + path, String(count));
    return new Response(JSON.stringify({ count }), { headers });
  }

  return new Response('Method not allowed', { status: 405 });
}
