import { DynamoDBClient, ScanCommand, PutItemCommand, UpdateItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

import ErrorUtil from '@common/utils/ErrorUtil';
import SecretsManagerUtil from '@common/aws/SecretsManagerUtil';
import { RecordTypeBase } from '@common/aws/interfaces/DynamoDB/RecordTypeBase';

/**
 * @deprecated Use DynamoDBService instead
 */
export default class DynamoDBUtil {
  /**
   * Creates a DynamoDBClient based on the environment.
   * If the environment is 'local', it uses credentials from AWS Secrets Manager.
   * Otherwise, it uses the default credentials provider chain.
   * @returns {DynamoDBClient} The configured DynamoDBClient.
   */
  private static async getDynamoClient(): Promise<DynamoDBClient> {
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

  /**
   * Retrieves all records from a DynamoDB table.
   * @template T The type of records to retrieve, extending RecordTypeBase.
   * @param tableName The name of the DynamoDB table to scan.
   * @throws Throws an error using ErrorUtil if the scan operation fails.
    * @returns {Promise<T[]>} A promise that resolves to an array of records of type T.
   */
  public static async getAll<T extends RecordTypeBase>(tableName: string): Promise<T[]> {
    const dynamoClient = await this.getDynamoClient();

    const command = new ScanCommand({
      TableName: tableName
    });

    try {
      const response = await dynamoClient.send(command);
      const items = response.Items || [];
      return items.map(item => unmarshall(item) as T);
    } catch (error) {
      throw ErrorUtil.throwError(JSON.stringify(error));
    }
  }

  /**
   * Retrieves all records from a DynamoDB table filtered by DataType.
   * @template T The type of records to retrieve, extending RecordTypeBase.
   * @param tableName The name of the DynamoDB table to scan.
   * @param dataTypeValue The DataType value to filter by.
   * @returns {Promise<T[]>} A promise that resolves to an array of records of type T.
   */
  public static async getAllByDataType<T extends RecordTypeBase>(
    tableName: string,
    dataTypeValue: string
  ): Promise<T[]> {
    const dynamoClient = await this.getDynamoClient();

    const command = new ScanCommand({
      TableName: tableName,
      FilterExpression: "#dt = :dt",
      ExpressionAttributeNames: { "#dt": "DataType" },
      ExpressionAttributeValues: { ":dt": { S: dataTypeValue } }
    });

    try {
      const response = await dynamoClient.send(command);
      const items = response.Items || [];
      return items.map(item => unmarshall(item) as T);
    } catch (error) {
      throw ErrorUtil.throwError(JSON.stringify(error));
    }
  }

  /**
   * Adds a new record to a DynamoDB table.
   * @template T The type of the record to add.
   * @param tableName The name of the DynamoDB table.
   * @param item The record to add.
   */
  public static async create<T extends RecordTypeBase>(
    tableName: string,
    item: T
  ): Promise<void> {
    const dynamoClient = await this.getDynamoClient();

    const command = new PutItemCommand({
      TableName: tableName,
      Item: marshall(item, { removeUndefinedValues: true })
    });

    try {
      await dynamoClient.send(command);
    } catch (error) {
      throw ErrorUtil.throwError(JSON.stringify(error));
    }
  }

  /**
   * Updates an existing record in a DynamoDB table.
   * @template T The type of the record to update.
   * @param tableName The name of the DynamoDB table.
   * @param key The primary key of the record to update.
   * @param dataType The DataType of the record to update.
   * @param updates The attributes to update.
   */
  public static async update<T extends RecordTypeBase>(
    tableName: string,
    id: string,
    dataType: string,
    updates: Partial<T>
  ): Promise<void> {
    const dynamoClient = await this.getDynamoClient();

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
      // 何も更新しない場合は return
      return;
    }

    const command = new UpdateItemCommand({
      TableName: tableName,
      Key: marshall({ ID: id, DataType: dataType }),
      UpdateExpression: updateExpr,
      ExpressionAttributeNames: Object.keys(exprAttrNames).length > 0 ? exprAttrNames : undefined,
      ExpressionAttributeValues: Object.keys(exprAttrValues).length > 0 ? exprAttrValues : undefined
    });

    try {
      await dynamoClient.send(command);
    } catch (error) {
      throw ErrorUtil.throwError(JSON.stringify(error));
    }
  }

  /**
   * Deletes a record from a DynamoDB table.
   * @param tableName The name of the DynamoDB table.
   * @param key The primary key of the record to delete.
   * @param dataType The DataType of the record to delete.
   */
  public static async delete(tableName: string, id: string, dataType: string): Promise<void> {
    const dynamoClient = await this.getDynamoClient();

    const command = new DeleteItemCommand({
      TableName: tableName,
      Key: marshall({ ID: id, DataType: dataType })
    });

    try {
      await dynamoClient.send(command);
    } catch (error) {
      throw ErrorUtil.throwError(JSON.stringify(error));
    }
  }
}
