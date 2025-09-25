import DataAccessorBase from '@common/services/DataAccessorBase.old';
import EnvironmentalUtil from '@common/utils/EnvironmentalUtil';
import { AuthRecordType } from '@common/interfaces/record/AuthRecordType';

export default class AuthDataAccessor<T extends AuthRecordType> extends DataAccessorBase<T> {
  public constructor() {
    super(AuthDataAccessor.getAuthTableName(), 'Auth');
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
