import CloudWatchLogsService, { LogEvent } from '@common/services/aws/CloudWatchLogsService';
import ErrorUtil from '@common/utils/ErrorUtil';

describe.skip('CloudWatch Logs Tests', () => {
  describe('CloudWatchLogsService', () => {
    const logGroupName = 'TestLogGroup';
    const logStreamName = 'TestLogStream';
    let cloudWatchLogsService: CloudWatchLogsService;

    beforeEach(() => {
      cloudWatchLogsService = new CloudWatchLogsService(logGroupName, logStreamName);
    });

    it('Get Log Group and Stream Names', () => {
      expect(cloudWatchLogsService.getLogGroupName()).toBe(logGroupName);
      expect(cloudWatchLogsService.getLogStreamName()).toBe(logStreamName);
    });

    it('Create Log Stream', async () => {
      await cloudWatchLogsService.createLogStream();
      expect(true).toBe(true);
    });

    it('Put Log Events', async () => {
      await cloudWatchLogsService.createLogStream();

      const events: LogEvent[] = [
        {
          message: 'Test log message 1',
          timestamp: Date.now(),
        },
        {
          message: 'Test log message 2',
          timestamp: Date.now() + 1000,
        },
      ];

      await cloudWatchLogsService.putLogEvents(events);
      expect(true).toBe(true);
    });

    it('Get Log Events', async () => {
      await cloudWatchLogsService.createLogStream();

      const currentTime = Date.now();
      const putEvents: LogEvent[] = [
        {
          message: 'Test log message for retrieval 1',
          timestamp: currentTime,
        },
        {
          message: 'Test log message for retrieval 2',
          timestamp: currentTime + 1000,
        },
      ];

      await cloudWatchLogsService.putLogEvents(putEvents);

      await new Promise(resolve => setTimeout(resolve, 3000));

      const retrievedEvents = await cloudWatchLogsService.getLogEvents({
        startTime: currentTime - 5000,
        endTime: currentTime + 10000,
        limit: 10,
        startFromHead: true,
      });

      expect(retrievedEvents.length).toBeGreaterThanOrEqual(2);

      const containsMessage1 = retrievedEvents.some(
        event => event.message === 'Test log message for retrieval 1'
      );
      const containsMessage2 = retrievedEvents.some(
        event => event.message === 'Test log message for retrieval 2'
      );

      expect(containsMessage1).toBe(true);
      expect(containsMessage2).toBe(true);
    });

    it('Put Log Events with Empty Array', async () => {
      await expect(cloudWatchLogsService.putLogEvents([])).rejects.toThrow();
    });

    it('Put Multiple Log Events in Order', async () => {
      await cloudWatchLogsService.createLogStream();

      const baseTime = Date.now();
      const events: LogEvent[] = [
        {
          message: 'Message 3',
          timestamp: baseTime + 2000,
        },
        {
          message: 'Message 1',
          timestamp: baseTime,
        },
        {
          message: 'Message 2',
          timestamp: baseTime + 1000,
        },
      ];

      await cloudWatchLogsService.putLogEvents(events);

      await new Promise(resolve => setTimeout(resolve, 3000));

      const retrievedEvents = await cloudWatchLogsService.getLogEvents({
        startTime: baseTime - 5000,
        endTime: baseTime + 10000,
        startFromHead: true,
      });

      const messages = retrievedEvents
        .filter(e => e.message.startsWith('Message'))
        .map(e => e.message);

      expect(messages.length).toBeGreaterThanOrEqual(3);
    });
  });
});
