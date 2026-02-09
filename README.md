# Reishin Sakuma - Portfolio

プロジェクトをまとめたポートフォリオサイト

## 掲載プロジェクト

### メインプロジェクト

- **Shakeeper** - 車検管理PWA
- **milpon（ミルポン）** - 赤ちゃんの育児記録アプリ

### Coming Soon

- RCScheduler
- car-buddy
- Chrona
- ILCollector

## 技術スタック

- **フレームワーク**: Astro
- **ホスティング**: Cloudflare Pages
- **デプロイツール**: Wrangler

## 開発

### セットアップ

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:4321](http://localhost:4321) を開く

### ビルド

```bash
npm run build
```

ビルドされたファイルは `dist/` ディレクトリに出力されます。

### プレビュー

```bash
npm run preview
```

## デプロイ

### Cloudflare Pages へのデプロイ

```bash
npm run build
npx wrangler pages deploy dist --project-name=reiblast-portfolio
```

または

```bash
npm run build
npx wrangler pages deploy
```

### カスタムドメイン

Cloudflare Pages のダッシュボードでカスタムドメイン `reiblast.f5.si` を設定してください。

## プロジェクト構成

```
.
├── src/
│   ├── layouts/
│   │   └── Layout.astro         # 共通レイアウト
│   └── pages/
│       └── index.astro           # トップページ
├── public/                       # 静的ファイル
├── astro.config.mjs              # Astro設定
├── wrangler.toml                 # Cloudflare Pages設定
└── package.json
```

## ライセンス

All rights reserved.
