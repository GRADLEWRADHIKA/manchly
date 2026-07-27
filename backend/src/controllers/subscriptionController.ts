import { Response } from "express";
import { PremiumSubscriptionStatus } from "@prisma/client";
import prisma from "../prismaClient";
import { JWTRequest } from "../middleware/jwtAuth";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import { cashfreePG } from "../services/cashfreeService";
import { sanitizePhoneForCashfree } from "../utils/phone";
import {
  PREMIUM_PLAN,
  PREMIUM_PLAN_DURATION_DAYS,
  PREMIUM_PLAN_PRICE
} from "../utils/marketplaceConstants";
import { issueAccessToken, serializeAuthUser, serializeSubscription } from "../utils/userSerializer";
import { canAccessCreatorMarketplace } from "../utils/userTypeHelper";

const AUTH_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  profile_image: true,
  user_type: true,
  companyName: true,
  isPremium: true,
  freeViewsCount: true,
  premiumExpiresAt: true,
  dob: true,
  kyc_verified: true,
  fcm_token: true,
  instagram_link: true,
  linkedin_link: true,
  youtube_link: true,
  facebook_link: true
} as const;

export class SubscriptionController {
  /**
   * GET /subscriptions/me
   */
  static async getMySubscription(req: JWTRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return ApiResponseHandler.customError(res, "Authentication required", 401, "UNAUTHENTICATED");
    }

    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: AUTH_USER_SELECT
      });

      if (!user) {
        return ApiResponseHandler.customError(res, "User not found", 404, "USER_NOT_FOUND");
      }

      ApiResponseHandler.success(res, serializeSubscription(user), "Subscription retrieved successfully");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * POST /subscriptions/checkout
   */
  static async createCheckout(req: JWTRequest, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      return ApiResponseHandler.customError(res, "Authentication required", 401, "UNAUTHENTICATED");
    }

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });
      if (!user) {
        return ApiResponseHandler.customError(res, "User not found", 404, "USER_NOT_FOUND");
      }

      if (!canAccessCreatorMarketplace(user.user_type)) {
        return ApiResponseHandler.customError(
          res,
          "Premium marketplace plans are available only for Brand and Agency accounts.",
          403,
          "MARKETPLACE_ACCESS_DENIED"
        );
      }

      if (user.isPremium) {
        return ApiResponseHandler.customError(res, "Premium subscription is already active", 400, "ALREADY_PREMIUM");
      }

      const orderId = `premium_${userId.slice(0, 8)}_${Date.now()}`;
      const amount = PREMIUM_PLAN_PRICE;

      const orderRequest = {
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: userId.slice(0, 50),
          customer_phone: sanitizePhoneForCashfree(user.phone),
          customer_name: (user.name || "User").slice(0, 100),
          customer_email: user.email
        },
        order_meta: {
          return_url: `${process.env.APP_URL || "https://manchly.com"}/payment/return?order_id={order_id}`,
          notify_url: `${process.env.APP_URL || "https://server.manchly.com"}/payments/webhook`
        },
        order_note: "Manchly Marketplace Premium",
        order_tags: {
          user_id: userId,
          type: "premium"
        }
      };

      const cashfreeOrder = await cashfreePG.PGCreateOrder(orderRequest);
      const orderData = cashfreeOrder.data;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + PREMIUM_PLAN_DURATION_DAYS);

      const subscription = await prisma.premium_subscriptions.create({
        data: {
          user_id: userId,
          plan: PREMIUM_PLAN,
          status: PremiumSubscriptionStatus.PENDING,
          amount,
          currency: "INR",
          cashfree_order_id: orderId,
          expires_at: expiresAt
        }
      });

      ApiResponseHandler.success(
        res,
        {
          subscription,
          cashfree_order: {
            order_id: orderData.order_id,
            payment_session_id: orderData.payment_session_id,
            order_status: orderData.order_status
          },
          cashfree_pg_app_id: process.env.CASHFREE_PG_APP_ID,
          cashfree_env: process.env.CASHFREE_PG_ENV || "SANDBOX",
          amount,
          currency: "INR",
          plan: PREMIUM_PLAN
        },
        "Premium checkout created successfully",
        201
      );
    } catch (err: any) {
      const cfDetail = err?.response?.data || err?.data || err?.message || err;
      console.error("Premium checkout error:", JSON.stringify(cfDetail, null, 2));
      ApiResponseHandler.customError(res, "Failed to create premium checkout", 500, "CHECKOUT_FAILED");
    }
  }

  /**
   * POST /subscriptions/verify
   */
  static async verifyCheckout(req: JWTRequest, res: Response) {
    const userId = req.user?.userId;
    const { order_id } = req.body;

    if (!userId) {
      return ApiResponseHandler.customError(res, "Authentication required", 401, "UNAUTHENTICATED");
    }
    if (!order_id) {
      return ApiResponseHandler.customError(res, "Missing order_id", 400, "MISSING_ORDER_ID");
    }

    try {
      const subscription = await prisma.premium_subscriptions.findUnique({
        where: { cashfree_order_id: order_id }
      });

      if (!subscription || subscription.user_id !== userId) {
        return ApiResponseHandler.customError(res, "Subscription order not found", 404, "ORDER_NOT_FOUND");
      }

      const orderStatus = await cashfreePG.PGFetchOrder(order_id);
      const status = orderStatus.data.order_status;

      if (status !== "PAID") {
        return ApiResponseHandler.customError(
          res,
          `Payment not completed. Current status: ${status}`,
          400,
          "PAYMENT_NOT_COMPLETED"
        );
      }

      const user = await activatePremiumSubscription(subscription.id, order_id);
      const token = issueAccessToken(user.id, user.email);

      ApiResponseHandler.success(
        res,
        {
          token,
          user: serializeAuthUser(user),
          subscription: serializeSubscription(user)
        },
        "Premium subscription activated successfully"
      );
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }
}

export async function activatePremiumSubscription(
  subscriptionId: string,
  orderId: string,
  cfPaymentId?: string
) {
  const subscription = await prisma.premium_subscriptions.findUnique({
    where: { id: subscriptionId }
  });

  if (!subscription) {
    throw new Error(`Premium subscription not found: ${subscriptionId}`);
  }

  if (subscription.status === PremiumSubscriptionStatus.ACTIVE) {
    return prisma.users.findUniqueOrThrow({
      where: { id: subscription.user_id },
      select: AUTH_USER_SELECT
    });
  }

  const expiresAt = subscription.expires_at || new Date(Date.now() + PREMIUM_PLAN_DURATION_DAYS * 86400000);

  await prisma.$transaction([
    prisma.premium_subscriptions.update({
      where: { id: subscription.id },
      data: {
        status: PremiumSubscriptionStatus.ACTIVE,
        ...(cfPaymentId ? { cf_payment_id: cfPaymentId } : {}),
        expires_at: expiresAt
      }
    }),
    prisma.users.update({
      where: { id: subscription.user_id },
      data: {
        isPremium: true,
        premiumExpiresAt: expiresAt
      }
    })
  ]);

  return prisma.users.findUniqueOrThrow({
    where: { id: subscription.user_id },
    select: AUTH_USER_SELECT
  });
}

export async function processPremiumPaymentSuccess(orderId: string, cfPaymentId?: string) {
  const subscription = await prisma.premium_subscriptions.findUnique({
    where: { cashfree_order_id: orderId }
  });

  if (!subscription) {
    console.error(`Premium subscription not found for order ${orderId}`);
    return;
  }

  await activatePremiumSubscription(subscription.id, orderId, cfPaymentId);
  console.log(`Premium subscription activated for user ${subscription.user_id}`);
}

export async function processPremiumPaymentFailed(orderId: string) {
  const subscription = await prisma.premium_subscriptions.findUnique({
    where: { cashfree_order_id: orderId }
  });

  if (!subscription) {
    return;
  }

  await prisma.premium_subscriptions.update({
    where: { id: subscription.id },
    data: { status: PremiumSubscriptionStatus.FAILED }
  });
}
