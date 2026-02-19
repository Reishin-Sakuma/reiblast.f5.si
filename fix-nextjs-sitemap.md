# Next.js サイトにサイトマップを追加する

## 対象

Next.js で作られた Web アプリで、Google Search Console にサイトマップを登録したい。

## プロンプト

```
このNext.jsサイトにサイトマップを追加してほしい。

1. `next-sitemap` パッケージをインストールする
2. `next-sitemap.config.js` を作成する
   - siteUrl にこのサイトの本番URLを設定する
   - ログイン後など、インデックスさせたくないページは exclude に指定する
   - generateRobotsTxt: true にして robots.txt も生成する
3. package.json の postbuild スクリプトに `next-sitemap` を追加する
4. ビルドしてサイトマップが生成されることを確認する
5. コミット・プッシュする

生成される sitemap.xml（または sitemap-index.xml）の URL を教えてほしい。
Google Search Console に登録するため。
```

## 補足

- `next-sitemap` がビルド後に自動で `public/sitemap*.xml` と `public/robots.txt` を生成する
- インデックスさせたくないページの例：`/dashboard`, `/settings`, `/login` など
- 生成後は Google Search Console のサイトマップ画面から URL を登録する
