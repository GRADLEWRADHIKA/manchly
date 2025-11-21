import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface WhatsAppConfig {
  apiKey?: string;
  apiUrl?: string;
  phoneNumberId?: string;
  accessToken?: string;
}

interface SendMessageOptions {
  to: string; // Phone number with country code (e.g., +919876543210)
  message: string;
  templateName?: string;
  templateParams?: string[];
}

interface WebinarEnrollmentMessageData {
  userName: string;
  userPhone: string;
  webinarTitle: string;
  scheduledAt: Date;
  zoomJoinUrl: string;
  zoomPassword?: string;
}

export class WhatsAppService {
  private client: AxiosInstance;
  private config: WhatsAppConfig;

  constructor(config?: WhatsAppConfig) {
    // Default configuration from environment variables
    this.config = config || {
      apiKey: process.env.WHATSAPP_API_KEY,
      apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN
    };

    this.client = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.accessToken}`
      },
      timeout: 30000
    });
  }

  /**
   * Send a generic WhatsApp message
   * 
   * Note: This uses WhatsApp Business API. You need to:
   * 1. Set up a WhatsApp Business account
   * 2. Get approved message templates
   * 3. Configure your app with phone number ID and access token
   */
  async sendMessage(options: SendMessageOptions): Promise<boolean> {
    try {
      // Validate phone number format
      const phoneNumber = this.formatPhoneNumber(options.to);
      
      const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: options.message
        }
      };

      const response = await this.client.post(
        `/${this.config.phoneNumberId}/messages`,
        payload
      );

      console.log(`📱 WhatsApp message sent successfully to ${phoneNumber}`);
      console.log('Response:', response.data);
      return true;
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error.response?.data || error.message);
      throw new Error(`Failed to send WhatsApp message: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Send WhatsApp message using a template
   * Templates must be pre-approved by WhatsApp
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'en',
    components?: any[]
  ): Promise<boolean> {
    try {
      const phoneNumber = this.formatPhoneNumber(to);
      
      const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components: components || []
        }
      };

      const response = await this.client.post(
        `/${this.config.phoneNumberId}/messages`,
        payload
      );

      console.log(`📱 WhatsApp template message sent successfully to ${phoneNumber}`);
      return true;
    } catch (error: any) {
      console.error('Error sending WhatsApp template:', error.response?.data || error.message);
      throw new Error(`Failed to send WhatsApp template: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Send webinar enrollment confirmation via WhatsApp
   */
  async sendWebinarEnrollmentMessage(data: WebinarEnrollmentMessageData): Promise<boolean> {
    const scheduledDate = new Date(data.scheduledAt).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const message = `🎉 *Webinar Enrollment Confirmed!*\n\n` +
      `Hi ${data.userName}!\n\n` +
      `You have successfully enrolled in:\n` +
      `*${data.webinarTitle}*\n\n` +
      `📅 *Scheduled:* ${scheduledDate}\n\n` +
      `🔗 *Join Link:* ${data.zoomJoinUrl}\n` +
      `${data.zoomPassword ? `🔐 *Password:* ${data.zoomPassword}\n` : ''}` +
      `\nPlease join 5 minutes before the scheduled time.\n\n` +
      `See you there! 👋\n` +
      `- Machly Team`;

    return this.sendMessage({
      to: data.userPhone,
      message
    });
  }

  /**
   * Send webinar reminder via WhatsApp
   */
  async sendWebinarReminderMessage(data: WebinarEnrollmentMessageData): Promise<boolean> {
    const message = `⏰ *Webinar Reminder*\n\n` +
      `Hi ${data.userName}!\n\n` +
      `Your webinar "${data.webinarTitle}" is starting soon!\n\n` +
      `🔗 Join now: ${data.zoomJoinUrl}\n` +
      `${data.zoomPassword ? `🔐 Password: ${data.zoomPassword}\n` : ''}` +
      `\nDon't be late! ⚡`;

    return this.sendMessage({
      to: data.userPhone,
      message
    });
  }

  /**
   * Send webinar cancellation notification via WhatsApp
   */
  async sendWebinarCancellationMessage(
    userName: string,
    userPhone: string,
    webinarTitle: string,
    reason?: string
  ): Promise<boolean> {
    const message = `❌ *Webinar Cancelled*\n\n` +
      `Hi ${userName},\n\n` +
      `We regret to inform you that the webinar "${webinarTitle}" has been cancelled.\n` +
      `${reason ? `\n*Reason:* ${reason}\n` : ''}` +
      `\nIf you made a payment, a refund will be processed within 5-7 business days.\n\n` +
      `We apologize for the inconvenience.\n` +
      `- Machly Team`;

    return this.sendMessage({
      to: userPhone,
      message
    });
  }

  /**
   * Format phone number to international format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If doesn't start with country code, assume India (+91)
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Validate phone number format
   */
  isValidPhoneNumber(phone: string): boolean {
    const cleaned = this.formatPhoneNumber(phone);
    // Basic validation: should be 10-15 digits
    return /^\d{10,15}$/.test(cleaned);
  }

  /**
   * Health check for WhatsApp service
   */
  async healthCheck(): Promise<{ ok: boolean; message: string }> {
    try {
      if (!this.config.accessToken || !this.config.phoneNumberId) {
        return {
          ok: false,
          message: 'WhatsApp API credentials not configured'
        };
      }

      // Try to fetch phone number details as a health check
      const response = await this.client.get(`/${this.config.phoneNumberId}`);
      
      return {
        ok: true,
        message: 'WhatsApp service is operational'
      };
    } catch (error: any) {
      return {
        ok: false,
        message: `WhatsApp service health check failed: ${error.response?.data?.error?.message || error.message}`
      };
    }
  }
}

/**
 * SETUP INSTRUCTIONS:
 * 
 * 1. Create a Meta (Facebook) Developer Account
 * 2. Create a WhatsApp Business App
 * 3. Set up WhatsApp Business API
 * 4. Get your Phone Number ID and Access Token
 * 5. Create and get approval for message templates
 * 
 * Add these to your .env file:
 * WHATSAPP_API_URL=https://graph.facebook.com/v17.0
 * WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
 * WHATSAPP_ACCESS_TOKEN=your_access_token
 * 
 * For testing, you can use the WhatsApp Business API Test Number
 * 
 * Alternative services:
 * - Twilio WhatsApp API
 * - MessageBird
 * - Vonage (Nexmo)
 * - Gupshup
 */

export default WhatsAppService;

