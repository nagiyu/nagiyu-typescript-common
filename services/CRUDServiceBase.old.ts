import CacheUtil from '@common/utils/CacheUtil';
import DataAccessorBase from '@common/services/DataAccessorBase.old';
import { DataTypeBase } from '@common/interfaces/data/DataTypeBase';
import { RecordTypeBase } from '@common/aws/interfaces/DynamoDB/RecordTypeBase';

/**
 * @deprecated Use the updated version in services/CRUDServiceBase.ts
 */
export default abstract class CRUDServiceBase<DataType extends DataTypeBase, RecordType extends RecordTypeBase> {
  private readonly dataAccessor: DataAccessorBase<RecordType>;
  private readonly dataToRecord: (data: DataType) => RecordType;
  private readonly recordToData: (record: RecordType) => DataType;
  private readonly useCache: boolean;
  private readonly cacheKey: string;

  protected constructor(
    dataAccessor: DataAccessorBase<RecordType>,
    dataToRecord: (data: DataType) => RecordType,
    recordToData: (record: RecordType) => DataType,
    useCache: boolean = true
  ) {
    this.dataAccessor = dataAccessor;
    this.dataToRecord = dataToRecord;
    this.recordToData = recordToData;
    this.useCache = useCache;
    // Create more specific cache key to prevent collisions
    this.cacheKey = `${dataAccessor.constructor.name}_${dataAccessor.getTableName()}_${dataAccessor.getDataType()}`;
  }

  public async get(): Promise<DataType[]> {
    if (this.useCache) {
      const cachedData = this.getCache();

      if (cachedData) {
        return cachedData;
      }
    }

    const data = await this.dataAccessor.get();
    const mappedData = data.map(this.recordToData);

    if (this.useCache) {
      CacheUtil.set(this.cacheKey, mappedData);
    }

    return mappedData;
  }

  public async create(item: DataType): Promise<void> {
    await this.dataAccessor.create(this.dataToRecord(item));

    if (this.useCache) {
      const cachedData = this.getCache() || [];
      cachedData.push(item);
      CacheUtil.set(this.cacheKey, cachedData);
    }
  }

  public async update(item: DataType): Promise<void> {
    await this.dataAccessor.update(this.dataToRecord(item));

    if (this.useCache) {
      const cachedData = this.getCache() || [];
      const index = cachedData.findIndex(i => i.id === item.id);
      if (index !== -1) {
        cachedData[index] = item;
        CacheUtil.set(this.cacheKey, cachedData);
      }
    }
  }

  public async delete(id: string): Promise<void> {
    await this.dataAccessor.delete(id);

    if (this.useCache) {
      const cachedData = this.getCache() || [];
      const updatedData = cachedData.filter(i => i.id !== id);
      CacheUtil.set(this.cacheKey, updatedData);
    }
  }

  public async syncCache(): Promise<void> {
    if (!this.useCache) {
      return;
    }

    const data = await this.dataAccessor.get();
    const mappedData = data.map(this.recordToData);

    CacheUtil.set(this.cacheKey, mappedData);
  }

  private getCache(): DataType[] | null {
    if (this.useCache) {
      return CacheUtil.get<DataType[]>(this.cacheKey);
    }

    return null;
  }
}
