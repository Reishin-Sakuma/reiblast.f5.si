import { describe, it, expect } from 'vitest';
import { buildFrontmatter, parseFrontmatter } from './frontmatter';

describe('buildFrontmatter', () => {
  it('builds minimal frontmatter', () => {
    const fm = buildFrontmatter({
      title: 'T',
      description: 'D',
      pubDate: '2026-04-17T10:00:00',
      slug: 's',
      author: 'reiblast1123',
      tags: ['a', 'b'],
      draft: false,
    });
    expect(fm).toBe(
      '---\n' +
        'title: "T"\n' +
        'description: "D"\n' +
        'pubDate: 2026-04-17T10:00:00\n' +
        'slug: s\n' +
        'author: reiblast1123\n' +
        'tags: ["a", "b"]\n' +
        'draft: false\n---'
    );
  });

  it('includes updatedDate when provided', () => {
    const fm = buildFrontmatter({
      title: 'T',
      description: 'D',
      pubDate: '2026-04-17T10:00:00',
      slug: 's',
      author: 'reiblast1123',
      tags: [],
      draft: true,
      updatedDate: '2026-04-18T00:00:00',
    });
    expect(fm).toContain('draft: true\nupdatedDate: 2026-04-18T00:00:00\n---');
  });
});

describe('parseFrontmatter', () => {
  it('extracts fields and body', () => {
    const raw =
      '---\n' +
      'title: "Hello"\n' +
      'description: "D"\n' +
      'pubDate: 2026-04-17T10:00:00\n' +
      'slug: s\n' +
      'author: reiblast1123\n' +
      'tags: ["a", "b"]\n' +
      'draft: false\n' +
      '---\n' +
      '# Body';
    const { frontmatter, body } = parseFrontmatter(raw);
    expect(frontmatter.title).toBe('Hello');
    expect(frontmatter.description).toBe('D');
    expect(frontmatter.slug).toBe('s');
    expect(frontmatter.pubDate).toBe('2026-04-17T10:00:00');
    expect(frontmatter.author).toBe('reiblast1123');
    expect(frontmatter.tags).toEqual(['a', 'b']);
    expect(frontmatter.draft).toBe(false);
    expect(body).toBe('# Body');
  });

  it('returns empty frontmatter when no fm block', () => {
    const { frontmatter, body } = parseFrontmatter('hello');
    expect(frontmatter).toEqual({});
    expect(body).toBe('hello');
  });

  it('treats draft: true correctly', () => {
    const raw = '---\ntitle: "T"\ndraft: true\n---\nbody';
    const { frontmatter } = parseFrontmatter(raw);
    expect(frontmatter.draft).toBe(true);
  });
});
