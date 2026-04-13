import { config, collection, fields } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },
  collections: {
    blog: collection({
      label: 'Blog Posts',
      // _path is the Keystatic-internal slug (derived from directory path, NOT written to frontmatter).
      // Using a dedicated field avoids removing `title` or `slug` from the .md file.
      slugField: '_path',
      path: 'src/content/blog/**/',
      format: { contentField: 'body' },
      entryLayout: 'content',
      schema: {
        // _path: Keystatic slugField — value = YYYY/MM/DD/<slug>, set at creation time.
        // This field is intentionally NOT in the Astro content schema (config.ts).
        _path: fields.text({ label: '記事パス (YYYY/MM/DD/slug-name)', validation: { length: { min: 1 } } }),
        title: fields.text({ label: 'タイトル', validation: { length: { min: 1 } } }),
        description: fields.text({ label: '説明文', multiline: true }),
        pubDate: fields.datetime({ label: '公開日時' }),
        updatedDate: fields.datetime({ label: '更新日時', validation: { isRequired: false } }),
        author: fields.text({ label: '著者', defaultValue: 'reiblast1123' }),
        tags: fields.array(
          fields.text({ label: 'タグ' }),
          { label: 'タグ', itemLabel: (props) => props.value }
        ),
        image: fields.text({ label: 'ヒーロー画像パス', validation: { isRequired: false } }),
        draft: fields.checkbox({ label: '下書き', defaultValue: false }),
        slug: fields.text({ label: 'スラッグ (URLに使うID)', validation: { isRequired: false } }),
        body: fields.markdoc({
          label: '本文',
          extension: 'md',
        }),
      },
    }),
  },
});
