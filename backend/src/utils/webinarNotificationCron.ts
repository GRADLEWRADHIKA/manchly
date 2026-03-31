import prisma from '../prismaClient';
import * as cron from 'node-cron';
import { notificationService } from '../services/NotificationService';

/**
 * Webinar Notification Cron Service
 *
 * Sends timed notifications to webinar enrollees:
 * - 24 hours before
 * - 6 hours before
 * - 30 minutes before
 * - When webinar goes live (at scheduled time)
 */

// Track which notifications have been sent to avoid duplicates
// Key format: `${webinarId}:${userId}:${type}`
const sentNotifications = new Set<string>();

function formatWebinarDate(date: Date, timezone: string = 'Asia/Kolkata'): { date: string; day: string; time: string } {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
    timeZoneName: 'short',
  };

  const dateStr = new Date(date).toLocaleDateString('en-IN', options);
  const dayStr = new Date(date).toLocaleDateString('en-IN', { weekday: 'long', timeZone: timezone });
  const timeStr = new Date(date).toLocaleTimeString('en-IN', timeOptions);

  return { date: dateStr, day: dayStr, time: timeStr };
}

function getNotificationKey(webinarId: string, userId: string, type: string): string {
  return `${webinarId}:${userId}:${type}`;
}

async function fetchWebinarsInWindow(minHoursAhead: number, maxHoursAhead: number) {
  const now = new Date();
  const minTime = new Date(now.getTime() + minHoursAhead * 60 * 60 * 1000);
  const maxTime = new Date(now.getTime() + maxHoursAhead * 60 * 60 * 1000);

  return prisma.webinars.findMany({
    where: {
      status: 'PUBLISHED',
      scheduled_at: {
        gte: minTime,
        lte: maxTime,
      },
    },
    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
      enrollments: {
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      },
    },
  });
}

async function sendNotificationsForWebinars(
  webinars: any[],
  type: '24hr' | '6hr' | '30min' | 'live',
  sendFn: (data: any) => Promise<void>
) {
  for (const webinar of webinars) {
    const { date, day, time } = formatWebinarDate(
      webinar.scheduled_at,
      webinar.timezone || 'Asia/Kolkata'
    );

    for (const enrollment of webinar.enrollments) {
      const key = getNotificationKey(webinar.id, enrollment.user.id, type);
      if (sentNotifications.has(key)) continue;

      const data = {
        joineeName: enrollment.user.name || 'there',
        joineeEmail: enrollment.user.email,
        joineePhone: enrollment.user.phone || undefined,
        webinarName: webinar.title,
        date,
        day,
        time,
        webinarLink: webinar.zoom_join_url || '',
        password: webinar.zoom_password || '',
        hostName: webinar.creator.name || 'Manchly',
      };

      try {
        await sendFn(data);
        sentNotifications.add(key);
        console.log(`✅ ${type} notification sent for webinar "${webinar.title}" to ${enrollment.user.email}`);
      } catch (error) {
        console.error(`❌ Failed ${type} notification for "${webinar.title}" to ${enrollment.user.email}:`, error);
      }
    }
  }
}

// ============ INDIVIDUAL NOTIFICATION RUNNERS ============

async function run24HrNotifications() {
  console.log('🔔 Checking for 24-hour webinar reminders...');
  try {
    // Webinars starting between 23.5 and 24.5 hours from now
    const webinars = await fetchWebinarsInWindow(23.5, 24.5);
    if (webinars.length > 0) {
      console.log(`Found ${webinars.length} webinar(s) for 24hr reminder`);
      await sendNotificationsForWebinars(
        webinars,
        '24hr',
        (data) => notificationService.sendWebinar24HrReminder(data)
      );
    }
  } catch (error) {
    console.error('Error in 24hr notifications:', error);
  }
}

async function run6HrNotifications() {
  console.log('🔔 Checking for 6-hour webinar reminders...');
  try {
    // Webinars starting between 5.5 and 6.5 hours from now
    const webinars = await fetchWebinarsInWindow(5.5, 6.5);
    if (webinars.length > 0) {
      console.log(`Found ${webinars.length} webinar(s) for 6hr reminder`);
      await sendNotificationsForWebinars(
        webinars,
        '6hr',
        (data) => notificationService.sendWebinar6HrReminder(data)
      );
    }
  } catch (error) {
    console.error('Error in 6hr notifications:', error);
  }
}

async function run30MinNotifications() {
  console.log('🔔 Checking for 30-minute webinar reminders...');
  try {
    // Webinars starting between 25 and 35 minutes from now
    const now = new Date();
    const minTime = new Date(now.getTime() + 25 * 60 * 1000);
    const maxTime = new Date(now.getTime() + 35 * 60 * 1000);

    const webinars = await prisma.webinars.findMany({
      where: {
        status: 'PUBLISHED',
        scheduled_at: { gte: minTime, lte: maxTime },
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        enrollments: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });

    if (webinars.length > 0) {
      console.log(`Found ${webinars.length} webinar(s) for 30min reminder`);
      await sendNotificationsForWebinars(
        webinars,
        '30min',
        (data) => notificationService.sendWebinar30MinReminder(data)
      );
    }
  } catch (error) {
    console.error('Error in 30min notifications:', error);
  }
}

async function runLiveNotifications() {
  console.log('🔔 Checking for live webinar notifications...');
  try {
    // Webinars that started within the last 5 minutes
    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const webinars = await prisma.webinars.findMany({
      where: {
        status: 'PUBLISHED',
        scheduled_at: { gte: fiveMinAgo, lte: now },
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        enrollments: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });

    if (webinars.length > 0) {
      console.log(`Found ${webinars.length} webinar(s) going live`);
      await sendNotificationsForWebinars(
        webinars,
        'live',
        (data) => notificationService.sendWebinarLiveNotification(data)
      );
    }
  } catch (error) {
    console.error('Error in live notifications:', error);
  }
}

// ============ CRON SERVICE ============

export class WebinarNotificationCronService {
  private jobs: any[] = [];

  /**
   * Start all notification cron jobs
   */
  startAll(): void {
    console.log('🔔 Starting webinar notification cron jobs...');

    // Run every 30 minutes for 24hr and 6hr checks
    this.jobs.push(
      cron.schedule('*/30 * * * *', async () => {
        await run24HrNotifications();
        await run6HrNotifications();
      })
    );

    // Run every 5 minutes for 30min and live checks
    this.jobs.push(
      cron.schedule('*/5 * * * *', async () => {
        await run30MinNotifications();
        await runLiveNotifications();
      })
    );

    // Clean up old sent notification keys daily at midnight
    this.jobs.push(
      cron.schedule('0 0 * * *', () => {
        console.log('🧹 Clearing sent notification cache');
        sentNotifications.clear();
      })
    );

    console.log('✅ Webinar notification cron jobs started');
    console.log('   - 24hr & 6hr checks: every 30 minutes');
    console.log('   - 30min & live checks: every 5 minutes');
  }

  /**
   * Stop all cron jobs
   */
  stopAll(): void {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    console.log('🛑 Webinar notification cron jobs stopped');
  }
}

export const webinarNotificationCronService = new WebinarNotificationCronService();

export default webinarNotificationCronService;
