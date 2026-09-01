import { Response } from "express";
import { CreatorTrialStatus } from "@prisma/client";
import prisma from "../prismaClient";
import { JWTRequest } from "../middleware/jwtAuth";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import { cashfreePG } from "../services/cashfreeService";
import { sanitizePhoneForCashfree } from "../utils/phone";

const TRIAL_DAYS = 3;
const TRIAL_PRICE = 199;      // ₹199 one-time trial charge
const MONTHLY_PRICE = 199;    // ₹199/month after trial
const AUTH_AMOUNT = 1;         // ₹1 mandate verification

export class CreatorTrialController {

  /**
   * GET /creator-trial/status
   * Check if creator has an active trial / subscription
   */
  static async getStatus(req: JWTRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return ApiResponseHandler.customError(res, "Auth required", 401, "UNAUTHENTICATED");

    try {
      const trial = await prisma.creator_trials.findFirst({
        where: {
          user_id: userId,
          status: { in: [CreatorTrialStatus.AUTHORIZED, CreatorTrialStatus.ACTIVE] },
        },
        orderBy: { created_at: "desc" },
      });

      if (!trial) {
        return ApiResponseHandler.success(res, {
          has_active: false,
          trial_days: TRIAL_DAYS,
          trial_price: TRIAL_PRICE,
          monthly_price: MONTHLY_PRICE,
        }, "No active trial");
      }

      const isExpired = trial.trial_ends_at && new Date() > trial.trial_ends_at;

      return ApiResponseHandler.success(res, {
        has_active: !isExpired,
        trial: {
          id: trial.id,
          status: trial.status,
          trial_starts_at: trial.trial_starts_at,
          trial_ends_at: trial.trial_ends_at,
          next_charge_at: trial.next_charge_at,
          cancelled_at: trial.cancelled_at,
        },
        trial_days: TRIAL_DAYS,
        trial_price: TRIAL_PRICE,
        monthly_price: MONTHLY_PRICE,
      }, "Trial status");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * POST /creator-trial/subscribe
   * Create a Cashfree subscription with ₹1 auth for autopay mandate.
   * After trial ends, ₹199/month is auto-charged.
   */
  static async subscribe(req: JWTRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return ApiResponseHandler.customError(res, "Auth required", 401, "UNAUTHENTICATED");

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });
      if (!user) return ApiResponseHandler.customError(res, "User not found", 404, "USER_NOT_FOUND");

      // Check if already has an active trial
      const existing = await prisma.creator_trials.findFirst({
        where: {
          user_id: userId,
          status: { in: [CreatorTrialStatus.AUTHORIZED, CreatorTrialStatus.ACTIVE] },
        },
      });
      if (existing) {
        return ApiResponseHandler.customError(res, "You already have an active trial/subscription", 400, "ALREADY_ACTIVE");
      }

      const subscriptionId = `creator_trial_${userId.slice(0, 8)}_${Date.now()}`;

      // First charge happens after trial ends
      const firstChargeTime = new Date();
      firstChargeTime.setDate(firstChargeTime.getDate() + TRIAL_DAYS);

      const cfRequest = {
        subscription_id: subscriptionId,
        customer_details: {
          customer_id: userId.slice(0, 50),
          customer_phone: sanitizePhoneForCashfree(user.phone),
          customer_name: (user.name || "Creator").slice(0, 100),
          customer_email: user.email || undefined,
        },
        plan_details: {
          plan_name: "Manchly Creator Monthly",
          plan_type: "PERIODIC" as const,
          plan_currency: "INR",
          plan_recurring_amount: MONTHLY_PRICE,
          plan_max_amount: MONTHLY_PRICE * 12,
          plan_max_cycles: 120,
          plan_intervals: 1,
          plan_interval_type: "MONTH" as const,
        },
        authorization_details: {
          authorization_amount: AUTH_AMOUNT,
          authorization_amount_refund: false, // keep the ₹1 (or set true to refund)
          payment_methods: ["upi", "card"],
        },
        subscription_first_charge_time: firstChargeTime.toISOString(),
        subscription_note: "Manchly Creator Trial - 3 days free then ₹199/month",
        subscription_tags: { user_id: userId, type: "creator_trial" },
        subscription_meta: {
          return_url: `https://manchly.com/trial/return?subscription_id=${subscriptionId}`,
        },
      };

      const cfResponse = await cashfreePG.SubsCreateSubscription(cfRequest as any);
      const cfData = cfResponse.data;

      // Save to DB
      const trial = await prisma.creator_trials.create({
        data: {
          user_id: userId,
          status: CreatorTrialStatus.PENDING,
          trial_days: TRIAL_DAYS,
          trial_price: TRIAL_PRICE,
          monthly_price: MONTHLY_PRICE,
          auth_amount: AUTH_AMOUNT,
          cf_subscription_id: cfData.cf_subscription_id || null,
          subscription_id: subscriptionId,
          subscription_session_id: cfData.subscription_session_id || null,
          trial_ends_at: firstChargeTime,
        },
      });

      return ApiResponseHandler.success(res, {
        trial_id: trial.id,
        subscription_id: subscriptionId,
        subscription_session_id: cfData.subscription_session_id,
        cf_subscription_id: cfData.cf_subscription_id,
        cashfree_pg_app_id: process.env.CASHFREE_PG_APP_ID,
        cashfree_env: process.env.CASHFREE_PG_ENV || "SANDBOX",
        auth_amount: AUTH_AMOUNT,
      }, "Subscription created. Complete ₹1 authorization.", 201);
    } catch (err: any) {
      const detail = err?.response?.data || err?.data || err?.message || err;
      console.error("Creator trial subscribe error:", JSON.stringify(detail, null, 2));
      ApiResponseHandler.customError(res, "Failed to create subscription", 500, "SUBSCRIBE_FAILED");
    }
  }

  /**
   * POST /creator-trial/verify
   * After ₹1 auth completes, verify and activate the trial.
   */
  static async verify(req: JWTRequest, res: Response) {
    const userId = req.user?.userId;
    const { subscription_id } = req.body;

    if (!userId) return ApiResponseHandler.customError(res, "Auth required", 401, "UNAUTHENTICATED");
    if (!subscription_id) return ApiResponseHandler.customError(res, "Missing subscription_id", 400, "MISSING_ID");

    try {
      const trial = await prisma.creator_trials.findUnique({
        where: { subscription_id },
      });

      if (!trial || trial.user_id !== userId) {
        return ApiResponseHandler.customError(res, "Trial not found", 404, "NOT_FOUND");
      }

      // Fetch subscription status from Cashfree
      const cfResponse = await cashfreePG.SubsFetchSubscription(subscription_id);
      const cfData = cfResponse.data;
      const cfStatus = (cfData as any).subscription_status || (cfData as any).status;

      if (cfStatus === "ACTIVE") {
        // ₹1 auth succeeded, mandate is set up
        const trialStart = new Date();
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + trial.trial_days);

        await prisma.creator_trials.update({
          where: { id: trial.id },
          data: {
            status: CreatorTrialStatus.ACTIVE,
            trial_starts_at: trialStart,
            trial_ends_at: trialEnd,
            next_charge_at: trialEnd,
          },
        });

        return ApiResponseHandler.success(res, {
          status: "ACTIVE",
          trial_starts_at: trialStart,
          trial_ends_at: trialEnd,
        }, "Trial activated! ₹1 authorized, ₹199/month starts after trial.");
      }

      if (cfStatus === "BANK_APPROVAL_PENDING") {
        await prisma.creator_trials.update({
          where: { id: trial.id },
          data: { status: CreatorTrialStatus.AUTHORIZED },
        });

        return ApiResponseHandler.success(res, {
          status: "BANK_APPROVAL_PENDING",
        }, "Authorization is pending bank approval. Trial will activate once approved.");
      }

      return ApiResponseHandler.customError(
        res,
        `Authorization not completed. Status: ${cfStatus}`,
        400,
        "AUTH_NOT_COMPLETED",
      );
    } catch (err: any) {
      const detail = err?.response?.data || err?.data || err?.message || err;
      console.error("Creator trial verify error:", JSON.stringify(detail, null, 2));
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * POST /creator-trial/cancel
   * Cancel the autopay subscription.
   */
  static async cancel(req: JWTRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) return ApiResponseHandler.customError(res, "Auth required", 401, "UNAUTHENTICATED");

    try {
      const trial = await prisma.creator_trials.findFirst({
        where: {
          user_id: userId,
          status: { in: [CreatorTrialStatus.AUTHORIZED, CreatorTrialStatus.ACTIVE] },
        },
        orderBy: { created_at: "desc" },
      });

      if (!trial || !trial.subscription_id) {
        return ApiResponseHandler.customError(res, "No active subscription to cancel", 404, "NOT_FOUND");
      }

      // Cancel on Cashfree
      await cashfreePG.SubsManageSubscription(trial.subscription_id, {
        subscription_id: trial.subscription_id,
        action: "CANCEL" as any,
      });

      await prisma.creator_trials.update({
        where: { id: trial.id },
        data: {
          status: CreatorTrialStatus.CANCELLED,
          cancelled_at: new Date(),
        },
      });

      return ApiResponseHandler.success(res, { status: "CANCELLED" }, "Subscription cancelled successfully.");
    } catch (err: any) {
      console.error("Creator trial cancel error:", err?.response?.data || err?.message);
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }
}
