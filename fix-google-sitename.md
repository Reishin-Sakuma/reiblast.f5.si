# Google検索でサイト名が「[kuku.lu]」と表示される問題の修正

## 問題

f5.si のサブドメイン（例: `xxx.reiblast.f5.si`）を使用しているサイトで、
Google検索結果のサイト名表示が独自のサービス名ではなく「[kuku.lu]」になってしまう。

## 修正プロンプト

```
Google検索結果でサイト名が「[kuku.lu]」と表示されてしまう問題を修正したい。
f5.si のサブドメインを使用しているため、Google がドメインオーナーとして kuku.lu を表示している。

以下を追加して修正してほしい：

1. OGP メタタグ（og:site_name, og:title, og:description, og:url, og:image, og:locale）
2. Twitter Card メタタグ（twitter:card, twitter:site, twitter:title 等）
3. JSON-LD 構造化データ（WebSite スキーマ、name と url を含む）

og:site_name と JSON-LD の name には、サービス名（例: "milpon" や "Shakeeper"）を設定すること。
修正後はビルドして動作確認し、コミット・プッシュまで行うこと。
```

## 注意

- Googleが検索表示を更新するまで数週間かかる場合がある
- 修正後は Google Search Console の「URL検査」でインデックス再登録をリクエストすると早まることがある
