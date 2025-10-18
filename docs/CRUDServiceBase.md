# CRUDServiceBase

CRUDServiceBaseは、CRUD（Create、Read、Update、Delete）操作を提供する抽象基底サービスクラスです。

## 概要

- データアクセス層の抽象化
- キャッシュ機能のサポート
- レコード型とデータ型の変換
- 派生クラスでの拡張可能な設計

## 基本的な使用方法

### 派生クラスの作成

```typescript
import CRUDServiceBase from '@common/services/CRUDServiceBase';
import DataAccessorBase from '@common/services/DataAccessorBase';
import { DataTypeBase } from '@common/interfaces/data/DataTypeBase';
import { RecordTypeBase } from '@common/interfaces/record/RecordTypeBase';

// データ型の定義
interface MyDataType extends DataTypeBase {
  name: string;
  value: number;
}

// レコード型の定義
interface MyRecordType extends RecordTypeBase {
  Name: string;
  Value: number;
}

// データアクセサーの作成
class MyDataAccessor extends DataAccessorBase<MyRecordType> {
  constructor() {
    super('MyTable', 'MyType', dynamoDBService);
  }
}

// CRUDサービスの作成
class MyCRUDService extends CRUDServiceBase<MyDataType, MyRecordType> {
  constructor() {
    super(new MyDataAccessor());
  }

  protected dataToRecord(data: Partial<MyDataType>): Partial<MyRecordType> {
    return {
      Name: data.name,
      Value: data.value,
    };
  }

  protected recordToData(record: MyRecordType): MyDataType {
    return {
      id: record.ID,
      name: record.Name,
      value: record.Value,
      create: record.Create,
      update: record.Update,
    };
  }
}
```

### CRUD操作

```typescript
const service = new MyCRUDService();

// 作成
const newItem = await service.create({ name: 'Test', value: 100 });

// 全件取得
const allItems = await service.get();

// ID指定取得
const item = await service.getById('item-id');

// 更新
const updatedItem = await service.update('item-id', { name: 'Updated', value: 200 });

// 削除
await service.delete('item-id');
```

## キャッシュ機能

### デフォルト設定（キャッシュ有効）

```typescript
class MyCRUDService extends CRUDServiceBase<MyDataType, MyRecordType> {
  constructor() {
    super(new MyDataAccessor()); // キャッシュは自動的に有効
  }
  // ...
}
```

### キャッシュの無効化

```typescript
class MyCRUDService extends CRUDServiceBase<MyDataType, MyRecordType> {
  constructor() {
    super(new MyDataAccessor(), false); // キャッシュを無効化
  }
  // ...
}
```

### キャッシュの同期

```typescript
// キャッシュを最新のデータで更新
await service.syncCache();
```

## 拡張機能

### dataAccessorへのアクセス

`dataAccessor`フィールドは`protected`として公開されているため、派生クラスで直接アクセスできます。

```typescript
class ExtendedCRUDService extends CRUDServiceBase<MyDataType, MyRecordType> {
  constructor() {
    super(new MyDataAccessor());
  }

  // dataAccessorを使用したカスタムメソッド
  public getTableName(): string {
    return this.dataAccessor.getTableName();
  }

  public getDataType(): string {
    return this.dataAccessor.getDataType();
  }

  // より複雑なクエリの実装も可能
  public async customQuery(): Promise<MyDataType[]> {
    // dataAccessorを使用した独自のクエリ実装
    const records = await this.dataAccessor.get();
    return records.map(this.recordToData);
  }

  protected dataToRecord(data: Partial<MyDataType>): Partial<MyRecordType> {
    return {
      Name: data.name,
      Value: data.value,
    };
  }

  protected recordToData(record: MyRecordType): MyDataType {
    return {
      id: record.ID,
      name: record.Name,
      value: record.Value,
      create: record.Create,
      update: record.Update,
    };
  }
}
```

## APIリファレンス

### コンストラクタ

```typescript
protected constructor(
  dataAccessor: DataAccessorBase<RecordType>,
  useCache: boolean = true
)
```

- `dataAccessor`: データアクセス層のインスタンス
- `useCache`: キャッシュ機能の有効/無効（デフォルト: `true`）

### パブリックメソッド

#### `get(): Promise<DataType[]>`

全てのデータを取得します。キャッシュが有効な場合、最初はキャッシュを返します。

#### `getById(id: string): Promise<DataType | null>`

指定されたIDのデータを取得します。データが存在しない場合は`null`を返します。

#### `create(creates: Partial<DataType>): Promise<DataType>`

新しいデータを作成します。

#### `update(id: string, updates: Partial<DataType>): Promise<DataType>`

指定されたIDのデータを更新します。

#### `delete(id: string): Promise<void>`

指定されたIDのデータを削除します。

#### `syncCache(): Promise<void>`

キャッシュを最新のデータで同期します。キャッシュが無効な場合は何もしません。

### プロテクテッドメソッド（実装必須）

#### `dataToRecord(data: Partial<DataType>): Partial<RecordType>`

データ型からレコード型に変換します。派生クラスで実装が必要です。

#### `recordToData(record: RecordType): DataType`

レコード型からデータ型に変換します。派生クラスで実装が必要です。

### プロテクテッドフィールド

#### `dataAccessor: DataAccessorBase<RecordType>`

データアクセス層のインスタンス。派生クラスから直接アクセス可能です。

## テスト

CRUDServiceBaseのテストは`tests/CRUDService.test.ts`に含まれています。

```typescript
import CRUDServiceBase from '@common/services/CRUDServiceBase';
import DataAccessorBase from '@common/services/DataAccessorBase';
import DynamoDBServiceMock from '@common-mock/services/aws/DynamoDBServiceMock';

// テスト用の実装
class TestCRUDService extends CRUDServiceBase<TestDataType, TestRecordType> {
  constructor() {
    super(new TestDataAccessor());
  }

  protected dataToRecord(data: Partial<TestDataType>): Partial<TestRecordType> {
    // 変換ロジック
  }

  protected recordToData(record: TestRecordType): TestDataType {
    // 変換ロジック
  }
}

// テストの実行
describe('CRUDServiceBase', () => {
  let service: TestCRUDService;

  beforeEach(() => {
    service = new TestCRUDService();
  });

  it('CRUD operations', async () => {
    const item = await service.create({ name: 'Test' });
    const retrieved = await service.getById(item.id);
    expect(retrieved).toEqual(item);
  });
});
```

## 設計のポイント

### 抽象化

CRUDServiceBaseは、データアクセス層の詳細を隠蔽し、ビジネスロジック層に統一されたインターフェースを提供します。

### キャッシュ戦略

- 読み取り操作でキャッシュを優先的に使用
- 書き込み操作（Create、Update、Delete）でキャッシュを自動更新
- 必要に応じて`syncCache()`で明示的な同期が可能

### 拡張性

- `protected`アクセス修飾子により、派生クラスでの拡張が容易
- `dataAccessor`フィールドへのアクセスにより、カスタムクエリの実装が可能
- 抽象メソッドにより、型変換ロジックのカスタマイズが必須

## 他プロジェクトでの使用

このサービスを他のプロジェクトで使用する場合：

1. DataAccessorBaseを継承してデータアクセス層を実装
2. CRUDServiceBaseを継承してサービス層を実装
3. `dataToRecord`と`recordToData`メソッドを実装
4. 必要に応じて追加のメソッドを実装

```typescript
// 独自のCRUDサービスの実装例
class UserCRUDService extends CRUDServiceBase<UserData, UserRecord> {
  constructor() {
    super(new UserDataAccessor());
  }

  // ユーザー固有の機能
  async findByEmail(email: string): Promise<UserData | null> {
    const users = await this.get();
    return users.find(u => u.email === email) || null;
  }

  protected dataToRecord(data: Partial<UserData>): Partial<UserRecord> {
    return {
      Email: data.email,
      Name: data.name,
    };
  }

  protected recordToData(record: UserRecord): UserData {
    return {
      id: record.ID,
      email: record.Email,
      name: record.Name,
      create: record.Create,
      update: record.Update,
    };
  }
}
```
