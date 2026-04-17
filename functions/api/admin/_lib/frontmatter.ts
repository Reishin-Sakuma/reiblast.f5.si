export interface PostMeta {
  title?: string;
  description?: string;
  pubDate?: string;
  slug?: string;
  author?: string;
  tags?: string[];
  draft?: boolean;
  updatedDate?: string;
}

export function buildFrontmatter(data: PostMeta): string {
  const title = data.title ?? '';
  const description = data.description ?? '';
  const slug = data.slug ?? '';
  const author = data.author ?? 'reiblast1123';
  const tags = data.tags ?? [];
  const pubDate = data.pubDate ?? new Date().toISOString().slice(0, 19);
  const draft = data.draft ?? false;
  const updatedDate = data.updatedDate ?? '';

  const tagsStr = '[' + tags.map((t) => `"${t}"`).join(', ') + ']';

  let fm =
    '---\n' +
    `title: "${title}"\n` +
    `description: "${description}"\n` +
    `pubDate: ${pubDate}\n` +
    `slug: ${slug}\n` +
    `author: ${author}\n` +
    `tags: ${tagsStr}\n` +
    `draft: ${String(draft).toLowerCase()}`;

  if (updatedDate) fm += `\nupdatedDate: ${updatedDate}`;
  fm += '\n---';
  return fm;
}

export function parseFrontmatter(raw: string): { frontmatter: PostMeta; body: string } {
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!fmMatch) return { frontmatter: {}, body: raw };

  const fmRaw = fmMatch[1];
  const body = raw.slice(fmMatch[0].length);

  const get = (key: string, fallback = ''): string => {
    const re = new RegExp(`^${key}:\\s*(.+)$`, 'm');
    const m = fmRaw.match(re);
    if (!m) return fallback;
    let val = m[1].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    return val;
  };

  const tagsMatch = fmRaw.match(/^tags:\s*\[(.+)\]$/m);
  const tags = tagsMatch
    ? tagsMatch[1]
        .split(',')
        .map((t) => t.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
    : [];

  const frontmatter: PostMeta = {
    title: get('title'),
    description: get('description'),
    slug: get('slug'),
    pubDate: get('pubDate'),
    author: get('author', 'reiblast1123'),
    draft: get('draft', 'false').toLowerCase() === 'true',
    updatedDate: get('updatedDate'),
    tags,
  };

  return { frontmatter, body };
}
