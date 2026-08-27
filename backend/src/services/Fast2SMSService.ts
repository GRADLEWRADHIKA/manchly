import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Fast2SMS WhatsApp Template Message IDs
// Message IDs belong to the WhatsApp sender +1555-456-1518
// (WABA 1063357392763539 / phone_number_id 1249948161538200). Template IDs are
// per-WABA — if the sender number changes, every ID below has to be remapped
// from that WABA's own template list.
export const WHATSAPP_TEMPLATES = {
  WEBINAR_REGISTRATION: {
    messageId: '29543',
    name: 'webinar_registration',
    // "Webinar Registration Confirmed — Hello {{1}}, Your registration for the
    //  {{2}} webinar has been confirmed. Date: {{3}} ({{4}}) Time: {{5}}
    //  Joining details: {{6}}"
    // Variables: {{1}}=name, {{2}}=webinarName, {{3}}=date, {{4}}=day, {{5}}=time, {{6}}=link
  },
  COURSE_PURCHASE: {
    messageId: '29542',
    name: 'course_registration',
    // "Course Enrollment Confirmed — Hello {{1}}, Your enrollment for the {{2}}
    //  course has been confirmed. Course access: {{3}}"
    // Variables: {{1}}=name, {{2}}=courseName, {{3}}=accessLink
  },
  WEBINAR_2HRS: {
    messageId: '29546',
    name: 'webinar_2hrs',
    // "Webinar Reminder — Hello {{1}}, This is a reminder regarding your
    //  scheduled webinar. Date: {{2}} ({{3}}) Time: {{4}} Joining details: {{5}}"
    // Variables: {{1}}=name, {{2}}=date, {{3}}=day, {{4}}=time, {{5}}=link
  },
  WEBINAR_10MIN: {
    messageId: '29545',
    name: 'webinar_10min',
    // "Webinar Reminder — Hello {{1}}, This is a reminder regarding your
    //  scheduled webinar. Scheduled time: {{2}} Joining details: {{3}}"
    // Variables: {{1}}=name, {{2}}=scheduledTime, {{3}}=link
  },
  WEBINAR_LIVE: {
    messageId: '29544',
    name: 'webinar_live',
    // "Webinar is live! — Hello {{1}}, Your scheduled webinar is now live.
    //  Joining link: {{2}}"
    // Variables: {{1}}=name, {{2}}=link
  },
  PAYMENT_COMPLETED: {
    messageId: '29394',
    name: 'payment_completed',
    // "Dear user, Your last payment completed successfully amount: {{1}} Thank you."
    // Variables: {{1}}=amount
  },
  // 1:1 session booking. The WABA behind +1555-456-1518 has no session template
  // approved yet, so this is read from the environment: set
  // FAST2SMS_TEMPLATE_SESSION_BOOKING once one is approved and it starts
  // sending. Empty means "skip WhatsApp for sessions" — email still goes out.
  // Variables: {{1}}=name, {{2}}=expertName, {{3}}=scheduledTime
  SESSION_BOOKING: {
    messageId: process.env.FAST2SMS_TEMPLATE_SESSION_BOOKING || '',
    name: 'session_booking',
  },
} as const;

interface Fast2SMSConfig {
  apiKey: string;
  senderId: string;
  whatsappPhoneNumberId: string;
}

interface SMSResponse {
  return: boolean;
  request_id: string;
  message: string[];
}

export class Fast2SMSService {
  private config: Fast2SMSConfig;
  private smsClient: AxiosInstance;

  constructor(config?: Partial<Fast2SMSConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.FAST2SMS_API_KEY || '',
      senderId: config?.senderId || process.env.FAST2SMS_SENDER_ID || 'ADPVT',
      whatsappPhoneNumberId: config?.whatsappPhoneNumberId || process.env.FAST2SMS_WHATSAPP_PHONE_NUMBER_ID || '',
    };

    // SMS client
    this.smsClient = axios.create({
      baseURL: 'https://www.fast2sms.com/dev',
      headers: {
        'authorization': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  // ============ SMS METHODS ============

  /**
   * Send OTP via Fast2SMS DLT Manual route
   */
  async sendOTP(phoneNumber: string, otp: string, ttlMinutes: number = 3): Promise<SMSResponse> {
    try {
      const cleanNumber = this.cleanPhoneNumber(phoneNumber);
      const message = `Your login otp is ${otp}  Regards, AGNIVORA DIGITAL PRIVATE LIMITED`;

      const response = await this.smsClient.get('/bulkV2', {
        params: {
          authorization: this.config.apiKey,
          sender_id: this.config.senderId,
          message,
          route: 'dlt_manual',
          flash: '0',
          numbers: cleanNumber,
        },
      });

      console.log(`Fast2SMS OTP sent to ${cleanNumber}: ${otp}`);
      return response.data;
    } catch (error: any) {
      console.error('Fast2SMS OTP error:', error.response?.data || error.message);
      throw new Error(`Failed to send OTP via Fast2SMS: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Send a generic SMS via Fast2SMS Quick SMS
   */
  async sendSMS(phoneNumbers: string | string[], message: string): Promise<SMSResponse> {
    try {
      const numbers = Array.isArray(phoneNumbers)
        ? phoneNumbers.map(n => this.cleanPhoneNumber(n)).join(',')
        : this.cleanPhoneNumber(phoneNumbers);

      const response = await this.smsClient.post('/bulkV2', {
        message,
        route: 'q',
        numbers,
        flash: '0',
      });

      console.log(`Fast2SMS message sent to ${numbers}`);
      return response.data;
    } catch (error: any) {
      console.error('Fast2SMS SMS error:', error.response?.data || error.message);
      throw new Error(`Failed to send SMS: ${error.response?.data?.message || error.message}`);
    }
  }

  // ============ WHATSAPP METHODS ============

  /**
   * Send a WhatsApp template message via Fast2SMS
   */
  async sendWhatsAppTemplate(
    phoneNumber: string,
    messageId: string,
    variablesValues: string
  ): Promise<any> {
    try {
      const cleanNumber = this.cleanPhoneNumber(phoneNumber);

      const response = await axios.get(
        'https://www.fast2sms.com/dev/whatsapp',
        {
          params: {
            authorization: this.config.apiKey,
            message_id: messageId,
            phone_number_id: this.config.whatsappPhoneNumberId,
            numbers: cleanNumber,
            variables_values: variablesValues,
          },
          timeout: 30000,
        }
      );

      console.log(`WhatsApp template (${messageId}) sent to ${cleanNumber}`);
      return response.data;
    } catch (error: any) {
      console.error('Fast2SMS WhatsApp error:', error.response?.data || error.message);
      throw new Error(`Failed to send WhatsApp message: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Send webinar successful registration via WhatsApp
   * Variables: name|webinarName|date|day|time|link|password
   */
  async sendWhatsAppWebinarRegistration(
    phoneNumber: string,
    name: string,
    webinarName: string,
    date: string,
    day: string,
    time: string,
    link: string
  ): Promise<any> {
    return this.sendWhatsAppTemplate(
      phoneNumber,
      WHATSAPP_TEMPLATES.WEBINAR_REGISTRATION.messageId,
      `${name}|${webinarName}|${date}|${day}|${time}|${link}`
    );
  }

  /**
   * Send course purchase confirmation via WhatsApp
   * Variables: name|courseName|accessLink
   */
  async sendWhatsAppCoursePurchase(
    phoneNumber: string,
    name: string,
    courseName: string,
    accessLink: string
  ): Promise<any> {
    return this.sendWhatsAppTemplate(
      phoneNumber,
      WHATSAPP_TEMPLATES.COURSE_PURCHASE.messageId,
      `${name}|${courseName}|${accessLink}`
    );
  }

  /**
   * Send payment completed notification via WhatsApp
   * Variables: amount
   */
  async sendWhatsAppPaymentCompleted(phoneNumber: string, amount: string): Promise<any> {
    return this.sendWhatsAppTemplate(
      phoneNumber,
      WHATSAPP_TEMPLATES.PAYMENT_COMPLETED.messageId,
      amount
    );
  }

  /**
   * Send the "2 hours to go" webinar reminder via WhatsApp
   * Variables: name|date|day|time|link
   */
  async sendWhatsAppWebinar2HrReminder(
    phoneNumber: string,
    name: string,
    date: string,
    day: string,
    time: string,
    link: string
  ): Promise<any> {
    return this.sendWhatsAppTemplate(
      phoneNumber,
      WHATSAPP_TEMPLATES.WEBINAR_2HRS.messageId,
      `${name}|${date}|${day}|${time}|${link}`
    );
  }

  /**
   * Send the "10 minutes to go" webinar reminder via WhatsApp
   * Variables: name|scheduledTime|link
   */
  async sendWhatsAppWebinar10MinReminder(
    phoneNumber: string,
    name: string,
    scheduledTime: string,
    link: string
  ): Promise<any> {
    return this.sendWhatsAppTemplate(
      phoneNumber,
      WHATSAPP_TEMPLATES.WEBINAR_10MIN.messageId,
      `${name}|${scheduledTime}|${link}`
    );
  }

  /**
   * Send a 1:1 session booking confirmation via WhatsApp.
   * Returns false without sending when no session template is configured, so
   * callers can fall back to email only instead of throwing.
   * Variables: name|expertName|scheduledTime
   */
  async sendWhatsAppSessionBooking(
    phoneNumber: string,
    name: string,
    expertName: string,
    scheduledTime: string,
  ): Promise<boolean> {
    const messageId = WHATSAPP_TEMPLATES.SESSION_BOOKING.messageId;
    if (!messageId) {
      console.warn(
        '⚠️  No WhatsApp session template configured (FAST2SMS_TEMPLATE_SESSION_BOOKING) — sending email only.',
      );
      return false;
    }
    await this.sendWhatsAppTemplate(
      phoneNumber,
      messageId,
      `${name}|${expertName}|${scheduledTime}`,
    );
    return true;
  }

  /**
   * Send the "webinar is live" notification via WhatsApp
   * Variables: name|link
   */
  async sendWhatsAppWebinarLive(
    phoneNumber: string,
    name: string,
    link: string
  ): Promise<any> {
    return this.sendWhatsAppTemplate(
      phoneNumber,
      WHATSAPP_TEMPLATES.WEBINAR_LIVE.messageId,
      `${name}|${link}`
    );
  }

  /**
   * Send a free-text WhatsApp message (session message, user must have messaged first)
   */
  async sendWhatsAppMessage(to: string, text: string): Promise<any> {
    try {
      const cleanNumber = this.cleanPhoneNumber(to);

      const response = await axios.post(
        'https://www.fast2sms.com/dev/whatsapp-session',
        {
          type: 'text',
          text,
        },
        {
          params: {
            phone_number_id: this.config.whatsappPhoneNumberId,
            to: cleanNumber,
          },
          headers: {
            'authorization': this.config.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      console.log(`WhatsApp message sent to ${cleanNumber}`);
      return response.data;
    } catch (error: any) {
      console.error('Fast2SMS WhatsApp error:', error.response?.data || error.message);
      throw new Error(`Failed to send WhatsApp message: ${error.response?.data?.message || error.message}`);
    }
  }

  // ============ UTILITY METHODS ============

  /**
   * Clean phone number to 10-digit Indian format
   */
  private cleanPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('91') && cleaned.length > 10) {
      cleaned = cleaned.substring(cleaned.length - 10);
    }
    if (cleaned.length !== 10) {
      throw new Error(`Invalid phone number: ${phone}. Must be 10 digits.`);
    }
    return cleaned;
  }

  /**
   * Check if Fast2SMS is configured
   */
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * Check if WhatsApp is configured
   */
  isWhatsAppConfigured(): boolean {
    return !!this.config.apiKey && !!this.config.whatsappPhoneNumberId;
  }
}

// Singleton instance
export const fast2smsService = new Fast2SMSService();

export default Fast2SMSService;
