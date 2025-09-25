# OpenAI Service

OpenAIServiceは、OpenAI APIを使用してチャット機能を提供するサービスです。

## 概要

- OpenAI APIを使用した基本的なチャット機能
- AWS Secrets Managerからの安全なAPIキー取得
- 会話履歴の管理
- インターフェースによる抽象化

## 使用方法

### 基本的なチャット

```typescript
import OpenAIService from '@common/services/OpenAIService';
import { OpenAIChatHistory } from '@common/interfaces/OpenAIMessageType';

const openaiService = new OpenAIService();

// 基本的なチャット
const messages: OpenAIChatHistory = [
  { role: 'system', content: 'あなたは親切なアシスタントです。' },
  { role: 'user', content: 'こんにちは！' }
];

const response = await openaiService.chat(messages);
console.log(response); // OpenAIからの応答
```

### 新しい会話の開始

```typescript
const response = await openaiService.startConversation(
  'あなたは親切なアシスタントです。',
  'こんにちは！元気ですか？'
);
```

### 会話の継続

```typescript
// 既存の会話履歴
let conversation: OpenAIChatHistory = [
  { role: 'system', content: 'あなたは親切なアシスタントです。' },
  { role: 'user', content: 'こんにちは！' },
  { role: 'assistant', content: 'こんにちは！お手伝いできることはありますか？' }
];

// 会話を継続
const newResponse = await openaiService.continueConversation(
  conversation,
  '天気について教えてください。'
);

// アシスタントの応答を会話履歴に追加
conversation = openaiService.addAssistantResponse(conversation, newResponse);
```

### オプション設定

```typescript
const response = await openaiService.chat(messages, {
  model: 'gpt-4',           // 使用するモデル（デフォルト: 'gpt-3.5-turbo'）
  maxTokens: 1000,          // 最大トークン数
  temperature: 0.7          // 応答のランダム性（0-2）
});
```

## 型定義

### OpenAIMessageType

```typescript
interface OpenAIMessageType {
  role: 'system' | 'user' | 'assistant';  // メッセージの役割
  content: string;                        // メッセージの内容
}
```

### OpenAIChatHistory

```typescript
type OpenAIChatHistory = OpenAIMessageType[]; // 会話履歴の配列
```

### OpenAIChatOptions

```typescript
interface OpenAIChatOptions {
  model?: string;        // 使用するモデル
  maxTokens?: number;    // 最大トークン数
  temperature?: number;  // 温度パラメータ
}
```

## 設定

### AWS Secrets Manager

OpenAI APIキーはAWS Secrets Managerから取得されます。

**必要な設定:**
- Secret Name: `process.env.PROJECT_SECRET` で指定
- Key: `OPENAI_API_KEY`

### 環境変数

```bash
PROJECT_SECRET=your-secret-name  # Secrets Managerのシークレット名
PROCESS_ENV=local|development|production  # 環境設定
```

## テスト

モックサービス `OpenAIServiceMock` が用意されており、テスト時に使用できます。

```typescript
import OpenAIServiceMock from '@common-mock/services/OpenAIServiceMock';

const mockService = new OpenAIServiceMock();
mockService.setDefaultResponse('カスタムモック応答');

const response = await mockService.chat([
  { role: 'user', content: 'テストメッセージ' }
]);
```

## エラーハンドリング

- APIキーが取得できない場合
- OpenAI APIからエラーが返された場合
- メッセージ配列が空の場合

すべてのエラーは `ErrorUtil.throwError()` を使用して適切に処理されます。

## 他プロジェクトでの使用

このサービスを他のプロジェクトで使用する場合、新たなパッケージのインストールは不要です。インターフェース `OpenAIServiceType` を実装することで、独自の実装を提供することも可能です。

```typescript
import { OpenAIServiceType } from '@common/services/OpenAIService';

class CustomOpenAIService implements OpenAIServiceType {
  async chat(messages: OpenAIChatHistory, options?: OpenAIChatOptions): Promise<string> {
    // カスタム実装
  }
}
```