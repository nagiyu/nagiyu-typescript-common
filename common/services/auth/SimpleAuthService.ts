import AuthService from '@common/services/auth/AuthService';
import { AuthDataType } from '@common/interfaces/data/AuthDataType';
import { AuthRecordType } from '@common/interfaces/record/AuthRecordType';

export default class SimpleAuthService extends AuthService<AuthDataType, AuthRecordType> {
  public constructor() {
    super(SimpleAuthService.dataToRecord, SimpleAuthService.recordToData);
  }

  private static dataToRecord(data: AuthDataType): AuthRecordType {
    return AuthService.dataToRecordBase(data);
  }

  private static recordToData(record: AuthRecordType): AuthDataType {
    return AuthService.recordToDataBase(record);
  }
}
