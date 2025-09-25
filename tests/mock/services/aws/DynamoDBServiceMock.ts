import DynamoDBService from '@common/services/aws/DynamoDBService';
import { RecordTypeBase } from '@common/interfaces/record/RecordTypeBase';
import CommonUtil from '@common/utils/CommonUtil';
import ErrorUtil from '@common/utils/ErrorUtil';

export default class DynamoDBServiceMock<T extends RecordTypeBase> extends DynamoDBService<T> {
  private items: T[] = [];

  public override async getAll(): Promise<T[]> {
    return this.items;
  }

  public override async getAllByDataType(dataTypeValue: string): Promise<T[]> {
    return this.items.filter(item => item.DataType === dataTypeValue);
  }

  public override async getById(id: string): Promise<T | null> {
    const item = this.items.find(item => item.ID === id);
    return (item as T) || null;
  }

  public override async create(creates: Partial<T>): Promise<T> {
    if (!creates.DataType) {
      ErrorUtil.throwError('DataType is required');
    }

    const item: T = {
      ...creates,
      ID: CommonUtil.generateUUID(),
      Create: Date.now(),
      Update: Date.now(),
    } as T;

    this.items.push(item);

    return item;
  }

  public override async update(
    id: string,
    dataType: string,
    updates: Partial<T>
  ): Promise<T> {
    updates.Update = Date.now();

    const index = this.items.findIndex(item => item.ID === id && item.DataType === dataType);
    if (index !== -1) {
      this.items[index] = { ...this.items[index], ...updates };
    }
    return this.items[index];
  }

  public override async delete(id: string, dataType: string): Promise<void> {
    this.items = this.items.filter(item => !(item.ID === id && item.DataType === dataType));
  }

  public clearData(): void {
    this.items = [];
  }
}
