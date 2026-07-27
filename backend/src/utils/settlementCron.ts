import * as cron from "node-cron";
import { SettlementService } from "../services/settlementService";

export class SettlementCronService {
  private payoutRetryJob: any | null = null;

  /**
   * Start cron job to retry any failed/pending payouts (daily at 7 AM IST)
   * This is a safety net — normal withdrawals are instant and creator-initiated.
   */
  startSettlementCron(): void {
    if (this.payoutRetryJob) {
      console.log("Payout retry CRON already running");
      return;
    }

    // Retry failed/pending payouts daily at 7:00 AM IST (01:30 UTC)
    this.payoutRetryJob = cron.schedule("30 1 * * *", async () => {
      console.log("Running payout retry job...");
      try {
        const result = await SettlementService.processAllPendingPayouts();
        console.log(`Payout retry job completed: ${result.success} success, ${result.failed} failed out of ${result.total}`);
      } catch (err) {
        console.error("Payout retry job failed:", err);
      }
    });

    console.log("Payout retry CRON started (daily at 7 AM IST)");
  }

  stopSettlementCron(): void {
    if (this.payoutRetryJob) {
      this.payoutRetryJob.stop();
      this.payoutRetryJob = null;
    }
    console.log("Payout retry CRON stopped");
  }
}

export const settlementCronService = new SettlementCronService();
