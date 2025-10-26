import CRUDServiceBase from '@common/services/CRUDServiceBase';
import { NotFoundError } from '@common/errors';
import { SubscriptionDataAccessor } from '@common/services/subscription/SubscriptionDataAccessor';
import { SubscriptionDataType } from '@common/interfaces/data/SubscriptionDataType';
import { SubscriptionRecordType } from '@common/interfaces/record/SubscriptionRecordType';

export class SubscriptionService extends CRUDServiceBase<SubscriptionDataType, SubscriptionRecordType> {
  constructor(dataAccessor?: SubscriptionDataAccessor) {
    if (!dataAccessor) {
      dataAccessor = new SubscriptionDataAccessor();
    }

    super(dataAccessor, false);
  }

  public async getByTerminalId(terminalId: string): Promise<SubscriptionDataType> {
    const records = await this.dataAccessor.get();
    const record = records.find((rec) => rec.TerminalID === terminalId);

    if (!record) {
      throw new NotFoundError(`Subscription record not found for TerminalID: ${terminalId}`);
    }

    return this.recordToData(record);
  }

  protected dataToRecord(data: Partial<SubscriptionDataType>): Partial<SubscriptionRecordType> {
    return {
      TerminalID: data.terminalId,
      Subscription: data.subscription,
    };
  }

  protected recordToData(record: SubscriptionRecordType): SubscriptionDataType {
    return {
      id: record.ID || '',
      terminalId: record.TerminalID,
      subscription: record.Subscription,
      create: record.Create || 0,
      update: record.Update || 0,
    };
  }
}
