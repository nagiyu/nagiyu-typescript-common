import DynamoDBService from '@common/services/aws/DynamoDBService';
import ErrorUtil from '@common/utils/ErrorUtil';
import { RecordTypeBase } from '@common/interfaces/record/RecordTypeBase';

const TEST_RECORD_DATA_TYPE = {
  TYPEA: 'TypeA',
  TYPEB: 'TypeB',
} as const;

type TestRecordDataType = typeof TEST_RECORD_DATA_TYPE[keyof typeof TEST_RECORD_DATA_TYPE];

interface TestType {
  stringProperty: string;
  numberProperty: number;
  optionalProperty?: string;
}

interface TestRecordType extends RecordTypeBase {
  DataType: TestRecordDataType;
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

const generateTypeARecord = (): Partial<TestRecordType> => {
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

const generateTypeBRecord = (): Partial<TestRecordType> => {
  return {
    DataType: TEST_RECORD_DATA_TYPE.TYPEB,
    StringColumn: 'stringB',
    NumberColumn: 456,
    BooleanColumn: false,
    StringArrayColumn: ['x', 'y', 'z'],
    NumberArrayColumn: [4, 5, 6],
    ListColumn: [
      { stringProperty: 'listB', numberProperty: 4 },
      { stringProperty: 'listB2', numberProperty: 5, optionalProperty: 'optional' }
    ],
    OptionalStringColumn: 'optionalB',
    OptionalNumberColumn: 789,
    OptionalBooleanColumn: false,
    OptionalStringArrayColumn: ['x', 'y', 'z'],
    OptionalNumberArrayColumn: [4, 5, 6],
    OptionalListColumn: [
      { stringProperty: 'optionalListB', numberProperty: 7 },
      { stringProperty: 'optionalListB2', numberProperty: 8, optionalProperty: 'optional' }
    ],
  };
};

describe.skip('AWS Tests', () => {
  describe('DynamoDBService', () => {
    const tableName = 'Test';
    let dynamoDBService: DynamoDBService<TestRecordType>;

    beforeEach(() => {
      dynamoDBService = new DynamoDBService(tableName);
    });

    it('Get All', async () => {
      const item1 = await dynamoDBService.create(generateTypeARecord());
      const item2 = await dynamoDBService.create(generateTypeBRecord());

      const allItems = await dynamoDBService.getAll();

      expect(allItems.length).toBeGreaterThanOrEqual(2);
      expect(allItems.find(i => i.ID === item1.ID)).toBeDefined();
      expect(allItems.find(i => i.ID === item2.ID)).toBeDefined();
    });

    it('Get All By DataType', async () => {
      const item1 = await dynamoDBService.create(generateTypeARecord());
      const item2 = await dynamoDBService.create(generateTypeBRecord());

      const typeAItems = await dynamoDBService.getAllByDataType(TEST_RECORD_DATA_TYPE.TYPEA);
      const typeBItems = await dynamoDBService.getAllByDataType(TEST_RECORD_DATA_TYPE.TYPEB);

      expect(typeAItems.length).toBeGreaterThanOrEqual(1);
      expect(typeAItems.find(i => i.ID === item1.ID)).toBeDefined();
      expect(typeAItems.find(i => i.ID === item2.ID)).toBeUndefined();

      expect(typeBItems.length).toBeGreaterThanOrEqual(1);
      expect(typeBItems.find(i => i.ID === item2.ID)).toBeDefined();
      expect(typeBItems.find(i => i.ID === item1.ID)).toBeUndefined();
    });

    it('CRUD', async () => {
      const createItem = await dynamoDBService.create(generateTypeARecord());
      const id = createItem.ID;

      const createResult = await dynamoDBService.getById(id);

      if (!createResult) {
        ErrorUtil.throwError('Item not found after creation');
      }

      expect(createResult.ID).toBe(createItem.ID);
      expect(createResult.DataType).toBe(createItem.DataType);
      expect(createResult.StringColumn).toBe(createItem.StringColumn);
      expect(createResult.NumberColumn).toBe(createItem.NumberColumn);
      expect(createResult.BooleanColumn).toBe(createItem.BooleanColumn);
      createResult.StringArrayColumn.forEach((value, index) => {
        expect(value).toBe(createItem.StringArrayColumn[index]);
      });
      createResult.NumberArrayColumn.forEach((value, index) => {
        expect(value).toBe(createItem.NumberArrayColumn[index]);
      });
      createResult.ListColumn.forEach((value, index) => {
        expect(value.stringProperty).toBe(createItem.ListColumn[index].stringProperty);
        expect(value.numberProperty).toBe(createItem.ListColumn[index].numberProperty);
        if (createItem.ListColumn[index].optionalProperty) {
          expect(value.optionalProperty).toBe(createItem.ListColumn[index].optionalProperty);
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
      expect(createResult.Create).toBe(createItem.Create);
      expect(createResult.Update).toBe(createItem.Update);

      const updateItem: Partial<TestRecordType> = {
        StringColumn: 'updated',
        NumberColumn: 2,
        BooleanColumn: false,
        StringArrayColumn: ['updated1', 'updated2'],
        NumberArrayColumn: [7, 8, 9],
        ListColumn: [
          { stringProperty: 'updatedList', numberProperty: 3 },
          { stringProperty: 'updatedList2', numberProperty: 4, optionalProperty: 'optional' }
        ],
        OptionalStringColumn: 'optional',
        OptionalNumberColumn: 42,
        OptionalBooleanColumn: true,
        OptionalStringArrayColumn: ['optional1', 'optional2'],
        OptionalNumberArrayColumn: [10, 11, 12],
        OptionalListColumn: [
          { stringProperty: 'optionalList', numberProperty: 5 },
          { stringProperty: 'optionalList2', numberProperty: 6, optionalProperty: 'optional' }
        ],
      };

      const updateResult = await dynamoDBService.update(id, TEST_RECORD_DATA_TYPE.TYPEA, updateItem);

      if (!updateResult) {
        ErrorUtil.throwError('Item not found after update');
      }

      expect(updateResult.ID).toBe(createItem.ID);
      expect(updateResult.DataType).toBe(createItem.DataType);
      expect(updateResult.StringColumn).toBe(updateItem.StringColumn);
      expect(updateResult.NumberColumn).toBe(updateItem.NumberColumn);
      expect(updateResult.BooleanColumn).toBe(updateItem.BooleanColumn);
      updateResult.StringArrayColumn.forEach((value, index) => {
        expect(value).toBe(updateItem.StringArrayColumn[index]);
      });
      updateResult.NumberArrayColumn.forEach((value, index) => {
        expect(value).toBe(updateItem.NumberArrayColumn[index]);
      });
      updateResult.ListColumn.forEach((value, index) => {
        expect(value.stringProperty).toBe(updateItem.ListColumn[index].stringProperty);
        expect(value.numberProperty).toBe(updateItem.ListColumn[index].numberProperty);
        if (updateItem.ListColumn[index].optionalProperty) {
          expect(value.optionalProperty).toBe(updateItem.ListColumn[index].optionalProperty);
        } else {
          expect(value.optionalProperty).toBeUndefined();
        }
      });
      expect(updateResult.OptionalStringColumn).toBe(updateItem.OptionalStringColumn);
      expect(updateResult.OptionalNumberColumn).toBe(updateItem.OptionalNumberColumn);
      expect(updateResult.OptionalBooleanColumn).toBe(updateItem.OptionalBooleanColumn);
      updateResult.OptionalStringArrayColumn.forEach((value, index) => {
        expect(value).toBe(updateItem.OptionalStringArrayColumn[index]);
      });
      updateResult.OptionalNumberArrayColumn.forEach((value, index) => {
        expect(value).toBe(updateItem.OptionalNumberArrayColumn[index]);
      });
      updateResult.OptionalListColumn.forEach((value, index) => {
        expect(value.stringProperty).toBe(updateItem.OptionalListColumn[index].stringProperty);
        expect(value.numberProperty).toBe(updateItem.OptionalListColumn[index].numberProperty);
        if (updateItem.OptionalListColumn[index].optionalProperty) {
          expect(value.optionalProperty).toBe(updateItem.OptionalListColumn[index].optionalProperty);
        } else {
          expect(value.optionalProperty).toBeUndefined();
        }
      });
      expect(updateResult.Create).toBe(createItem.Create);
      expect(updateResult.Update).toBeGreaterThanOrEqual(createItem.Update);

      await dynamoDBService.delete(id, TEST_RECORD_DATA_TYPE.TYPEA);

      const deleteResult = await dynamoDBService.getById(id);

      expect(deleteResult).toBeNull();
    });

    it('Update Partial Columns', async () => {
      const createItem = await dynamoDBService.create(generateTypeBRecord());
      const id = createItem.ID;

      const updateItem: Partial<TestRecordType> = {
        NumberColumn: 2,
        StringArrayColumn: ['updated1', 'updated2'],
      };

      const updateResult = await dynamoDBService.update(id, TEST_RECORD_DATA_TYPE.TYPEB, updateItem);

      if (!updateResult) {
        ErrorUtil.throwError('Item not found after update');
      }

      expect(updateResult.ID).toBe(createItem.ID);
      expect(updateResult.DataType).toBe(createItem.DataType);
      expect(updateResult.StringColumn).toBe(createItem.StringColumn);
      expect(updateResult.NumberColumn).toBe(updateItem.NumberColumn);
      expect(updateResult.BooleanColumn).toBe(createItem.BooleanColumn);
      expect(updateResult.StringArrayColumn.length).toBe(updateItem.StringArrayColumn.length);
      updateResult.StringArrayColumn.forEach((value, index) => {
        expect(value).toBe(updateItem.StringArrayColumn[index]);
      });
      expect(updateResult.NumberArrayColumn.length).toBe(createItem.NumberArrayColumn.length);
      updateResult.NumberArrayColumn.forEach((value, index) => {
        expect(value).toBe(createItem.NumberArrayColumn[index]);
      });
      expect(updateResult.ListColumn.length).toBe(createItem.ListColumn.length);
      updateResult.ListColumn.forEach((value, index) => {
        expect(value.stringProperty).toBe(createItem.ListColumn[index].stringProperty);
        expect(value.numberProperty).toBe(createItem.ListColumn[index].numberProperty);
        if (createItem.ListColumn[index].optionalProperty) {
          expect(value.optionalProperty).toBe(createItem.ListColumn[index].optionalProperty);
        } else {
          expect(value.optionalProperty).toBeUndefined();
        }
      });
      expect(updateResult.OptionalStringColumn).toBe(createItem.OptionalStringColumn);
      expect(updateResult.OptionalNumberColumn).toBe(createItem.OptionalNumberColumn);
      expect(updateResult.OptionalBooleanColumn).toBe(createItem.OptionalBooleanColumn);
      expect(updateResult.OptionalStringArrayColumn.length).toBe(createItem.OptionalStringArrayColumn.length);
      updateResult.OptionalStringArrayColumn.forEach((value, index) => {
        expect(value).toBe(createItem.OptionalStringArrayColumn[index]);
      });
      expect(updateResult.OptionalNumberArrayColumn.length).toBe(createItem.OptionalNumberArrayColumn.length);
      updateResult.OptionalNumberArrayColumn.forEach((value, index) => {
        expect(value).toBe(createItem.OptionalNumberArrayColumn[index]);
      });
      expect(updateResult.OptionalListColumn.length).toBe(createItem.OptionalListColumn.length);
      updateResult.OptionalListColumn.forEach((value, index) => {
        expect(value.stringProperty).toBe(createItem.OptionalListColumn[index].stringProperty);
        expect(value.numberProperty).toBe(createItem.OptionalListColumn[index].numberProperty);
        if (createItem.OptionalListColumn[index].optionalProperty) {
          expect(value.optionalProperty).toBe(createItem.OptionalListColumn[index].optionalProperty);
        } else {
          expect(value.optionalProperty).toBeUndefined();
        }
      });
      expect(updateResult.Create).toBe(createItem.Create);
      expect(updateResult.Update).toBeGreaterThanOrEqual(createItem.Update);
    });

    it('Delete Optional Columns', async () => {
      const createItem = await dynamoDBService.create(generateTypeBRecord());
      const id = createItem.ID;

      const updateItem: Partial<TestRecordType> = {
        StringColumn: 'updated',
        NumberColumn: 2,
        BooleanColumn: true,
        StringArrayColumn: ['updated1', 'updated2'],
        NumberArrayColumn: [7, 8, 9],
        ListColumn: [
          { stringProperty: 'updatedList', numberProperty: 3 },
          { stringProperty: 'updatedList2', numberProperty: 4, optionalProperty: 'optional' }
        ],
        OptionalStringColumn: null,
        OptionalNumberColumn: null,
        OptionalBooleanColumn: null,
        OptionalStringArrayColumn: null,
        OptionalNumberArrayColumn: null,
        OptionalListColumn: null,
      };

      const updateResult = await dynamoDBService.update(id, TEST_RECORD_DATA_TYPE.TYPEB, updateItem);

      if (!updateResult) {
        ErrorUtil.throwError('Item not found after update');
      }

      expect(updateResult.ID).toBe(createItem.ID);
      expect(updateResult.DataType).toBe(createItem.DataType);
      expect(updateResult.StringColumn).toBe(updateItem.StringColumn);
      expect(updateResult.NumberColumn).toBe(updateItem.NumberColumn);
      expect(updateResult.BooleanColumn).toBe(updateItem.BooleanColumn);
      updateResult.StringArrayColumn.forEach((value, index) => {
        expect(value).toBe(updateItem.StringArrayColumn[index]);
      });
      updateResult.NumberArrayColumn.forEach((value, index) => {
        expect(value).toBe(updateItem.NumberArrayColumn[index]);
      });
      updateResult.ListColumn.forEach((value, index) => {
        expect(value.stringProperty).toBe(updateItem.ListColumn[index].stringProperty);
        expect(value.numberProperty).toBe(updateItem.ListColumn[index].numberProperty);
        if (updateItem.ListColumn[index].optionalProperty) {
          expect(value.optionalProperty).toBe(updateItem.ListColumn[index].optionalProperty);
        } else {
          expect(value.optionalProperty).toBeUndefined();
        }
      });
      expect(updateResult.OptionalStringColumn).toBeUndefined();
      expect(updateResult.OptionalNumberColumn).toBeUndefined();
      expect(updateResult.OptionalBooleanColumn).toBeUndefined();
      expect(updateResult.OptionalStringArrayColumn).toBeUndefined();
      expect(updateResult.OptionalNumberArrayColumn).toBeUndefined();
      expect(updateResult.OptionalListColumn).toBeUndefined();
      expect(updateResult.Create).toBe(createItem.Create);
      expect(updateResult.Update).toBeGreaterThanOrEqual(createItem.Update);
    });
  });
});
