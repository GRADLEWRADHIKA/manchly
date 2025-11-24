import * as nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

interface WebinarEnrollmentEmailData {
  userName: string;
  userEmail: string;
  webinarTitle: string;
  webinarDescription?: string;
  scheduledAt: Date;
  duration?: number;
  zoomJoinUrl: string;
  zoomPassword?: string;
  timezone?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private defaultFrom: string;

  constructor(config?: EmailConfig) {
    // Default configuration from environment variables
    const emailConfig = config || {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || ''
      }
    };

    this.transporter = nodemailer.createTransport(emailConfig);
    this.defaultFrom = process.env.EMAIL_FROM || 'noreply@machly.com';
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html)
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✉️ Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send webinar enrollment confirmation email
   */
  async sendWebinarEnrollmentEmail(data: WebinarEnrollmentEmailData): Promise<boolean> {
    const html = this.generateWebinarEnrollmentEmailTemplate(data);
    
    return this.sendEmail({
      to: data.userEmail,
      subject: `🎉 You're Enrolled: ${data.webinarTitle}`,
      html
    });
  }

  /**
   * Send webinar reminder email (to be sent before the webinar starts)
   */
  async sendWebinarReminderEmail(data: WebinarEnrollmentEmailData): Promise<boolean> {
    const html = this.generateWebinarReminderEmailTemplate(data);
    
    return this.sendEmail({
      to: data.userEmail,
      subject: `⏰ Reminder: ${data.webinarTitle} starts soon!`,
      html
    });
  }

  /**
   * Send webinar cancellation email
   */
  async sendWebinarCancellationEmail(
    userName: string,
    userEmail: string,
    webinarTitle: string,
    reason?: string
  ): Promise<boolean> {
    const html = this.generateWebinarCancellationEmailTemplate(userName, webinarTitle, reason);
    
    return this.sendEmail({
      to: userEmail,
      subject: `Webinar Cancelled: ${webinarTitle}`,
      html
    });
  }

  /**
   * Generate webinar enrollment email HTML template
   */
  private generateWebinarEnrollmentEmailTemplate(data: WebinarEnrollmentEmailData): string {
    const scheduledDate = new Date(data.scheduledAt).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: data.timezone || 'UTC'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #333;
          }
          .webinar-details {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
          }
          .webinar-details h2 {
            margin-top: 0;
            color: #667eea;
            font-size: 22px;
          }
          .detail-row {
            display: flex;
            margin: 12px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e9ecef;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 600;
            color: #666;
            min-width: 120px;
          }
          .detail-value {
            color: #333;
            flex: 1;
          }
          .zoom-credentials {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .zoom-credentials strong {
            color: #856404;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
            font-size: 16px;
          }
          .button:hover {
            opacity: 0.9;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
          }
          .footer p {
            margin: 5px 0;
          }
          .note {
            background-color: #e7f3ff;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Enrollment Confirmed!</h1>
          </div>
          
          <div class="content">
            <p class="greeting">Hi ${data.userName},</p>
            
            <p>Congratulations! You have successfully enrolled in the webinar. We're excited to have you join us!</p>
            
            <div class="webinar-details">
              <h2>${data.webinarTitle}</h2>
              ${data.webinarDescription ? `<p>${data.webinarDescription}</p>` : ''}
              
              <div class="detail-row">
                <span class="detail-label">📅 Date & Time:</span>
                <span class="detail-value">${scheduledDate}</span>
              </div>
              
              ${data.duration ? `
              <div class="detail-row">
                <span class="detail-label">⏱️ Duration:</span>
                <span class="detail-value">${data.duration} minutes</span>
              </div>
              ` : ''}
              
              ${data.timezone ? `
              <div class="detail-row">
                <span class="detail-label">🌍 Timezone:</span>
                <span class="detail-value">${data.timezone}</span>
              </div>
              ` : ''}
            </div>
            
            ${data.zoomPassword ? `
            <div class="zoom-credentials">
              <strong>🔐 Meeting Password:</strong> ${data.zoomPassword}
            </div>
            ` : ''}
            
            <div style="text-align: center;">
              <a href="${data.zoomJoinUrl}" class="button">Join Webinar</a>
            </div>
            
            <div class="note">
              <strong>📌 Important Notes:</strong><br>
              • Please join the webinar 5 minutes before the scheduled time<br>
              • Make sure you have a stable internet connection<br>
              • We recommend using headphones for better audio quality<br>
              • You can access the webinar link from your enrolled webinars section
            </div>
            
            <p>If you have any questions or need assistance, feel free to reach out to us.</p>
            
            <p>See you at the webinar!<br>
            <strong>The Machly Team</strong></p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Machly. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate webinar reminder email template
   */
  private generateWebinarReminderEmailTemplate(data: WebinarEnrollmentEmailData): string {
    const scheduledDate = new Date(data.scheduledAt).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: data.timezone || 'UTC'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
          .header { background: #ff9800; color: white; padding: 20px; text-align: center; border-radius: 8px; }
          .content { background: white; padding: 30px; margin-top: 20px; border-radius: 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #ff9800; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .details { background: #fff3e0; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Webinar Starting Soon!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>This is a friendly reminder that your enrolled webinar is starting soon!</p>
            <div class="details">
              <h3>${data.webinarTitle}</h3>
              <p><strong>Scheduled:</strong> ${scheduledDate}</p>
              ${data.duration ? `<p><strong>Duration:</strong> ${data.duration} minutes</p>` : ''}
            </div>
            <div style="text-align: center;">
              <a href="${data.zoomJoinUrl}" class="button">Join Now</a>
            </div>
            ${data.zoomPassword ? `<p><strong>Password:</strong> ${data.zoomPassword}</p>` : ''}
            <p>See you there!<br>The Machly Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate webinar cancellation email template
   */
  private generateWebinarCancellationEmailTemplate(
    userName: string,
    webinarTitle: string,
    reason?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px; }
          .content { background: white; padding: 30px; margin-top: 20px; border-radius: 8px; }
          .notice { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Webinar Cancelled</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>We regret to inform you that the following webinar has been cancelled:</p>
            <h3>${webinarTitle}</h3>
            ${reason ? `<div class="notice"><strong>Reason:</strong> ${reason}</div>` : ''}
            <p>If you made a payment for this webinar, a refund will be processed automatically within 5-7 business days.</p>
            <p>We apologize for any inconvenience caused.</p>
            <p>Best regards,<br>The Machly Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Strip HTML tags from string
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready to send messages');
      return true;
    } catch (error) {
      console.error('❌ Email service verification failed:', error);
      return false;
    }
  }
}

export default EmailService;

