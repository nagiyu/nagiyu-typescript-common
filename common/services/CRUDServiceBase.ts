import CacheUtil from '@common/utils/CacheUtil';
import DataAccessorBase from '@common/services/DataAccessorBase';
import ErrorUtil from '@common/utils/ErrorUtil';
import { DataTypeBase } from '@common/interfaces/data/DataTypeBase';
import { RecordTypeBase } from '@common/interfaces/record/RecordTypeBase';

export default abstract class CRUDServiceBase<DataType extends DataTypeBase, RecordType extends RecordTypeBase> {
  private readonly dataAccessor: DataAccessorBase<RecordType>;
  private readonly useCache: boolean;
  private readonly cacheKey: string;

  protected constructor(
    dataAccessor: DataAccessorBase<RecordType>,
    useCache: boolean = true
  ) {
    this.dataAccessor = dataAccessor;
    this.useCache = useCache;
    this.cacheKey = `${this.dataAccessor.getTableName()}_${this.dataAccessor.getDataType()}`;
  }

  public async get(): Promise<DataType[]> {
    if (this.useCache) {
      return await this.getCache();
    }

    const data = await this.dataAccessor.get();

    return data.map(this.recordToData);
  }

  public async getById(id: string): Promise<DataType | null> {
    if (this.useCache) {
      const cachedData = await this.getCache();
      const item = cachedData.find(i => i.id === id);
      return item || null;
    }

    const data = await this.dataAccessor.getById(id);

    if (!data) {
      return null;
    }

    return this.recordToData(data);
  }

  public async create(creates: Partial<DataType>): Promise<DataType> {
    const data = await this.dataAccessor.create(this.dataToRecord(creates));
    const item = this.recordToData(data);

    if (this.useCache) {
      const cachedData = await this.getCache();
      cachedData.push(item);
      CacheUtil.set(this.cacheKey, cachedData);
    }

    return item;
  }

  public async update(id: string, updates: Partial<DataType>): Promise<DataType> {
    const data = await this.dataAccessor.update(id, this.dataToRecord(updates));

    if (!data) {
      ErrorUtil.throwError(`Failed to update item with id: ${id}`);
    }

    const item = this.recordToData(data);

    if (this.useCache) {
      const cachedData = await this.getCache();
      const index = cachedData.findIndex(i => i.id === item.id);

      if (index !== -1) {
        cachedData[index] = item;
      } else {
        cachedData.push(item);
      }

      CacheUtil.set(this.cacheKey, cachedData);
    }

    return item;
  }

  public async delete(id: string): Promise<void> {
    await this.dataAccessor.delete(id);

    if (this.useCache) {
      const cachedData = await this.getCache();
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

  protected abstract dataToRecord(data: Partial<DataType>): Partial<RecordType>;

  protected abstract recordToData(record: RecordType): DataType;

  private async getCache(): Promise<DataType[]> {
    const cachedData = CacheUtil.get<DataType[]>(this.cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const data = await this.dataAccessor.get();
    const mappedData = data.map(this.recordToData);

    CacheUtil.set(this.cacheKey, mappedData);

    return mappedData;
  }
}
