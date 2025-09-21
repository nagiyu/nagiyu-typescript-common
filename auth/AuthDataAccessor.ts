import DynamoDBUtil from '@common/aws/DynamoDBUtil';
import { AuthRecordType } from '@common/interfaces/record/AuthRecordType';
import EnvironmentalUtil from '@common/utils/EnvironmentalUtil';

export default class AuthDataAccessor {
  private static readonly authDataType = 'Auth';

  public static async get<T extends AuthRecordType>(): Promise<T[]> {
    return await DynamoDBUtil.getAllByDataType<T>(this.getAuthTableName(), this.authDataType);
  }

  public static async create<T extends AuthRecordType>(record: T): Promise<void> {
    await DynamoDBUtil.create(this.getAuthTableName(), record);
  }

  public static async update<T extends AuthRecordType>(record: T): Promise<void> {
    await DynamoDBUtil.update(this.getAuthTableName(), record.ID, this.authDataType, record);
  }

  public static async delete(id: string): Promise<void> {
    await DynamoDBUtil.delete(this.getAuthTableName(), id, this.authDataType);
  }

  private static getAuthTableName(): string {
    switch (EnvironmentalUtil.GetProcessEnv()) {
      case 'local':
      case 'development':
        return 'DevAuth';
      case 'production':
        return 'Auth';
      default:
        return 'DevAuth';
    }
  }
}
