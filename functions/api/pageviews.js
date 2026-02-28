/**
 * Cloudflare Pages Function: /api/pageviews
 *
 * GET  ?path=/blog/xxx          → 現在のPV数を返す
 * GET  ?paths=/blog/a/,/blog/b/ → 複数記事のPV数を一括返す { "/blog/a/": N, ... }
 * POST ?path=/blog/xxx          → PV数をインクリメントして新しい数を返す
 *                                  /blog/ で始まる場合、__total__ も同時にインクリメント
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

  // 複数パス一括取得（GETのみ）
  if (request.method === 'GET') {
    const paths = url.searchParams.get('paths');
    if (paths) {
      const pathList = paths.split(',').slice(0, 100);
      const entries = await Promise.all(
        pathList.map(async (p) => {
          const val = await env.PAGEVIEWS.get(p);
          return [p, parseInt(val || '0')];
        })
      );
      return new Response(JSON.stringify(Object.fromEntries(entries)), { headers });
    }
  }

  const path = url.searchParams.get('path');

  if (!path) {
    return new Response(JSON.stringify({ error: 'path parameter required' }), {
      status: 400,
      headers,
    });
  }

  if (request.method === 'POST') {
    const isBlogPost = path.startsWith('/blog/') && path !== '/blog/';

    if (isBlogPost) {
      const [articleVal, totalVal] = await Promise.all([
        env.PAGEVIEWS.get(path),
        env.PAGEVIEWS.get('__total__'),
      ]);
      const count = parseInt(articleVal || '0') + 1;
      const total = parseInt(totalVal || '0') + 1;
      await Promise.all([
        env.PAGEVIEWS.put(path, String(count)),
        env.PAGEVIEWS.put('__total__', String(total)),
      ]);
      return new Response(JSON.stringify({ count, total }), { headers });
    } else {
      const val = await env.PAGEVIEWS.get(path);
      const count = parseInt(val || '0') + 1;
      await env.PAGEVIEWS.put(path, String(count));
      return new Response(JSON.stringify({ count }), { headers });
    }
  }

  if (request.method === 'GET') {
    const val = await env.PAGEVIEWS.get(path);
    const count = parseInt(val || '0');
    return new Response(JSON.stringify({ count }), { headers });
  }

  return new Response('Method not allowed', { status: 405 });
}
