import DataAccessorBase from '@common/services/DataAccessorBase';
import DynamoDBService from '@common/services/aws/DynamoDBService';
import EnvironmentalUtil from '@common/utils/EnvironmentalUtil';
import { AuthRecordType } from '@common/interfaces/record/AuthRecordType';

export class AuthDataAccessor<T extends AuthRecordType> extends DataAccessorBase<T> {
  public constructor(
    dynamoDBService?: DynamoDBService<T>
  ) {
    if (!dynamoDBService) {
      const tableName = AuthDataAccessor.getAuthTableName();
      dynamoDBService = new DynamoDBService<T>(tableName);
    }

    super(AuthDataAccessor.getAuthTableName(), 'Auth', dynamoDBService);
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
