export interface SubscriptionType {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
