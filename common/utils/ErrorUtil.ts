import CloudWatchLogService, { LogEvent } from '@common/services/aws/CloudWatchLogsService';
import EnvironmentalUtil from '@common/utils/EnvironmentalUtil';
import { DataTypeBase } from '@common/interfaces/data/DataTypeBase';

interface ErrorNotificationDataType extends DataTypeBase {
  rootFeature: string;
  feature: string;
  message: string;
  stack: string;
}

/**
 * Utility for handling errors in the application.
 */
export default class ErrorUtil {
  /**
   * Throws an error with the provided message and error details.
   * @param message The error message to throw.
   * @param error The error details to include.
   * @throws Throws an Error with the specified message and error details.
   * @deprecated 今後は通常の Error をスローしてください。
   */
  public static throwError(message?: string | null, error?: any | null): never {
    if (!message && !error) {
      const msg = 'An unknown error occurred';
      console.error(msg);
      throw new Error(msg);
    }

    if (!message) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(msg);
      throw error instanceof Error ? error : new Error(msg);
    }

    if (!error) {
      console.error(message);
      throw new Error(message);
    }

    const combinedMessage = `${message}: ${error instanceof Error ? error.message : String(error)}`;
    console.error(combinedMessage);
    throw new Error(combinedMessage);
  }

  /**
   * 最大リトライ回数
   */
  private static readonly maxRetries = 5;

  /**
   * Logs an error to CloudWatch Logs.
   * @param rootFeature Root feature name
   * @param feature Feature name
   * @param error The error to log
   */
  public static async logError<T extends Error = Error>(
    rootFeature: string,
    feature: string,
    error: T
  ): Promise<void> {
    const environment = EnvironmentalUtil.GetProcessEnv();

    const logService = new CloudWatchLogService(`/nagiyu/${rootFeature}/${environment}`, feature);

    const errorData: Partial<ErrorNotificationDataType> = {
      rootFeature: rootFeature,
      feature: feature,
      message: error.message,
      stack: error.stack || '',
    };

    await logService.createLogStream();

    const events: LogEvent[] = [
      {
        message: JSON.stringify(errorData),
        timestamp: Date.now(),
      }
    ];

    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        await logService.putLogEvents(events);
        break;
      } catch (e: any) {
        if (e.__type === 'ThrottlingException') {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempt++;
        } else {
          throw e;
        }
      }
    }
  }
}
