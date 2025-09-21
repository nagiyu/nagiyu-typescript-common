import DataAccessorBase from '@common/services/DataAccessorBase';
import DynamoDBServiceMock from '@common/tests/mock/services/aws/DynamoDBServiceMock';
import ErrorUtil from '@common/utils/ErrorUtil';
import { RecordTypeBase } from '@common/interfaces/record/RecordTypeBase';

const tableName = 'Test';

const TEST_RECORD_DATA_TYPE = {
  TYPEA: 'TypeA',
  TYPEB: 'TypeB',
} as const;

interface TestType {
  stringProperty: string;
  numberProperty: number;
  optionalProperty?: string;
}

interface TestRecordType extends RecordTypeBase {
  DataType: typeof TEST_RECORD_DATA_TYPE.TYPEA;
  StringColumn: string;
  NumberColumn: number;
  BooleanColumn: boolean;
  StringArrayColumn: string[];
  NumberArrayColumn: number[];
  ListColumn: TestType[];
  OptionalStringColumn?: string;
  OptionalNumberColumn?: number;
  OptionalBooleanColumn?: boolean;
  OptionalStringArrayColumn?: string[];
  OptionalNumberArrayColumn?: number[];
  OptionalListColumn?: TestType[];
}

const generateTypeARecord = (): TestRecordType => {
  return {
    DataType: TEST_RECORD_DATA_TYPE.TYPEA,
    StringColumn: 'stringA',
    NumberColumn: 123,
    BooleanColumn: true,
    StringArrayColumn: ['a', 'b', 'c'],
    NumberArrayColumn: [1, 2, 3],
    ListColumn: [
      { stringProperty: 'listA', numberProperty: 1 },
      { stringProperty: 'listA2', numberProperty: 2, optionalProperty: 'optional' }
    ],
  };
}

class TestDataAccessor extends DataAccessorBase<TestRecordType> {
  constructor() {
    super(tableName, TEST_RECORD_DATA_TYPE.TYPEA, new DynamoDBServiceMock(tableName));
  }
}

describe('DataAccessorBase', () => {
  let dataAccessor: TestDataAccessor;

  beforeEach(() => {
    dataAccessor = new TestDataAccessor();
  });

  it('Get Table Name', () => {
    expect(dataAccessor.getTableName()).toBe(tableName);
  });

  it('Get', async () => {
    const item1 = await dataAccessor.create(generateTypeARecord());
    const item2 = await dataAccessor.create(generateTypeARecord());

    const results = await dataAccessor.get();
    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results).toEqual(expect.arrayContaining([item1, item2]));
  });

  it('CRUD', async () => {
    const createItem = await dataAccessor.create(generateTypeARecord());
    const id = createItem.ID;

    const createResult = await dataAccessor.getById(id);

    if (!createResult) {
      ErrorUtil.throwError('Create result is null');
    }

    expect(createResult.ID).toEqual(createItem.ID);
    expect(createResult.DataType).toEqual(createItem.DataType);
    expect(createResult.StringColumn).toEqual(createItem.StringColumn);
    expect(createResult.NumberColumn).toEqual(createItem.NumberColumn);
    expect(createResult.BooleanColumn).toEqual(createItem.BooleanColumn);
    createResult.StringArrayColumn.forEach((value, index) => {
      expect(value).toEqual(createItem.StringArrayColumn[index]);
    });
    createResult.NumberArrayColumn.forEach((value, index) => {
      expect(value).toEqual(createItem.NumberArrayColumn[index]);
    });
    createResult.ListColumn.forEach((value, index) => {
      expect(value.stringProperty).toEqual(createItem.ListColumn[index].stringProperty);
      expect(value.numberProperty).toEqual(createItem.ListColumn[index].numberProperty);
      if (createItem.ListColumn[index].optionalProperty) {
        expect(value.optionalProperty).toEqual(createItem.ListColumn[index].optionalProperty);
      } else {
        expect(value.optionalProperty).toBeUndefined();
      }
    });
    expect(createResult.OptionalStringColumn).toBeUndefined();
    expect(createResult.OptionalNumberColumn).toBeUndefined();
    expect(createResult.OptionalBooleanColumn).toBeUndefined();
    expect(createResult.OptionalStringArrayColumn).toBeUndefined();
    expect(createResult.OptionalNumberArrayColumn).toBeUndefined();
    expect(createResult.OptionalListColumn).toBeUndefined();
    expect(createResult.Create).toEqual(createItem.Create);
    expect(createResult.Update).toEqual(createItem.Update);

    const updateItem: Partial<TestRecordType> = {
      StringColumn: 'updated',
      NumberColumn: 456,
      BooleanColumn: false,
      StringArrayColumn: ['updated1', 'updated2'],
      NumberArrayColumn: [7, 8, 9],
      ListColumn: [
        { stringProperty: 'updatedList', numberProperty: 3 },
        { stringProperty: 'updatedList2', numberProperty: 4, optionalProperty: 'optional' }
      ],
      OptionalStringColumn: 'optional',
      OptionalNumberColumn: 789,
      OptionalBooleanColumn: true,
      OptionalStringArrayColumn: ['optional1', 'optional2'],
      OptionalNumberArrayColumn: [10, 11, 12],
      OptionalListColumn: [
        { stringProperty: 'optionalList', numberProperty: 5 },
        { stringProperty: 'optionalList2', numberProperty: 6, optionalProperty: 'optional' }
      ],
    };

    const updateResult = await dataAccessor.update(id, updateItem);

    if (!updateResult) {
      ErrorUtil.throwError('Update result is null');
    }

    expect(updateResult.ID).toEqual(createItem.ID);
    expect(updateResult.DataType).toEqual(createItem.DataType);
    expect(updateResult.StringColumn).toEqual(updateItem.StringColumn);
    expect(updateResult.NumberColumn).toEqual(updateItem.NumberColumn);
    expect(updateResult.BooleanColumn).toEqual(updateItem.BooleanColumn);
    updateResult.StringArrayColumn.forEach((value, index) => {
      expect(value).toEqual(updateItem.StringArrayColumn?.[index]);
    });
    updateResult.NumberArrayColumn.forEach((value, index) => {
      expect(value).toEqual(updateItem.NumberArrayColumn?.[index]);
    });
    updateResult.ListColumn.forEach((value, index) => {
      expect(value.stringProperty).toEqual(updateItem.ListColumn?.[index].stringProperty);
      expect(value.numberProperty).toEqual(updateItem.ListColumn?.[index].numberProperty);
      if (updateItem.ListColumn?.[index].optionalProperty) {
        expect(value.optionalProperty).toEqual(updateItem.ListColumn[index].optionalProperty);
      } else {
        expect(value.optionalProperty).toBeUndefined();
      }
    });
    expect(updateResult.OptionalStringColumn).toEqual(updateItem.OptionalStringColumn);
    expect(updateResult.OptionalNumberColumn).toEqual(updateItem.OptionalNumberColumn);
    expect(updateResult.OptionalBooleanColumn).toEqual(updateItem.OptionalBooleanColumn);
    updateResult.OptionalStringArrayColumn?.forEach((value, index) => {
      expect(value).toEqual(updateItem.OptionalStringArrayColumn?.[index]);
    });
    updateResult.OptionalNumberArrayColumn?.forEach((value, index) => {
      expect(value).toEqual(updateItem.OptionalNumberArrayColumn?.[index]);
    });
    updateResult.OptionalListColumn?.forEach((value, index) => {
      expect(value.stringProperty).toEqual(updateItem.OptionalListColumn?.[index].stringProperty);
      expect(value.numberProperty).toEqual(updateItem.OptionalListColumn?.[index].numberProperty);
      if (updateItem.OptionalListColumn?.[index].optionalProperty) {
        expect(value.optionalProperty).toEqual(updateItem.OptionalListColumn[index].optionalProperty);
      } else {
        expect(value.optionalProperty).toBeUndefined();
      }
    });
    expect(updateResult.Create).toBe(createItem.Create);
    expect(updateResult.Update).toBeGreaterThanOrEqual(createItem.Update);

    await dataAccessor.delete(id);

    const deleteResult = await dataAccessor.getById(id);

    expect(deleteResult).toBeNull();
  });
});
