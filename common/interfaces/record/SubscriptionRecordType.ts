import { RecordTypeBase } from '@common/interfaces/record/RecordTypeBase';
import { SubscriptionType } from '@common/interfaces/SubscriptionType';

export interface SubscriptionRecordType extends RecordTypeBase {
  DataType: 'Subscription';
  TerminalID: string;
  Subscription: SubscriptionType;
}
