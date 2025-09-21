import fetch from 'node-fetch';

import ErrorUtil from '@common/utils/ErrorUtil';
import { SubscriptionType } from '@common/interfaces/SubscriptionType';

export interface NotificationServiceType {
  sendPushNotification(endpoint: string, message: string, subscription: SubscriptionType): Promise<void>;
}

export default class NotificationService implements NotificationServiceType {
  public async sendPushNotification(endpoint: string, message: string, subscription: SubscriptionType): Promise<void> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          subscription
        })
      });

      if (!response.ok) {
        ErrorUtil.throwError(`Failed to send push notification, status: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        ErrorUtil.throwError(`Error sending push notification: ${error.message}`);
      } else {
        ErrorUtil.throwError('Unknown error sending push notification');
      }
    }
  }
}
