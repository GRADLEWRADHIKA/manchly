import * as cron from "node-cron";
import { SettlementService } from "../services/settlementService";

export class SettlementCronService {
  private settlementJob: any | null = null;
  private payoutJob: any | null = null;

  /**
   * Start the T+2 settlement CRON jobs
   *
   * Job 1: Create settlement records from matured transactions (daily at 6 AM IST)
   * Job 2: Process payouts for pending settlements (daily at 7 AM IST)
   */
  startSettlementCron(): void {
    if (this.settlementJob) {
      console.log("Settlement CRON already running");
      return;
    }

    // Job 1: Create settlements daily at 6:00 AM IST (00:30 UTC)
    this.settlementJob = cron.schedule("30 0 * * *", async () => {
      console.log("Running T+2 settlement creation job...");
      try {
        const result = await SettlementService.processSettlements();
        console.log(`Settlement job completed: ${result.settlementsCreated} settlements created`);
      } catch (err) {
        console.error("Settlement creation job failed:", err);
      }
    });

    // Job 2: Process payouts daily at 7:00 AM IST (01:30 UTC)
    this.payoutJob = cron.schedule("30 1 * * *", async () => {
      console.log("Running payout processing job...");
      try {
        const result = await SettlementService.processAllPendingPayouts();
        console.log(`Payout job completed: ${result.success} success, ${result.failed} failed out of ${result.total}`);
      } catch (err) {
        console.error("Payout processing job failed:", err);
      }
    });

    console.log("Settlement CRON jobs started (T+2 at 6 AM IST, Payouts at 7 AM IST)");
  }

  stopSettlementCron(): void {
    if (this.settlementJob) {
      this.settlementJob.stop();
      this.settlementJob = null;
    }
    if (this.payoutJob) {
      this.payoutJob.stop();
      this.payoutJob = null;
    }
    console.log("Settlement CRON jobs stopped");
  }
}

export const settlementCronService = new SettlementCronService();
