import { DynamoDBClient, ScanCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

import CommonUtil from '@common/utils/CommonUtil';
import ErrorUtil from '@common/utils/ErrorUtil';
import SecretsManagerUtil from '@common/aws/SecretsManagerUtil';
import { RecordTypeBase } from '@common/interfaces/record/RecordTypeBase';

export default class DynamoDBService<T extends RecordTypeBase> {
  private readonly tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  public getTableName(): string {
    return this.tableName;
  }

  public async getAll(): Promise<T[]> {
    const dynamoClient = await this.getDynamoClient();

    const command = new ScanCommand({
      TableName: this.tableName
    });

    try {
      const response = await dynamoClient.send(command);
      const items = response.Items || [];
      return items.map(item => unmarshall(item) as T);
    } catch (error) {
      ErrorUtil.throwError(null, error);
    }
  }

  public async getAllByDataType(dataTypeValue: string): Promise<T[]> {
    const dynamoClient = await this.getDynamoClient();

    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: "#dt = :dt",
      ExpressionAttributeNames: { "#dt": "DataType" },
      ExpressionAttributeValues: { ":dt": { S: dataTypeValue } }
    });

    try {
      const response = await dynamoClient.send(command);
      const items = response.Items || [];
      return items.map(item => unmarshall(item) as T);
    } catch (error) {
      ErrorUtil.throwError(null, error);
    }
  }

  public async getById(id: string): Promise<T | null> {
    const dynamoClient = await this.getDynamoClient();

    const command = new ScanCommand({
      TableName: this.tableName,
      FilterExpression: "#id = :id",
      ExpressionAttributeNames: { "#id": "ID" },
      ExpressionAttributeValues: { ":id": { S: id } }
    });

    try {
      const response = await dynamoClient.send(command);
      const items = response.Items || [];

      if (items.length === 0) {
        return null;
      }

      return unmarshall(items[0]) as T;
    } catch (error) {
      ErrorUtil.throwError(null, error);
    }
  }

  public async create(creates: Partial<T>): Promise<T> {
    if (!creates.DataType) {
      ErrorUtil.throwError('DataType is required');
    }

    const item: T = {
      ...creates,
      ID: CommonUtil.generateUUID(),
      Create: Date.now(),
      Update: Date.now()
    } as T;

    const dynamoClient = await this.getDynamoClient();

    const command = new PutItemCommand({
      TableName: this.tableName,
      Item: marshall(item, { removeUndefinedValues: true })
    });

    try {
      await dynamoClient.send(command);
    } catch (error) {
      ErrorUtil.throwError(null, error);
    }

    return item;
  }

  public async update(
    id: string,
    dataType: string,
    updates: Partial<T>
  ): Promise<T | null> {
    const dynamoClient = await this.getDynamoClient();

    updates.Update = Date.now();

    // SET: 値が null/undefined 以外
    const setEntries = Object.entries(updates)
      .filter(([k, v]) => !["ID", "DataType"].includes(k) && v !== undefined && v !== null);
    // REMOVE: 値が null
    const removeEntries = Object.entries(updates)
      .filter(([k, v]) => !["ID", "DataType"].includes(k) && v === null);

    let updateExpr = '';
    const exprAttrNames: Record<string, string> = {};
    const exprAttrValues: Record<string, any> = {};

    if (setEntries.length > 0) {
      updateExpr += 'SET ' + setEntries.map(([k]) => `#${k} = :${k}`).join(', ');
      Object.assign(exprAttrNames, Object.fromEntries(setEntries.map(([k]) => [`#${k}`, k])));
      Object.assign(exprAttrValues, Object.fromEntries(setEntries.map(([k, v]) => [`:${k}`, marshall({ [k]: v }, { removeUndefinedValues: true })[k]])));
    }
    if (removeEntries.length > 0) {
      if (updateExpr) updateExpr += ' ';
      updateExpr += 'REMOVE ' + removeEntries.map(([k]) => `#${k}`).join(', ');
      Object.assign(exprAttrNames, Object.fromEntries(removeEntries.map(([k]) => [`#${k}`, k])));
    }

    if (!updateExpr) {
      ErrorUtil.throwError('No fields to update');
    }

    const command = new UpdateItemCommand({
      TableName: this.tableName,
      Key: marshall({ ID: id, DataType: dataType }),
      UpdateExpression: updateExpr,
      ExpressionAttributeNames: Object.keys(exprAttrNames).length > 0 ? exprAttrNames : undefined,
      ExpressionAttributeValues: Object.keys(exprAttrValues).length > 0 ? exprAttrValues : undefined
    });

    try {
      await dynamoClient.send(command);
    } catch (error) {
      ErrorUtil.throwError(null, error);
    }

    return await this.getById(id);
  }

  public async delete(id: string, dataType: string): Promise<void> {
    const dynamoClient = await this.getDynamoClient();

    const command = new DeleteItemCommand({
      TableName: this.tableName,
      Key: marshall({ ID: id, DataType: dataType })
    });

    try {
      await dynamoClient.send(command);
    } catch (error) {
      ErrorUtil.throwError(null, error);
    }
  }

  private async getDynamoClient(): Promise<DynamoDBClient> {
    const secretName = process.env.PROJECT_SECRET!;

    if (process.env.PROCESS_ENV !== 'local') {
      return new DynamoDBClient({
        region: await SecretsManagerUtil.getSecretValue(secretName, 'AWS_REGION'),
      });
    }

    return new DynamoDBClient({
      region: await SecretsManagerUtil.getSecretValue(secretName, 'AWS_REGION'),
      credentials: {
        accessKeyId: await SecretsManagerUtil.getSecretValue(secretName, 'AWS_ACCESS_KEY'),
        secretAccessKey: await SecretsManagerUtil.getSecretValue(secretName, 'AWS_SECRET_ACCESS_KEY')
      }
    });
  }
}
