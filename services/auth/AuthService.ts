import AuthDataAccessor from '@common/services/auth/AuthDataAccessor';
import CRUDServiceBase from '@common/services/CRUDServiceBase.old';
import { AuthDataType } from '@common/interfaces/data/AuthDataType';
import { AuthRecordType } from '@common/interfaces/record/AuthRecordType';

export default class AuthService<DataType extends AuthDataType, RecordType extends AuthRecordType> extends CRUDServiceBase<DataType, RecordType> {
  public constructor(dataToRecord: (data: DataType) => RecordType, recordToData: (record: RecordType) => DataType) {
    super(new AuthDataAccessor(), dataToRecord, recordToData);
  }

  public async getByGoogleUserId(googleUserId: string): Promise<DataType | null> {
    const users = await this.get();
    return users.find(user => user.googleUserId === googleUserId) || null;
  }

  public async isAuthorizedByGoogle(
    googleUserId: string,
    feature: keyof DataType,
    roles?: string[]
  ): Promise<boolean> {
    const user = await this.getByGoogleUserId(googleUserId);

    if (!user) return false;

    return (
      roles === undefined ||
      roles.length === 0 ||
      roles.includes(user[feature] as string)
    );
  }

  protected static dataToRecordBase(data: AuthDataType): AuthRecordType {
    return {
      ID: data.id,
      DataType: 'Auth',
      Name: data.name,
      GoogleUserID: data.googleUserId,
      Create: data.create,
      Update: data.update,
    };
  }

  protected static recordToDataBase(record: AuthRecordType): AuthDataType {
    return {
      id: record.ID,
      name: record.Name,
      googleUserId: record.GoogleUserID,
      create: record.Create,
      update: record.Update,
    };
  }
}
