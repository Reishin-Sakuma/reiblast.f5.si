# CLAUDE.md

このファイルには、プロジェクトの設計・実装に関する重要な情報を記録します。

## プロジェクト概要

**reiblast1123 Portfolio**

reiblast1123のプロジェクトポートフォリオサイト。Astro静的サイトジェネレーターを使用し、Cloudflare Pagesにデプロイ。

### 主な掲載プロジェクト
- **Shakeeper** - 車検管理PWA
- **milpon（ミルポン）** - 赤ちゃんの育児記録アプリ

## ファビコン設計

### デザインコンセプト

**ターミナル風「r>_」デザイン**

- **モチーフ**: コマンドラインプロンプト
- **文字**: `r>_`（reiblastの頭文字 + ターミナルプロンプト記号）
- **背景**: グラデーション（#667eea → #764ba2）- ヒーローセクションと統一
- **文字色**: 白（#FFFFFF）
- **フォント**: Courier New（モノスペースフォント）
- **角丸**: 24px（rx="24"）

### デザインの意図

1. **開発者らしさ**: ターミナル/CLIの見た目で技術的な印象
2. **ブランド統一**: サイトのヒーローセクションと同じグラデーション背景
3. **視認性**: シンプルで小さいサイズでも判別しやすい
4. **個性**: 「reiblast1123」のユーザー名らしさを表現

### 生成ファイル一覧

| ファイル名 | サイズ | 用途 |
|-----------|-------|------|
| `favicon.svg` | 531 bytes | モダンブラウザ用ベクターファビコン |
| `favicon.ico` | 5.2 KB | レガシーブラウザ用（16x16, 32x32含む） |
| `favicon-16x16.png` | 515 bytes | PNG 16x16 |
| `favicon-32x32.png` | 1.1 KB | PNG 32x32 |
| `apple-touch-icon.png` | 17 KB | iOS/macOS用 180x180 |
| `icon-192x192.png` | 21 KB | PWA用 192x192 |
| `icon-512x512.png` | 70 KB | PWA用 512x512 |
| `manifest.json` | 545 bytes | PWAマニフェスト |

### 技術スタック

**使用パッケージ**:
- `@resvg/resvg-js` - SVGからPNG変換
- `to-ico` - PNGからICO生成

**生成スクリプト**:
1. `scripts/generate-favicons.js` - SVG→PNG変換（複数サイズ）
2. `scripts/generate-ico.js` - PNG→ICO変換

### 再生成手順

デザインを変更する場合：

```bash
# 1. public/favicon.svg を編集

# 2. PNGファビコンを生成
node scripts/generate-favicons.js

# 3. ICOファビコンを生成
node scripts/generate-ico.js

# 4. ビルド＆デプロイ
npm run build
npx wrangler pages deploy dist --project-name=reiblast-f5-si --branch=main
```

### HTMLへの組み込み

`src/layouts/Layout.astro` の `<head>` セクション:

```html
<!-- Favicons -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json" />
```

### PWAマニフェスト

`public/manifest.json`:

```json
{
  "name": "reiblast1123 Portfolio",
  "short_name": "reiblast1123",
  "description": "reiblast1123 のプロジェクトポートフォリオサイト",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#667eea",
  "theme_color": "#667eea",
  "icons": [...]
}
```

## デプロイ

### Cloudflare Pages

- **プロジェクト名**: `reiblast-f5-si`
- **本番URL**: https://reiblast-f5-si.pages.dev
- **カスタムドメイン**: https://reiblast1123.com ✅ 設定済み
- **デプロイ方式**: GitHub連携による自動デプロイ ✅
- **ビルドコマンド**: `npm run build`
- **出力ディレクトリ**: `dist/`

### 自動デプロイ

mainブランチへのプッシュで自動的に本番環境にデプロイされます。

```bash
# 変更をコミット＆プッシュするだけでOK
git add .
git commit -m "Update content"
git push origin main
```

### 手動デプロイ（非推奨）

通常は不要ですが、必要な場合：

```bash
npm run build
npx wrangler pages deploy dist --project-name=reiblast-f5-si --branch=main
```

## ブログ記事 生成ガイドライン

### 著者プロフィール（記事の文体・設定に使用）

- **名前**: レイ（reiblast1123）
- **出身・居住**: 沖縄県
- **職業**: インフラエンジニア（2020年度高校新卒入社）
- **趣味**: クルマ、レースゲーム、ドライブ
- **年齢計算**: 2020年時点で18歳 → 誕生日は秋頃（10〜11月）

### 記事ディレクトリ構成

```
src/content/blog/YYYY/MM/DD/<slug>/index.md
```

### frontmatter テンプレート

```yaml
---
title: "タイトル"
description: "説明文"
pubDate: YYYY-MM-DDTHH:MM:SS
slug: slug-name
author: reiblast1123
tags: ["タグ1", "タグ2"]
draft: false
---
```

### 文体・口調ルール

- **挨拶**: 「どうも、レイと申します。」で始める
- **一人称**: 「僕」
- **語尾**: 「〜です」「〜ます」と「〜だ」「〜なんですよね」をカジュアルに混ぜる
- **笑い**: 「笑」「www」「草」を自然に使う
- **顔文字**: たまに使う（`(^o^)` `(´・ω・｀)` など）
- **冒頭にキャッチコピー**: `<u>「〇〇」</u>` の形式
- **近況報告**: 沖縄の天気や季節の話題から自然に本題へ
- **自己ツッコミ**: 「このブログの通例なんで書きます」「伝わるかな？www」
- **締め**: 次回予告 + 個人の近況（給料、昇格など過去記事との連続性を意識）

### 装飾ルール

| 用途 | 記法 |
|---|---|
| 太字 | `**text**` |
| 下線 | `<u>text</u>` |
| 取り消し線 | `~~text~~` |
| 文字色 | `<span style="color:#ff0000">text</span>` |
| ハイライト | `<mark style="background-color:#ffcc00">text</mark>` |
| 太字+色 | `<span style="color:orange">**text**</span>` |

**重要: `**` が正しく変換されないケース**

以下のパターンでは `**` がHTMLの `<strong>` に変換されず、そのまま表示される:

- 鉤括弧を含む: `**「テキスト」**` → `<strong>「テキスト」</strong>` を使う
- リンクを含む: `**[text](url)**` → `<strong>[text](url)</strong>` を使う
- 括弧を含む: `**Nutanix(AHV)**` → `<strong>Nutanix(AHV)</strong>` を使う

**ルール**: 太字の中に `「」` `()` `[]` などの括弧類がある場合は、必ず `<strong>` タグを使うこと。

### リンクルール

- 用語・プロダクト名には極力 **日本語版Wikipedia** のリンクをつける
- 日本語版に記事がない場合は **英語版Wikipedia** にリンク
- 記事作成後に全リンクの HTTP ステータスを `curl` で確認する

### 記事作成後の検証

1. OGP画像を生成する（**必須**）
   ```bash
   node scripts/generate-ogp.js <slug>
   ```
   例: `node scripts/generate-ogp.js 24sai-kara-mita-chatgpt-no-sekai`
   → `src/content/blog/YYYY/MM/DD/<slug>/ogp.png` が生成される。これをコミットに含めること。
   （ビルド時に `npm run copy-images` で `public/images/blog/...` にコピーされ公開される）
2. `npm run build` でビルドが通ることを確認
3. ビルド後のHTMLで生の `**` が残っていないか `grep '\*\*'` で確認
4. 全リンクの HTTP ステータスを確認（200以外は修正）

### 既存記事でよく使われる色

| 色 | 用途例 |
|---|---|
| `#ff0000` (赤) | 警告、重要、障害 |
| `#0000ff` (青) | ポジティブな項目、間接部門 |
| `#8f20ff` (紫) | 補足、ツッコミ |
| `#ff7f00` / `orange` | 強調、まとめ |
| `#ffcc00` (黄) | ハイライト（`<mark>`） |
| `#ff007d` (ピンク) | 強い主張 |
| `#7cd300` (黄緑) | 背景ハイライト |

## blog-editor（WYSIWYG エディタ）

### Cloudflare Pages 版（本番）

本番サイト上の `/admin/` で動作する WYSIWYG エディタ。

- **URL**: https://reiblast1123.com/admin/（Cloudflare Access 経由でログイン必須）
- **認証**: Cloudflare Access（GitHub OAuth）
- **実装**: Astro ページ + Cloudflare Pages Functions
  - UI: `src/pages/admin/index.astro`
  - API: `functions/api/admin/*.ts`
  - PWA アセット: `public/admin/{manifest.json,sw.js,icon-*.png}`
- **git 操作**: GitHub REST API（`GITHUB_TOKEN` で認証）
- **OGP 生成**: `post/**` への push で `.github/workflows/generate-ogp.yml` が自動実行

#### 必要な環境変数（Cloudflare Pages > Settings > Environment variables）

| 名前 | 値 | 用途 |
|---|---|---|
| `GITHUB_TOKEN` | GitHub PAT（`repo` scope） | git 操作全般（Encrypted） |
| `ACCESS_AUD` | Access アプリの Application Audience (AUD) Tag | JWT 検証 |
| `ACCESS_TEAM_DOMAIN` | `<team>.cloudflareaccess.com` | JWKS 取得 |
| `ALLOWED_EMAILS` | カンマ区切り email（任意） | 追加のメール許可リスト |
| `GITHUB_OWNER` | `Reishin-Sakuma`（省略可） | リポジトリオーナー |
| `GITHUB_REPO` | `reiblast.f5.si`（省略可） | リポジトリ名 |
| `GITHUB_DEFAULT_BRANCH` | `master`（省略可） | ベースブランチ |

`ACCESS_AUD` または `ACCESS_TEAM_DOMAIN` が未設定の場合はミドルウェアが
認証をスキップする（`wrangler pages dev` ローカル開発用）。

#### Access アプリ設定

- Application domain: `reiblast1123.com/admin/*` と `reiblast1123.com/api/admin/*` の2つを保護
- Identity provider: GitHub OAuth
- Policy: 自分の GitHub email のみ allow
- Session duration: 24 時間

#### ローカル開発

```bash
npx wrangler pages dev -- npm run dev
# → http://localhost:8788/admin/  （Access 無効なのでそのままアクセス可能）
```

### ローカル版（tools/blog-editor/）

レガシーのローカル専用 Flask エディタ。Pages 版への移行後は保守モード。

- **アクセス**: http://localhost:5000（VS Code Remote SSH ポートフォワード）
- **エディタ**: TipTap 2.11.5（esm.sh CDN）
- **カード挿入**: ツールバーの 📝 ⚠ 💡 🚨 🔖 📂 ボタン（自動で `.mdx` に切り替わり import も追加）
- **文字色・背景色**: カラーパレットをワンクリック
- **保存**: 自動で `post/<slug>` ブランチを作成してコミット
- **サービス管理**: `systemctl --user restart blog-editor`

## 今後の改善予定

GitHubにIssueを作成済み：

- **#3**: プロジェクトの画像・スクリーンショットの追加 - High
- **#4**: ダークモード対応 - Medium
- **#5**: アニメーション・トランジションの追加 - Low
- **#6**: SEO対策（sitemap.xml、robots.txt、構造化データ） - Medium
- **#7**: アクセシビリティの改善 - High
- **#8**: カスタム404ページの作成 - Low
- **#9**: プロジェクト詳細ページの追加 - Medium
- **#10**: About / Contact セクションの追加 - Medium
- **#53**: blog-editor からブランチ作成・PR作成・記事公開をできるようにする（ブランチ作成・コミットは実装済み）
- **#54**: blog-editor を PWA 化する

---

_Last updated: 2026-04-14_
