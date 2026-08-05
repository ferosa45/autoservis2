export type SendJobNotificationInput = {
  toPhone: string;
  customerName: string;
  message: string;
};

/**
 * Rozhraní pro odesílání notifikací zákazníkům (např. SMS o dokončení zakázky).
 *
 * Pro MVP se skutečné SMS neposílají - používá se MockNotificationService,
 * který pouze zaloguje, co by se odeslalo. Až bude potřeba, půjde doplnit
 * skutečného SMS providera (např. GoSMS, SMSbrana) bez změny volajícího kódu.
 */
export interface NotificationService {
  sendJobNotification(input: SendJobNotificationInput): Promise<void>;
}
