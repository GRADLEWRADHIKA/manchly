import { Request, Response } from "express";
import prisma from "../prismaClient";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import { isCreator, isAdmin } from "../utils/userTypeHelper";
import { SettlementService } from "../services/settlementService";

export class SettlementController {
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
          cashfree_beneficiary_id: null,
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

  static async getWallet(req: any, res: Response) {
    console.log("===== GET WALLET =====");
    console.log("req.user:", req.user);
    console.log("req.user.userId:", req.user?.userId);
    console.log("req.user.id:", req.user?.id);
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
      const [availableAgg, settledAgg, totalAgg] = await Promise.all([
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
          available_balance: availableAgg._sum.net_amount || 0,
          withdrawn_amount: settledAgg._sum.net_amount || 0,
          settlement_info: "Request a withdrawal to instantly transfer funds to your bank account",
        },
        transactions: walletTxns.map((tx) => ({
          ...tx,
          title: tx.title,
          status_label:
            tx.status === "PENDING_SETTLEMENT"
              ? "Available for withdrawal"
              : tx.status === "SETTLED"
              ? "Withdrawn to bank account"
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

  static async requestWithdrawal(req: any, res: Response) {
    const userId = req.user.userId;
    const { amount } = req.body; // optional — if not provided, withdraw all

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });
      if (!user || !isCreator(user.user_type)) {
        return ApiResponseHandler.customError(res, "Only creators can request withdrawals", 403, "FORBIDDEN");
      }

      const result = await SettlementService.requestWithdrawal(userId, amount ? Number(amount) : undefined);

      ApiResponseHandler.success(res, {
        settlement_id: result.settlementId,
        withdrawal_amount: result.amount,
        transactions_included: result.transactionsCount,
        payout_mode: "IMPS",
        message: "Withdrawal initiated! Money will reach your bank account in ~15 minutes.",
      }, "Withdrawal initiated successfully", 201);

    } catch (err: any) {
      console.error("Withdrawal error:", err.message);
      ApiResponseHandler.customError(res, err.message, 400, "WITHDRAWAL_FAILED");
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
          payment_method: { in: ["RAZORPAY", "CASHFREE"] },
          id: { notIn: settledCourseIds.length > 0 ? settledCourseIds : undefined },
        },
        include: { course: { select: { price: true, title: true } } },
      });

      // Unsettled webinar revenue
      const unsettledWebinars = await prisma.webinar_transactions.findMany({
        where: {
          webinar: { creator_id: userId },
          status: "SUCCESS",
          payment_method: { in: ["RAZORPAY", "CASHFREE"] },
          id: { notIn: settledWebinarIds.length > 0 ? settledWebinarIds : undefined },
        },
        include: { webinar: { select: { price: true, title: true } } },
      });

      let totalUnsettledGross = 0;
      const items = [];
      const commissionPct = SettlementService.getCommissionPercent(userId);

      for (const tx of unsettledCourses) {
        const d = SettlementService.calculateDeductions(tx.course.price, commissionPct);
        totalUnsettledGross += tx.course.price;
        items.push({ type: "COURSE", title: tx.course.title, ...d, completed_at: tx.completed_at });
      }

      for (const tx of unsettledWebinars) {
        const d = SettlementService.calculateDeductions(tx.webinar.price, commissionPct);
        totalUnsettledGross += tx.webinar.price;
        items.push({ type: "WEBINAR", title: tx.webinar.title, ...d, completed_at: tx.completed_at });
      }

      const totalDeductions = SettlementService.calculateDeductions(totalUnsettledGross, commissionPct);

      // Summary figures for the wallet screen (net of deductions)
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [allCourseTx, allWebinarTx, lastSettlement] = await Promise.all([
        prisma.transactions.findMany({
          where: {
            course: { creator_id: userId },
            status: "SUCCESS",
            payment_method: { in: ["RAZORPAY", "CASHFREE"] },
          },
          select: { amount: true, completed_at: true, created_at: true },
        }),
        prisma.webinar_transactions.findMany({
          where: {
            webinar: { creator_id: userId },
            status: "SUCCESS",
            payment_method: { in: ["RAZORPAY", "CASHFREE"] },
          },
          select: { amount: true, completed_at: true, created_at: true },
        }),
        prisma.settlements.findFirst({
          where: { creator_id: userId, status: "COMPLETED" },
          orderBy: { created_at: "desc" },
          select: { net_amount: true },
        }),
      ]);

      let totalNetEarnings = 0;
      let monthNetEarnings = 0;
      for (const tx of [...allCourseTx, ...allWebinarTx]) {
        const net = SettlementService.calculateDeductions(tx.amount || 0, commissionPct).netAmount;
        totalNetEarnings += net;
        const paidAt = tx.completed_at || tx.created_at;
        if (paidAt && paidAt >= monthStart) monthNetEarnings += net;
      }

      ApiResponseHandler.success(res, {
        net_earnings: Math.round(monthNetEarnings * 100) / 100,
        total_earnings: Math.round(totalNetEarnings * 100) / 100,
        last_payout: lastSettlement?.net_amount || 0,
        unsettled_count: items.length,
        total_gross: totalUnsettledGross,
        estimated_deductions: {
          platform_fee: totalDeductions.platformFee,
          gst_on_platform_fee: totalDeductions.gstOnPlatformFee,
          tds: totalDeductions.tdsAmount,
          total: totalDeductions.totalDeductions,
        },
        estimated_net: totalDeductions.netAmount,
        settlement_delay: "Instant (IMPS)",
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

      // Retry any pending/failed payouts
      const payouts = await SettlementService.processAllPendingPayouts();

      ApiResponseHandler.success(res, {
        payouts,
      }, "Payout processing triggered");
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
          cashfree_transfer_id: null,
        },
      });

      const payout = await SettlementService.processPayout(settlementId);

      ApiResponseHandler.success(res, { payout }, "Settlement retry initiated");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Cashfree Payout Webhook Handler
   */
  static async handlePayoutWebhook(req: Request, res: Response) {
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;
    const signature = req.headers["x-webhook-signature"] as string;
    const timestamp = req.headers["x-webhook-timestamp"] as string;
    const rawBody = (req as any).rawBody;

    console.log("Payout webhook received:", {
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
      hasSecret: !!webhookSecret,
      hasRawBody: !!rawBody,
      headers: Object.keys(req.headers).filter(h => h.startsWith("x-")),
      bodyType: typeof req.body,
    });

    try {
      // If no signature headers, Cashfree might be doing a URL verification ping
      if (!signature || !timestamp) {
        console.log("Payout webhook: No signature headers — accepting as verification ping");
        return res.status(200).json({ status: "ok" });
      }

      if (!webhookSecret) {
        console.error("CASHFREE_WEBHOOK_SECRET not configured");
        return res.status(200).json({ status: "ok" });
      }

      if (!rawBody) {
        console.error("Payout webhook: rawBody not available");
        return res.status(200).json({ status: "ok" });
      }

      // Verify signature
      const crypto = require("crypto");
      const signedPayload = timestamp + rawBody;
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(signedPayload)
        .digest("base64");

      if (expectedSignature !== signature) {
        console.error("Payout webhook signature mismatch:", {
          expected: expectedSignature,
          received: signature,
        });
        return res.status(200).json({ status: "ok" });
      }

      const body = typeof req.body === "object" ? req.body : JSON.parse(rawBody);
      const eventType = body.type;
      const data = body.data;

      console.log(`Payout webhook event: ${eventType}`);

      if (eventType?.startsWith("TRANSFER_")) {
        await SettlementService.handlePayoutWebhook(eventType, data);
      }

      res.status(200).json({ status: "ok" });
    } catch (err: any) {
      console.error("Payout webhook error:", err);
      res.status(200).json({ status: "ok" });
    }
  }
}
