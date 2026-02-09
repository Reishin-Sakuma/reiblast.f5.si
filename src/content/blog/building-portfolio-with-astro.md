---
title: "Astroでポートフォリオサイトを構築した話"
description: "静的サイトジェネレーターAstroを使ってポートフォリオサイトを構築した経験をシェアします。"
pubDate: 2026-02-09
author: reiblast1123
tags: ["Astro", "Web開発", "ポートフォリオ"]
---

# Astroでポートフォリオサイトを構築した話

このポートフォリオサイトは、Astroという静的サイトジェネレーターで構築しています。

## なぜAstroを選んだか

Astroを選んだ理由は以下の通りです：

### 1. パフォーマンス

Astroは「**Zero JavaScript by default**」というコンセプトで、不要なJavaScriptを一切送信しません。その結果、驚異的に高速なサイトが実現できます。

### 2. 柔軟性

React、Vue、Svelte、Solidなど、好きなUIフレームワークを混在して使えます。私のプロジェクトでは：

- Shakeeper: Next.js (React)
- milpon: SvelteKit

と異なるフレームワークを使っていますが、Astroならどちらのコンポーネントも統合できます。

### 3. 開発体験

- シンプルな`.astro`ファイル形式
- TypeScript完全サポート
- Content Collections による型安全なMarkdown管理

## 実装した機能

### ファビコン生成システム

SVGファビコンから複数サイズのPNG、ICOを自動生成するスクリプトを実装しました：

```javascript
// scripts/generate-favicons.js
import { Resvg } from '@resvg/resvg-js';
// ...サイズごとにPNGを生成
```

### PWA対応

manifest.jsonとservice workerでPWA対応し、ホーム画面に追加できるようにしました。

### Cloudflare Pages デプロイ

Wranglerを使ってCloudflare Pagesに自動デプロイ。カスタムドメイン `reiblast.f5.si` も設定済みです。

## 今後の予定

- ブログ機能（今これ！）
- ダークモード対応
- プロジェクトのスクリーンショット追加
- アクセシビリティ改善

## まとめ

Astroは非常に強力で使いやすいフレームワークです。ポートフォリオサイトやブログを作りたい方には特におすすめです。

ぜひ試してみてください！
