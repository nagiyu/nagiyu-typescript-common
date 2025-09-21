import AuthDataAccessor from '@common/auth/AuthDataAccessor';
import CacheUtil from '@common/utils/CacheUtil';
import { AuthRecordType } from '@common/interfaces/record/AuthRecordType';

export default class AuthorizeUtil {
  private static readonly CACHE_KEY = 'AuthRecord';

  public static async isAuthorizedByGoogleUserID<T extends AuthRecordType>(
    googleUserID: string,
    feature: keyof T,
    roles?: string[]
  ): Promise<boolean> {
    const authRecord = await this.getAuthRecord<T>();

    return authRecord.some(record =>
      record.GoogleUserID === googleUserID &&
      (
        roles === undefined ||
        roles.length === 0 ||
        roles.includes(record[feature] as string)
      )
    );
  }

  private static async getAuthRecord<T extends AuthRecordType>(): Promise<T[]> {
    const cacheData = CacheUtil.get<T[]>(this.CACHE_KEY);

    if (cacheData) {
      return cacheData;
    }

    const authRecord = await AuthDataAccessor.get<T>();

    CacheUtil.set(this.CACHE_KEY, authRecord);

    return authRecord;
  }
}
