import type { GhConfig } from './github';

export interface AdminEnv {
  GITHUB_TOKEN: string;
  GITHUB_OWNER?: string;
  GITHUB_REPO?: string;
  GITHUB_DEFAULT_BRANCH?: string;
}

export function getGhConfig(env: AdminEnv): GhConfig {
  if (!env.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN is not configured');
  }
  return {
    token: env.GITHUB_TOKEN,
    owner: env.GITHUB_OWNER ?? 'Reishin-Sakuma',
    repo: env.GITHUB_REPO ?? 'reiblast.f5.si',
    defaultBranch: env.GITHUB_DEFAULT_BRANCH ?? 'master',
  };
}

export function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

export function errorResponse(message: string, status = 500): Response {
  return jsonResponse({ error: message }, { status });
}
