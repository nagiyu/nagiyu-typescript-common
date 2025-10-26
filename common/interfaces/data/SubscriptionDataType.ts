import { DataTypeBase } from '@common/interfaces/data/DataTypeBase';
import { SubscriptionType } from '@common/interfaces/SubscriptionType';

export interface SubscriptionDataType extends DataTypeBase {
  terminalId: string;
  subscription: SubscriptionType;
}
