import CRUDServiceBase from '@common/services/CRUDServiceBase';
import DataAccessorBase from '@common/services/DataAccessorBase';
import DynamoDBServiceMock from '@common/tests/mock/services/aws/DynamoDBServiceMock';
import ErrorUtil from '@common/utils/ErrorUtil';
import { DataTypeBase } from '@common/interfaces/data/DataTypeBase';
import { RecordTypeBase } from '@common/interfaces/record/RecordTypeBase';

const tableName = 'Test';

const TEST_RECORD_DATA_TYPE = {
  TYPEC: 'TypeC',
} as const;

interface TestType {
  propX: string;
  propY: number;
}

interface TestRecordType extends RecordTypeBase {
  DataType: typeof TEST_RECORD_DATA_TYPE.TYPEC;
  ColumnA: string;
  ColumnB: number;
  ColumnC: boolean;
  ColumnD: TestType;
}

interface TestDataType extends DataTypeBase {
  columnA: string;
  columnB: number;
  columnC: boolean;
  columnD: TestType;
}

class TestDataAccessor extends DataAccessorBase<TestRecordType> {
  constructor() {
    super(tableName, TEST_RECORD_DATA_TYPE.TYPEC, new DynamoDBServiceMock(tableName));
  }
}

class TestCRUDService extends CRUDServiceBase<TestDataType, TestRecordType> {
  constructor() {
    super(new TestDataAccessor());
  }

  protected dataToRecord(data: Partial<TestDataType>): Partial<TestRecordType> {
    return {
      ColumnA: data.columnA,
      ColumnB: data.columnB,
      ColumnC: data.columnC,
      ColumnD: data.columnD,
    };
  }

  protected recordToData(record: TestRecordType): TestDataType {
    return {
      id: record.ID,
      columnA: record.ColumnA,
      columnB: record.ColumnB,
      columnC: record.ColumnC,
      columnD: record.ColumnD,
      create: record.Create,
      update: record.Update,
    };
  }
}

class TestCRUDNoCacheService extends CRUDServiceBase<TestDataType, TestRecordType> {
  constructor() {
    super(new TestDataAccessor(), false);
  }

  protected dataToRecord(data: Partial<TestDataType>): Partial<TestRecordType> {
    return {
      ColumnA: data.columnA,
      ColumnB: data.columnB,
      ColumnC: data.columnC,
      ColumnD: data.columnD,
    };
  }

  protected recordToData(record: TestRecordType): TestDataType {
    return {
      id: record.ID,
      columnA: record.ColumnA,
      columnB: record.ColumnB,
      columnC: record.ColumnC,
      columnD: record.ColumnD,
      create: record.Create,
      update: record.Update,
    };
  }
}

describe('CRUDServiceBase', () => {
  let service: TestCRUDService;
  let serviceNoCache: TestCRUDNoCacheService;

  beforeEach(() => {
    service = new TestCRUDService();
    serviceNoCache = new TestCRUDNoCacheService();
  });

  it('Get', async () => {
    const item1 = await service.create({ columnA: 'A1', columnB: 1, columnC: true, columnD: { propX: 'X1', propY: 10 } });
    const item2 = await service.create({ columnA: 'A2', columnB: 2, columnC: false, columnD: { propX: 'X2', propY: 20 } });

    const results = await service.get();
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results).toEqual(expect.arrayContaining([item1, item2]));
  });

  it('Get No Cache', async () => {
    const item1 = await serviceNoCache.create({ columnA: 'A1', columnB: 1, columnC: true, columnD: { propX: 'X1', propY: 10 } });
    const item2 = await serviceNoCache.create({ columnA: 'A2', columnB: 2, columnC: false, columnD: { propX: 'X2', propY: 20 } });

    const results = await serviceNoCache.get();
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results).toEqual(expect.arrayContaining([item1, item2]));
  });

  it('CRUD', async () => {
    const createItem = await service.create({ columnA: 'A1', columnB: 1, columnC: true, columnD: { propX: 'X1', propY: 10 } });
    const id = createItem.id;

    const createResult = await service.getById(id);

    if (!createResult) {
      ErrorUtil.throwError('Create result is null');
    }

    expect(createResult.id).toEqual(createItem.id);
    expect(createResult.columnA).toEqual(createItem.columnA);
    expect(createResult.columnB).toEqual(createItem.columnB);
    expect(createResult.columnC).toEqual(createItem.columnC);
    expect(createResult.columnD.propX).toEqual(createItem.columnD.propX);
    expect(createResult.columnD.propY).toEqual(createItem.columnD.propY);
    expect(createResult.create).toEqual(createItem.create);
    expect(createResult.update).toEqual(createItem.update);

    const updateItem: Partial<TestDataType> = {
      columnA: 'A2',
      columnB: 2,
      columnC: false,
      columnD: { propX: 'X2', propY: 20 },
    };

    const updateResult = await service.update(id, updateItem);

    if (!updateResult) {
      ErrorUtil.throwError('Update result is null');
    }

    expect(updateResult.id).toEqual(createItem.id);
    expect(updateResult.columnA).toEqual(updateItem.columnA);
    expect(updateResult.columnB).toEqual(updateItem.columnB);
    expect(updateResult.columnC).toEqual(updateItem.columnC);
    expect(updateResult.columnD.propX).toEqual(updateItem.columnD?.propX);
    expect(updateResult.columnD.propY).toEqual(updateItem.columnD?.propY);
    expect(updateResult.create).toBe(createItem.create);
    expect(updateResult.update).toBeGreaterThanOrEqual(createItem.update);

    await service.delete(id);

    const deleteResult = await service.getById(id);

    expect(deleteResult).toBeNull();
  });

  it('CRUD No Cache', async () => {
    const createItem = await serviceNoCache.create({ columnA: 'A1', columnB: 1, columnC: true, columnD: { propX: 'X1', propY: 10 } });
    const id = createItem.id;

    const createResult = await serviceNoCache.getById(id);

    if (!createResult) {
      ErrorUtil.throwError('Create result is null');
    }

    expect(createResult.id).toEqual(createItem.id);
    expect(createResult.columnA).toEqual(createItem.columnA);
    expect(createResult.columnB).toEqual(createItem.columnB);
    expect(createResult.columnC).toEqual(createItem.columnC);
    expect(createResult.columnD.propX).toEqual(createItem.columnD.propX);
    expect(createResult.columnD.propY).toEqual(createItem.columnD.propY);
    expect(createResult.create).toEqual(createItem.create);
    expect(createResult.update).toEqual(createItem.update);

    const updateItem: Partial<TestDataType> = {
      columnA: 'A2',
      columnB: 2,
      columnC: false,
      columnD: { propX: 'X2', propY: 20 },
    };

    const updateResult = await serviceNoCache.update(id, updateItem);

    if (!updateResult) {
      ErrorUtil.throwError('Update result is null');
    }

    expect(updateResult.id).toEqual(createItem.id);
    expect(updateResult.columnA).toEqual(updateItem.columnA);
    expect(updateResult.columnB).toEqual(updateItem.columnB);
    expect(updateResult.columnC).toEqual(updateItem.columnC);
    expect(updateResult.columnD.propX).toEqual(updateItem.columnD?.propX);
    expect(updateResult.columnD.propY).toEqual(updateItem.columnD?.propY);
    expect(updateResult.create).toBe(createItem.create);
    expect(updateResult.update).toBeGreaterThanOrEqual(createItem.update);

    await serviceNoCache.delete(id);

    const deleteResult = await serviceNoCache.getById(id);

    expect(deleteResult).toBeNull();
  });
});
