import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Fast2SMS WhatsApp Template Message IDs
export const WHATSAPP_TEMPLATES = {
  OTP: {
    messageId: '16405',
    name: 'otp_template',
    // Template: "{{1}} is your verification code. For your security, do not share this code."
    // Variables: {{1}} = OTP code
  },
  PAYMENT_COMPLETED: {
    messageId: '16404',
    name: 'payment_completed',
    // Template: "Dear user, Your last payment completed successfully amount: {{1}} Thank you."
    // Variables: {{1}} = amount
  },
  OFFER: {
    messageId: '16403',
    name: 'offer_template',
    // Template: "Offer of the day. Buy {{1}} & get {{2}} FREE. Visit: {{3}} Offer valid for 3 days only."
    // Variables: {{1}} = item, {{2}} = freebie, {{3}} = link
  },
  WEBINAR_REGISTRATION: {
    messageId: '16677',
    name: 'webinar_successful_registration',
    // Template: "Hey {{1}} 👋 You've successfully registered for the {{2}} Webinar 🤩 📅 Date: {{3}} ({{4}}) ⏰ Time: {{5}} 🔗 Join here: {{6}} 🔐 : {{7}} See you there! 🚀"
    // Variables: {{1}}=name, {{2}}=webinarName, {{3}}=date, {{4}}=day, {{5}}=time, {{6}}=link, {{7}}=password
  },
  COURSE_PURCHASE: {
    messageId: '16683',
    name: 'course_purchase_successful',
    // Template: "Hello {{1}}, Your enrollment for the {{2}} course is confirmed. Access your course here: {{3}} No login is required."
    // Variables: {{1}}=name, {{2}}=courseName, {{3}}=accessLink
  },
  WEBINAR_LIVE: {
    messageId: '16684',
    name: 'webinar_live_notification',
    // Template: "Hey {{1}} 👋 🗓 Date: {{2}} ({{3}}) ⏰ Time: {{4}} Here are your joining details: 🔗 Link: {{5}} 🔐 {{6}} See you inside!"
    // Variables: {{1}}=name, {{2}}=date, {{3}}=day, {{4}}=time, {{5}}=link, {{6}}=password
  },
  WEBINAR_30MIN: {
    messageId: '16685',
    name: 'webinar_30min_notification',
    // Template: "Hey {{1}} 👋 🗓 Date: {{2}} ({{3}}) ⏰ Time: {{4}} Here are your joining details: 🔗 Link: {{5}} 🔐 {{6}} See you inside!"
    // Variables: {{1}}=name, {{2}}=date, {{3}}=day, {{4}}=time, {{5}}=link, {{6}}=password
  },
  WEBINAR_6HRS: {
    messageId: '16686',
    name: 'webinar_6hrs_notification',
    // Template: "Hey {{1}} 👋 🗓 Date: {{2}} ({{3}}) ⏰ Time: {{4}} Here are your joining details: 🔗 Link: {{5}} 🔐 {{6}} See you inside!"
    // Variables: {{1}}=name, {{2}}=date, {{3}}=day, {{4}}=time, {{5}}=link, {{6}}=password
  },
  WEBINAR_24HRS: {
    messageId: '16687',
    name: 'webinar__24hrs_notification',
    // Template: "Hey {{1}} 👋 🗓 Date: {{2}} ({{3}}) ⏰ Time: {{4}} (sharp) Here are your joining details: 🔗 Link: {{5}} 🔐 {{6}} See you inside!"
    // Variables: {{1}}=name, {{2}}=date, {{3}}=day, {{4}}=time, {{5}}=link, {{6}}=password
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
   * Send OTP via WhatsApp using otp_template
   */
  async sendWhatsAppOTP(phoneNumber: string, otp: string): Promise<any> {
    return this.sendWhatsAppTemplate(
      phoneNumber,
      WHATSAPP_TEMPLATES.OTP.messageId,
      otp
    );
  }

  /**
   * Send payment completed notification via WhatsApp
   */
  async sendWhatsAppPaymentCompleted(phoneNumber: string, amount: string): Promise<any> {
    return this.sendWhatsAppTemplate(
      phoneNumber,
      WHATSAPP_TEMPLATES.PAYMENT_COMPLETED.messageId,
      amount
    );
  }

  /**
   * Send offer notification via WhatsApp
   * @param variablesValues - pipe-separated: "item|freebie|link"
   */
  async sendWhatsAppOffer(phoneNumber: string, variablesValues: string): Promise<any> {
    return this.sendWhatsAppTemplate(
      phoneNumber,
      WHATSAPP_TEMPLATES.OFFER.messageId,
      variablesValues
    );
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
    link: string,
    password: string
  ): Promise<any> {
    return this.sendWhatsAppTemplate(
      phoneNumber,
      WHATSAPP_TEMPLATES.WEBINAR_REGISTRATION.messageId,
      `${name}|${webinarName}|${date}|${day}|${time}|${link}|${password}`
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
   * Send webinar reminder/notification via WhatsApp
   * Used for 24hr, 6hr, 30min, and live notifications (same variable format)
   * Variables: name|date|day|time|link|password
   */
  async sendWhatsAppWebinarReminder(
    phoneNumber: string,
    templateMessageId: string,
    name: string,
    date: string,
    day: string,
    time: string,
    link: string,
    password: string
  ): Promise<any> {
    return this.sendWhatsAppTemplate(
      phoneNumber,
      templateMessageId,
      `${name}|${date}|${day}|${time}|${link}|${password}`
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
