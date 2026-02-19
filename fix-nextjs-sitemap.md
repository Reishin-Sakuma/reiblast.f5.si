# Next.js サイトにサイトマップを追加する

## プロンプト

```
このNext.jsサイトにサイトマップを追加してほしい。

まず以下を確認してから作業してほしい：
- 本番URLはどこか（package.json, .env, next.config.js 等から特定する）
- どのページをインデックスさせるべきか（ログイン必須ページ・APIルートは除外）

手順：
1. `next-sitemap` パッケージをインストールする
2. `next-sitemap.config.js` を作成する
   - siteUrl に本番URLを設定する
   - generateRobotsTxt: true にする
   - インデックス不要なパス（/api/*, ログイン後画面など）を exclude に指定する
3. package.json の postbuild スクリプトに `next-sitemap` を追加する
4. ビルドして sitemap.xml（または sitemap-index.xml）が生成されることを確認する
5. コミット・プッシュする

完了後、生成されたサイトマップの URL を教えてほしい。
Google Search Console に登録するため。
```

## Search Console への登録

生成されたサイトマップURLを Google Search Console → サイトマップ から登録する。
