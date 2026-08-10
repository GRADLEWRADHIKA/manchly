import { Request, Response } from "express";
import prisma from "../prismaClient";
import { ApiResponseHandler } from "../utils/ApiResponseHandler";
import ZoomMeetingManager, {
  createZoomMeetingManager,
  getZoomConfigurationStatus,
} from "../utils/zoomManager";
import { isCreator, isUser } from "../utils/userTypeHelper";
import { SettlementService } from "../services/settlementService";
import { notificationService } from "../services/NotificationService";
import { cashfreePG } from "../services/cashfreeService";
import { NotificationController } from "./notificationController";
import { isAccessExpired, computeAccessExpiry, parseAccessPolicyInput } from "../utils/accessExpiry";
import MuxManager from "../utils/MuxManager";
import { resolveUserByIdOrPhone } from "../utils/userLookup";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const zoomManager = createZoomMeetingManager();

const muxManager = new MuxManager({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
  webhookSecret: process.env.MUX_WEBHOOK_SECRET,
  timeout: 30000,
});

function ensureZoomConfigured(res: Response): boolean {
  const status = getZoomConfigurationStatus();
  if (status.isConfigured) {
    return true;
  }

  console.error(
    `[Zoom] Webinar publish blocked — missing configuration: ${status.missing.join(", ")}`
  );
  ApiResponseHandler.customError(
    res,
    `Zoom is not configured. Missing: ${status.missing.join(", ")}. ${"Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET in your environment."}`,
    503,
    "ZOOM_NOT_CONFIGURED",
    { missing: status.missing }
  );
  return false;
}

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
        if (!ensureZoomConfigured(res)) {
          return;
        }

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
          access_duration_days: parseAccessPolicyInput(req.body).access_duration_days,
          access_expires_at: parseAccessPolicyInput(req.body).access_expires_at,
          whatsapp_community_url: req.body.whatsapp_community_url?.trim() || null,
          thankyou_message: req.body.thankyou_message?.trim() || null,
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

      // Check access permissions — webinar creator always has full access
      const isOwner = webinar.creator_id === userId;

      if (!isOwner && isCreator(user.user_type)) {
        return ApiResponseHandler.customError(res, "You don't have access to this webinar", 403, "FORBIDDEN");
      }

      if (!isOwner && webinar.status !== "PUBLISHED") {
        return ApiResponseHandler.customError(res, "Webinar not available", 403, "WEBINAR_NOT_AVAILABLE");
      }

      const enrollment = isUser(user.user_type) &&
        webinar.enrollments &&
        webinar.enrollments.length > 0
        ? webinar.enrollments[0]
        : null;

      // Access-expiry (Feature #8): an expired enrollment loses access
      const accessExpired = enrollment
        ? isAccessExpired(webinar, enrollment.enrolled_at)
        : false;
      const accessExpiresAt = enrollment
        ? computeAccessExpiry(webinar, enrollment.enrolled_at)
        : null;

      const isEnrolled = !!enrollment && !accessExpired;

      // Feature #8: the expiry gate must actually withhold the Zoom join
      // credentials, not just flip a flag. Only the owner or a currently-enrolled
      // (non-expired) user may see the join URL/password; the host start URL is
      // owner-only. Without this, expired — and even non-enrolled — viewers could
      // read the join link straight off the response.
      const canJoin = isOwner || isEnrolled;
      const safeWebinar: any = { ...webinar };
      safeWebinar.zoom_start_url = isOwner ? webinar.zoom_start_url : null;
      if (!canJoin) {
        safeWebinar.zoom_join_url = null;
        safeWebinar.zoom_password = null;
        safeWebinar.zoom_meeting_id = null;
      }

      ApiResponseHandler.success(res, {
        webinar: {
          ...safeWebinar,
          is_enrolled: isEnrolled,
          access_expired: accessExpired,
          access_expires_at: accessExpiresAt,
          enrollment_info: enrollment,
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
      if (req.body.access_duration_days !== undefined) {
        updateData.access_duration_days = parseAccessPolicyInput(req.body).access_duration_days;
      }
      if (req.body.access_expires_at !== undefined) {
        updateData.access_expires_at = parseAccessPolicyInput(req.body).access_expires_at;
      }
      if (req.body.whatsapp_community_url !== undefined) {
        updateData.whatsapp_community_url = req.body.whatsapp_community_url?.trim() || null;
      }
      if (req.body.thankyou_message !== undefined) {
        updateData.thankyou_message = req.body.thankyou_message?.trim() || null;
      }
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
          if (!ensureZoomConfigured(res)) {
            return;
          }

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

      // In-app notifications
      NotificationController.createNotification({
        userId,
        type: "WEBINAR",
        title: "Webinar Enrolled",
        message: `You have successfully enrolled in "${transaction.webinar.title}".`,
        data: { webinarId: transaction.webinar_id },
      }).catch(err => console.error("Notification error:", err));

      NotificationController.createNotification({
        userId: transaction.webinar.creator.id,
        type: "SALE",
        title: "New Webinar Enrollment",
        message: `${transaction.user?.name || "A user"} enrolled in your "${transaction.webinar.title}" webinar for Rs. ${transaction.amount}.`,
        data: { webinarId: transaction.webinar_id, buyerId: userId },
      }).catch(err => console.error("Notification error:", err));

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
   * Manually grant a user access to a webinar without payment.
   * Allowed for the webinar owner (creator) or an ADMIN.
   * The target user is identified by `user_id` or `phone` in the body.
   * Creates a webinar_enrollment with a null `transaction_id`, which is how a
   * manual/comp grant is distinguished from a paid enrollment.
   */
  static async grantWebinarAccess(req: any, res: Response) {
    const { webinarId } = req.params;
    const requesterId = req.user.userId;
    const { user_id, phone } = req.body;

    try {
      if (!user_id && !phone) {
        return ApiResponseHandler.customError(res, "Provide a user_id or phone to grant access to", 400, "MISSING_TARGET");
      }

      const webinar = await prisma.webinars.findUnique({ where: { id: webinarId } });
      if (!webinar) {
        return ApiResponseHandler.customError(res, "Webinar not found", 404, "WEBINAR_NOT_FOUND");
      }

      // Authorization: only the webinar owner or an admin may grant access
      const requester = await prisma.users.findUnique({
        where: { id: requesterId },
        select: { user_type: true },
      });
      const isAdmin = requester?.user_type?.some(t => t === "ADMIN") ?? false;
      if (webinar.creator_id !== requesterId && !isAdmin) {
        return ApiResponseHandler.customError(res, "You don't have permission to grant access to this webinar", 403, "FORBIDDEN");
      }

      // Resolve the target user (tolerates country-code/format differences in
      // how the phone was stored — a bare 10-digit lookup still matches a
      // stored "+91…" variant of the same number).
      const targetUser = await resolveUserByIdOrPhone({ user_id, phone });
      if (!targetUser) {
        return ApiResponseHandler.customError(res, "No user found for the given identifier", 404, "USER_NOT_FOUND");
      }

      // Idempotent: if the user already has access, return the existing enrollment
      const existing = await prisma.webinar_enrollments.findUnique({
        where: { user_id_webinar_id: { user_id: targetUser.id, webinar_id: webinarId } },
      });
      if (existing) {
        return ApiResponseHandler.success(res, { enrollment: existing, alreadyEnrolled: true }, "User already has access to this webinar", 200);
      }

      // Create a manual enrollment (no payment — transaction_id stays null).
      // Guard the race where two concurrent grants both pass the check above:
      // the unique constraint then just means "already enrolled", not a 500.
      let enrollment;
      try {
        enrollment = await prisma.webinar_enrollments.create({
          data: {
            user_id: targetUser.id,
            webinar_id: webinarId,
          },
        });
      } catch (createErr: any) {
        if (createErr?.code === "P2002") {
          const now = await prisma.webinar_enrollments.findUnique({
            where: { user_id_webinar_id: { user_id: targetUser.id, webinar_id: webinarId } },
          });
          return ApiResponseHandler.success(res, { enrollment: now, alreadyEnrolled: true }, "User already has access to this webinar", 200);
        }
        throw createErr;
      }

      // Notify the user they've been granted access
      NotificationController.createNotification({
        userId: targetUser.id,
        type: "WEBINAR",
        title: "Webinar Access Granted",
        message: `You've been given access to "${webinar.title}".`,
        data: { webinarId },
      }).catch(err => console.error("Notification error:", err));

      return ApiResponseHandler.success(res, { enrollment }, "Access granted successfully", 201);
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Submit (or update) a review for a webinar. Only enrolled users may review.
   */
  static async reviewWebinar(req: any, res: Response) {
    try {
      const userId = req.user.userId;
      const { webinarId } = req.params;
      const { rating, comment } = req.body;

      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return ApiResponseHandler.customError(res, "Rating must be an integer between 1 and 5", 400, "INVALID_RATING");
      }

      const webinar = await prisma.webinars.findUnique({ where: { id: webinarId } });
      if (!webinar) {
        return ApiResponseHandler.customError(res, "Webinar not found", 404, "WEBINAR_NOT_FOUND");
      }

      // A webinar can only be reviewed once it has actually taken place — block
      // reviews on cancelled or not-yet-started webinars from skewing the average.
      // (Webinars are never marked COMPLETED in code, so gate on the schedule.)
      if (webinar.status === "CANCELLED" || webinar.scheduled_at.getTime() > Date.now()) {
        return ApiResponseHandler.customError(res, "You can review a webinar only after it has taken place", 400, "WEBINAR_NOT_STARTED");
      }

      // Only enrolled users can review
      const enrollment = await prisma.webinar_enrollments.findUnique({
        where: { user_id_webinar_id: { user_id: userId, webinar_id: webinarId } },
      });
      if (!enrollment) {
        return ApiResponseHandler.customError(res, "Only enrolled users can review this webinar", 403, "NOT_ENROLLED");
      }

      const existing = await prisma.webinar_reviews.findUnique({
        where: { webinar_id_reviewer_id: { webinar_id: webinarId, reviewer_id: userId } },
      });

      // upsert is atomic on the (webinar_id, reviewer_id) unique key, so a
      // concurrent double-submit updates the row instead of 500-ing on the
      // constraint.
      const review = await prisma.webinar_reviews.upsert({
        where: { webinar_id_reviewer_id: { webinar_id: webinarId, reviewer_id: userId } },
        update: { rating, comment: comment?.trim() || null },
        create: {
          webinar_id: webinarId,
          reviewer_id: userId,
          creator_id: webinar.creator_id,
          rating,
          comment: comment?.trim() || null,
        },
      });

      // Notify the creator only when a review is first created
      if (!existing) {
        NotificationController.createNotification({
          userId: webinar.creator_id,
          type: "WEBINAR",
          title: "New Webinar Review",
          message: `You received a ${rating}-star review on "${webinar.title}".`,
          data: { webinarId, rating },
        }).catch(err => console.error("Notification error:", err));
      }

      return ApiResponseHandler.success(
        res,
        { review, updated: !!existing },
        existing ? "Review updated" : "Review submitted",
        existing ? 200 : 201,
      );
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * List reviews for a webinar (most recent first) with reviewer info.
   */
  static async getWebinarReviews(req: any, res: Response) {
    try {
      const { webinarId } = req.params;

      const reviews = await prisma.webinar_reviews.findMany({
        where: { webinar_id: webinarId },
        orderBy: { created_at: "desc" },
        take: 50,
      });

      const reviewerIds = [...new Set(reviews.map(r => r.reviewer_id))];
      const users = reviewerIds.length
        ? await prisma.users.findMany({
            where: { id: { in: reviewerIds } },
            select: { id: true, name: true, profile_image: true },
          })
        : [];
      const userMap = new Map(users.map(u => [u.id, u]));

      const data = reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        reviewer: userMap.get(r.reviewer_id) || null,
      }));
      // Count + average over ALL reviews, not just the 50 returned for display.
      // For webinars this is the only average source (no cached field), so the
      // truncated math would otherwise be wrong past 50 reviews.
      const agg = await prisma.webinar_reviews.aggregate({
        where: { webinar_id: webinarId },
        _avg: { rating: true },
        _count: true,
      });
      const average = Math.round((agg._avg.rating ?? 0) * 10) / 10;

      return ApiResponseHandler.success(res, { reviews: data, count: agg._count, average }, "Reviews retrieved");
    } catch (err: any) {
      ApiResponseHandler.unexpectedError(res, err, 500);
    }
  }

  /**
   * Publish a webinar's recording as a course and auto-enroll its registrants
   * (Feature #7). Creator-owner or admin. The recording is ingested into Mux from
   * `recording_url` (must be a URL Mux can pull — e.g. a Zoom download URL with an
   * access token, or a re-hosted file).
   */
  static async publishRecording(req: any, res: Response) {
    try {
      const userId = req.user.userId;
      const { webinarId } = req.params;
      const {
        recording_url,
        title,
        description,
        price = 0,
        auto_enroll = true,
        publish = true,
        access_duration_days,
        access_expires_at,
      } = req.body;

      if (!recording_url) {
        return ApiResponseHandler.customError(res, "recording_url is required", 400, "MISSING_RECORDING_URL");
      }

      const webinar = await prisma.webinars.findUnique({ where: { id: webinarId } });
      if (!webinar) {
        return ApiResponseHandler.customError(res, "Webinar not found", 404, "WEBINAR_NOT_FOUND");
      }

      // Authorization: only the webinar owner or an admin may publish
      const requester = await prisma.users.findUnique({
        where: { id: userId },
        select: { user_type: true },
      });
      const isAdmin = requester?.user_type?.some(t => t === "ADMIN") ?? false;
      if (webinar.creator_id !== userId && !isAdmin) {
        return ApiResponseHandler.customError(res, "You don't have permission to publish this webinar's recording", 403, "FORBIDDEN");
      }

      // Ingest the recording into Mux (Mux pulls from the URL)
      let asset: any;
      try {
        asset = await muxManager.createAsset({ input: recording_url });
      } catch (e: any) {
        return ApiResponseHandler.customError(res, `Failed to ingest recording into Mux: ${e?.message || "unknown error"}`, 502, "MUX_INGEST_FAILED");
      }
      const playbackId = asset?.playback_ids?.[0]?.id || null;

      const accessPolicy = parseAccessPolicyInput({ access_duration_days, access_expires_at });
      const courseTitle = title?.trim() || `${webinar.title} (Recording)`;

      // Create the course from the webinar's metadata
      const course = await prisma.courses.create({
        data: {
          title: courseTitle,
          description: description?.trim() || webinar.description || null,
          thumbnail: webinar.thumbnail,
          thumbnail_url: webinar.thumbnail_url,
          price: Number(price) || 0,
          category: "webinar-recording",
          status: publish ? "PUBLISHED" : "DRAFT",
          creator_id: webinar.creator_id,
          published_at: publish ? new Date() : null,
          access_duration_days: accessPolicy.access_duration_days,
          access_expires_at: accessPolicy.access_expires_at,
          whatsapp_community_url: webinar.whatsapp_community_url,
          thankyou_message: webinar.thankyou_message,
        },
      });

      // Attach the recording as the course's first video
      const video = await prisma.videos.create({
        data: {
          course_id: course.id,
          title: courseTitle,
          description: webinar.description || null,
          mux_asset_id: asset?.id || null,
          mux_playback_id: playbackId,
          playback_url: playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : null,
          thumbnail_url: playbackId ? `https://image.mux.com/${playbackId}/thumbnail.jpg` : webinar.thumbnail_url,
          duration: asset?.duration ? Math.round(asset.duration) : null,
          status: asset?.status === "ready" ? "READY" : "PROCESSING",
          order: 0,
          is_free: false,
        },
      });

      // Auto-enroll all webinar registrants into the new course
      let enrolledCount = 0;
      if (auto_enroll) {
        const registrants = await prisma.webinar_enrollments.findMany({
          where: { webinar_id: webinarId },
          select: { user_id: true },
        });
        if (registrants.length) {
          const result = await prisma.enrollments.createMany({
            data: registrants.map(r => ({ user_id: r.user_id, course_id: course.id })),
            skipDuplicates: true,
          });
          enrolledCount = result.count;

          // Notify each registrant the recording is available (fire-and-forget)
          registrants.forEach(r => {
            NotificationController.createNotification({
              userId: r.user_id,
              type: "COURSE",
              title: "Webinar Recording Available",
              message: `The recording of "${webinar.title}" is now available as a course.`,
              data: { courseId: course.id },
            }).catch(err => console.error("Notification error:", err));
          });
        }
      }

      return ApiResponseHandler.success(
        res,
        { course, video, enrolled_count: enrolledCount },
        "Recording published as course",
        201,
      );
    } catch (err: any) {
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

