# Next.js サイトにサイトマップを追加する

## 対象サイト

| サイト | LP URL | インデックスさせるページ |
|---|---|---|
| Charin | https://charin.reiblast.f5.si | `/` のみ（アプリは app.charin.reiblast.f5.si） |
| Shakeeper | https://shakeeper.reiblast.f5.si | `/` のみ（アプリは app.shakeeper.reiblast.f5.si） |

## プロンプト（Charin 用）

```
このNext.jsランディングページにサイトマップを追加してほしい。

サイト情報：
- 本番URL: https://charin.reiblast.f5.si
- インデックスさせるページ: / のみ
- アプリ本体（app.charin.reiblast.f5.si）はインデックス不要

手順：
1. `next-sitemap` パッケージをインストールする
2. `next-sitemap.config.js` を作成する
   - siteUrl: https://charin.reiblast.f5.si
   - generateRobotsTxt: true
   - exclude に /api/* 等サーバー側のパスを指定する
3. package.json の postbuild に `next-sitemap` を追加する
4. ビルドして public/sitemap.xml または sitemap-index.xml が生成されることを確認する
5. コミット・プッシュする

完了後、生成されたサイトマップの URL を教えてほしい。
```

## プロンプト（Shakeeper 用）

```
このNext.jsランディングページにサイトマップを追加してほしい。

サイト情報：
- 本番URL: https://shakeeper.reiblast.f5.si
- インデックスさせるページ: / のみ
- アプリ本体（app.shakeeper.reiblast.f5.si）はインデックス不要

手順：
1. `next-sitemap` パッケージをインストールする
2. `next-sitemap.config.js` を作成する
   - siteUrl: https://shakeeper.reiblast.f5.si
   - generateRobotsTxt: true
   - exclude に /api/* 等サーバー側のパスを指定する
3. package.json の postbuild に `next-sitemap` を追加する
4. ビルドして public/sitemap.xml または sitemap-index.xml が生成されることを確認する
5. コミット・プッシュする

完了後、生成されたサイトマップの URL を教えてほしい。
```

## Search Console への登録

サイトマップ生成後、Google Search Console で以下を登録する：
- `https://charin.reiblast.f5.si/sitemap.xml`（または sitemap-index.xml）
- `https://shakeeper.reiblast.f5.si/sitemap.xml`（または sitemap-index.xml）
