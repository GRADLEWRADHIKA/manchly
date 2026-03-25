import { Request, Response } from "express";
import prisma from "../prismaClient";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import { isCreator, isAdmin } from "../utils/userTypeHelper";
import { SettlementService } from "../services/settlementService";

export class SettlementController {
  /**
   * Creator: Add/update bank account details
   */
  static async addBankAccount(req: any, res: Response) {
    const userId = req.user.userId;
    const { account_number, ifsc_code, beneficiary_name, bank_name, account_type } = req.body;

    if (!account_number || !ifsc_code || !beneficiary_name) {
      return ApiResponseHandler.customError(res, "account_number, ifsc_code, and beneficiary_name are required", 400, "MISSING_FIELDS");
    }

    // Validate IFSC format
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifsc_code)) {
      return ApiResponseHandler.customError(res, "Invalid IFSC code format", 400, "INVALID_IFSC");
    }

    // Validate account number
    if (account_number.length < 8 || account_number.length > 18) {
      return ApiResponseHandler.customError(res, "Account number must be between 8-18 digits", 400, "INVALID_ACCOUNT_NUMBER");
    }

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });
      if (!user || !isCreator(user.user_type)) {
        return ApiResponseHandler.customError(res, "Only creators can add bank accounts", 403, "FORBIDDEN");
      }

      const bankAccount = await prisma.creator_bank_accounts.upsert({
        where: { user_id: userId },
        update: {
          account_number,
          ifsc_code: ifsc_code.toUpperCase(),
          beneficiary_name,
          bank_name: bank_name || null,
          account_type: account_type || "savings",
          is_verified: false,
          // Reset Razorpay IDs since account details changed
          razorpay_fund_account_id: null,
          razorpay_contact_id: null,
        },
        create: {
          user_id: userId,
          account_number,
          ifsc_code: ifsc_code.toUpperCase(),
          beneficiary_name,
          bank_name: bank_name || null,
          account_type: account_type || "savings",
          is_verified: false,
        },
      });

      ApiResponseHandler.success(res, { bankAccount }, "Bank account saved successfully", 201);
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Creator: Get bank account details
   */
  static async getBankAccount(req: any, res: Response) {
    const userId = req.user.userId;

    try {
      const bankAccount = await prisma.creator_bank_accounts.findUnique({
        where: { user_id: userId },
      });

      if (!bankAccount) {
        return ApiResponseHandler.customError(res, "No bank account found. Please add your bank details.", 404, "BANK_ACCOUNT_NOT_FOUND");
      }

      // Mask account number for security
      const maskedAccount = {
        ...bankAccount,
        account_number: bankAccount.account_number.replace(/.(?=.{4})/g, "*"),
      };

      ApiResponseHandler.success(res, { bankAccount: maskedAccount }, "Bank account retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Creator: Get wallet overview with pending T+2 entries
   */
  static async getWallet(req: any, res: Response) {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });
      if (!user || !isCreator(user.user_type)) {
        return ApiResponseHandler.customError(res, "Only creators can view wallet", 403, "FORBIDDEN");
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [walletTxns, total] = await Promise.all([
        prisma.wallet_transactions.findMany({
          where: { creator_id: userId },
          skip,
          take: Number(limit),
          orderBy: { created_at: "desc" },
        }),
        prisma.wallet_transactions.count({ where: { creator_id: userId } }),
      ]);

      // Calculate balances
      const [pendingAgg, settledAgg, totalAgg] = await Promise.all([
        prisma.wallet_transactions.aggregate({
          where: { creator_id: userId, status: "PENDING_SETTLEMENT" },
          _sum: { net_amount: true, amount: true },
        }),
        prisma.wallet_transactions.aggregate({
          where: { creator_id: userId, status: "SETTLED" },
          _sum: { net_amount: true },
        }),
        prisma.wallet_transactions.aggregate({
          where: { creator_id: userId },
          _sum: { net_amount: true, amount: true },
        }),
      ]);

      ApiResponseHandler.success(res, {
        wallet: {
          total_earnings: totalAgg._sum.amount || 0,
          total_net_earnings: totalAgg._sum.net_amount || 0,
          pending_settlement: pendingAgg._sum.net_amount || 0,
          settled_amount: settledAgg._sum.net_amount || 0,
          settlement_info: "Money will be submitted to your bank account after T+2 settlement period",
        },
        transactions: walletTxns.map((tx) => ({
          ...tx,
          title: tx.title,
          status_label:
            tx.status === "PENDING_SETTLEMENT"
              ? "Money will be submitted in T+2 settlement"
              : tx.status === "SETTLED"
              ? "Settled to bank account"
              : "Failed",
        })),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          total_pages: Math.ceil(total / Number(limit)),
        },
      }, "Wallet retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Creator: View their settlements
   */
  static async getCreatorSettlements(req: any, res: Response) {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });
      if (!user || !isCreator(user.user_type)) {
        return ApiResponseHandler.customError(res, "Only creators can view settlements", 403, "FORBIDDEN");
      }

      const skip = (Number(page) - 1) * Number(limit);
      const whereClause: any = { creator_id: userId };
      if (status) whereClause.status = status;

      const [settlements, total] = await Promise.all([
        prisma.settlements.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          include: {
            items: {
              select: {
                id: true,
                transaction_type: true,
                course_id: true,
                webinar_id: true,
                gross_amount: true,
                net_amount: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
        }),
        prisma.settlements.count({ where: whereClause }),
      ]);

      // Aggregate totals
      const totals = await prisma.settlements.aggregate({
        where: { creator_id: userId, status: "COMPLETED" },
        _sum: { net_amount: true, total_gross_amount: true },
      });

      const pendingAmount = await prisma.settlements.aggregate({
        where: { creator_id: userId, status: { in: ["PENDING", "PROCESSING"] } },
        _sum: { net_amount: true },
      });

      ApiResponseHandler.success(res, {
        settlements,
        summary: {
          total_earned: totals._sum.total_gross_amount || 0,
          total_settled: totals._sum.net_amount || 0,
          pending_settlement: pendingAmount._sum.net_amount || 0,
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          total_pages: Math.ceil(total / Number(limit)),
        },
      }, "Settlements retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Creator: View settlement detail with line items
   */
  static async getSettlementDetail(req: any, res: Response) {
    const userId = req.user.userId;
    const { settlementId } = req.params;

    try {
      const settlement = await prisma.settlements.findUnique({
        where: { id: settlementId },
        include: {
          items: true,
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      if (!settlement) {
        return ApiResponseHandler.customError(res, "Settlement not found", 404, "SETTLEMENT_NOT_FOUND");
      }

      // Creators can only see their own settlements
      const user = await prisma.users.findUnique({ where: { id: userId } });
      if (settlement.creator_id !== userId && (!user || !isAdmin(user.user_type))) {
        return ApiResponseHandler.customError(res, "Unauthorized", 403, "FORBIDDEN");
      }

      ApiResponseHandler.success(res, { settlement }, "Settlement details retrieved");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Creator: Get settlement breakdown/estimate for unsettled earnings
   */
  static async getEarningsBreakdown(req: any, res: Response) {
    const userId = req.user.userId;

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });
      if (!user || !isCreator(user.user_type)) {
        return ApiResponseHandler.customError(res, "Only creators can view earnings", 403, "FORBIDDEN");
      }

      // Get all settled transaction IDs
      const settledItems = await prisma.settlement_items.findMany({
        select: { transaction_type: true, transaction_id: true },
      });
      const settledCourseIds = settledItems.filter((i) => i.transaction_type === "COURSE").map((i) => i.transaction_id);
      const settledWebinarIds = settledItems.filter((i) => i.transaction_type === "WEBINAR").map((i) => i.transaction_id);

      // Unsettled course revenue
      const unsettledCourses = await prisma.transactions.findMany({
        where: {
          course: { creator_id: userId },
          status: "SUCCESS",
          payment_method: "RAZORPAY",
          id: { notIn: settledCourseIds.length > 0 ? settledCourseIds : undefined },
        },
        include: { course: { select: { price: true, title: true } } },
      });

      // Unsettled webinar revenue
      const unsettledWebinars = await prisma.webinar_transactions.findMany({
        where: {
          webinar: { creator_id: userId },
          status: "SUCCESS",
          payment_method: "RAZORPAY",
          id: { notIn: settledWebinarIds.length > 0 ? settledWebinarIds : undefined },
        },
        include: { webinar: { select: { price: true, title: true } } },
      });

      let totalUnsettledGross = 0;
      const items = [];

      for (const tx of unsettledCourses) {
        const d = SettlementService.calculateDeductions(tx.course.price);
        totalUnsettledGross += tx.course.price;
        items.push({ type: "COURSE", title: tx.course.title, ...d, completed_at: tx.completed_at });
      }

      for (const tx of unsettledWebinars) {
        const d = SettlementService.calculateDeductions(tx.webinar.price);
        totalUnsettledGross += tx.webinar.price;
        items.push({ type: "WEBINAR", title: tx.webinar.title, ...d, completed_at: tx.completed_at });
      }

      const totalDeductions = SettlementService.calculateDeductions(totalUnsettledGross);

      ApiResponseHandler.success(res, {
        unsettled_count: items.length,
        total_gross: totalUnsettledGross,
        estimated_deductions: {
          platform_fee: totalDeductions.platformFee,
          gst_on_platform_fee: totalDeductions.gstOnPlatformFee,
          tds: totalDeductions.tdsAmount,
          total: totalDeductions.totalDeductions,
        },
        estimated_net: totalDeductions.netAmount,
        settlement_delay: "T+2 business days",
        items,
      }, "Earnings breakdown retrieved");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ============ ADMIN ENDPOINTS ============

  /**
   * Admin: View all settlements
   */
  static async adminGetAllSettlements(req: any, res: Response) {
    const userId = req.user.userId;
    const { page = 1, limit = 20, status, creator_id } = req.query;

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });
      if (!user || !isAdmin(user.user_type)) {
        return ApiResponseHandler.customError(res, "Admin access required", 403, "FORBIDDEN");
      }

      const skip = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};
      if (status) whereClause.status = status;
      if (creator_id) whereClause.creator_id = creator_id;

      const [settlements, total] = await Promise.all([
        prisma.settlements.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          include: {
            creator: { select: { id: true, name: true, email: true } },
            _count: { select: { items: true } },
          },
          orderBy: { created_at: "desc" },
        }),
        prisma.settlements.count({ where: whereClause }),
      ]);

      // Summary stats
      const [totalSettled, totalPending] = await Promise.all([
        prisma.settlements.aggregate({ where: { status: "COMPLETED" }, _sum: { net_amount: true } }),
        prisma.settlements.aggregate({ where: { status: { in: ["PENDING", "PROCESSING"] } }, _sum: { net_amount: true } }),
      ]);

      ApiResponseHandler.success(res, {
        settlements,
        summary: {
          total_settled: totalSettled._sum.net_amount || 0,
          total_pending: totalPending._sum.net_amount || 0,
        },
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          total_pages: Math.ceil(total / Number(limit)),
        },
      }, "All settlements retrieved");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Admin: Manually trigger settlement processing
   */
  static async adminTriggerSettlements(req: any, res: Response) {
    const userId = req.user.userId;

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });
      if (!user || !isAdmin(user.user_type)) {
        return ApiResponseHandler.customError(res, "Admin access required", 403, "FORBIDDEN");
      }

      // Step 1: Create settlement records from unsettled transactions
      const created = await SettlementService.processSettlements();

      // Step 2: Process payouts for pending settlements
      const payouts = await SettlementService.processAllPendingPayouts();

      ApiResponseHandler.success(res, {
        settlements_created: created.settlementsCreated,
        transactions_processed: created.totalTransactions || 0,
        payouts,
      }, "Settlement processing triggered");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Admin: Retry a failed settlement
   */
  static async adminRetrySettlement(req: any, res: Response) {
    const userId = req.user.userId;
    const { settlementId } = req.params;

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });
      if (!user || !isAdmin(user.user_type)) {
        return ApiResponseHandler.customError(res, "Admin access required", 403, "FORBIDDEN");
      }

      const settlement = await prisma.settlements.findUnique({ where: { id: settlementId } });
      if (!settlement) {
        return ApiResponseHandler.customError(res, "Settlement not found", 404, "SETTLEMENT_NOT_FOUND");
      }

      if (settlement.status === "COMPLETED") {
        return ApiResponseHandler.customError(res, "Settlement already completed", 400, "ALREADY_COMPLETED");
      }

      if (settlement.retry_count >= 3) {
        return ApiResponseHandler.customError(res, "Max retries reached. Please investigate manually.", 400, "MAX_RETRIES");
      }

      // Reset to pending and retry
      await prisma.settlements.update({
        where: { id: settlementId },
        data: {
          status: "PENDING",
          payout_status: "PENDING",
          failure_reason: null,
          razorpay_payout_id: null,
        },
      });

      const payout = await SettlementService.processPayout(settlementId);

      ApiResponseHandler.success(res, { payout }, "Settlement retry initiated");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Razorpay Payout Webhook Handler
   */
  static async handlePayoutWebhook(req: Request, res: Response) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"] as string;

    try {
      const crypto = require("crypto");
      const generatedSignature = crypto
        .createHmac("sha256", webhookSecret!)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (generatedSignature !== signature) {
        return res.status(400).json({ error: "Invalid webhook signature" });
      }

      const event = req.body.event;
      const payload = req.body.payload;

      if (event.startsWith("payout.")) {
        await SettlementService.handlePayoutWebhook(event, payload);
      }

      res.status(200).json({ status: "ok" });
    } catch (err: any) {
      console.error("Payout webhook error:", err);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }
}
