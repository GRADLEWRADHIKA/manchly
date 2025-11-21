import prisma from "../prismaClient";
import * as cron from "node-cron";

/**
 * Webinar Cleanup Utility
 * 
 * This utility handles:
 * 1. Automatic removal of expired webinars
 * 2. Updating webinar status to COMPLETED after scheduled time
 * 3. Cleaning up old completed webinars (optional)
 */

export class WebinarCleanupService {
  private cleanupJob: any | null = null;

  /**
   * Remove expired webinars
   * Removes webinars that have passed their scheduled time + duration
   */
  async removeExpiredWebinars(): Promise<{ removed: number; updated: number }> {
    try {
      const now = new Date();
      
      // Find webinars that have ended (scheduled_at + duration has passed)
      const expiredWebinars = await prisma.webinars.findMany({
        where: {
          scheduled_at: {
            lt: now
          },
          status: {
            in: ['PUBLISHED', 'DRAFT']
          }
        },
        select: {
          id: true,
          scheduled_at: true,
          duration: true,
          status: true
        }
      });

      let removedCount = 0;
      let updatedCount = 0;

      for (const webinar of expiredWebinars) {
        const scheduledTime = new Date(webinar.scheduled_at);
        const durationMs = (webinar.duration || 60) * 60 * 1000; // Convert minutes to milliseconds
        const endTime = new Date(scheduledTime.getTime() + durationMs);

        // Check if webinar has ended
        if (endTime < now) {
          // Option 1: Delete the webinar (uncomment if you want to delete)
          // await prisma.webinars.delete({
          //   where: { id: webinar.id }
          // });
          // removedCount++;

          // Option 2: Mark as COMPLETED (recommended - keeps history)
          await prisma.webinars.update({
            where: { id: webinar.id },
            data: { status: 'COMPLETED' }
          });
          updatedCount++;

          console.log(`✅ Webinar ${webinar.id} marked as COMPLETED`);
        }
      }

      console.log(`🧹 Cleanup complete: ${updatedCount} webinars marked as completed, ${removedCount} removed`);
      
      return { removed: removedCount, updated: updatedCount };
    } catch (error) {
      console.error('Error in webinar cleanup:', error);
      throw error;
    }
  }

  /**
   * Delete old completed webinars
   * Removes completed webinars older than specified days
   */
  async deleteOldCompletedWebinars(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.webinars.deleteMany({
        where: {
          status: 'COMPLETED',
          scheduled_at: {
            lt: cutoffDate
          }
        }
      });

      console.log(`🗑️ Deleted ${result.count} old completed webinars`);
      return result.count;
    } catch (error) {
      console.error('Error deleting old webinars:', error);
      throw error;
    }
  }

  /**
   * Archive expired webinars instead of deleting
   * Changes status to ARCHIVED for webinars that have passed
   */
  async archiveExpiredWebinars(): Promise<number> {
    try {
      const now = new Date();

      const result = await prisma.webinars.updateMany({
        where: {
          scheduled_at: {
            lt: now
          },
          status: {
            in: ['PUBLISHED']
          }
        },
        data: {
          status: 'COMPLETED'
        }
      });

      console.log(`📦 Archived ${result.count} expired webinars`);
      return result.count;
    } catch (error) {
      console.error('Error archiving webinars:', error);
      throw error;
    }
  }

  /**
   * Get upcoming webinars that will expire soon
   * Useful for sending reminders
   */
  async getUpcomingWebinars(hoursAhead: number = 24): Promise<any[]> {
    try {
      const now = new Date();
      const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

      const webinars = await prisma.webinars.findMany({
        where: {
          scheduled_at: {
            gte: now,
            lte: futureTime
          },
          status: 'PUBLISHED'
        },
        include: {
          enrollments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        }
      });

      return webinars;
    } catch (error) {
      console.error('Error fetching upcoming webinars:', error);
      throw error;
    }
  }

  // Start automatic cleanup scheduler
  // Runs cleanup task at specified intervals
  // Cron expression examples:
  // - "0 * * * *" = Every hour
  // - "0 0 * * *" = Every day at midnight  
  // - "*/30 * * * *" = Every 30 minutes
  startAutomaticCleanup(cronExpression: string = "0 * * * *"): void {
    if (this.cleanupJob) {
      console.log('⚠️ Cleanup job already running');
      return;
    }

    console.log(`🚀 Starting automatic webinar cleanup with schedule: ${cronExpression}`);

    this.cleanupJob = cron.schedule(cronExpression, async () => {
      console.log('🧹 Running scheduled webinar cleanup...');
      try {
        await this.removeExpiredWebinars();
      } catch (error) {
        console.error('Error in scheduled cleanup:', error);
      }
    });

    // Run cleanup immediately on start
    this.removeExpiredWebinars().catch(err => {
      console.error('Error in initial cleanup:', err);
    });
  }

  /**
   * Stop automatic cleanup scheduler
   */
  stopAutomaticCleanup(): void {
    if (this.cleanupJob) {
      this.cleanupJob.stop();
      this.cleanupJob = null;
      console.log('🛑 Automatic webinar cleanup stopped');
    }
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats(): Promise<{
    total_webinars: number;
    published: number;
    completed: number;
    expired_pending_cleanup: number;
  }> {
    try {
      const now = new Date();

      const [total, published, completed, expired] = await Promise.all([
        prisma.webinars.count(),
        prisma.webinars.count({ where: { status: 'PUBLISHED' } }),
        prisma.webinars.count({ where: { status: 'COMPLETED' } }),
        prisma.webinars.count({
          where: {
            scheduled_at: { lt: now },
            status: { in: ['PUBLISHED', 'DRAFT'] }
          }
        })
      ]);

      return {
        total_webinars: total,
        published,
        completed,
        expired_pending_cleanup: expired
      };
    } catch (error) {
      console.error('Error getting cleanup stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const webinarCleanupService = new WebinarCleanupService();

/**
 * USAGE EXAMPLES:
 * 
 * 1. Manual cleanup:
 *    import { webinarCleanupService } from './utils/webinarCleanup';
 *    await webinarCleanupService.removeExpiredWebinars();
 * 
 * 2. Automatic cleanup (in your main app file):
 *    import { webinarCleanupService } from './utils/webinarCleanup';
 *    webinarCleanupService.startAutomaticCleanup("0 * * * *"); // Every hour
 * 
 * 3. Delete old webinars:
 *    await webinarCleanupService.deleteOldCompletedWebinars(30); // 30 days old
 * 
 * 4. Get stats:
 *    const stats = await webinarCleanupService.getCleanupStats();
 */

export default webinarCleanupService;

