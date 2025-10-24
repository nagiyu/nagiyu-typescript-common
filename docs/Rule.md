# Rule

## TypeScript

### データ

#### DataType

部品間のデータのやり取りは [DataTypeBase](common/interfaces/data/DataTypeBase.ts) を継承した DataType を使用する。
DynamoDB のレコードの型は直接使用しないこと。

```typescript
interface SampleDataType extends DataTypeBase {
  column1: string;
  column2: number;
}
```

### サービス

#### CRUDService

CRUD を含むサービスは [CRUDServiceBase](common/services/CRUDServiceBase.ts) を継承したサービスを使用する。

```typescript
class SampleService extends CRUDServiceBase<SampleDataType, SampleRecordType> {
  constructor() {
    super(new TestDataAccessor());
  }

  protected dataToRecord(
    data: Partial<SampleDataType>
  ): Partial<SampleRecordType> {
    return {
      Column1: data.column1,
      Column2: data.column2,
    };
  }

  protected recordToData(record: SampleRecordType): SampleDataType {
    return {
      id: record.ID,
      columnA: record.Column1,
      columnB: record.Column2,
      create: record.Create,
      update: record.Update,
    };
  }
}
```

### DynamoDB

#### RecordType

DynamoDB のレコードは [RecordTypeBase](common/interfaces/record/RecordTypeBase.ts) を継承した RecordType を使用する。

```typescript
interface SampleRecordType extends RecordTypeBase {
  DataType: "Sample";
  Column1: string;
  Column2: number;
}
```

#### DataAccessor

データアクセスには [DataAccessorBase](common/services/DataAccessorBase.ts) を継承した DataAccessor を使用する。

```typescript
class SampleDataAccessor extends DataAccessorBase<TestRecordType> {
  constructor() {
    super(tableName, "Sample");
  }
}
```

テーブル名はプロジェクト固有のため、共通の Util を切り出して流用するなど工夫する。
