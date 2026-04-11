import prisma from "../prismaClient";
import { CashfreePayout } from "./cashfreeService";
import dotenv from "dotenv";

dotenv.config();

// Settlement configuration
const PLATFORM_FEE_PERCENT = 10; // 10% platform commission
const GST_ON_PLATFORM_FEE_PERCENT = 18; // 18% GST on platform fee
const TDS_PERCENT = 1; // 1% TDS (u/s 194O for e-commerce)
const SETTLEMENT_DELAY_DAYS = 1; // T+1

export class SettlementService {
  /**
   * Calculate deductions and net amount for a transaction
   */
  static calculateDeductions(grossAmount: number) {
    const platformFee = (grossAmount * PLATFORM_FEE_PERCENT) / 100;
    const gstOnPlatformFee = (platformFee * GST_ON_PLATFORM_FEE_PERCENT) / 100;
    const tdsAmount = (grossAmount * TDS_PERCENT) / 100;
    const totalDeductions = platformFee + gstOnPlatformFee + tdsAmount;
    const netAmount = grossAmount - totalDeductions;

    return {
      grossAmount: parseFloat(grossAmount.toFixed(2)),
      platformFee: parseFloat(platformFee.toFixed(2)),
      gstOnPlatformFee: parseFloat(gstOnPlatformFee.toFixed(2)),
      tdsAmount: parseFloat(tdsAmount.toFixed(2)),
      totalDeductions: parseFloat(totalDeductions.toFixed(2)),
      netAmount: parseFloat(netAmount.toFixed(2)),
    };
  }

  /**
   * Calculate T+1 settlement ETA from now (skipping weekends)
   */
  static getSettlementETA(): Date {
    const eta = new Date();
    let businessDays = 0;
    while (businessDays < SETTLEMENT_DELAY_DAYS) {
      eta.setDate(eta.getDate() + 1);
      const day = eta.getDay();
      if (day !== 0 && day !== 6) {
        businessDays++;
      }
    }
    eta.setHours(7, 0, 0, 0); // 7 AM IST payout time
    return eta;
  }

  /**
   * Credit creator's wallet after a successful payment
   */
  static async creditCreatorWallet(params: {
    creatorId: string;
    grossAmount: number;
    transactionType: "COURSE" | "WEBINAR";
    transactionId: string;
    courseId?: string;
    webinarId?: string;
    itemTitle: string;
  }) {
    const deductions = this.calculateDeductions(params.grossAmount);
    const settlementEta = this.getSettlementETA();

    try {
      await prisma.wallet_transactions.create({
        data: {
          creator_id: params.creatorId,
          type: "CREDIT",
          amount: deductions.grossAmount,
          net_amount: deductions.netAmount,
          platform_fee: deductions.platformFee,
          gst_on_platform_fee: deductions.gstOnPlatformFee,
          tds_amount: deductions.tdsAmount,
          status: "PENDING_SETTLEMENT",
          title: `Payment received - ${params.itemTitle}`,
          description: `Money will be settled to your bank account by ${settlementEta.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} (T+1 settlement)`,
          transaction_type: params.transactionType,
          transaction_id: params.transactionId,
          course_id: params.courseId || null,
          webinar_id: params.webinarId || null,
          settlement_eta: settlementEta,
        },
      });
      console.log(`Wallet credited for creator ${params.creatorId}: +${deductions.netAmount} (gross: ${deductions.grossAmount})`);
    } catch (err: any) {
      // Ignore duplicate - wallet already credited for this transaction
      if (err.code === "P2002") {
        console.log(`Wallet already credited for ${params.transactionType} ${params.transactionId}`);
        return;
      }
      console.error("Error crediting creator wallet:", err);
    }
  }

  /**
   * Get the cutoff date for T+1 settlement
   * Returns the date that is T+1 business days ago
   */
  static getSettlementCutoffDate(): Date {
    const now = new Date();
    let businessDays = 0;
    const cutoff = new Date(now);

    while (businessDays < SETTLEMENT_DELAY_DAYS) {
      cutoff.setDate(cutoff.getDate() - 1);
      const day = cutoff.getDay();
      // Skip weekends (0 = Sunday, 6 = Saturday)
      if (day !== 0 && day !== 6) {
        businessDays++;
      }
    }

    // Set to end of that day
    cutoff.setHours(23, 59, 59, 999);
    return cutoff;
  }

  /**
   * Find all unsettled SUCCESS transactions completed on or before cutoff date
   */
  static async getUnsettledTransactions(cutoffDate: Date) {
    // Get already settled transaction IDs to exclude them
    const settledCourseItems = await prisma.settlement_items.findMany({
      where: { transaction_type: "COURSE" },
      select: { transaction_id: true },
    });
    const settledWebinarItems = await prisma.settlement_items.findMany({
      where: { transaction_type: "WEBINAR" },
      select: { transaction_id: true },
    });

    const settledCourseIds = settledCourseItems.map((i) => i.transaction_id);
    const settledWebinarIds = settledWebinarItems.map((i) => i.transaction_id);

    // Fetch unsettled course transactions (both RAZORPAY and CASHFREE)
    const courseTransactions = await prisma.transactions.findMany({
      where: {
        status: "SUCCESS",
        payment_method: { in: ["CASHFREE", "RAZORPAY"] },
        completed_at: { lte: cutoffDate },
        id: { notIn: settledCourseIds.length > 0 ? settledCourseIds : undefined },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            creator_id: true,
            price: true,
          },
        },
      },
    });

    // Fetch unsettled webinar transactions (both RAZORPAY and CASHFREE)
    const webinarTransactions = await prisma.webinar_transactions.findMany({
      where: {
        status: "SUCCESS",
        payment_method: { in: ["CASHFREE", "RAZORPAY"] },
        completed_at: { lte: cutoffDate },
        id: { notIn: settledWebinarIds.length > 0 ? settledWebinarIds : undefined },
      },
      include: {
        webinar: {
          select: {
            id: true,
            title: true,
            creator_id: true,
            price: true,
          },
        },
      },
    });

    return { courseTransactions, webinarTransactions };
  }

  /**
   * Group transactions by creator and create settlement records
   */
  static async processSettlements() {
    const cutoffDate = this.getSettlementCutoffDate();
    console.log(`Processing settlements for transactions completed on or before: ${cutoffDate.toISOString()}`);

    const { courseTransactions, webinarTransactions } = await this.getUnsettledTransactions(cutoffDate);

    if (courseTransactions.length === 0 && webinarTransactions.length === 0) {
      console.log("No unsettled transactions found.");
      return { settlementsCreated: 0 };
    }

    // Group by creator
    const creatorMap = new Map<
      string,
      Array<{
        type: "COURSE" | "WEBINAR";
        transactionId: string;
        courseId?: string;
        webinarId?: string;
        amount: number;
      }>
    >();

    for (const tx of courseTransactions) {
      const creatorId = tx.course.creator_id;
      if (!creatorMap.has(creatorId)) creatorMap.set(creatorId, []);
      creatorMap.get(creatorId)!.push({
        type: "COURSE",
        transactionId: tx.id,
        courseId: tx.course.id,
        amount: tx.course.price, // Use base price (before GST charged to user)
      });
    }

    for (const tx of webinarTransactions) {
      const creatorId = tx.webinar.creator_id;
      if (!creatorMap.has(creatorId)) creatorMap.set(creatorId, []);
      creatorMap.get(creatorId)!.push({
        type: "WEBINAR",
        transactionId: tx.id,
        webinarId: tx.webinar.id,
        amount: tx.webinar.price, // Use base price
      });
    }

    let settlementsCreated = 0;

    for (const [creatorId, transactions] of creatorMap) {
      try {
        // Calculate totals for this creator
        let totalGross = 0;
        let totalPlatformFee = 0;
        let totalGst = 0;
        let totalTds = 0;
        let totalNet = 0;

        const itemsData = transactions.map((tx) => {
          const deductions = this.calculateDeductions(tx.amount);
          totalGross += deductions.grossAmount;
          totalPlatformFee += deductions.platformFee;
          totalGst += deductions.gstOnPlatformFee;
          totalTds += deductions.tdsAmount;
          totalNet += deductions.netAmount;

          return {
            transaction_type: tx.type,
            transaction_id: tx.transactionId,
            course_id: tx.courseId || null,
            webinar_id: tx.webinarId || null,
            gross_amount: deductions.grossAmount,
            platform_fee: deductions.platformFee,
            gst_on_platform_fee: deductions.gstOnPlatformFee,
            tds_amount: deductions.tdsAmount,
            net_amount: deductions.netAmount,
          };
        });

        // Create settlement with items in a transaction
        await prisma.settlements.create({
          data: {
            creator_id: creatorId,
            total_gross_amount: parseFloat(totalGross.toFixed(2)),
            platform_fee: parseFloat(totalPlatformFee.toFixed(2)),
            gst_on_platform_fee: parseFloat(totalGst.toFixed(2)),
            tds_amount: parseFloat(totalTds.toFixed(2)),
            net_amount: parseFloat(totalNet.toFixed(2)),
            status: "PENDING",
            settlement_date: new Date(),
            payout_status: "PENDING",
            items: {
              create: itemsData,
            },
          },
        });

        settlementsCreated++;
        console.log(
          `Settlement created for creator ${creatorId}: ${transactions.length} transactions, net amount: ${totalNet.toFixed(2)}`
        );
      } catch (err) {
        console.error(`Error creating settlement for creator ${creatorId}:`, err);
      }
    }

    return { settlementsCreated, totalTransactions: courseTransactions.length + webinarTransactions.length };
  }

  /**
   * Register creator as Cashfree Beneficiary for payouts
   */
  static async registerCreatorForPayout(userId: string) {
    const bankAccount = await prisma.creator_bank_accounts.findUnique({
      where: { user_id: userId },
      include: { user: true },
    });

    if (!bankAccount) {
      throw new Error("Creator bank account not found. Please add bank details first.");
    }

    if (!bankAccount.is_verified) {
      throw new Error("Bank account is not verified. Please complete bank verification via KYC.");
    }

    // Create Cashfree Beneficiary if not exists
    let beneficiaryId = bankAccount.cashfree_beneficiary_id;
    if (!beneficiaryId) {
      beneficiaryId = `ben_${userId.replace(/-/g, "").substring(0, 20)}`;

      await CashfreePayout.PayoutCreateBeneficiary({
        beneficiary_id: beneficiaryId,
        beneficiary_name: bankAccount.beneficiary_name,
        beneficiary_phone: bankAccount.user.phone || undefined,
        beneficiary_email: bankAccount.user.email,
        beneficiary_account_number: bankAccount.account_number,
        beneficiary_ifsc: bankAccount.ifsc_code,
      } as any);

      await prisma.creator_bank_accounts.update({
        where: { user_id: userId },
        data: { cashfree_beneficiary_id: beneficiaryId },
      });
    }

    return { beneficiaryId };
  }

  /**
   * Process payout for a single settlement via Cashfree Payouts
   */
  static async processPayout(settlementId: string) {
    const settlement = await prisma.settlements.findUnique({
      where: { id: settlementId },
      include: {
        creator: {
          include: {
            bank_account: true,
          },
        },
      },
    });

    if (!settlement) throw new Error("Settlement not found");
    if (settlement.status === "COMPLETED") throw new Error("Settlement already completed");

    const bankAccount = settlement.creator.bank_account;
    if (!bankAccount) {
      await prisma.settlements.update({
        where: { id: settlementId },
        data: {
          status: "FAILED",
          failure_reason: "Creator has no bank account registered",
        },
      });
      throw new Error("Creator has no bank account. Settlement marked as FAILED.");
    }

    // Ensure Cashfree beneficiary exists
    let beneficiaryId = bankAccount.cashfree_beneficiary_id;
    if (!beneficiaryId) {
      try {
        const result = await this.registerCreatorForPayout(settlement.creator_id);
        beneficiaryId = result.beneficiaryId;
      } catch (err: any) {
        await prisma.settlements.update({
          where: { id: settlementId },
          data: {
            status: "FAILED",
            failure_reason: `Beneficiary setup failed: ${err.message}`,
          },
        });
        throw err;
      }
    }

    if (!beneficiaryId) {
      await prisma.settlements.update({
        where: { id: settlementId },
        data: {
          status: "FAILED",
          failure_reason: "Could not create Cashfree beneficiary",
        },
      });
      throw new Error("Could not create Cashfree beneficiary");
    }

    // Update status to PROCESSING
    await prisma.settlements.update({
      where: { id: settlementId },
      data: { status: "PROCESSING", payout_status: "PROCESSING" },
    });

    try {
      const transferId = `payout_${settlementId.substring(0, 20)}_${Date.now()}`;

      const transfer = await CashfreePayout.PayoutInitiateTransfer({
        transfer_id: transferId,
        transfer_amount: settlement.net_amount,
        transfer_currency: "INR",
        transfer_mode: "imps",
        beneficiary_id: beneficiaryId,
        remarks: `Manchly Settlement ${settlementId.substring(0, 8)}`,
      } as any);

      const transferData = (transfer as any)?.data;

      await prisma.settlements.update({
        where: { id: settlementId },
        data: {
          cashfree_transfer_id: transferId,
          payout_status: "PROCESSING",
          payout_details: transferData || null,
          processed_at: new Date(),
        },
      });

      console.log(`Payout initiated for settlement ${settlementId}: ${transferId}`);
      return transferData;
    } catch (err: any) {
      await prisma.settlements.update({
        where: { id: settlementId },
        data: {
          status: "FAILED",
          payout_status: "FAILED",
          failure_reason: err.message || "Payout initiation failed",
          retry_count: { increment: 1 },
        },
      });
      throw err;
    }
  }

  /**
   * Process all pending settlements (called by CRON)
   */
  static async processAllPendingPayouts() {
    const pendingSettlements = await prisma.settlements.findMany({
      where: {
        status: "PENDING",
        payout_status: "PENDING",
      },
      include: {
        creator: {
          include: { bank_account: true },
        },
      },
    });

    console.log(`Found ${pendingSettlements.length} pending settlements to process`);

    let successCount = 0;
    let failCount = 0;

    for (const settlement of pendingSettlements) {
      try {
        // Skip if creator has no bank account
        if (!settlement.creator.bank_account) {
          console.log(`Skipping settlement ${settlement.id}: Creator has no bank account`);
          continue;
        }

        await this.processPayout(settlement.id);
        successCount++;
      } catch (err: any) {
        console.error(`Payout failed for settlement ${settlement.id}:`, err.message);
        failCount++;
      }
    }

    return { total: pendingSettlements.length, success: successCount, failed: failCount };
  }

  /**
   * Handle Cashfree payout webhook to update settlement status
   */
  static async handlePayoutWebhook(event: string, data: any) {
    const transferId = data?.transfer?.transfer_id;
    if (!transferId) return;

    const settlement = await prisma.settlements.findUnique({
      where: { cashfree_transfer_id: transferId },
      include: { items: true },
    });

    if (!settlement) {
      console.error(`Settlement not found for transfer ${transferId}`);
      return;
    }

    // Helper to update wallet entries for this settlement's items
    const updateWalletStatus = async (status: "SETTLED" | "FAILED") => {
      for (const item of settlement.items) {
        await prisma.wallet_transactions.updateMany({
          where: {
            transaction_type: item.transaction_type,
            transaction_id: item.transaction_id,
          },
          data: {
            status,
            settlement_id: settlement.id,
          },
        });
      }
    };

    switch (event) {
      case "TRANSFER_SUCCESS":
        await prisma.settlements.update({
          where: { id: settlement.id },
          data: {
            status: "COMPLETED",
            payout_status: "COMPLETED",
            processed_at: new Date(),
            payout_details: data,
          },
        });
        await updateWalletStatus("SETTLED");
        console.log(`Settlement ${settlement.id} completed successfully`);
        break;

      case "TRANSFER_REVERSED":
        await prisma.settlements.update({
          where: { id: settlement.id },
          data: {
            status: "FAILED",
            payout_status: "REVERSED",
            failure_reason: data?.transfer?.status_description || "Payout reversed",
            payout_details: data,
          },
        });
        await updateWalletStatus("FAILED");
        console.log(`Settlement ${settlement.id} payout reversed`);
        break;

      case "TRANSFER_FAILED":
        await prisma.settlements.update({
          where: { id: settlement.id },
          data: {
            status: "FAILED",
            payout_status: "FAILED",
            failure_reason: data?.transfer?.status_description || "Payout failed",
            payout_details: data,
          },
        });
        await updateWalletStatus("FAILED");
        console.log(`Settlement ${settlement.id} payout failed`);
        break;
    }
  }
}
