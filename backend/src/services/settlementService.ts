import prisma from "../prismaClient";
import dotenv from "dotenv";

dotenv.config();

const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * Direct Razorpay API call helper for endpoints not available in the SDK
 * (contacts, payouts are missing from razorpay SDK v2.9.x)
 */
async function razorpayApi(endpoint: string, body: any) {
  const auth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString("base64");

  const response = await fetch(`https://api.razorpay.com/v1${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as any)?.error?.description || `Razorpay API error: ${response.status}`
    );
  }

  return response.json();
}

// Settlement configuration
const PLATFORM_FEE_PERCENT = 10; // 10% platform commission
const GST_ON_PLATFORM_FEE_PERCENT = 18; // 18% GST on platform fee
const TDS_PERCENT = 1; // 1% TDS (u/s 194O for e-commerce)
const SETTLEMENT_DELAY_DAYS = 2; // T+2

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
   * Calculate T+2 settlement ETA from now (skipping weekends)
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
          description: `Money will be settled to your bank account by ${settlementEta.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} (T+2 settlement)`,
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
   * Get the cutoff date for T+2 settlement
   * Returns the date that is T+2 business days ago
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

    // Fetch unsettled course transactions
    const courseTransactions = await prisma.transactions.findMany({
      where: {
        status: "SUCCESS",
        payment_method: "RAZORPAY",
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

    // Fetch unsettled webinar transactions
    const webinarTransactions = await prisma.webinar_transactions.findMany({
      where: {
        status: "SUCCESS",
        payment_method: "RAZORPAY",
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
   * Register creator as Razorpay Contact and create Fund Account
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

    // Create Razorpay Contact if not exists
    let contactId = bankAccount.razorpay_contact_id;
    if (!contactId) {
      const contact = await razorpayApi("/contacts", {
        name: bankAccount.beneficiary_name,
        email: bankAccount.user.email,
        contact: bankAccount.user.phone,
        type: "vendor",
        notes: { user_id: userId },
      });
      contactId = contact.id;

      if (contactId) {
        await prisma.creator_bank_accounts.update({
          where: { user_id: userId },
          data: { razorpay_contact_id: contactId },
        });
      }
    }

    // Create Razorpay Fund Account if not exists
    let fundAccountId = bankAccount.razorpay_fund_account_id;
    if (!fundAccountId && contactId) {
      const fundAccount = await razorpay.fundAccount.create({
        contact_id: contactId,
        account_type: "bank_account",
        bank_account: {
          name: bankAccount.beneficiary_name,
          ifsc: bankAccount.ifsc_code,
          account_number: bankAccount.account_number,
        },
      });
      fundAccountId = fundAccount?.id;

      if (fundAccountId) {
        await prisma.creator_bank_accounts.update({
          where: { user_id: userId },
          data: { razorpay_fund_account_id: fundAccountId },
        });
      }
    }

    return { contactId, fundAccountId };
  }

  /**
   * Process payout for a single settlement via RazorpayX
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

    // Ensure Razorpay fund account exists
    let fundAccountId = bankAccount.razorpay_fund_account_id;
    if (!fundAccountId) {
      try {
        const result = await this.registerCreatorForPayout(settlement.creator_id);
        fundAccountId = result.fundAccountId;
      } catch (err: any) {
        await prisma.settlements.update({
          where: { id: settlementId },
          data: {
            status: "FAILED",
            failure_reason: `Fund account setup failed: ${err.message}`,
          },
        });
        throw err;
      }
    }

    if (!fundAccountId) {
      await prisma.settlements.update({
        where: { id: settlementId },
        data: {
          status: "FAILED",
          failure_reason: "Could not create Razorpay fund account",
        },
      });
      throw new Error("Could not create Razorpay fund account");
    }

    // Update status to PROCESSING
    await prisma.settlements.update({
      where: { id: settlementId },
      data: { status: "PROCESSING", payout_status: "PROCESSING" },
    });

    try {
      const amountInPaise = Math.round(settlement.net_amount * 100);

      const payout = await razorpayApi("/payouts", {
        account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
        fund_account_id: fundAccountId,
        amount: amountInPaise,
        currency: "INR",
        mode: "IMPS",
        purpose: "payout",
        queue_if_low_balance: true,
        reference_id: settlementId,
        narration: `Manchly Settlement ${settlementId.substring(0, 8)}`,
        notes: {
          settlement_id: settlementId,
          creator_id: settlement.creator_id,
        },
      });

      await prisma.settlements.update({
        where: { id: settlementId },
        data: {
          razorpay_payout_id: payout?.id,
          payout_status: "PROCESSING",
          payout_details: payout,
          processed_at: new Date(),
        },
      });

      console.log(`Payout initiated for settlement ${settlementId}: ${payout?.id}`);
      return payout;
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
   * Handle Razorpay payout webhook to update settlement status
   */
  static async handlePayoutWebhook(event: string, payload: any) {
    const payoutId = payload?.payout?.entity?.id;
    if (!payoutId) return;

    const settlement = await prisma.settlements.findUnique({
      where: { razorpay_payout_id: payoutId },
      include: { items: true },
    });

    if (!settlement) {
      console.error(`Settlement not found for payout ${payoutId}`);
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
      case "payout.processed":
        await prisma.settlements.update({
          where: { id: settlement.id },
          data: {
            status: "COMPLETED",
            payout_status: "COMPLETED",
            processed_at: new Date(),
            payout_details: payload.payout.entity,
          },
        });
        await updateWalletStatus("SETTLED");
        console.log(`Settlement ${settlement.id} completed successfully`);
        break;

      case "payout.reversed":
        await prisma.settlements.update({
          where: { id: settlement.id },
          data: {
            status: "FAILED",
            payout_status: "REVERSED",
            failure_reason: payload.payout.entity?.failure_reason || "Payout reversed",
            payout_details: payload.payout.entity,
          },
        });
        await updateWalletStatus("FAILED");
        console.log(`Settlement ${settlement.id} payout reversed`);
        break;

      case "payout.failed":
        await prisma.settlements.update({
          where: { id: settlement.id },
          data: {
            status: "FAILED",
            payout_status: "FAILED",
            failure_reason: payload.payout.entity?.failure_reason || "Payout failed",
            payout_details: payload.payout.entity,
          },
        });
        await updateWalletStatus("FAILED");
        console.log(`Settlement ${settlement.id} payout failed`);
        break;
    }
  }
}
