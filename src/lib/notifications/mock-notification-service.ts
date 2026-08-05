import type {
  NotificationService,
  SendJobNotificationInput,
} from './notification-service.interface';

export class MockNotificationService implements NotificationService {
  async sendJobNotification(input: SendJobNotificationInput): Promise<void> {
    // MVP: skutečné odeslání SMS neimplementujeme, pouze zalogujeme.
    console.log('[MockNotificationService] SMS by byla odeslána:', {
      toPhone: input.toPhone,
      customerName: input.customerName,
      message: input.message,
    });
  }
}
