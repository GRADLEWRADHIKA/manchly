import prisma from "../prismaClient";
import { CashfreePayout } from "./cashfreeService";
import { NotificationController } from "../controllers/notificationController";
import dotenv from "dotenv";

dotenv.config();

// Settlement configuration
const PLATFORM_FEE_PERCENT = 10; // 10% platform commission
const GST_ON_PLATFORM_FEE_PERCENT = 18; // 18% GST on platform fee
const TDS_PERCENT = 1; // 1% TDS (u/s 194O for e-commerce)

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
   * Credit creator's wallet after a successful payment.
   * Money stays in wallet until creator requests withdrawal.
   */
  static async creditCreatorWallet(params: {
    creatorId: string;
    grossAmount: number;
    transactionType: "COURSE" | "WEBINAR" | "SESSION";
    transactionId: string;
    courseId?: string;
    webinarId?: string;
    itemTitle: string;
  }) {
    const deductions = this.calculateDeductions(params.grossAmount);

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
          description: `Available for withdrawal`,
          transaction_type: params.transactionType,
          transaction_id: params.transactionId,
          course_id: params.courseId || null,
          webinar_id: params.webinarId || null,
          settlement_eta: null,
        },
      });
      console.log(`Wallet credited for creator ${params.creatorId}: +${deductions.netAmount} (gross: ${deductions.grossAmount})`);
    } catch (err: any) {
      if (err.code === "P2002") {
        console.log(`Wallet already credited for ${params.transactionType} ${params.transactionId}`);
        return;
      }
      console.error("Error crediting creator wallet:", err);
    }
  }

  /**
   * Get creator's available wallet balance (net amount available for withdrawal)
   */
  static async getAvailableBalance(creatorId: string): Promise<number> {
    const result = await prisma.wallet_transactions.aggregate({
      where: {
        creator_id: creatorId,
        status: "PENDING_SETTLEMENT",
      },
      _sum: { net_amount: true },
    });
    return result._sum.net_amount || 0;
  }

  /**
   * Creator requests withdrawal — instantly pay out to their bank account
   */
  static async requestWithdrawal(creatorId: string, amount?: number) {
    // Get available balance
    const availableBalance = await this.getAvailableBalance(creatorId);

    if (availableBalance <= 0) {
      throw new Error("No funds available for withdrawal");
    }

    // If no amount specified, withdraw everything
    const withdrawAmount = amount ? Math.min(amount, availableBalance) : availableBalance;

    if (withdrawAmount <= 0) {
      throw new Error("Invalid withdrawal amount");
    }

    // Check creator has a verified bank account
    const bankAccount = await prisma.creator_bank_accounts.findUnique({
      where: { user_id: creatorId },
    });

    if (!bankAccount) {
      throw new Error("Please add your bank account details first");
    }

    if (!bankAccount.is_verified) {
      throw new Error("Your bank account is not verified yet. Please complete KYC first.");
    }

    // Get all unsettled wallet transactions for this creator
    const unsettledWalletTxns = await prisma.wallet_transactions.findMany({
      where: {
        creator_id: creatorId,
        status: "PENDING_SETTLEMENT",
        settlement_id: null,
      },
      orderBy: { created_at: "asc" },
    });

    // Collect transactions up to the withdrawal amount
    let runningTotal = 0;
    const txnsToSettle: typeof unsettledWalletTxns = [];
    for (const wt of unsettledWalletTxns) {
      if (runningTotal >= withdrawAmount) break;
      txnsToSettle.push(wt);
      runningTotal += wt.net_amount;
    }

    if (txnsToSettle.length === 0) {
      throw new Error("No transactions available for withdrawal");
    }

    // Calculate totals
    let totalGross = 0;
    let totalPlatformFee = 0;
    let totalGst = 0;
    let totalTds = 0;
    let totalNet = 0;

    const itemsData = txnsToSettle.map((wt) => {
      totalGross += wt.amount;
      totalPlatformFee += wt.platform_fee;
      totalGst += wt.gst_on_platform_fee;
      totalTds += wt.tds_amount;
      totalNet += wt.net_amount;

      return {
        transaction_type: wt.transaction_type,
        transaction_id: wt.transaction_id,
        course_id: wt.course_id || null,
        webinar_id: wt.webinar_id || null,
        gross_amount: wt.amount,
        platform_fee: wt.platform_fee,
        gst_on_platform_fee: wt.gst_on_platform_fee,
        tds_amount: wt.tds_amount,
        net_amount: wt.net_amount,
      };
    });

    // Create settlement record
    const settlement = await prisma.settlements.create({
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

    console.log(`Withdrawal settlement created: ${settlement.id}, net: ${totalNet.toFixed(2)}`);

    // Trigger instant payout
    await this.processPayout(settlement.id);

    return {
      settlementId: settlement.id,
      amount: parseFloat(totalNet.toFixed(2)),
      transactionsCount: txnsToSettle.length,
    };
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
   * Process all pending settlements — fallback for failed withdrawals (called by CRON)
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

        // Notify creator about successful payout
        NotificationController.createNotification({
          userId: settlement.creator_id,
          type: "SALE",
          title: "Payout Processed",
          message: `Rs. ${settlement.net_amount.toFixed(0)} has been transferred to your bank account.`,
          data: { settlementId: settlement.id },
        }).catch(err => console.error("Notification error:", err));

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
