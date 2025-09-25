import DynamoDBUtil from '@common/aws/DynamoDBUtil';
import { RecordTypeBase } from '@common/aws/interfaces/DynamoDB/RecordTypeBase';

/**
 * @deprecated Use the updated version in services/DataAccessorBase.ts
 */
export default abstract class DataAccessorBase<T extends RecordTypeBase> {
  private readonly tableName: string;
  private readonly dataType: string;

  protected constructor(tableName: string, dataType: string) {
    this.tableName = tableName;
    this.dataType = dataType;
  }

  public getTableName(): string {
    return this.tableName;
  }

  public getDataType(): string {
    return this.dataType;
  }

  public async get(): Promise<T[]> {
    return await DynamoDBUtil.getAllByDataType<T>(this.tableName, this.dataType);
  }

  public async create(record: T): Promise<void> {
    await DynamoDBUtil.create<T>(this.tableName, record);
  }

  public async update(record: T): Promise<void> {
    await DynamoDBUtil.update<T>(this.tableName, record.ID, this.dataType, record);
  }

  public async delete(id: string): Promise<void> {
    await DynamoDBUtil.delete(this.tableName, id, this.dataType);
  }
}
