# Nagiyu TypeScript Common

共通の TypeScript ライブラリとユーティリティを提供するプロジェクトです。

## 開発環境

このプロジェクトでは VSCode の DevContainer を使用した開発環境を提供しています。

### DevContainer を使用した開発

1. VSCode でプロジェクトを開く
2. Dev Containers 拡張機能がインストールされていることを確認
3. コマンドパレットから "Dev Containers: Reopen in Container" を選択
4. 自動的に開発環境が構築されます

詳細については [DevContainer 開発環境](./docs/development/devcontainer.md) を参照してください。

### ローカル開発

```bash
# 依存関係のインストール
npm install

# テストの実行
npm test
```

## プロジェクト構成

- `common/`: 共通ライブラリのソースコード
- `tests/`: テストファイル
- `docs/`: プロジェクトドキュメント
