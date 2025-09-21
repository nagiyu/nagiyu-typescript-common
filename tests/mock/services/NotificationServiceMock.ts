import { NotificationServiceType } from '@common/services/NotificationService';
import { SubscriptionType } from '@common/interfaces/SubscriptionType';

export default class NotificationServiceMock implements NotificationServiceType {
  private messageList: string[] = [];

  public getMessages(): string[] {
    return this.messageList;
  }

  public clearMessages(): void {
    this.messageList = [];
  }

  public async sendPushNotification(endpoint: string, message: string, subscription: SubscriptionType): Promise<void> {
    console.log(`Notification: ${message}`);
    this.messageList.push(message);
  }
}