/**
 * Cloudflare Access authentication guard for /api/admin/*.
 *
 * Access issues a signed JWT in the `CF-Access-Jwt-Assertion` header.
 * We verify:
 *   1) signature against the team JWKS
 *   2) `aud` matches ACCESS_AUD
 *   3) `iss` matches https://<team>.cloudflareaccess.com
 *   4) `exp` not expired
 *
 * When ACCESS_AUD is unset (e.g. local `wrangler pages dev`), auth is skipped
 * so the editor is usable without Access in development.
 */

interface AccessEnv {
  ACCESS_AUD?: string;
  ACCESS_TEAM_DOMAIN?: string; // e.g. "reiblast.cloudflareaccess.com"
  ALLOWED_EMAILS?: string; // comma-separated list, optional
}

interface JwtPayload {
  aud: string | string[];
  iss: string;
  exp: number;
  email?: string;
  sub?: string;
}

interface Jwks {
  keys: Array<{
    kid: string;
    kty: string;
    alg?: string;
    n?: string;
    e?: string;
    use?: string;
  }>;
}

function b64urlToUint8Array(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlToString(s: string): string {
  return new TextDecoder().decode(b64urlToUint8Array(s));
}

// 5-minute in-memory JWKS cache (per worker instance)
let jwksCache: { url: string; keys: Jwks; expiresAt: number } | null = null;

async function loadJwks(teamDomain: string): Promise<Jwks> {
  const url = `https://${teamDomain}/cdn-cgi/access/certs`;
  const now = Date.now();
  if (jwksCache && jwksCache.url === url && jwksCache.expiresAt > now) {
    return jwksCache.keys;
  }
  const res = await fetch(url, { headers: { 'User-Agent': 'reiblast-blog-editor' } });
  if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);
  const keys = (await res.json()) as Jwks;
  jwksCache = { url, keys, expiresAt: now + 5 * 60 * 1000 };
  return keys;
}

async function verifyAccessJwt(token: string, env: AccessEnv): Promise<JwtPayload> {
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  if (!headerB64 || !payloadB64 || !signatureB64) throw new Error('malformed JWT');

  const header = JSON.parse(b64urlToString(headerB64)) as { kid: string; alg: string };
  const payload = JSON.parse(b64urlToString(payloadB64)) as JwtPayload;

  if (header.alg !== 'RS256') throw new Error(`unsupported alg ${header.alg}`);

  const teamDomain = env.ACCESS_TEAM_DOMAIN;
  if (!teamDomain) throw new Error('ACCESS_TEAM_DOMAIN not configured');

  const jwks = await loadJwks(teamDomain);
  const jwk = jwks.keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error(`unknown kid ${header.kid}`);

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk as JsonWebKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signed = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = b64urlToUint8Array(signatureB64);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signature, signed);
  if (!valid) throw new Error('invalid signature');

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) throw new Error('JWT expired');

  const expectedAud = env.ACCESS_AUD!;
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(expectedAud)) throw new Error('audience mismatch');

  const expectedIss = `https://${teamDomain}`;
  if (payload.iss !== expectedIss) throw new Error(`issuer mismatch: ${payload.iss}`);

  if (env.ALLOWED_EMAILS) {
    const allowed = env.ALLOWED_EMAILS.split(',').map((e) => e.trim().toLowerCase());
    const email = (payload.email ?? '').toLowerCase();
    if (!email || !allowed.includes(email)) {
      throw new Error('email not allowed');
    }
  }

  return payload;
}

export const onRequest: PagesFunction<AccessEnv> = async (ctx) => {
  const { env, request, next } = ctx;

  // When Access is not configured, skip authentication (dev mode).
  if (!env.ACCESS_AUD || !env.ACCESS_TEAM_DOMAIN) {
    return next();
  }

  const token =
    request.headers.get('Cf-Access-Jwt-Assertion') ??
    request.headers.get('cf-access-jwt-assertion');

  if (!token) {
    return new Response(JSON.stringify({ error: 'Access token missing' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    await verifyAccessJwt(token, env);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: `Access auth failed: ${e?.message}` }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return next();
};
