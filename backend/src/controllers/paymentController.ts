import { Request, Response } from "express";
import prisma from "../prismaClient";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import { isUser, isCreator } from "../utils/userTypeHelper";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const Razorpay = require('razorpay');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
});

export class PaymentController {
  
  /**
   * Create Razorpay order for course enrollment
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

      // Check if there's a pending transaction
      const pendingTransaction = await prisma.transactions.findFirst({
        where: {
          user_id: userId,
          course_id: courseId,
          status: "PENDING"
        }
      });

      // if (pendingTransaction) {
      //   return ApiResponseHandler.customError(res, "You already have a pending payment for this course", 400, "PENDING_PAYMENT_EXISTS");
      // }

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

        return ApiResponseHandler.success(res, {
          enrollment,
          transaction,
          message: "Successfully enrolled in free course"
        }, "Enrollment successful", 201);
      }

      // Create Razorpay order for paid courses
      // Calculate price with 18% GST and 5% platform fee on GST
      const gstAmount = course.price * 0.18; // 18% GST
      const platformFee = gstAmount * 0.05; // 5% platform fee on GST amount
      const finalAmount = course.price + gstAmount + platformFee; // Base price + GST + Platform fee
      const finalAmountRounded = parseFloat(finalAmount.toFixed(2)); // Fix to 2 decimal places
      
      const amountInPaise = Math.round(finalAmountRounded * 100); // Convert to paise
      
      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          user_id: userId,
          course_id: courseId,
          course_title: course.title,
          user_email: user.email
        }
      });

      // Create transaction record in database
      const transaction = await prisma.transactions.create({
        data: {
          user_id: userId,
          course_id: courseId,
          amount: finalAmountRounded,
          currency: "INR",
          status: "PENDING",
          payment_method: "RAZORPAY",
          razorpay_order_id: razorpayOrder.id,
          payment_details: {
            razorpay_order: razorpayOrder
          }
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
        razorpay_order: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency
        },
        razorpay_key_id: process.env.RAZORPAY_KEY_ID,
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
        }
      }, "Razorpay order created successfully", 201);

    } catch (err: any) {
      console.error("Error creating Razorpay order:", err);
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Verify payment and create enrollment
   */
  static async verifyPayment(req: any, res: Response) {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;
    const userId = req.user.userId;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return ApiResponseHandler.customError(res, "Missing payment verification details", 400, "MISSING_PAYMENT_DETAILS");
    }

    try {
      // Find transaction
      const transaction = await prisma.transactions.findUnique({
        where: { razorpay_order_id },
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

      // Verify signature
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        // Update transaction as failed
        await prisma.transactions.update({
          where: { id: transaction.id },
          data: {
            status: "FAILED",
            failure_reason: "Invalid signature"
          }
        });

        return ApiResponseHandler.customError(res, "Invalid payment signature", 400, "INVALID_SIGNATURE");
      }

      // Fetch payment details from Razorpay
      const payment = await razorpay.payments.fetch(razorpay_payment_id);

      // Update transaction
      const updatedTransaction = await prisma.transactions.update({
        where: { id: transaction.id },
        data: {
          status: "SUCCESS",
          razorpay_payment_id,
          razorpay_signature,
          completed_at: new Date(),
          payment_details: {
            payment_info: payment
          }
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

      // TODO: Send notification to creator
      console.log(`🎉 New purchase! User ${userId} purchased course "${transaction.course.title}" for ₹${transaction.amount}`);
      console.log(`Creator: ${transaction.course.creator.name} (${transaction.course.creator.email})`);

      ApiResponseHandler.success(res, {
        enrollment,
        transaction: updatedTransaction,
        message: "Payment verified and enrollment created successfully"
      }, "Payment verified successfully", 201);

    } catch (err: any) {
      console.error("Error verifying payment:", err);
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Razorpay Webhook Handler
   */
  static async handleWebhook(req: Request, res: Response) {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'] as string;

    try {
      // Verify webhook signature
      const generatedSignature = crypto
        .createHmac('sha256', webhookSecret!)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (generatedSignature !== signature) {
        return ApiResponseHandler.customError(res, "Invalid webhook signature", 400, "INVALID_SIGNATURE");
      }

      const event = req.body.event;
      const payload = req.body.payload.payment.entity;

      console.log(`📥 Razorpay Webhook: ${event}`, payload);

      // Handle different events
      switch (event) {
        case 'payment.authorized':
        case 'payment.captured':
          await PaymentController.handlePaymentSuccess(payload);
          break;

        case 'payment.failed':
          await PaymentController.handlePaymentFailed(payload);
          break;

        default:
          console.log(`Unhandled webhook event: ${event}`);
      }

      res.status(200).json({ status: 'ok' });

    } catch (err: any) {
      console.error("Webhook error:", err);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Handle successful payment from webhook
   */
  private static async handlePaymentSuccess(payload: any) {
    try {
      const orderId = payload.order_id;
      const paymentId = payload.id;

      const transaction = await prisma.transactions.findUnique({
        where: { razorpay_order_id: orderId },
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
          razorpay_payment_id: paymentId,
          completed_at: new Date(),
          payment_details: {
            webhook_payload: payload
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

      // Notify creator
      console.log(`🎉 PAYMENT SUCCESS WEBHOOK`);
      console.log(`Student: ${transaction.user.name} (${transaction.user.email})`);
      console.log(`Course: ${transaction.course.title}`);
      console.log(`Amount: ₹${transaction.amount}`);
      console.log(`Creator: ${transaction.course.creator.name} (${transaction.course.creator.email})`);
      console.log(`Transaction ID: ${transaction.id}`);
      console.log(`Note: Money will be transferred manually to creator`);

      // TODO: Send email notification to creator

    } catch (err) {
      console.error("Error handling payment success:", err);
    }
  }

  /**
   * Handle failed payment from webhook
   */
  private static async handlePaymentFailed(payload: any) {
    try {
      const orderId = payload.order_id;

      const transaction = await prisma.transactions.findUnique({
        where: { razorpay_order_id: orderId }
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
          failure_reason: payload.error_description || "Payment failed",
          payment_details: {
            webhook_payload: payload
          }
        }
      });

      console.log(`❌ Payment failed for transaction ${transaction.id}`);

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

