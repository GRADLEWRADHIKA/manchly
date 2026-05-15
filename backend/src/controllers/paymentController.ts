import { Request, Response } from "express";
import prisma from "../prismaClient";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import { isUser, isCreator } from "../utils/userTypeHelper";
import { SettlementService } from "../services/settlementService";
import { notificationService } from "../services/NotificationService";
import { cashfreePG } from "../services/cashfreeService";
import { processTelegramPaymentSuccess, processTelegramPaymentFailed } from "./telegramController";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

export class PaymentController {

  /**
   * Create Cashfree order for course enrollment
   */
  static async createOrder(req: any, res: Response) {
    const { courseId } = req.params;
    const userId = req.user.userId;

    try {
      // Get user details
      const user = await prisma.users.findUnique({ where: { id: userId } });

      if (!user) {
        return ApiResponseHandler.customError(res, "User not found", 404, "USER_NOT_FOUND");
      }

      if (!isUser(user.user_type)) {
        return ApiResponseHandler.customError(res, "Only regular users can purchase courses", 403, "FORBIDDEN");
      }

      // Get course details
      const course = await prisma.courses.findUnique({
        where: { id: courseId },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!course) {
        return ApiResponseHandler.customError(res, "Course not found", 404, "COURSE_NOT_FOUND");
      }

      if (course.status !== "PUBLISHED") {
        return ApiResponseHandler.customError(res, "Course is not available for purchase", 400, "COURSE_NOT_AVAILABLE");
      }

      // Check if already enrolled
      const existingEnrollment = await prisma.enrollments.findUnique({
        where: {
          user_id_course_id: {
            user_id: userId,
            course_id: courseId
          }
        }
      });

      if (existingEnrollment) {
        return ApiResponseHandler.customError(res, "Already enrolled in this course", 400, "ALREADY_ENROLLED");
      }

      // Handle free courses
      if (course.price === 0) {
        // Create transaction record
        const transaction = await prisma.transactions.create({
          data: {
            user_id: userId,
            course_id: courseId,
            amount: 0,
            currency: "INR",
            status: "SUCCESS",
            payment_method: "FREE",
            completed_at: new Date()
          }
        });

        // Create enrollment immediately
        const enrollment = await prisma.enrollments.create({
          data: {
            user_id: userId,
            course_id: courseId,
            transaction_id: transaction.id
          }
        });

        // Send course purchase notification for free course
        notificationService.sendCoursePurchaseNotification({
          customerName: user.name || 'there',
          customerEmail: user.email,
          customerPhone: user.phone || undefined,
          courseName: course.title,
          courseAccessLink: `${process.env.APP_URL || 'https://manchly.com'}/courses/${courseId}`,
          hostName: course.creator?.name || 'Manchly',
        }).catch(err => console.error('Free course notification error:', err));

        return ApiResponseHandler.success(res, {
          enrollment,
          transaction,
          message: "Successfully enrolled in free course"
        }, "Enrollment successful", 201);
      }

      // Create Cashfree order for paid courses
      // Some courses are billed at the listed price with no GST/platform fee added.
      const NO_FEE_COURSE_IDS = new Set<string>([
        '50c4b8ae-fc6e-47e5-97dc-4e33539a3e5e', // Xtech masterclass
      ]);
      const GST_PERCENT = 18;
      const PLATFORM_FEE_PERCENT = 5; // applied on GST amount, not base
      const noFee = NO_FEE_COURSE_IDS.has(courseId);
      const basePrice = course.price;
      const gstAmount = noFee ? 0 : basePrice * (GST_PERCENT / 100);
      const platformFee = noFee ? 0 : gstAmount * (PLATFORM_FEE_PERCENT / 100);
      const finalAmount = basePrice + gstAmount + platformFee;
      const round2 = (n: number) => parseFloat(n.toFixed(2));
      const finalAmountRounded = round2(finalAmount);
      const pricingBreakdown = {
        base_price: round2(basePrice),
        gst_percent: noFee ? 0 : GST_PERCENT,
        gst_amount: round2(gstAmount),
        platform_fee_percent: noFee ? 0 : PLATFORM_FEE_PERCENT,
        platform_fee_amount: round2(platformFee),
        total: finalAmountRounded,
        currency: "INR",
      };

      const orderId = `course_${courseId}_${Date.now()}`;

      const orderRequest = {
        order_id: orderId,
        order_amount: finalAmountRounded,
        order_currency: "INR",
        customer_details: {
          customer_id: userId.slice(0, 50),
          customer_phone: (user.phone || "9999999999").replace(/^\+?91/, "").replace(/\D/g, "").slice(-10) || "9999999999",
          customer_name: (user.name || "User").slice(0, 100),
          customer_email: user.email,
        },
        order_meta: {
          return_url: `${process.env.APP_URL || 'https://manchly.com'}/payment/return?order_id={order_id}`,
          notify_url: `${process.env.APP_URL || 'https://server.manchly.com'}/payments/webhook`,
        },
        order_note: `Course: ${course.title}`,
        order_tags: {
          user_id: userId,
          course_id: courseId,
          type: "course",
        },
      };

      const cashfreeOrder = await cashfreePG.PGCreateOrder(orderRequest);
      const orderData = cashfreeOrder.data;

      // Create transaction record in database
      const transaction = await prisma.transactions.create({
        data: {
          user_id: userId,
          course_id: courseId,
          amount: finalAmountRounded,
          currency: "INR",
          status: "PENDING",
          payment_method: "CASHFREE",
          cashfree_order_id: orderId,
          payment_details: JSON.parse(JSON.stringify({
            cashfree_order: orderData
          }))
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              price: true
            }
          }
        }
      });

      // Return order details for frontend
      ApiResponseHandler.success(res, {
        transaction,
        cashfree_order: {
          order_id: orderData.order_id,
          payment_session_id: orderData.payment_session_id,
          order_status: orderData.order_status,
        },
        cashfree_pg_app_id: process.env.CASHFREE_PG_APP_ID,
        cashfree_env: process.env.CASHFREE_PG_ENV || "SANDBOX",
        user_details: {
          name: user.name,
          email: user.email,
          phone: user.phone
        },
        course_details: {
          id: course.id,
          title: course.title,
          price: finalAmountRounded,
          original_price: course.price,
          thumbnail: course.thumbnail
        },
        pricing_breakdown: pricingBreakdown
      }, "Cashfree order created successfully", 201);

    } catch (err: any) {
      // Log the full Cashfree error for debugging
      const cfDetail = err?.response?.data || err?.data || err?.message || err;
      console.error("Error creating Cashfree order:", JSON.stringify(cfDetail, null, 2));
      const msg = typeof cfDetail === 'object' ? (cfDetail.message || cfDetail.type || JSON.stringify(cfDetail)) : String(cfDetail);
      ApiResponseHandler.customError(res, msg, 500, "PAYMENT_ORDER_FAILED");
    }
  }

  /**
   * Verify payment by checking order status with Cashfree
   */
  static async verifyPayment(req: any, res: Response) {
    const { order_id } = req.body;
    const userId = req.user.userId;

    if (!order_id) {
      return ApiResponseHandler.customError(res, "Missing order_id", 400, "MISSING_ORDER_ID");
    }

    try {
      // Find transaction
      const transaction = await prisma.transactions.findUnique({
        where: { cashfree_order_id: order_id },
        include: {
          course: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      });

      if (!transaction) {
        return ApiResponseHandler.customError(res, "Transaction not found", 404, "TRANSACTION_NOT_FOUND");
      }

      if (transaction.user_id !== userId) {
        return ApiResponseHandler.customError(res, "Unauthorized", 403, "FORBIDDEN");
      }

      if (transaction.status === "SUCCESS") {
        return ApiResponseHandler.customError(res, "Payment already verified", 400, "ALREADY_VERIFIED");
      }

      // Verify order status with Cashfree server-to-server
      const orderResponse = await cashfreePG.PGFetchOrder(order_id);
      const orderData = orderResponse.data;

      if (orderData.order_status !== "PAID") {
        if (orderData.order_status === "EXPIRED") {
          await prisma.transactions.update({
            where: { id: transaction.id },
            data: {
              status: "FAILED",
              failure_reason: "Order expired"
            }
          });
        }
        return ApiResponseHandler.customError(res, `Payment not completed. Status: ${orderData.order_status}`, 400, "PAYMENT_NOT_COMPLETED");
      }

      // Get payment details
      let paymentInfo = null;
      try {
        const paymentsResponse = await cashfreePG.PGOrderFetchPayments(order_id);
        paymentInfo = paymentsResponse.data;
      } catch (e) {
        console.error("Error fetching payment details:", e);
      }

      const cfPaymentId = paymentInfo?.[0]?.cf_payment_id?.toString() || null;

      // Update transaction
      const updatedTransaction = await prisma.transactions.update({
        where: { id: transaction.id },
        data: {
          status: "SUCCESS",
          cf_payment_id: cfPaymentId,
          completed_at: new Date(),
          payment_details: JSON.parse(JSON.stringify({
            order_info: orderData,
            payment_info: paymentInfo
          }))
        }
      });

      // Create enrollment
      const enrollment = await prisma.enrollments.create({
        data: {
          user_id: userId,
          course_id: transaction.course_id,
          transaction_id: transaction.id
        },
        include: {
          course: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              videos: true
            }
          }
        }
      });

      // Credit creator's wallet
      SettlementService.creditCreatorWallet({
        creatorId: transaction.course.creator.id,
        grossAmount: transaction.course.price,
        transactionType: "COURSE",
        transactionId: transaction.id,
        courseId: transaction.course_id,
        itemTitle: transaction.course.title,
      }).catch(err => console.error("Wallet credit error:", err));

      // Send course purchase notification (Email + WhatsApp)
      const buyer = await prisma.users.findUnique({
        where: { id: userId },
        select: { name: true, email: true, phone: true }
      });
      if (buyer) {
        notificationService.sendCoursePurchaseNotification({
          customerName: buyer.name || 'there',
          customerEmail: buyer.email,
          customerPhone: buyer.phone || undefined,
          courseName: transaction.course.title,
          courseAccessLink: `${process.env.APP_URL || 'https://manchly.com'}/courses/${transaction.course_id}`,
          hostName: transaction.course.creator.name || 'Manchly',
        }).catch(err => console.error('Course purchase notification error:', err));
      }

      console.log(`New purchase! User ${userId} purchased course "${transaction.course.title}" for ${transaction.amount}`);

      ApiResponseHandler.success(res, {
        enrollment,
        transaction: updatedTransaction,
        wallet_info: {
          title: "Payment received",
          message: "Payment credited to creator's wallet. Creator can withdraw anytime."
        },
        message: "Payment verified and enrollment created successfully"
      }, "Payment verified successfully", 201);

    } catch (err: any) {
      console.error("Error verifying payment:", err);
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Cashfree Webhook Handler
   */
  static async handleWebhook(req: Request, res: Response) {
    // Cashfree PG signs webhooks with the Client Secret Key (same key used for API auth),
    // not a separately-configured webhook secret.
    const webhookSecret = process.env.CASHFREE_PG_SECRET_KEY;
    const signature = req.headers['x-webhook-signature'] as string;
    const timestamp = req.headers['x-webhook-timestamp'] as string;
    const rawBody = (req as any).rawBody;

    console.log("Payment webhook received:", {
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
      hasSecret: !!webhookSecret,
      hasRawBody: !!rawBody,
      headers: Object.keys(req.headers).filter(h => h.startsWith("x-")),
    });

    try {
      // If no signature headers, Cashfree might be doing a URL verification ping
      if (!signature || !timestamp) {
        console.log("Payment webhook: No signature headers — accepting as verification ping");
        return res.status(200).json({ status: "ok" });
      }

      if (!webhookSecret) {
        console.error("CASHFREE_PG_SECRET_KEY not configured");
        return res.status(200).json({ status: "ok" });
      }

      if (!rawBody) {
        console.error("Payment webhook: rawBody not available");
        return res.status(200).json({ status: "ok" });
      }

      // Verify webhook signature using raw body
      // Cashfree signature = HMAC-SHA256(timestamp + rawBody, secret) in base64
      const signedPayload = timestamp + rawBody;
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedPayload)
        .digest('base64');

      if (expectedSignature !== signature) {
        console.error("Payment webhook signature mismatch:", {
          expected: expectedSignature,
          received: signature,
        });
        // Return 200 to prevent Cashfree from retrying endlessly
        return res.status(200).json({ status: "ok" });
      }

      const body = typeof req.body === "object" ? req.body : JSON.parse(rawBody);
      const eventType = body.type;
      const data = body.data;

      console.log(`Cashfree Webhook: ${eventType}`, data?.order?.order_id);

      switch (eventType) {
        case 'PAYMENT_SUCCESS_WEBHOOK':
          await PaymentController.handlePaymentSuccess(data);
          break;

        case 'PAYMENT_FAILED_WEBHOOK':
          await PaymentController.handlePaymentFailed(data);
          break;

        case 'PAYMENT_USER_DROPPED_WEBHOOK':
          console.log(`User dropped payment for order: ${data?.order?.order_id}`);
          break;

        default:
          console.log(`Unhandled webhook event: ${eventType}`);
      }

      res.status(200).json({ status: 'ok' });

    } catch (err: any) {
      console.error("Webhook error:", err);
      res.status(200).json({ status: 'ok' });
    }
  }

  /**
   * Handle successful payment from webhook
   */
  private static async handlePaymentSuccess(data: any) {
    try {
      const orderId = data.order?.order_id;
      const cfPaymentId = data.payment?.cf_payment_id?.toString();

      if (typeof orderId === "string" && orderId.startsWith("tg_")) {
        await processTelegramPaymentSuccess(orderId, data);
        return;
      }

      const transaction = await prisma.transactions.findUnique({
        where: { cashfree_order_id: orderId },
        include: {
          course: {
            include: {
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!transaction) {
        console.error(`Transaction not found for order ${orderId}`);
        return;
      }

      if (transaction.status === "SUCCESS") {
        console.log(`Transaction already processed: ${transaction.id}`);
        return;
      }

      // Update transaction
      await prisma.transactions.update({
        where: { id: transaction.id },
        data: {
          status: "SUCCESS",
          cf_payment_id: cfPaymentId,
          completed_at: new Date(),
          payment_details: {
            webhook_payload: data
          }
        }
      });

      // Check if enrollment already exists
      const existingEnrollment = await prisma.enrollments.findUnique({
        where: {
          user_id_course_id: {
            user_id: transaction.user_id,
            course_id: transaction.course_id
          }
        }
      });

      if (!existingEnrollment) {
        // Create enrollment
        await prisma.enrollments.create({
          data: {
            user_id: transaction.user_id,
            course_id: transaction.course_id,
            transaction_id: transaction.id
          }
        });
      }

      // Credit creator's wallet
      await SettlementService.creditCreatorWallet({
        creatorId: transaction.course.creator.id,
        grossAmount: transaction.course.price,
        transactionType: "COURSE",
        transactionId: transaction.id,
        courseId: transaction.course_id,
        itemTitle: transaction.course.title,
      });

      console.log(`PAYMENT SUCCESS WEBHOOK - Course: ${transaction.course.title}, Amount: ${transaction.amount}, Creator: ${transaction.course.creator.name}`);

    } catch (err) {
      console.error("Error handling payment success:", err);
    }
  }

  /**
   * Handle failed payment from webhook
   */
  private static async handlePaymentFailed(data: any) {
    try {
      const orderId = data.order?.order_id;

      if (typeof orderId === "string" && orderId.startsWith("tg_")) {
        await processTelegramPaymentFailed(orderId, data);
        return;
      }

      const transaction = await prisma.transactions.findUnique({
        where: { cashfree_order_id: orderId }
      });

      if (!transaction) {
        console.error(`Transaction not found for order ${orderId}`);
        return;
      }

      // Update transaction as failed
      await prisma.transactions.update({
        where: { id: transaction.id },
        data: {
          status: "FAILED",
          failure_reason: data.payment?.payment_message || "Payment failed",
          payment_details: {
            webhook_payload: data
          }
        }
      });

      console.log(`Payment failed for transaction ${transaction.id}`);

    } catch (err) {
      console.error("Error handling payment failure:", err);
    }
  }

  /**
   * Get user's transactions
   */
  static async getMyTransactions(req: any, res: Response) {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    try {
      const skip = (Number(page) - 1) * Number(limit);

      const whereClause: any = { user_id: userId };
      if (status) {
        whereClause.status = status;
      }

      const [transactions, total] = await Promise.all([
        prisma.transactions.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          include: {
            course: {
              select: {
                id: true,
                title: true,
                thumbnail: true,
                creator: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          orderBy: { created_at: 'desc' }
        }),
        prisma.transactions.count({ where: whereClause })
      ]);

      ApiResponseHandler.success(res, {
        transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          total_pages: Math.ceil(total / Number(limit))
        }
      }, "Transactions retrieved successfully");

    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Get creator's sales (transactions for their courses)
   */
  static async getCreatorSales(req: any, res: Response) {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });

      if (!user || !isCreator(user.user_type)) {
        return ApiResponseHandler.customError(res, "Only creators can view sales", 403, "FORBIDDEN");
      }

      const skip = (Number(page) - 1) * Number(limit);

      const whereClause: any = {
        course: {
          creator_id: userId
        }
      };

      if (status) {
        whereClause.status = status;
      }

      const [transactions, total] = await Promise.all([
        prisma.transactions.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          include: {
            course: {
              select: {
                id: true,
                title: true,
                thumbnail: true,
                price: true
              }
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { created_at: 'desc' }
        }),
        prisma.transactions.count({ where: whereClause })
      ]);

      // Calculate total revenue
      const totalRevenue = await prisma.transactions.aggregate({
        where: {
          course: {
            creator_id: userId
          },
          status: "SUCCESS"
        },
        _sum: {
          amount: true
        }
      });

      ApiResponseHandler.success(res, {
        transactions,
        total_revenue: totalRevenue._sum.amount || 0,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          total_pages: Math.ceil(total / Number(limit))
        }
      }, "Sales retrieved successfully");

    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }
}
