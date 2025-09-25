import { RecordTypeBase } from '@common/aws/interfaces/DynamoDB/RecordTypeBase';

export interface AuthRecordType extends RecordTypeBase {
  DataType: 'Auth';
  Name: string;
  GoogleUserID: string;
}
