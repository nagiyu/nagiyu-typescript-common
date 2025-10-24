# CloudWatch Logs Service

CloudWatchLogsServiceは、AWS CloudWatch Logsを使用してログの記録と取得を行うサービスです。

## 概要

- AWS CloudWatch Logsへのログイベントの送信
- ログストリームの作成
- ログイベントの取得
- AWS Secrets Managerからの安全な認証情報取得

## 使用方法

### サービスの初期化

```typescript
import CloudWatchLogsService from '@common/services/aws/CloudWatchLogsService';

// ロググループ名とログストリーム名を指定してサービスを初期化
const cloudWatchLogsService = new CloudWatchLogsService(
  'my-log-group',
  'my-log-stream'
);
```

### ログストリームの作成

```typescript
// ログストリームが存在しない場合は作成する
// 既に存在する場合はエラーなく処理を続行
await cloudWatchLogsService.createLogStream();
```

### ログイベントの送信

```typescript
import { LogEvent } from '@common/services/aws/CloudWatchLogsService';

// ログイベントを配列で送信
const events: LogEvent[] = [
  {
    message: 'Application started',
    timestamp: Date.now(),
  },
  {
    message: 'Processing request',
    timestamp: Date.now(),
  },
];

await cloudWatchLogsService.putLogEvents(events);
```

### ログイベントの取得

```typescript
// オプションを指定してログを取得
const logs = await cloudWatchLogsService.getLogEvents({
  startTime: Date.now() - 3600000, // 1時間前から
  endTime: Date.now(),             // 現在まで
  limit: 100,                      // 最大100件
  startFromHead: true,             // 古いログから取得
});

// 取得したログを処理
logs.forEach(log => {
  console.log(`[${new Date(log.timestamp)}] ${log.message}`);
});
```

### 完全な使用例

```typescript
import CloudWatchLogsService, { LogEvent } from '@common/services/aws/CloudWatchLogsService';

async function logApplicationEvent(message: string) {
  const service = new CloudWatchLogsService(
    'my-app-logs',
    'application-events'
  );

  // ログストリームを作成（初回のみ必要）
  await service.createLogStream();

  // ログイベントを送信
  const event: LogEvent = {
    message,
    timestamp: Date.now(),
  };

  await service.putLogEvents([event]);
}

async function getRecentLogs() {
  const service = new CloudWatchLogsService(
    'my-app-logs',
    'application-events'
  );

  // 直近1時間のログを取得
  const logs = await service.getLogEvents({
    startTime: Date.now() - 3600000,
    endTime: Date.now(),
    limit: 50,
    startFromHead: false, // 新しいログから取得
  });

  return logs;
}
```

## 型定義

### LogEvent

```typescript
interface LogEvent {
  message: string;   // ログメッセージ
  timestamp: number; // タイムスタンプ（ミリ秒単位のUnix時間）
}
```

### GetLogEventsOptions

```typescript
interface GetLogEventsOptions {
  startTime?: number;      // 開始時刻（ミリ秒単位のUnix時間）
  endTime?: number;        // 終了時刻（ミリ秒単位のUnix時間）
  limit?: number;          // 取得する最大イベント数
  startFromHead?: boolean; // trueの場合、古いログから取得
}
```

## メソッド

### getLogGroupName(): string

ロググループ名を取得します。

```typescript
const logGroupName = cloudWatchLogsService.getLogGroupName();
```

### getLogStreamName(): string

ログストリーム名を取得します。

```typescript
const logStreamName = cloudWatchLogsService.getLogStreamName();
```

### createLogStream(): Promise<void>

ログストリームを作成します。既に存在する場合はエラーなく処理を続行します。

```typescript
await cloudWatchLogsService.createLogStream();
```

### putLogEvents(events: LogEvent[]): Promise<void>

ログイベントを送信します。イベントは自動的にタイムスタンプ順にソートされます。

```typescript
const events: LogEvent[] = [
  { message: 'Event 1', timestamp: Date.now() },
  { message: 'Event 2', timestamp: Date.now() + 1000 },
];

await cloudWatchLogsService.putLogEvents(events);
```

**注意**: 空の配列を渡すとエラーがスローされます。

### getLogEvents(options?: GetLogEventsOptions): Promise<LogEvent[]>

ログイベントを取得します。

```typescript
const logs = await cloudWatchLogsService.getLogEvents({
  startTime: Date.now() - 3600000,
  endTime: Date.now(),
  limit: 100,
  startFromHead: true,
});
```

## 設定

### 環境変数

CloudWatchLogsServiceは、以下の環境変数を使用します：

```bash
PROJECT_SECRET=your-secret-name  # Secrets Managerのシークレット名
PROCESS_ENV=local|development|production  # 環境設定
```

### AWS Secrets Managerに必要なキー

Secrets Managerには以下のキーが必要です：

- `AWS_REGION`: AWSリージョン（例: 'ap-northeast-1'）
- `AWS_ACCESS_KEY`: AWSアクセスキー（ローカル環境のみ）
- `AWS_SECRET_ACCESS_KEY`: AWSシークレットアクセスキー（ローカル環境のみ）

### AWS CloudWatch Logsの準備

1. **ロググループの作成**
   - AWSコンソールまたはCLIでロググループを作成してください
   - サービス初期化時に指定したロググループ名と一致させる必要があります

2. **IAM権限の設定**
   - `logs:CreateLogStream`: ログストリームの作成
   - `logs:PutLogEvents`: ログイベントの送信
   - `logs:DescribeLogStreams`: ログストリームの情報取得
   - `logs:GetLogEvents`: ログイベントの取得

## テスト

テストは `tests/cloudwatch.test.ts` に配置されています。実際のAWS CloudWatch Logsを使用するテストはデフォルトでスキップされています。

```bash
# テストを有効にするには、テストファイル内の .skip を削除してください
# tests/cloudwatch.test.ts の describe.skip を describe に変更
```

実際のAWSテストを実行する場合：
1. 環境変数を適切に設定
2. ロググループを作成
3. テストファイルの `describe.skip` を `describe` に変更
4. `npm test` を実行

## エラーハンドリング

- ログストリームが存在しない場合
- ログイベントの配列が空の場合
- AWS APIからエラーが返された場合
- 認証情報が取得できない場合

すべてのエラーは `ErrorUtil.throwError()` を使用して適切に処理されます。

## 他プロジェクトでの使用

このサービスを他のプロジェクトで使用する場合、新たなパッケージのインストールは不要です。ログの記録と取得を簡単に行うことができます。

```typescript
// 他のプロジェクトでの使用例
import CloudWatchLogsService from '@common/services/aws/CloudWatchLogsService';

const logger = new CloudWatchLogsService(
  'my-project-logs',
  'api-requests'
);

await logger.createLogStream();
await logger.putLogEvents([
  {
    message: JSON.stringify({ action: 'API_CALL', endpoint: '/api/users' }),
    timestamp: Date.now(),
  },
]);
```

## 注意事項

- ログイベントのタイムスタンプは、現在時刻から前後2週間以内である必要があります
- 1回のputLogEventsリクエストで送信できるイベント数には制限があります（最大10,000イベント）
- ログイベントは自動的にタイムスタンプ順にソートされます
- ログストリームへの書き込みにはシーケンストークンが必要ですが、サービス内で自動的に管理されます
