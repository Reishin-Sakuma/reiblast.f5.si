# ブログ記事の書き方・公開方法

このドキュメントでは、ポートフォリオサイトのブログ機能の使い方を説明します。

## 📝 記事の作成

### 1. 新しい記事ファイルを作成

`src/content/blog/` ディレクトリに新しいMarkdownファイルを作成します。

```bash
# ファイル名の例
src/content/blog/my-new-post.md
src/content/blog/react-hooks-tutorial.md
```

**ファイル名のルール:**
- 小文字とハイフンを使用（例: `my-article-title.md`）
- 日本語は避け、英数字とハイフン `-` のみ使用
- このファイル名がURLの一部になります（例: `/blog/my-article-title`）

### 2. テンプレートを使用

プロジェクトルートにある `blog-template.md` をコピーして使うと便利です。

```bash
cp blog-template.md src/content/blog/your-article-name.md
```

### 3. Frontmatter（メタデータ）を記入

ファイルの先頭に `---` で囲まれた部分がFrontmatterです。

```yaml
---
title: "記事のタイトル"
description: "記事の説明文（SEO用）"
pubDate: 2026-02-10T12:00:00
author: reiblast1123
tags: ["タグ1", "タグ2", "タグ3"]
draft: false
---
```

**各フィールドの説明:**

| フィールド | 必須 | 説明 | 例 |
|-----------|------|------|-----|
| `title` | ✅ | 記事のタイトル | `"TypeScriptの型推論入門"` |
| `description` | ✅ | 記事の説明（SEO、OGP用） | `"TypeScriptの型推論について基礎から解説します"` |
| `pubDate` | ✅ | 公開日時（ISO 8601形式） | `2026-02-10T12:00:00` |
| `author` | ❌ | 著者名（デフォルト: `reiblast1123`） | `"reiblast1123"` |
| `tags` | ❌ | タグの配列 | `["TypeScript", "Web開発"]` |
| `image` | ❌ | アイキャッチ画像のパス | `"/images/post-cover.jpg"` |
| `draft` | ❌ | 下書きフラグ（`true`で非公開） | `false` |
| `updatedDate` | ❌ | 更新日時 | `2026-02-11T10:00:00` |

### 4. 公開日時の指定

`pubDate` は ISO 8601 形式で指定します。

```yaml
# ✅ 正しい形式
pubDate: 2026-02-10T12:00:00      # 2026年2月10日 12時00分
pubDate: 2026-02-10T00:00:00      # 2026年2月10日 0時00分
pubDate: 2026-02-10                # 時刻省略も可能（0時として扱われる）

# ❌ 間違った形式
pubDate: 2026/02/10               # スラッシュ区切りは不可
pubDate: "February 10, 2026"      # 英語表記は不可
```

**ソート順:**
- ブログ一覧ページでは、`pubDate` の新しい順（降順）で表示されます
- 最も新しい日時の記事が一番上に表示されます

### 5. タグの使い方

記事をカテゴリ分けするためにタグを使用できます。

```yaml
tags: ["Astro", "Web開発", "ポートフォリオ"]
```

- 複数指定可能
- 日本語・英語どちらでもOK
- 一覧ページでは最初の2つのタグが表示されます

### 6. 下書き機能

公開前の記事は `draft: true` にすることで、ビルドから除外できます。

```yaml
draft: true  # この記事は公開されません
```

公開する準備ができたら：

```yaml
draft: false  # または削除（デフォルトは false）
```

## ✍️ 記事本文の書き方

Frontmatterの後に、Markdown形式で記事本文を書きます。

### 見出し

```markdown
# H1見出し（記事タイトルに使用）
## H2見出し
### H3見出し
#### H4見出し
```

### リスト

```markdown
- 箇条書き
- 箇条書き

1. 番号付きリスト
2. 番号付きリスト
```

### リンク

```markdown
[リンクテキスト](https://example.com)
```

### 画像

```markdown
![代替テキスト](/images/screenshot.png)
```

### コードブロック

````markdown
```javascript
const greeting = "Hello, World!";
console.log(greeting);
```
````

### 引用

```markdown
> これは引用文です。
> 複数行にわたることもできます。
```

### 強調

```markdown
**太字**
*斜体*
`インラインコード`
```

## 🚀 ビルドとデプロイ

### ローカルでプレビュー

```bash
# 開発サーバーを起動
npm run dev

# ブラウザで確認
# http://localhost:4321/blog
```

### ビルド

```bash
npm run build
```

ビルド時に `draft: true` の記事は自動的に除外されます。

### デプロイ

このプロジェクトは **GitHub連携による自動デプロイ** が設定されています。

#### 自動デプロイの動作

- ✅ **mainブランチへのプッシュ** → 自動的に本番環境（https://reiblast.f5.si）にデプロイ
- ✅ **他のブランチへのプッシュ** → 自動的にプレビュー環境を作成
- ✅ **Pull Request作成** → プレビューURLをPRコメントに自動投稿

#### 記事を公開する手順

```bash
# 1. 記事を作成・編集
# src/content/blog/your-article.md

# 2. ローカルで確認
npm run dev

# 3. 変更をコミット
git add .
git commit -m "Add new blog post: 記事タイトル

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 4. GitHubにプッシュ
git push origin main

# → Cloudflare Pagesが自動的にビルド＆デプロイします
```

#### プレビュー環境で確認してから公開

```bash
# 1. feature/new-post ブランチを作成
git checkout -b feature/new-post

# 2. 記事を作成・編集

# 3. コミット＆プッシュ
git add .
git commit -m "Draft: New blog post"
git push origin feature/new-post

# → プレビュー環境が自動作成されます

# 4. プレビュー環境で確認後、mainにマージ
gh pr create --title "Add new blog post" --body "新しいブログ記事を追加"
# PRをマージすると本番環境に自動デプロイされます
```

#### 手動デプロイ（非推奨）

通常は不要ですが、必要な場合は以下のコマンドでデプロイできます：

```bash
npm run build
npx wrangler pages deploy dist --project-name=reiblast-portfolio --branch=main
```

## 📋 公開までの流れ

1. **記事を作成**: `src/content/blog/article-name.md` を作成
2. **下書きで確認**: `draft: true` にしてローカルで確認
3. **公開準備**: `draft: false` に変更
4. **ビルドテスト**: `npm run build` でエラーがないか確認
5. **プレビューデプロイ**: Cloudflare Pagesのプレビュー環境で確認
6. **本番デプロイ**: mainブランチにマージして公開

## 💡 Tips

### 記事の順序を調整したい

`pubDate` を調整することで、記事の表示順序を変更できます。

```yaml
# 常に一番上に表示したい記事
pubDate: 2026-12-31T23:59:59

# 通常の記事
pubDate: 2026-02-10T12:00:00
```

### 記事を削除したい

ファイルを削除するだけでOKです。

```bash
rm src/content/blog/old-article.md
```

### 記事を一時的に非公開にしたい

`draft: true` に設定するか、`pubDate` を未来の日時に設定します。

```yaml
# 方法1: 下書きに戻す
draft: true

# 方法2: 未来の日時に設定
pubDate: 2027-01-01T00:00:00
```

## 🆘 トラブルシューティング

### ビルドエラーが出る

- Frontmatterのフォーマットが正しいか確認
- `title` と `description` が必須フィールドです
- `pubDate` が正しいフォーマットか確認

### 記事が表示されない

- `draft: true` になっていないか確認
- ファイルが `src/content/blog/` 配下にあるか確認
- 拡張子が `.md` になっているか確認

### 日時が正しく表示されない

- `pubDate` が ISO 8601 形式になっているか確認
- タイムゾーンは指定しなくてOK（ローカル時間として扱われます）

## 📚 参考

- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Markdown記法](https://www.markdownguide.org/basic-syntax/)
- [ISO 8601 日時形式](https://en.wikipedia.org/wiki/ISO_8601)
