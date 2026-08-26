import EmailService from './EmailService';
import { fast2smsService } from './Fast2SMSService';
import dotenv from 'dotenv';

dotenv.config();

interface WebinarNotificationData {
  joineeName: string;
  joineeEmail: string;
  joineePhone?: string;
  webinarName: string;
  date: string;       // e.g. "5th April 2026"
  day: string;        // e.g. "Saturday"
  time: string;       // e.g. "3:00 PM IST"
  webinarLink: string;
  password: string;
  hostName: string;
}

interface CourseNotificationData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  courseName: string;
  courseAccessLink: string;
  hostName: string;
}

interface SessionNotificationData {
  /** The learner who booked. */
  callerName: string;
  callerEmail: string;
  callerPhone?: string;
  /** The creator/expert being booked. */
  expertName: string;
  expertEmail?: string;
  expertPhone?: string;
  mode: string;
  scheduledAt?: Date | string | null;
  amount?: number;
}

export class NotificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  // ============ WEBINAR PURCHASE / REGISTRATION ============

  async sendWebinarPurchaseNotification(data: WebinarNotificationData): Promise<void> {
    const promises: Promise<any>[] = [];

    // Email
    promises.push(
      this.emailService.sendEmail({
        to: data.joineeEmail,
        subject: `Congrats on Registering for the ${data.webinarName} Webinar! 🚀`,
        html: this.wrapEmailHtml(`
          <p class="greeting">Hey ${data.joineeName} 👋</p>
          <p>You have successfully registered for the <strong>${data.webinarName}</strong> Webinar 🤩</p>
          <p>Here are the details of the Webinar:</p>
          <div class="details-box">
            <p>🗓 Date: <strong>${data.date}</strong> (${data.day})</p>
            <p>⏰ Time: <strong>${data.time}</strong> (sharp)</p>
          </div>
          <p>Here are your joining details:</p>
          <div class="details-box">
            <p>🔗 Link: <a href="${data.webinarLink}">${data.webinarLink}</a></p>
            <p>🔐 Password: <strong>${data.password}</strong></p>
          </div>
          <p>Cheers<br>— ${data.hostName}</p>
        `),
      }).catch(err => console.error('Webinar purchase email error:', err))
    );

    // WhatsApp
    if (data.joineePhone && fast2smsService.isWhatsAppConfigured()) {
      promises.push(
        fast2smsService.sendWhatsAppWebinarRegistration(
          data.joineePhone,
          data.joineeName,
          data.webinarName,
          data.date,
          data.day,
          data.time,
          data.webinarLink
        ).catch(err => console.error('Webinar registration WhatsApp error:', err))
      );
    }

    await Promise.allSettled(promises);
  }

  // ============ WEBINAR 24HR REMINDER ============

  async sendWebinar24HrReminder(data: WebinarNotificationData): Promise<void> {
    const promises: Promise<any>[] = [];

    // Email
    promises.push(
      this.emailService.sendEmail({
        to: data.joineeEmail,
        subject: `24 hours to go for ${data.webinarName} Webinar`,
        html: this.wrapEmailHtml(`
          <p class="greeting">Hey ${data.joineeName} !</p>
          <p>The <strong>${data.webinarName}</strong> that you signed up for is happening tomorrow!</p>
          <p>Webinar will start at <strong>${data.time}</strong> sharp on <strong>${data.date}</strong> ${data.day}.</p>
          <div class="details-box">
            <h3>Webinar Joining Details</h3>
            <p>Link : <a href="${data.webinarLink}">${data.webinarLink}</a></p>
            <p>Password: <strong>${data.password}</strong></p>
          </div>
          <p>I'll see you inside the workshop!</p>
          <p>Cheers,<br>${data.hostName}</p>
        `),
      }).catch(err => console.error('24hr email error:', err))
    );

    // WhatsApp
    if (data.joineePhone && fast2smsService.isWhatsAppConfigured()) {
      promises.push(
        // The WhatsApp sender has no 24-hour template — the closest approved one
        // is the generic "webinar reminder" used for the 2-hour mark, and its
        // wording suits either. Email still carries the full 24-hour notice.
        fast2smsService.sendWhatsAppWebinar2HrReminder(
          data.joineePhone,
          data.joineeName,
          data.date,
          data.day,
          data.time,
          data.webinarLink
        ).catch(err => console.error('24hr WhatsApp error:', err))
      );
    }

    await Promise.allSettled(promises);
  }

  // ============ WEBINAR 6HR REMINDER ============

  async sendWebinar6HrReminder(data: WebinarNotificationData): Promise<void> {
    const promises: Promise<any>[] = [];

    // Email
    promises.push(
      this.emailService.sendEmail({
        to: data.joineeEmail,
        subject: `6 Hours to go for ${data.webinarName} Webinar`,
        html: this.wrapEmailHtml(`
          <p class="greeting">Hey ${data.joineeName} !</p>
          <p>The <strong>${data.webinarName}</strong> that you signed up for is happening today!</p>
          <p>Webinar will start at <strong>${data.time}</strong> sharp on <strong>${data.date}</strong> ${data.day}.</p>
          <div class="details-box">
            <h3>Webinar Joining Details</h3>
            <p>Link : <a href="${data.webinarLink}">${data.webinarLink}</a></p>
            <p>Password: <strong>${data.password}</strong></p>
          </div>
          <p>I'll see you inside the workshop!</p>
          <p>Cheers,<br>${data.hostName}</p>
        `),
      }).catch(err => console.error('6hr email error:', err))
    );

    // WhatsApp
    if (data.joineePhone && fast2smsService.isWhatsAppConfigured()) {
      promises.push(
        fast2smsService.sendWhatsAppWebinar2HrReminder(
          data.joineePhone,
          data.joineeName,
          data.date,
          data.day,
          data.time,
          data.webinarLink
        ).catch(err => console.error('6hr WhatsApp error:', err))
      );
    }

    await Promise.allSettled(promises);
  }

  // ============ WEBINAR 30MIN REMINDER ============

  async sendWebinar30MinReminder(data: WebinarNotificationData): Promise<void> {
    const promises: Promise<any>[] = [];

    // Email
    promises.push(
      this.emailService.sendEmail({
        to: data.joineeEmail,
        subject: `Your ${data.webinarName} starts in 30 Minutes`,
        html: this.wrapEmailHtml(`
          <p class="greeting">Hey ${data.joineeName} !</p>
          <p>The <strong>${data.webinarName}</strong> that you signed up for is happening in 30 min!</p>
          <p>Webinar will start at <strong>${data.time}</strong> sharp on <strong>${data.date}</strong> ${data.day}.</p>
          <div class="details-box">
            <h3>Webinar Joining Details</h3>
            <p>Link : <a href="${data.webinarLink}">${data.webinarLink}</a></p>
            <p>Password: <strong>${data.password}</strong></p>
          </div>
          <p>I'll see you inside the workshop!</p>
          <p>Cheers,<br>${data.hostName}</p>
        `),
      }).catch(err => console.error('30min email error:', err))
    );

    // WhatsApp
    if (data.joineePhone && fast2smsService.isWhatsAppConfigured()) {
      promises.push(
        fast2smsService.sendWhatsAppWebinar10MinReminder(
          data.joineePhone,
          data.joineeName,
          `${data.time} on ${data.date} (${data.day})`,
          data.webinarLink
        ).catch(err => console.error('30min WhatsApp error:', err))
      );
    }

    await Promise.allSettled(promises);
  }

  // ============ WEBINAR LIVE NOTIFICATION ============

  async sendWebinarLiveNotification(data: WebinarNotificationData): Promise<void> {
    const promises: Promise<any>[] = [];

    // Email
    promises.push(
      this.emailService.sendEmail({
        to: data.joineeEmail,
        subject: `I am LIVE! Start Joining Now!`,
        html: this.wrapEmailHtml(`
          <p class="greeting">Hey ${data.joineeName} !</p>
          <p>The <strong>${data.webinarName}</strong> that you signed up for is live!</p>
          <p>Webinar will start at <strong>${data.time}</strong> sharp on <strong>${data.date}</strong> ${data.day}.</p>
          <div class="details-box">
            <h3>Webinar Joining Details</h3>
            <p>Link : <a href="${data.webinarLink}">${data.webinarLink}</a></p>
            <p>Password: <strong>${data.password}</strong></p>
          </div>
          <p>I'll see you inside the workshop!</p>
          <p>Cheers,<br>${data.hostName}</p>
        `),
      }).catch(err => console.error('Live email error:', err))
    );

    // WhatsApp
    if (data.joineePhone && fast2smsService.isWhatsAppConfigured()) {
      promises.push(
        fast2smsService.sendWhatsAppWebinarLive(
          data.joineePhone,
          data.joineeName,
          data.webinarLink
        ).catch(err => console.error('Live WhatsApp error:', err))
      );
    }

    await Promise.allSettled(promises);
  }

  // ============ COURSE PURCHASE NOTIFICATION ============

  async sendCoursePurchaseNotification(data: CourseNotificationData): Promise<void> {
    const promises: Promise<any>[] = [];

    // Email
    promises.push(
      this.emailService.sendEmail({
        to: data.customerEmail,
        subject: `You're in! Start ${data.courseName} now 🚀`,
        html: this.wrapEmailHtml(`
          <p class="greeting">Hey ${data.customerName},</p>
          <p>🎉 You're enrolled in <strong>${data.courseName}</strong></p>
          <p>Start instantly — no login needed:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${data.courseAccessLink}" class="button">👉 Start Learning</a>
          </div>
          <p>Tip: Begin with Module 1 and take action as you go.</p>
          <p>Thanks<br>— ${data.hostName}</p>
        `),
      }).catch(err => console.error('Course purchase email error:', err))
    );

    // WhatsApp - send course purchase confirmation
    if (data.customerPhone && fast2smsService.isWhatsAppConfigured()) {
      promises.push(
        fast2smsService.sendWhatsAppCoursePurchase(
          data.customerPhone,
          data.customerName,
          data.courseName,
          data.courseAccessLink
        ).catch(err => console.error('Course purchase WhatsApp error:', err))
      );
    }

    await Promise.allSettled(promises);
  }

  // ============ 1:1 SESSION BOOKING ============

  /**
   * Confirms a 1:1 booking to the learner and tells the expert someone booked
   * them. WhatsApp only goes out if a session template is configured — see
   * WHATSAPP_TEMPLATES.SESSION_BOOKING — but email always does.
   */
  async sendSessionBookingNotification(data: SessionNotificationData): Promise<void> {
    const promises: Promise<any>[] = [];

    const when = data.scheduledAt
      ? new Date(data.scheduledAt).toLocaleString('en-IN', {
          dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
        })
      : 'to be confirmed';
    const modeLabel = String(data.mode).toUpperCase() === 'VIDEO' ? 'Video call' : 'Audio call';

    // ── Learner ──
    promises.push(
      this.emailService.sendEmail({
        to: data.callerEmail,
        subject: `Your 1:1 session with ${data.expertName} is booked`,
        html: this.wrapEmailHtml(`
          <p class="greeting">Hey ${data.callerName}!</p>
          <p>Your 1:1 session with <strong>${data.expertName}</strong> is confirmed.</p>
          <div class="details-box">
            <h3>Session details</h3>
            <p>Format: <strong>${modeLabel}</strong></p>
            <p>When: <strong>${when}</strong></p>
            ${data.amount ? `<p>Amount: <strong>₹${data.amount}</strong></p>` : ''}
          </div>
          <p>You'll get the joining link here before it starts.</p>
        `),
      }).catch(err => console.error('Session booking email error (learner):', err)),
    );

    if (data.callerPhone && fast2smsService.isWhatsAppConfigured()) {
      promises.push(
        fast2smsService
          .sendWhatsAppSessionBooking(data.callerPhone, data.callerName, data.expertName, when)
          .catch(err => console.error('Session booking WhatsApp error (learner):', err)),
      );
    }

    // ── Expert ──
    if (data.expertEmail) {
      promises.push(
        this.emailService.sendEmail({
          to: data.expertEmail,
          subject: `New 1:1 booking from ${data.callerName}`,
          html: this.wrapEmailHtml(`
            <p class="greeting">Hey ${data.expertName}!</p>
            <p><strong>${data.callerName}</strong> just booked a 1:1 session with you.</p>
            <div class="details-box">
              <h3>Session details</h3>
              <p>Format: <strong>${modeLabel}</strong></p>
              <p>When: <strong>${when}</strong></p>
            </div>
          `),
        }).catch(err => console.error('Session booking email error (expert):', err)),
      );
    }

    if (data.expertPhone && fast2smsService.isWhatsAppConfigured()) {
      promises.push(
        fast2smsService
          .sendWhatsAppSessionBooking(data.expertPhone, data.expertName, data.callerName, when)
          .catch(err => console.error('Session booking WhatsApp error (expert):', err)),
      );
    }

    await Promise.allSettled(promises);
  }

  // ============ EMAIL HTML WRAPPER ============

  private wrapEmailHtml(bodyContent: string): string {
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
            border-radius: 8px;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 15px;
            color: #333;
          }
          .details-box {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .details-box h3 {
            margin-top: 0;
            color: #667eea;
          }
          .details-box p {
            margin: 8px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 13px;
          }
          a { color: #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Manchly</h1>
          </div>
          <div class="content">
            ${bodyContent}
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} Manchly. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Singleton instance
export const notificationService = new NotificationService();

export default NotificationService;
