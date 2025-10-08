import DynamoDBService from '@common/services/aws/DynamoDBService';
import { RecordTypeBase } from '@common/interfaces/record/RecordTypeBase';

export default abstract class DataAccessorBase<T extends RecordTypeBase> {
  private readonly dataType: string;
  private readonly DynamoDBService: DynamoDBService<T>;

  protected constructor(
    tableName: string,
    dataType: string,
    dynamoDBService: DynamoDBService<T> = new DynamoDBService<T>(tableName)
  ) {
    this.dataType = dataType;
    this.DynamoDBService = dynamoDBService;
  }

  public getTableName(): string {
    return this.DynamoDBService.getTableName();
  }

  public getDataType(): string {
    return this.dataType;
  }

  public async get(): Promise<T[]> {
    return await this.DynamoDBService.getAllByDataType(this.dataType);
  }

  public async getById(id: string): Promise<T | null> {
    return await this.DynamoDBService.getById(id);
  }

  public async create(creates: Partial<T>): Promise<T> {
    return await this.DynamoDBService.create({ ...creates, DataType: this.dataType });
  }

  public async update(id: string, updates: Partial<T>): Promise<T | null> {
    return await this.DynamoDBService.update(id, this.dataType, updates);
  }

  public async delete(id: string): Promise<void> {
    await this.DynamoDBService.delete(id, this.dataType);
  }
}
