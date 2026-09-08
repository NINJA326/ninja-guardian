# NINJA AIRS 保護者アプリ

## 概要

NINJA AIRSの保護者向け閲覧専用Webアプリです。

将来的に以下を提供します。

- 成長記録
- フィードバック
- スケジュール

保護者からの新規作成・更新・削除は行いません。

## 構成

```text
ninja-guardian/
├─ index.html
├─ css/
│  └─ base.css
├─ js/
│  ├─ config.js
│  └─ app.js
├─ assets/
└─ README.md
```

## 起動方法

VS Codeでこのフォルダを開き、ローカルHTTPサーバーで `index.html` を表示してください。

## 公開方法

GitHub Pagesを使用します。

## 更新方法

VS Code
→ 動作確認
→ Commit
→ Push
→ GitHub Pages確認

## セキュリティ

公開コードにパスワード、アクセストークン、シークレット、個人情報を保存しないでください。
