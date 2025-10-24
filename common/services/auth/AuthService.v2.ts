import CRUDServiceBase from '@common/services/CRUDServiceBase';
import { AuthDataType } from '@common/interfaces/data/AuthDataType';
import { AuthRecordType } from '@common/interfaces/record/AuthRecordType';
import { AuthDataAccessor } from '@common/services/auth/AuthDataAccessor.v2';

export class AuthService<DataType extends AuthDataType, RecordType extends AuthRecordType> extends CRUDServiceBase<DataType, RecordType> {
  public constructor(
    dataAccessor?: AuthDataAccessor<RecordType>
  ) {
    if (!dataAccessor) {
      dataAccessor = new AuthDataAccessor<RecordType>();
    }

    super(dataAccessor, true);
  }

  public async getByGoogleUserId(googleUserId: string): Promise<DataType | null> {
    const users = await this.get();
    return users.find(user => user.googleUserId === googleUserId) || null;
  }

  protected dataToRecord(data: Partial<DataType>): Partial<RecordType> {
    return {
      Name: data.name,
      GoogleUserID: data.googleUserId,
    } as Partial<RecordType>;
  }

  protected recordToData(record: RecordType): DataType {
    return {
      id: record.ID,
      name: record.Name,
      googleUserId: record.GoogleUserID,
      create: record.Create,
      update: record.Update,
    } as DataType;
  }
}
