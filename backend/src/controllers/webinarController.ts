import { Request, Response } from "express";
import prisma from "../prismaClient";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import ZoomMeetingManager from "../utils/zoomManager";
import { isCreator, isUser } from "../utils/userTypeHelper";
import { SettlementService } from "../services/settlementService";
import { notificationService } from "../services/NotificationService";
import { cashfreePG } from "../services/cashfreeService";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const zoomManager = new ZoomMeetingManager({
  apiKey: process.env.ZOOM_API_KEY || '',
  apiSecret: process.env.ZOOM_API_SECRET || '',
  accountId: process.env.ZOOM_ACCOUNT_ID,
  oauthClientId: process.env.ZOOM_OAUTH_CLIENT_ID,
  oauthClientSecret: process.env.ZOOM_OAUTH_CLIENT_SECRET
});

/** Validates time string in "HH:MM" or "HH:MM:SS" format (e.g. "15:00", "09:30"). Returns trimmed string or null if invalid. */
function parseTimeString(value: unknown): string | null {
  if (value == null || typeof value !== "string") return null;
  const trimmed = value.trim();
  // HH:MM or H:MM or HH:MM:SS (24h)
  if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/.test(trimmed)) return null;
  return trimmed;
}

/** Converts "HH:MM" or "HH:MM:SS" to minutes since midnight. */
function timeStringToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/** Converts minutes since midnight to "HH:MM" (same format as start_time). Wraps past 24h using modulo. */
function minutesToTimeString(totalMinutes: number): string {
  const wrapped = ((totalMinutes % (24 * 60)) + (24 * 60)) % (24 * 60);
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/** Calculates end_time from start_time (e.g. "15:00") + duration in minutes. Returns "HH:MM". */
function calculateEndTime(startTimeStr: string, durationMinutes: number): string {
  const startMins = timeStringToMinutes(startTimeStr);
  return minutesToTimeString(startMins + durationMinutes);
}

/** Combines date from scheduled_at with time from start_time (e.g. "15:00"). Returns Date so it's not midnight. */
function combineDateWithTime(date: Date, timeStr: string): Date {
  const y = date.getUTCFullYear();
  const mo = date.getUTCMonth();
  const d = date.getUTCDate();
  const [h, m] = timeStr.trim().split(":").map((x) => parseInt(x, 10) || 0);
  return new Date(Date.UTC(y, mo, d, h, m, 0, 0));
}

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
      start_time,
      end_time,
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

    // Validate start_time / end_time format ("15:00" or "15:00:00")
    const parsedStartTime = start_time != null && start_time !== "" ? parseTimeString(start_time) : null;
    const parsedEndTime = end_time != null && end_time !== "" ? parseTimeString(end_time) : null;
    if (start_time != null && start_time !== "" && parsedStartTime === null) {
      return ApiResponseHandler.customError(res, "start_time must be in HH:MM format (e.g. 15:00)", 400, "INVALID_START_TIME");
    }
    if (end_time != null && end_time !== "" && parsedEndTime === null) {
      return ApiResponseHandler.customError(res, "end_time must be in HH:MM format (e.g. 15:00)", 400, "INVALID_END_TIME");
    }

    // Check if user is a creator
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user || !isCreator(user.user_type)) {
      return ApiResponseHandler.customError(res, "Only creators can create webinars", 403, "FORBIDDEN");
    }

    try {
      // scheduled_at = date from scheduled_at + time from start_time (so not 12 AM)
      let scheduledDate = new Date(scheduled_at);
      if (parsedStartTime) {
        scheduledDate = combineDateWithTime(scheduledDate, parsedStartTime);
      }

      console.log('scheduledDate', scheduledDate);
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
          start_time: parsedStartTime ?? undefined,
          end_time: parsedStartTime && (duration !== undefined && duration !== null) ? calculateEndTime(parsedStartTime, Number(duration)) : (parsedEndTime ?? undefined),
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
      upcoming = "true",
      my_webinars
    } = req.query;

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });

      if (!user) {
        return ApiResponseHandler.customError(res, "User not found", 404, "USER_NOT_FOUND");
      }

      const skip = (Number(page) - 1) * Number(limit);

      // Build where clause based on user type
      const whereClause: any = {};

      if (isCreator(user.user_type) && my_webinars === "true") {
        // Creators viewing their own webinars (creator dashboard)
        whereClause.creator_id = userId;

        // Apply status filter if provided
        if (status) {
          whereClause.status = status;
        }
      } else {
        // All users (including creators browsing) see only published webinars
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
            enrollments: isUser(user.user_type) ? {
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
        const isEnrolled = isUser(user.user_type) &&
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
          enrollments: isUser(user.user_type) ? {
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
      if (isCreator(user.user_type) && webinar.creator_id !== userId) {
        return ApiResponseHandler.customError(res, "You don't have access to this webinar", 403, "FORBIDDEN");
      }

      if (isUser(user.user_type) && webinar.status !== "PUBLISHED") {
        return ApiResponseHandler.customError(res, "Webinar not available", 403, "WEBINAR_NOT_AVAILABLE");
      }

      const isEnrolled = isUser(user.user_type) &&
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
      start_time,
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
      if (start_time !== undefined) {
        const parsedStart = parseTimeString(start_time);
        if (start_time !== "" && parsedStart === null) {
          return ApiResponseHandler.customError(res, "start_time must be in HH:MM format (e.g. 15:00)", 400, "INVALID_START_TIME");
        }
        updateData.start_time = parsedStart;
      }

      // Calculate end_time from start_time + duration (same "HH:MM" format)
      const effectiveStartTime = updateData.start_time ?? (existingWebinar as { start_time?: string | null }).start_time;
      const effectiveDuration = updateData.duration ?? existingWebinar.duration ?? 0;
      if (effectiveStartTime && typeof effectiveDuration === "number" && effectiveDuration >= 0) {
        updateData.end_time = calculateEndTime(effectiveStartTime, effectiveDuration);
      }

      // scheduled_at = date from scheduled_at + time from start_time (so not 12 AM)
      const effectiveStartTimeForDate = updateData.start_time ?? (existingWebinar as { start_time?: string | null }).start_time;
      if (scheduled_at) {
        let baseDate = new Date(scheduled_at);
        if (effectiveStartTimeForDate) {
          baseDate = combineDateWithTime(baseDate, effectiveStartTimeForDate);
        }
        if (baseDate <= new Date()) {
          return ApiResponseHandler.customError(res, "Scheduled date must be in the future", 400, "INVALID_SCHEDULE");
        }
        updateData.scheduled_at = baseDate;

        // Update Zoom meeting if it exists
        if (existingWebinar.zoom_meeting_id) {
          try {
            await zoomManager.updateMeeting(existingWebinar.zoom_meeting_id, {
              start_time: baseDate.toISOString(),
              duration: duration ?? existingWebinar.duration ?? 60
            });
          } catch (error) {
            console.error('Error updating Zoom meeting:', error);
          }
        }
      } else if (effectiveStartTimeForDate) {
        // Only start_time updated: combine existing scheduled_at date with new start_time
        updateData.scheduled_at = combineDateWithTime(existingWebinar.scheduled_at, effectiveStartTimeForDate);

        if (existingWebinar.zoom_meeting_id) {
          try {
            await zoomManager.updateMeeting(existingWebinar.zoom_meeting_id, {
              start_time: updateData.scheduled_at.toISOString(),
              duration: updateData.duration ?? existingWebinar.duration ?? 60
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
              start_time: (updateData.scheduled_at ?? existingWebinar.scheduled_at).toISOString(),
              duration: duration ?? existingWebinar.duration ?? 60,
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

      if (!isUser(user.user_type)) {
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

      // Create Cashfree order for paid webinars
      const orderId = `webinar_${webinarId}_${Date.now()}`;
      const orderAmount = parseFloat(Number(req.body.amount || webinar.price).toFixed(2));

      const orderRequest = {
        order_id: orderId,
        order_amount: orderAmount,
        order_currency: "INR",
        customer_details: {
          customer_id: userId,
          customer_phone: user.phone || "9999999999",
          customer_name: user.name || undefined,
          customer_email: user.email,
        },
        order_meta: {
          return_url: `${process.env.APP_URL || 'https://manchly.com'}/payment/return?order_id={order_id}`,
          notify_url: `${process.env.APP_URL || 'https://server.manchly.com'}/payments/webhook`,
        },
        order_note: `Webinar: ${webinar.title}`,
        order_tags: {
          user_id: userId,
          webinar_id: webinarId,
          type: "webinar",
        },
      };

      const cashfreeOrder = await cashfreePG.PGCreateOrder(orderRequest);
      const orderData = cashfreeOrder.data;

      // Create transaction record in database
      const transaction = await prisma.webinar_transactions.create({
        data: {
          user_id: userId,
          webinar_id: webinarId,
          amount: orderAmount,
          currency: "INR",
          status: "PENDING",
          payment_method: "CASHFREE",
          cashfree_order_id: orderId,
          payment_details: JSON.parse(JSON.stringify({
            cashfree_order: orderData
          }))
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
        webinar_details: {
          id: webinar.id,
          title: webinar.title,
          price: webinar.price,
          thumbnail: webinar.thumbnail,
          scheduled_at: webinar.scheduled_at
        }
      }, "Cashfree order created successfully", 201);

    } catch (err: any) {
      console.error("Error creating Cashfree order:", err);
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Verify payment and create webinar enrollment
   */
  static async verifyWebinarPayment(req: any, res: Response) {
    const { order_id } = req.body;
    const userId = req.user.userId;

    if (!order_id) {
      return ApiResponseHandler.customError(res, "Missing order_id", 400, "MISSING_ORDER_ID");
    }

    try {
      // Find transaction
      const transaction = await prisma.webinar_transactions.findUnique({
        where: { cashfree_order_id: order_id },
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
        // Webhook may have already processed this payment — return success
        const existingEnrollment = await prisma.webinar_enrollments.findUnique({
          where: {
            user_id_webinar_id: {
              user_id: userId,
              webinar_id: transaction.webinar_id
            }
          },
          include: {
            webinar: {
              include: {
                creator: { select: { id: true, name: true, email: true } }
              }
            }
          }
        });

        return ApiResponseHandler.success(res, {
          enrollment: existingEnrollment,
          transaction,
          message: "Payment already verified and enrollment exists"
        }, "Payment verified successfully", 200);
      }

      // Verify order status with Cashfree server-to-server
      const orderResponse = await cashfreePG.PGFetchOrder(order_id);
      const orderData = orderResponse.data;

      if (orderData.order_status !== "PAID") {
        if (orderData.order_status === "EXPIRED") {
          await prisma.webinar_transactions.update({
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
      const updatedTransaction = await prisma.webinar_transactions.update({
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

      // Credit creator's wallet
      SettlementService.creditCreatorWallet({
        creatorId: transaction.webinar.creator.id,
        grossAmount: transaction.webinar.price,
        transactionType: "WEBINAR",
        transactionId: transaction.id,
        webinarId: transaction.webinar_id,
        itemTitle: transaction.webinar.title,
      }).catch(err => console.error("Wallet credit error:", err));

      // Send notifications (don't wait for them)
      WebinarController.sendEnrollmentNotifications(transaction.user, transaction.webinar).catch(err => {
        console.error('Error sending enrollment notifications:', err);
      });

      console.log(`New webinar enrollment! User ${userId} enrolled in "${transaction.webinar.title}"`);

      ApiResponseHandler.success(res, {
        enrollment,
        transaction: updatedTransaction,
        wallet_info: {
          title: "Payment received",
          message: "Money will be submitted to your account after T+1 settlement period"
        },
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

      if (!user || !isCreator(user.user_type)) {
        return ApiResponseHandler.customError(res, "Only creators can view statistics", 403, "FORBIDDEN");
      }

      const [totalWebinars, publishedWebinars, upcomingWebinars, totalEnrollments, webinarsSold] = await Promise.all([
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
        }),
        prisma.webinars.count({
          where: {
            creator_id: userId,
            enrollments: {
              some: {}
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
          webinars_sold: webinarsSold,
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
   * Send enrollment notifications (Email & WhatsApp) using new templates
   */
  private static async sendEnrollmentNotifications(user: any, webinar: any): Promise<void> {
    try {
      const scheduledDate = new Date(webinar.scheduled_at);
      const tz = webinar.timezone || 'Asia/Kolkata';

      const dateStr = scheduledDate.toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric', timeZone: tz,
      });
      const dayStr = scheduledDate.toLocaleDateString('en-IN', {
        weekday: 'long', timeZone: tz,
      });
      const timeStr = scheduledDate.toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: tz, timeZoneName: 'short',
      });

      // Get creator name
      const creator = webinar.creator || {};

      await notificationService.sendWebinarPurchaseNotification({
        joineeName: user.name || 'there',
        joineeEmail: user.email,
        joineePhone: user.phone || undefined,
        webinarName: webinar.title,
        date: dateStr,
        day: dayStr,
        time: timeStr,
        webinarLink: webinar.zoom_join_url || '',
        password: webinar.zoom_password || '',
        hostName: creator.name || 'Manchly',
      });

      console.log('✅ Webinar enrollment notifications sent');
    } catch (error) {
      console.error('Error sending enrollment notifications:', error);
    }
  }
}

