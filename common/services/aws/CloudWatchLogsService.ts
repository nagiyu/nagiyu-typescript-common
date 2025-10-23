import {
  CloudWatchLogsClient,
  CreateLogStreamCommand,
  PutLogEventsCommand,
  DescribeLogStreamsCommand,
  GetLogEventsCommand,
  InputLogEvent,
  GetLogEventsCommandOutput,
} from '@aws-sdk/client-cloudwatch-logs';

import ErrorUtil from '@common/utils/ErrorUtil';
import SecretsManagerUtil from '@common/aws/SecretsManagerUtil';

export interface LogEvent {
  message: string;
  timestamp: number;
}

export interface GetLogEventsOptions {
  startTime?: number;
  endTime?: number;
  limit?: number;
  startFromHead?: boolean;
}

export default class CloudWatchLogsService {
  private readonly logGroupName: string;
  private readonly logStreamName: string;

  constructor(logGroupName: string, logStreamName: string) {
    this.logGroupName = logGroupName;
    this.logStreamName = logStreamName;
  }

  public getLogGroupName(): string {
    return this.logGroupName;
  }

  public getLogStreamName(): string {
    return this.logStreamName;
  }

  public async createLogStream(): Promise<void> {
    const client = await this.getCloudWatchLogsClient();

    const command = new CreateLogStreamCommand({
      logGroupName: this.logGroupName,
      logStreamName: this.logStreamName,
    });

    try {
      await client.send(command);
    } catch (error: any) {
      if (error.name === 'ResourceAlreadyExistsException') {
        return;
      }
      ErrorUtil.throwError(null, error);
    }
  }

  public async putLogEvents(events: LogEvent[]): Promise<void> {
    if (!events || events.length === 0) {
      ErrorUtil.throwError('Events array cannot be empty');
    }

    const client = await this.getCloudWatchLogsClient();

    const inputEvents: InputLogEvent[] = events.map(event => ({
      message: event.message,
      timestamp: event.timestamp,
    }));

    inputEvents.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    let sequenceToken: string | undefined;

    try {
      const describeCommand = new DescribeLogStreamsCommand({
        logGroupName: this.logGroupName,
        logStreamNamePrefix: this.logStreamName,
      });

      const describeResponse = await client.send(describeCommand);
      const logStream = describeResponse.logStreams?.find(
        stream => stream.logStreamName === this.logStreamName
      );

      if (logStream) {
        sequenceToken = logStream.uploadSequenceToken;
      }
    } catch (error: any) {
      ErrorUtil.throwError(null, error);
    }

    const putCommand = new PutLogEventsCommand({
      logGroupName: this.logGroupName,
      logStreamName: this.logStreamName,
      logEvents: inputEvents,
      sequenceToken,
    });

    try {
      await client.send(putCommand);
    } catch (error: any) {
      ErrorUtil.throwError(null, error);
    }
  }

  public async getLogEvents(
    options?: GetLogEventsOptions
  ): Promise<LogEvent[]> {
    const client = await this.getCloudWatchLogsClient();

    const command = new GetLogEventsCommand({
      logGroupName: this.logGroupName,
      logStreamName: this.logStreamName,
      startTime: options?.startTime,
      endTime: options?.endTime,
      limit: options?.limit,
      startFromHead: options?.startFromHead,
    });

    try {
      const response: GetLogEventsCommandOutput = await client.send(command);
      const events = response.events || [];

      return events.map(event => ({
        message: event.message || '',
        timestamp: event.timestamp || 0,
      }));
    } catch (error: any) {
      ErrorUtil.throwError(null, error);
    }
  }

  private async getCloudWatchLogsClient(): Promise<CloudWatchLogsClient> {
    const secretName = process.env.PROJECT_SECRET!;

    if (process.env.PROCESS_ENV !== 'local') {
      return new CloudWatchLogsClient({
        region: await SecretsManagerUtil.getSecretValue(secretName, 'AWS_REGION'),
      });
    }

    return new CloudWatchLogsClient({
      region: await SecretsManagerUtil.getSecretValue(secretName, 'AWS_REGION'),
      credentials: {
        accessKeyId: await SecretsManagerUtil.getSecretValue(secretName, 'AWS_ACCESS_KEY'),
        secretAccessKey: await SecretsManagerUtil.getSecretValue(secretName, 'AWS_SECRET_ACCESS_KEY'),
      },
    });
  }
}
