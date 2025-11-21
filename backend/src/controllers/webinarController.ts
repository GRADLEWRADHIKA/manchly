import { Request, Response } from "express";
import prisma from "../prismaClient";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import ZoomMeetingManager from "../utils/zoomManager";
import EmailService from "../services/EmailService";
import WhatsAppService from "../services/WhatsAppService";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const Razorpay = require('razorpay');

// Initialize services
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!
});

const zoomManager = new ZoomMeetingManager({
  apiKey: process.env.ZOOM_API_KEY || '',
  apiSecret: process.env.ZOOM_API_SECRET || '',
  accountId: process.env.ZOOM_ACCOUNT_ID,
  oauthClientId: process.env.ZOOM_OAUTH_CLIENT_ID,
  oauthClientSecret: process.env.ZOOM_OAUTH_CLIENT_SECRET
});

const emailService = new EmailService();
const whatsAppService = new WhatsAppService();

export class WebinarController {
  // ============ WEBINAR MANAGEMENT ============

  /**
   * Create a new webinar (Creator only)
   */
  static async createWebinar(req: any, res: Response) {
    const {
      title,
      description,
      thumbnail,
      thumbnail_url,
      price = 0,
      category,
      tags = [],
      scheduled_at,
      duration = 60,
      timezone = "UTC",
      max_participants,
      status = "DRAFT"
    } = req.body;

    const userId = req.user.userId;

    // Validate required fields
    if (!title) {
      return ApiResponseHandler.customError(res, "Webinar title is required", 400, "MISSING_TITLE");
    }

    if (!scheduled_at) {
      return ApiResponseHandler.customError(res, "Scheduled date and time is required", 400, "MISSING_SCHEDULE");
    }

    // Check if user is a creator
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user || user.user_type !== "CREATOR") {
      return ApiResponseHandler.customError(res, "Only creators can create webinars", 403, "FORBIDDEN");
    }

    try {
      // Validate scheduled date is in the future
      const scheduledDate = new Date(scheduled_at);
      if (scheduledDate <= new Date()) {
        return ApiResponseHandler.customError(res, "Scheduled date must be in the future", 400, "INVALID_SCHEDULE");
      }

      // Create Zoom meeting if status is PUBLISHED
      let zoomMeetingData: any = {};
      if (status === "PUBLISHED") {
        try {
          const meeting = await zoomManager.createMeeting('me', {
            topic: title,
            agenda: description || '',
            type: 2, // Scheduled meeting
            start_time: scheduledDate.toISOString(),
            duration: duration,
            timezone: timezone,
            settings: {
              host_video: true,
              participant_video: true,
              join_before_host: false,
              mute_upon_entry: true,
              waiting_room: true,
              audio: 'both',
              auto_recording: 'cloud',
              registrants_confirmation_email: false
            }
          });

          zoomMeetingData = {
            zoom_meeting_id: meeting.id.toString(),
            zoom_join_url: meeting.join_url,
            zoom_start_url: meeting.start_url,
            zoom_password: meeting.password
          };

          console.log('Zoom meeting created successfully:', JSON.stringify(meeting, null, 2));
        } catch (error: any) {
          console.error('Error creating Zoom meeting:', error);
          return ApiResponseHandler.customError(res, `Failed to create Zoom meeting: ${error.message}`, 500, "ZOOM_ERROR");
        }
      }

      const webinar = await prisma.webinars.create({
        data: {
          title,
          description,
          thumbnail,
          thumbnail_url,
          price: parseFloat(price),
          category,
          tags: Array.isArray(tags) ? tags : [],
          scheduled_at: scheduledDate,
          duration,
          timezone,
          max_participants,
          status,
          creator_id: userId,
          published_at: status === "PUBLISHED" ? new Date() : null,
          ...zoomMeetingData
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              profile_image: true
            }
          }
        }
      });

      ApiResponseHandler.success(res, { webinar }, "Webinar created successfully", 201);
    } catch (err: any) {
      console.error('Error creating webinar:', err);
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Get all webinars
   * - USER: Can see all published webinars
   * - CREATOR: Can see their own webinars (all statuses)
   */
  static async getAllWebinars(req: any, res: Response) {
    const userId = req.user.userId;
    const {
      page = 1,
      limit = 10,
      category,
      status,
      search,
      upcoming = "true"
    } = req.query;

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });

      if (!user) {
        return ApiResponseHandler.customError(res, "User not found", 404, "USER_NOT_FOUND");
      }

      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause based on user type
      const whereClause: any = {};

      if (user.user_type === "CREATOR") {
        // Creators see only their webinars
        whereClause.creator_id = userId;

        // Apply status filter if provided
        if (status) {
          whereClause.status = status;
        }
      } else {
        // Regular users see only published webinars
        whereClause.status = "PUBLISHED";
      }

      // Filter for upcoming webinars
      if (upcoming === "true") {
        whereClause.scheduled_at = {
          gte: new Date()
        };
      }

      // Apply filters
      if (category) {
        whereClause.category = category;
      }

      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [webinars, total] = await Promise.all([
        prisma.webinars.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
                profile_image: true
              }
            },
            enrollments: user.user_type === "USER" ? {
              where: { user_id: userId },
              select: {
                id: true,
                enrolled_at: true,
                attended: true
              }
            } : true,
            _count: {
              select: {
                enrollments: true
              }
            }
          },
          orderBy: { scheduled_at: 'asc' }
        }),
        prisma.webinars.count({ where: whereClause })
      ]);

      // Add enrollment status for users
      const webinarsWithStatus = webinars.map(webinar => {
        const isEnrolled = user.user_type === "USER" &&
          webinar.enrollments &&
          webinar.enrollments.length > 0;

        return {
          ...webinar,
          is_enrolled: isEnrolled,
          enrollment_count: webinar._count.enrollments,
          is_full: webinar.max_participants ? webinar._count.enrollments >= webinar.max_participants : false
        };
      });

      ApiResponseHandler.success(res, {
        webinars: webinarsWithStatus,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          total_pages: Math.ceil(total / Number(limit))
        }
      }, "Webinars retrieved successfully");
    } catch (err: any) {
      console.error('Error fetching webinars:', err);
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Get single webinar by ID
   */
  static async getWebinarById(req: any, res: Response) {
    const { webinarId } = req.params;
    const userId = req.user.userId;

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });

      if (!user) {
        return ApiResponseHandler.customError(res, "User not found", 404, "USER_NOT_FOUND");
      }

      const webinar = await prisma.webinars.findUnique({
        where: { id: webinarId },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              profile_image: true
            }
          },
          enrollments: user.user_type === "USER" ? {
            where: { user_id: userId }
          } : true,
          _count: {
            select: {
              enrollments: true
            }
          }
        }
      });

      if (!webinar) {
        return ApiResponseHandler.customError(res, "Webinar not found", 404, "WEBINAR_NOT_FOUND");
      }

      // Check access permissions
      if (user.user_type === "CREATOR" && webinar.creator_id !== userId) {
        return ApiResponseHandler.customError(res, "You don't have access to this webinar", 403, "FORBIDDEN");
      }

      if (user.user_type === "USER" && webinar.status !== "PUBLISHED") {
        return ApiResponseHandler.customError(res, "Webinar not available", 403, "WEBINAR_NOT_AVAILABLE");
      }

      const isEnrolled = user.user_type === "USER" &&
        webinar.enrollments &&
        webinar.enrollments.length > 0;

      ApiResponseHandler.success(res, {
        webinar: {
          ...webinar,
          is_enrolled: isEnrolled,
          enrollment_info: isEnrolled ? webinar.enrollments[0] : null,
          enrollment_count: webinar._count.enrollments,
          is_full: webinar.max_participants ? webinar._count.enrollments >= webinar.max_participants : false
        }
      }, "Webinar retrieved successfully");
    } catch (err: any) {
      console.error('Error fetching webinar:', err);
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Update webinar (Creator only - own webinars)
   */
  static async updateWebinar(req: any, res: Response) {
    const { webinarId } = req.params;
    const userId = req.user.userId;
    const {
      title,
      description,
      thumbnail,
      thumbnail_url,
      price,
      category,
      tags,
      scheduled_at,
      duration,
      timezone,
      max_participants,
      status
    } = req.body;

    try {
      // Check if webinar exists and user is the creator
      const existingWebinar = await prisma.webinars.findUnique({
        where: { id: webinarId }
      });

      if (!existingWebinar) {
        return ApiResponseHandler.customError(res, "Webinar not found", 404, "WEBINAR_NOT_FOUND");
      }

      if (existingWebinar.creator_id !== userId) {
        return ApiResponseHandler.customError(res, "You don't have permission to update this webinar", 403, "FORBIDDEN");
      }

      const updateData: any = {};
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
      if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (category !== undefined) updateData.category = category;
      if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];
      if (duration !== undefined) updateData.duration = duration;
      if (timezone !== undefined) updateData.timezone = timezone;
      if (max_participants !== undefined) updateData.max_participants = max_participants;

      // Handle scheduled date update
      if (scheduled_at) {
        const scheduledDate = new Date(scheduled_at);
        if (scheduledDate <= new Date()) {
          return ApiResponseHandler.customError(res, "Scheduled date must be in the future", 400, "INVALID_SCHEDULE");
        }
        updateData.scheduled_at = scheduledDate;

        // Update Zoom meeting if it exists
        if (existingWebinar.zoom_meeting_id) {
          try {
            await zoomManager.updateMeeting(existingWebinar.zoom_meeting_id, {
              start_time: scheduledDate.toISOString(),
              duration: duration || existingWebinar.duration || 60
            });
          } catch (error) {
            console.error('Error updating Zoom meeting:', error);
          }
        }
      }

      // Handle status change to PUBLISHED
      if (status && status === "PUBLISHED" && existingWebinar.status !== "PUBLISHED") {
        updateData.status = status;
        updateData.published_at = new Date();

        // Create Zoom meeting if not exists
        if (!existingWebinar.zoom_meeting_id) {
          try {
            const meeting = await zoomManager.createMeeting('me', {
              topic: title || existingWebinar.title,
              agenda: description || existingWebinar.description || '',
              type: 2,
              start_time: (scheduled_at ? new Date(scheduled_at) : existingWebinar.scheduled_at).toISOString(),
              duration: duration || existingWebinar.duration || 60,
              timezone: timezone || existingWebinar.timezone || 'UTC',
              settings: {
                host_video: true,
                participant_video: true,
                join_before_host: false,
                mute_upon_entry: true,
                waiting_room: true,
                audio: 'both'
              }
            });

            updateData.zoom_meeting_id = meeting.id.toString();
            updateData.zoom_join_url = meeting.join_url;
            updateData.zoom_start_url = meeting.start_url;
            updateData.zoom_password = meeting.password;
          } catch (error: any) {
            console.error('Error creating Zoom meeting:', error);
            return ApiResponseHandler.customError(res, `Failed to create Zoom meeting: ${error.message}`, 500, "ZOOM_ERROR");
          }
        }
      }

      const webinar = await prisma.webinars.update({
        where: { id: webinarId },
        data: updateData,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              profile_image: true
            }
          }
        }
      });

      ApiResponseHandler.success(res, { webinar }, "Webinar updated successfully");
    } catch (err: any) {
      console.error('Error updating webinar:', err);
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Delete webinar (Creator only - own webinars)
   */
  static async deleteWebinar(req: any, res: Response) {
    const { webinarId } = req.params;
    const userId = req.user.userId;

    try {
      const webinar = await prisma.webinars.findUnique({
        where: { id: webinarId },
        include: {
          enrollments: true
        }
      });

      if (!webinar) {
        return ApiResponseHandler.customError(res, "Webinar not found", 404, "WEBINAR_NOT_FOUND");
      }

      if (webinar.creator_id !== userId) {
        return ApiResponseHandler.customError(res, "You don't have permission to delete this webinar", 403, "FORBIDDEN");
      }

      // Delete Zoom meeting if exists
      if (webinar.zoom_meeting_id) {
        try {
          await zoomManager.deleteMeeting(webinar.zoom_meeting_id);
        } catch (err) {
          console.error(`Failed to delete Zoom meeting ${webinar.zoom_meeting_id}:`, err);
        }
      }

      // Delete webinar (cascade will delete enrollments and transactions)
      await prisma.webinars.delete({
        where: { id: webinarId }
      });

      ApiResponseHandler.success(res, {}, "Webinar deleted successfully");
    } catch (err: any) {
      console.error('Error deleting webinar:', err);
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ============ PAYMENT & ENROLLMENT ============

  /**
   * Create Razorpay order for webinar enrollment
   */
  static async createWebinarOrder(req: any, res: Response) {
    const { webinarId } = req.params;
    const userId = req.user.userId;

    try {
      // Get user details
      const user = await prisma.users.findUnique({ where: { id: userId } });

      if (!user) {
        return ApiResponseHandler.customError(res, "User not found", 404, "USER_NOT_FOUND");
      }

      if (user.user_type !== "USER") {
        return ApiResponseHandler.customError(res, "Only regular users can enroll in webinars", 403, "FORBIDDEN");
      }

      // Get webinar details
      const webinar = await prisma.webinars.findUnique({
        where: { id: webinarId },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              enrollments: true
            }
          }
        }
      });

      if (!webinar) {
        return ApiResponseHandler.customError(res, "Webinar not found", 404, "WEBINAR_NOT_FOUND");
      }

      if (webinar.status !== "PUBLISHED") {
        return ApiResponseHandler.customError(res, "Webinar is not available for enrollment", 400, "WEBINAR_NOT_AVAILABLE");
      }

      // Check if webinar is full
      if (webinar.max_participants && webinar._count.enrollments >= webinar.max_participants) {
        return ApiResponseHandler.customError(res, "Webinar is full", 400, "WEBINAR_FULL");
      }

      // Check if already enrolled
      const existingEnrollment = await prisma.webinar_enrollments.findUnique({
        where: {
          user_id_webinar_id: {
            user_id: userId,
            webinar_id: webinarId
          }
        }
      });

      if (existingEnrollment) {
        return ApiResponseHandler.customError(res, "Already enrolled in this webinar", 400, "ALREADY_ENROLLED");
      }

      // Handle free webinars
      if (webinar.price === 0) {
        // Create transaction record
        const transaction = await prisma.webinar_transactions.create({
          data: {
            user_id: userId,
            webinar_id: webinarId,
            amount: 0,
            currency: "INR",
            status: "SUCCESS",
            payment_method: "FREE",
            completed_at: new Date()
          }
        });

        // Create enrollment immediately
        const enrollment = await prisma.webinar_enrollments.create({
          data: {
            user_id: userId,
            webinar_id: webinarId,
            transaction_id: transaction.id
          }
        });

        // Send notifications (don't wait for them)
        WebinarController.sendEnrollmentNotifications(user, webinar).catch(err => {
          console.error('Error sending enrollment notifications:', err);
        });

        return ApiResponseHandler.success(res, {
          enrollment,
          transaction,
          message: "Successfully enrolled in free webinar"
        }, "Enrollment successful", 201);
      }

      // Create Razorpay order for paid webinars
      const amountInPaise = Math.round(webinar.price * 100);

      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `webinar_${Date.now()}`,
        notes: {
          user_id: userId,
          webinar_id: webinarId,
          webinar_title: webinar.title,
          user_email: user.email
        }
      });

      // Create transaction record in database
      const transaction = await prisma.webinar_transactions.create({
        data: {
          user_id: userId,
          webinar_id: webinarId,
          amount: webinar.price,
          currency: "INR",
          status: "PENDING",
          payment_method: "RAZORPAY",
          razorpay_order_id: razorpayOrder.id,
          payment_details: {
            razorpay_order: razorpayOrder
          }
        },
        include: {
          webinar: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              price: true,
              scheduled_at: true
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
        webinar_details: {
          id: webinar.id,
          title: webinar.title,
          price: webinar.price,
          thumbnail: webinar.thumbnail,
          scheduled_at: webinar.scheduled_at
        }
      }, "Razorpay order created successfully", 201);

    } catch (err: any) {
      console.error("Error creating Razorpay order:", err);
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Verify payment and create webinar enrollment
   */
  static async verifyWebinarPayment(req: any, res: Response) {
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
      const transaction = await prisma.webinar_transactions.findUnique({
        where: { razorpay_order_id },
        include: {
          webinar: {
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
              email: true,
              phone: true
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
        await prisma.webinar_transactions.update({
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
      const updatedTransaction = await prisma.webinar_transactions.update({
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
      const enrollment = await prisma.webinar_enrollments.create({
        data: {
          user_id: userId,
          webinar_id: transaction.webinar_id,
          transaction_id: transaction.id
        },
        include: {
          webinar: {
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

      // Send notifications (don't wait for them)
      WebinarController.sendEnrollmentNotifications(transaction.user, transaction.webinar).catch(err => {
        console.error('Error sending enrollment notifications:', err);
      });

      console.log(`🎉 New webinar enrollment! User ${userId} enrolled in "${transaction.webinar.title}"`);

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
   * Get user's enrolled webinars
   */
  static async getEnrolledWebinars(req: any, res: Response) {
    const userId = req.user.userId;
    const { page = 1, limit = 10, upcoming = "true" } = req.query;

    try {
      const skip = (Number(page) - 1) * Number(limit);

      const whereClause: any = { user_id: userId };

      // Filter for upcoming webinars only
      if (upcoming === "true") {
        whereClause.webinar = {
          scheduled_at: {
            gte: new Date()
          }
        };
      }

      const [enrollments, total] = await Promise.all([
        prisma.webinar_enrollments.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          include: {
            webinar: {
              include: {
                creator: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    profile_image: true
                  }
                }
              }
            }
          },
          orderBy: { enrolled_at: 'desc' }
        }),
        prisma.webinar_enrollments.count({ where: whereClause })
      ]);

      ApiResponseHandler.success(res, {
        enrollments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          total_pages: Math.ceil(total / Number(limit))
        }
      }, "Enrolled webinars retrieved successfully");
    } catch (err: any) {
      console.error('Error fetching enrolled webinars:', err);
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Get creator's webinar statistics
   */
  static async getCreatorWebinarStats(req: any, res: Response) {
    const userId = req.user.userId;

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });

      if (!user || user.user_type !== "CREATOR") {
        return ApiResponseHandler.customError(res, "Only creators can view statistics", 403, "FORBIDDEN");
      }

      const [totalWebinars, publishedWebinars, upcomingWebinars, totalEnrollments] = await Promise.all([
        prisma.webinars.count({ where: { creator_id: userId } }),
        prisma.webinars.count({ where: { creator_id: userId, status: "PUBLISHED" } }),
        prisma.webinars.count({
          where: {
            creator_id: userId,
            status: "PUBLISHED",
            scheduled_at: { gte: new Date() }
          }
        }),
        prisma.webinar_enrollments.count({
          where: {
            webinar: {
              creator_id: userId
            }
          }
        })
      ]);

      // Get webinar-wise enrollment count
      const webinarEnrollments = await prisma.webinars.findMany({
        where: { creator_id: userId },
        include: {
          _count: {
            select: { enrollments: true }
          }
        }
      });

      ApiResponseHandler.success(res, {
        statistics: {
          total_webinars: totalWebinars,
          published_webinars: publishedWebinars,
          upcoming_webinars: upcomingWebinars,
          draft_webinars: totalWebinars - publishedWebinars,
          total_enrollments: totalEnrollments,
          webinars_with_enrollments: webinarEnrollments.map(w => ({
            webinar_id: w.id,
            webinar_title: w.title,
            scheduled_at: w.scheduled_at,
            enrollments: w._count.enrollments,
            max_participants: w.max_participants,
            is_full: w.max_participants ? w._count.enrollments >= w.max_participants : false
          }))
        }
      }, "Creator webinar statistics retrieved successfully");
    } catch (err: any) {
      console.error('Error fetching creator stats:', err);
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  // ============ HELPER METHODS ============

  /**
   * Send enrollment notifications (Email & WhatsApp)
   */
  private static async sendEnrollmentNotifications(user: any, webinar: any): Promise<void> {
    try {
      const emailData = {
        userName: user.name || 'User',
        userEmail: user.email,
        webinarTitle: webinar.title,
        webinarDescription: webinar.description,
        scheduledAt: webinar.scheduled_at,
        duration: webinar.duration,
        zoomJoinUrl: webinar.zoom_join_url || '',
        zoomPassword: webinar.zoom_password,
        timezone: webinar.timezone
      };

      // Send email
      await emailService.sendWebinarEnrollmentEmail(emailData);
      console.log('✅ Enrollment email sent');

      // Send WhatsApp if phone number exists
      if (user.phone) {
        const whatsappData = {
          userName: user.name || 'User',
          userPhone: user.phone,
          webinarTitle: webinar.title,
          scheduledAt: webinar.scheduled_at,
          zoomJoinUrl: webinar.zoom_join_url || '',
          zoomPassword: webinar.zoom_password
        };

        await whatsAppService.sendWebinarEnrollmentMessage(whatsappData);
        console.log('✅ Enrollment WhatsApp message sent');
      }
    } catch (error) {
      console.error('Error sending enrollment notifications:', error);
      // Don't throw error, just log it
    }
  }
}

