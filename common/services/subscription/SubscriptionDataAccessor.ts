import DataAccessorBase from '@common/services/DataAccessorBase';
import DynamoDBService from '@common/services/aws/DynamoDBService';
import { SubscriptionRecordType } from '@common/interfaces/record/SubscriptionRecordType';

export class SubscriptionDataAccessor extends DataAccessorBase<SubscriptionRecordType> {
  constructor(dynamoDBService?: DynamoDBService<SubscriptionRecordType>) {
    const tableName = 'Subscription';

    if (!dynamoDBService) {
      dynamoDBService = new DynamoDBService<SubscriptionRecordType>(tableName);
    }

    super(tableName, 'Subscription', dynamoDBService);
  }
}
