# DevContainer 開発環境

## 概要

このプロジェクトでは VSCode の DevContainer を使用した開発環境を提供しています。

## 前提条件

- Docker がインストールされていること
- VSCode がインストールされていること
- Dev Containers 拡張機能がインストールされていること

## セットアップ手順

1. VSCode でプロジェクトを開く
2. コマンドパレット（Ctrl+Shift+P / Cmd+Shift+P）を開く
3. "Dev Containers: Reopen in Container" を選択する
4. DevContainer が自動的にビルドされ、開発環境が準備されます

## 含まれる機能

### 自動インストールされる拡張機能

- **TypeScript Next**: TypeScript の最新機能サポート
- **JSON Support**: JSON ファイルのサポート
- **Prettier**: コードフォーマッター
- **ESLint**: コードリンター
- **Jest**: テストフレームワークサポート
- **NPM Scripts**: npm スクリプトサポート
- **AWS Toolkit**: AWS 開発支援ツール

### Workspace 設定

以下の設定が自動的に適用されます：

- **インデント**: スペース 2 文字
- **自動フォーマット**: 保存時に自動フォーマット
- **行末**: LF（Unix形式）
- **末尾の空白**: 自動削除
- **ファイル末尾**: 改行を自動挿入

## ワークスペースファイル

プロジェクトには `nagiyu-typescript-common.code-workspace` ファイルが含まれており、このファイルを開くことで統一された開発環境設定が適用されます。

## 利用可能なコマンド

DevContainer 内では以下のコマンドが利用できます：

```bash
# 依存関係のインストール
npm install

# テストの実行
npm test

# TypeScript のコンパイルチェック
npx tsc --noEmit
```

## トラブルシューティング

### DevContainer が起動しない場合

1. Docker が正常に動作していることを確認
2. Docker Desktop が起動していることを確認
3. VSCode の Dev Containers 拡張機能が最新版であることを確認

### 拡張機能が正常に動作しない場合

1. DevContainer を再ビルド（"Dev Containers: Rebuild Container"）
2. VSCode を再起動