/**
 * GitHub REST API helpers for Pages Functions.
 * Uses Contents API for simple commits, Git Data API for multi-file commits.
 */

export interface GhConfig {
  token: string;
  owner: string;
  repo: string;
  defaultBranch: string;
}

interface GhFile {
  path: string;
  // Either base64-encoded content (for text/binary), or raw text we will encode.
  contentBase64?: string;
  content?: string;
}

function b64encode(input: string): string {
  // Workers-compatible base64 of UTF-8 string
  const bytes = new TextEncoder().encode(input);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

async function gh<T>(cfg: GhConfig, method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'reiblast-blog-editor',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function getBranchSha(cfg: GhConfig, branch: string): Promise<string | null> {
  const res = await fetch(
    `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/git/ref/heads/${encodeURIComponent(branch)}`,
    {
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'reiblast-blog-editor',
      },
    }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getBranchSha ${branch}: ${res.status}`);
  const j = (await res.json()) as { object: { sha: string } };
  return j.object.sha;
}

export async function ensureBranch(cfg: GhConfig, branch: string, fromBranch?: string): Promise<string> {
  const existing = await getBranchSha(cfg, branch);
  if (existing) return existing;
  const baseSha = await getBranchSha(cfg, fromBranch ?? cfg.defaultBranch);
  if (!baseSha) throw new Error(`base branch ${fromBranch ?? cfg.defaultBranch} not found`);
  await gh(cfg, 'POST', `/repos/${cfg.owner}/${cfg.repo}/git/refs`, {
    ref: `refs/heads/${branch}`,
    sha: baseSha,
  });
  return baseSha;
}

/**
 * Reset branch to default-branch HEAD (force push style).
 * Used to keep post/<slug> in sync with master on re-save.
 */
export async function resetBranchToDefault(cfg: GhConfig, branch: string): Promise<void> {
  const baseSha = await getBranchSha(cfg, cfg.defaultBranch);
  if (!baseSha) throw new Error(`default branch ${cfg.defaultBranch} not found`);
  await gh(cfg, 'PATCH', `/repos/${cfg.owner}/${cfg.repo}/git/refs/heads/${encodeURIComponent(branch)}`, {
    sha: baseSha,
    force: true,
  });
}

/**
 * Commit files to a branch via the Git Data API (supports multiple files at once).
 * Overwrites existing files; deletes files NOT listed in `files` only if `filesToDelete` includes them.
 */
export async function commitFiles(
  cfg: GhConfig,
  branch: string,
  files: GhFile[],
  message: string,
  filesToDelete: string[] = []
): Promise<string> {
  const branchSha = await getBranchSha(cfg, branch);
  if (!branchSha) throw new Error(`branch ${branch} not found`);

  const commit = await gh<{ tree: { sha: string } }>(
    cfg,
    'GET',
    `/repos/${cfg.owner}/${cfg.repo}/git/commits/${branchSha}`
  );
  const baseTree = commit.tree.sha;

  // Create blobs for each file
  const tree: Array<{ path: string; mode: string; type: 'blob'; sha?: string | null }> = [];
  for (const f of files) {
    const b64 = f.contentBase64 ?? b64encode(f.content ?? '');
    const blob = await gh<{ sha: string }>(cfg, 'POST', `/repos/${cfg.owner}/${cfg.repo}/git/blobs`, {
      content: b64,
      encoding: 'base64',
    });
    tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  for (const path of filesToDelete) {
    tree.push({ path, mode: '100644', type: 'blob', sha: null });
  }

  const newTree = await gh<{ sha: string }>(cfg, 'POST', `/repos/${cfg.owner}/${cfg.repo}/git/trees`, {
    base_tree: baseTree,
    tree,
  });

  const newCommit = await gh<{ sha: string }>(cfg, 'POST', `/repos/${cfg.owner}/${cfg.repo}/git/commits`, {
    message,
    tree: newTree.sha,
    parents: [branchSha],
  });

  await gh(cfg, 'PATCH', `/repos/${cfg.owner}/${cfg.repo}/git/refs/heads/${encodeURIComponent(branch)}`, {
    sha: newCommit.sha,
  });

  return newCommit.sha;
}

export interface GhFileGet {
  content: string;
  sha: string;
  encoding: 'base64' | string;
}

export async function getFile(cfg: GhConfig, path: string, ref?: string): Promise<GhFileGet | null> {
  const q = ref ? `?ref=${encodeURIComponent(ref)}` : '';
  const res = await fetch(
    `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(path)}${q}`,
    {
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'reiblast-blog-editor',
      },
    }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getFile ${path}: ${res.status}`);
  const j = (await res.json()) as GhFileGet;
  return j;
}

export async function decodeFile(f: GhFileGet): Promise<string> {
  if (f.encoding !== 'base64') return f.content;
  const bin = atob(f.content.replace(/\n/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

export interface PrInfo {
  url: string;
  number: number;
}

export async function findOrCreatePr(
  cfg: GhConfig,
  branch: string,
  title: string,
  body: string
): Promise<PrInfo> {
  // List open PRs for this head
  const list = (await gh<Array<{ html_url: string; number: number }>>(
    cfg,
    'GET',
    `/repos/${cfg.owner}/${cfg.repo}/pulls?state=open&head=${cfg.owner}:${encodeURIComponent(branch)}`
  )) as Array<{ html_url: string; number: number }>;
  if (list.length > 0) {
    return { url: list[0].html_url, number: list[0].number };
  }

  const created = await gh<{ html_url: string; number: number }>(cfg, 'POST', `/repos/${cfg.owner}/${cfg.repo}/pulls`, {
    title,
    body,
    head: branch,
    base: cfg.defaultBranch,
  });
  return { url: created.html_url, number: created.number };
}

export async function mergePr(cfg: GhConfig, prNumber: number): Promise<void> {
  await gh(cfg, 'PUT', `/repos/${cfg.owner}/${cfg.repo}/pulls/${prNumber}/merge`, {
    merge_method: 'merge',
  });
}

export async function deleteBranch(cfg: GhConfig, branch: string): Promise<void> {
  const res = await fetch(
    `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/git/refs/heads/${encodeURIComponent(branch)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'reiblast-blog-editor',
      },
    }
  );
  if (!res.ok && res.status !== 404 && res.status !== 422) {
    throw new Error(`deleteBranch ${branch}: ${res.status}`);
  }
}

/**
 * List files under a path on a given branch (non-recursive direct call).
 * Returns [] on 404.
 */
export async function listDir(
  cfg: GhConfig,
  path: string,
  ref?: string
): Promise<Array<{ name: string; path: string; type: 'file' | 'dir' }>> {
  const q = ref ? `?ref=${encodeURIComponent(ref)}` : '';
  const res = await fetch(
    `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(path)}${q}`,
    {
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'reiblast-blog-editor',
      },
    }
  );
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`listDir ${path}: ${res.status}`);
  return (await res.json()) as Array<{ name: string; path: string; type: 'file' | 'dir' }>;
}

/**
 * Recursively list all blobs under a prefix on a given ref.
 * Uses the git trees API for efficiency.
 */
export async function listBlobsUnder(
  cfg: GhConfig,
  prefix: string,
  ref?: string
): Promise<Array<{ path: string }>> {
  const refName = ref ?? cfg.defaultBranch;
  const branchRes = await fetch(
    `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/git/ref/heads/${encodeURIComponent(refName)}`,
    {
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'reiblast-blog-editor',
      },
    }
  );
  if (!branchRes.ok) return [];
  const branchJson = (await branchRes.json()) as { object: { sha: string } };

  const commitRes = await fetch(
    `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/git/commits/${branchJson.object.sha}`,
    {
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'reiblast-blog-editor',
      },
    }
  );
  const commit = (await commitRes.json()) as { tree: { sha: string } };

  const treeRes = await fetch(
    `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/git/trees/${commit.tree.sha}?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'reiblast-blog-editor',
      },
    }
  );
  const tree = (await treeRes.json()) as {
    tree: Array<{ path: string; type: 'blob' | 'tree' }>;
  };
  return tree.tree
    .filter((e) => e.type === 'blob' && e.path.startsWith(prefix))
    .map((e) => ({ path: e.path }));
}
