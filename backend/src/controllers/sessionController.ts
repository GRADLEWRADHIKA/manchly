import { Response } from "express";
import prisma from "../prismaClient";
import { JWTRequest } from "../middleware/jwtAuth";
import { cashfreePG } from "../services/cashfreeService";
import { SettlementService } from "../services/settlementService";
import { NotificationController } from "./notificationController";
import dotenv from "dotenv";

dotenv.config();

const userSelect = { id: true, name: true, email: true, profile_image: true };

export class SessionController {
  // Create a session (caller initiates)
  static async createSession(req: JWTRequest, res: Response) {
    try {
      const callerId = req.user!.userId;
      const { receiver_id, mode, rate_per_min } = req.body;

      if (!receiver_id || !mode) {
        return res.status(400).json({ error: "receiver_id and mode are required" });
      }

      const callId = `session_${callerId}_${receiver_id}_${Date.now()}`;

      const session = await prisma.sessions.create({
        data: {
          call_id: callId,
          caller_id: callerId,
          receiver_id,
          mode: mode === "video" ? "VIDEO" : "CALL",
          rate_per_min: rate_per_min || 0,
          status: "PENDING",
        },
      });

      // Fetch with user info
      const [caller, receiver] = await Promise.all([
        prisma.users.findUnique({ where: { id: callerId }, select: userSelect }),
        prisma.users.findUnique({ where: { id: receiver_id }, select: userSelect }),
      ]);

      return res.status(201).json({ data: { ...session, caller, receiver } });
    } catch (err: any) {
      console.error("createSession error:", err);
      return res.status(500).json({ error: "Failed to create session" });
    }
  }

  // Accept a session (receiver joins)
  static async acceptSession(req: JWTRequest, res: Response) {
    try {
      const { session_id } = req.params;

      const session = await prisma.sessions.update({
        where: { id: session_id },
        data: {
          status: "ACTIVE",
          started_at: new Date(),
        },
      });

      return res.json({ data: session });
    } catch (err: any) {
      console.error("acceptSession error:", err);
      return res.status(500).json({ error: "Failed to accept session" });
    }
  }

  // End a session
  static async endSession(req: JWTRequest, res: Response) {
    try {
      const { session_id } = req.params;
      const { duration } = req.body;

      const existing = await prisma.sessions.findUnique({
        where: { id: session_id },
      });

      if (!existing) {
        return res.status(404).json({ error: "Session not found" });
      }

      const finalDuration = duration || 0;
      const amount = finalDuration * existing.rate_per_min;

      const session = await prisma.sessions.update({
        where: { id: session_id },
        data: {
          status: "COMPLETED",
          ended_at: new Date(),
          duration: finalDuration,
          amount,
        },
      });

      return res.json({ data: session });
    } catch (err: any) {
      console.error("endSession error:", err);
      return res.status(500).json({ error: "Failed to end session" });
    }
  }

  // Rate a session expert after call
  static async rateSession(req: JWTRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { session_id, rating, feedback } = req.body;

      if (!session_id || !rating) {
        return res.status(400).json({ error: "session_id and rating are required" });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      const session = await prisma.sessions.findUnique({ where: { id: session_id } });
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (session.caller_id !== userId) {
        return res.status(403).json({ error: "Only the caller can rate the session" });
      }

      // Update expert's rating (running average)
      const expert = await prisma.session_experts.findUnique({ where: { user_id: session.receiver_id } });
      if (expert) {
        const newCount = expert.review_count + 1;
        const newRating = ((expert.rating * expert.review_count) + rating) / newCount;

        await prisma.session_experts.update({
          where: { user_id: session.receiver_id },
          data: {
            rating: Math.round(newRating * 10) / 10,
            review_count: newCount,
          },
        });
      }

      // Notify the expert about the review
      NotificationController.createNotification({
        userId: session.receiver_id,
        type: "SESSION",
        title: "New Review",
        message: `You received a ${rating}-star review on your consultation session.`,
        data: { sessionId: session_id, rating },
      }).catch(err => console.error("Notification error:", err));

      return res.json({
        data: {
          message: "Rating submitted successfully",
          rating,
          feedback: feedback || null,
        },
      });
    } catch (err: any) {
      console.error("rateSession error:", err);
      return res.status(500).json({ error: "Failed to submit rating" });
    }
  }

  // Get my sessions (as caller or receiver) with user names
  static async getMySessions(req: JWTRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { role, status, page = "1", limit = "20" } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const where: any = {};

      if (role === "caller") {
        where.caller_id = userId;
      } else if (role === "receiver") {
        where.receiver_id = userId;
      } else {
        where.OR = [{ caller_id: userId }, { receiver_id: userId }];
      }

      if (status) {
        where.status = (status as string).toUpperCase();
      }

      const [sessions, total] = await Promise.all([
        prisma.sessions.findMany({
          where,
          orderBy: { created_at: "desc" },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.sessions.count({ where }),
      ]);

      // Collect unique user IDs and fetch names
      const userIds = new Set<string>();
      sessions.forEach((s) => {
        userIds.add(s.caller_id);
        userIds.add(s.receiver_id);
      });

      const users = await prisma.users.findMany({
        where: { id: { in: Array.from(userIds) } },
        select: userSelect,
      });

      const userMap = new Map(users.map((u) => [u.id, u]));

      const enriched = sessions.map((s) => ({
        ...s,
        caller: userMap.get(s.caller_id) || null,
        receiver: userMap.get(s.receiver_id) || null,
      }));

      return res.json({
        data: {
          sessions: enriched,
          total,
          page: pageNum,
          limit: limitNum,
        },
      });
    } catch (err: any) {
      console.error("getMySessions error:", err);
      return res.status(500).json({ error: "Failed to fetch sessions" });
    }
  }

  // Get session stats
  static async getSessionStats(req: JWTRequest, res: Response) {
    try {
      const userId = req.user!.userId;

      const sessions = await prisma.sessions.findMany({
        where: {
          OR: [{ caller_id: userId }, { receiver_id: userId }],
          status: "COMPLETED",
        },
      });

      const totalSessions = sessions.length;
      const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
      const totalEarnings = sessions.reduce((sum, s) => sum + s.amount, 0);

      return res.json({
        data: {
          total_sessions: totalSessions,
          total_minutes: totalMinutes,
          total_earnings: totalEarnings,
        },
      });
    } catch (err: any) {
      console.error("getSessionStats error:", err);
      return res.status(500).json({ error: "Failed to fetch stats" });
    }
  }

  // Get session by call_id
  static async getByCallId(req: JWTRequest, res: Response) {
    try {
      const { call_id } = req.params;

      const session = await prisma.sessions.findUnique({
        where: { call_id },
      });

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const [caller, receiver] = await Promise.all([
        prisma.users.findUnique({ where: { id: session.caller_id }, select: userSelect }),
        prisma.users.findUnique({ where: { id: session.receiver_id }, select: userSelect }),
      ]);

      return res.json({ data: { ...session, caller, receiver } });
    } catch (err: any) {
      console.error("getByCallId error:", err);
      return res.status(500).json({ error: "Failed to fetch session" });
    }
  }

  // ============ SESSION EXPERTS ============

  // Check if creator is registered as expert
  static async getMyExpertProfile(req: JWTRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const expert = await prisma.session_experts.findUnique({ where: { user_id: userId } });
      return res.json({ data: expert });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch expert profile" });
    }
  }

  // Register as session expert
  static async registerAsExpert(req: JWTRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { profession, bio, categories, experience, audio_rate, video_rate, languages } = req.body;

      const effectiveAudioRate = audio_rate || video_rate;
      if (!profession || !effectiveAudioRate) {
        return res.status(400).json({ error: "profession and audio_rate or video_rate are required" });
      }

      const existing = await prisma.session_experts.findUnique({ where: { user_id: userId } });
      if (existing) {
        return res.status(400).json({ error: "Already registered as expert" });
      }

      const expert = await prisma.session_experts.create({
        data: {
          user_id: userId,
          profession,
          bio: bio || null,
          categories: categories || [],
          experience: experience || 0,
          audio_rate: effectiveAudioRate,
          video_rate: video_rate || effectiveAudioRate,
          languages: languages || [],
          is_active: true,
          is_available: true,
        },
      });

      return res.status(201).json({ data: expert });
    } catch (err: any) {
      console.error("registerAsExpert error:", err);
      return res.status(500).json({ error: "Failed to register as expert" });
    }
  }

  // Update expert profile
  static async updateExpertProfile(req: JWTRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const fields = req.body;
      const data: any = {};

      const allowed = ["profession", "bio", "categories", "experience", "audio_rate", "video_rate", "languages", "is_active", "is_available"];
      for (const k of allowed) {
        if (fields[k] !== undefined) data[k] = fields[k];
      }

      const expert = await prisma.session_experts.update({
        where: { user_id: userId },
        data,
      });

      return res.json({ data: expert });
    } catch (err: any) {
      console.error("updateExpertProfile error:", err);
      return res.status(500).json({ error: "Failed to update expert profile" });
    }
  }

  // Public: list all active experts
  static async listExperts(req: JWTRequest, res: Response) {
    try {
      const { category, page = "1", limit = "20", search } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const where: any = { is_active: true, is_available: true };
      if (category) {
        where.categories = { has: category as string };
      }

      const experts = await prisma.session_experts.findMany({
        where,
        orderBy: [{ is_available: "desc" }, { rating: "desc" }],
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      });

      // Fetch user info
      const userIds = experts.map((e) => e.user_id);
      const users = await prisma.users.findMany({
        where: { id: { in: userIds } },
        select: { ...userSelect, user_type: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));

      let enriched = experts.map((e) => ({
        ...e,
        user: userMap.get(e.user_id) || null,
      }));

      // Client-side search by name/profession
      if (search) {
        const q = (search as string).toLowerCase();
        enriched = enriched.filter(
          (e) =>
            e.user?.name?.toLowerCase().includes(q) ||
            e.profession.toLowerCase().includes(q),
        );
      }

      const total = await prisma.session_experts.count({ where });

      return res.json({ data: { experts: enriched, total, page: pageNum, limit: limitNum } });
    } catch (err: any) {
      console.error("listExperts error:", err);
      return res.status(500).json({ error: "Failed to list experts" });
    }
  }

  // Public: get single expert detail
  static async getExpertDetail(req: JWTRequest, res: Response) {
    try {
      const { expert_id } = req.params;
      const expert = await prisma.session_experts.findUnique({ where: { id: expert_id } });
      if (!expert) return res.status(404).json({ error: "Expert not found" });

      const user = await prisma.users.findUnique({
        where: { id: expert.user_id },
        select: { ...userSelect, user_type: true },
      });

      const products = await prisma.session_products.findMany({
        where: { creator_id: expert.user_id, is_active: true },
        orderBy: { created_at: "desc" },
      });

      return res.json({ data: { ...expert, user, products } });
    } catch (err: any) {
      console.error("getExpertDetail error:", err);
      return res.status(500).json({ error: "Failed to fetch expert" });
    }
  }

  // Public: get booked time slots for an expert on a specific date
  static async getBookedSlots(req: JWTRequest, res: Response) {
    try {
      const { expert_id } = req.params;
      const { date } = req.query; // YYYY-MM-DD

      if (!date) {
        return res.status(400).json({ error: "date query param is required (YYYY-MM-DD)" });
      }

      const expert = await prisma.session_experts.findUnique({ where: { id: expert_id } });
      if (!expert) return res.status(404).json({ error: "Expert not found" });

      const targetDate = new Date(date as string);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const sessions = await prisma.sessions.findMany({
        where: {
          receiver_id: expert.user_id,
          scheduled_at: { gte: startOfDay, lte: endOfDay },
          status: { in: ["PENDING", "ACTIVE"] },
        },
        select: {
          scheduled_at: true,
          duration: true,
          mode: true,
          status: true,
        },
        orderBy: { scheduled_at: "asc" },
      });

      const bookedSlots = sessions.map((s) => ({
        scheduled_at: s.scheduled_at,
        duration: s.duration,
        mode: s.mode,
      }));

      return res.json({ data: { booked_slots: bookedSlots } });
    } catch (err: any) {
      console.error("getBookedSlots error:", err);
      return res.status(500).json({ error: "Failed to fetch booked slots" });
    }
  }

  // ============ SESSION PRODUCTS ============

  // Creator: create a session product
  static async createProduct(req: JWTRequest, res: Response) {
    try {
      const creatorId = req.user!.userId;
      const { title, description, duration, price, mode } = req.body;

      if (!title || !duration || !price || !mode) {
        return res.status(400).json({ error: "title, duration, price, mode are required" });
      }

      const product = await prisma.session_products.create({
        data: {
          creator_id: creatorId,
          title,
          description: description || null,
          duration,
          price,
          mode: mode === "video" ? "VIDEO" : "CALL",
        },
      });

      return res.status(201).json({ data: product });
    } catch (err: any) {
      console.error("createProduct error:", err);
      return res.status(500).json({ error: "Failed to create session product" });
    }
  }

  // Creator: get my session products
  static async getMyProducts(req: JWTRequest, res: Response) {
    try {
      const creatorId = req.user!.userId;
      const products = await prisma.session_products.findMany({
        where: { creator_id: creatorId },
        orderBy: { created_at: "desc" },
      });
      return res.json({ data: products });
    } catch (err: any) {
      console.error("getMyProducts error:", err);
      return res.status(500).json({ error: "Failed to fetch products" });
    }
  }

  // Creator: update a session product
  static async updateProduct(req: JWTRequest, res: Response) {
    try {
      const { product_id } = req.params;
      const { title, description, duration, price, mode, is_active } = req.body;

      const data: any = {};
      if (title !== undefined) data.title = title;
      if (description !== undefined) data.description = description;
      if (duration !== undefined) data.duration = duration;
      if (price !== undefined) data.price = price;
      if (mode !== undefined) data.mode = mode === "video" ? "VIDEO" : "CALL";
      if (is_active !== undefined) data.is_active = is_active;

      const product = await prisma.session_products.update({
        where: { id: product_id },
        data,
      });

      return res.json({ data: product });
    } catch (err: any) {
      console.error("updateProduct error:", err);
      return res.status(500).json({ error: "Failed to update product" });
    }
  }

  // Creator: delete a session product
  static async deleteProduct(req: JWTRequest, res: Response) {
    try {
      const { product_id } = req.params;
      await prisma.session_products.delete({ where: { id: product_id } });
      return res.json({ message: "Deleted" });
    } catch (err: any) {
      console.error("deleteProduct error:", err);
      return res.status(500).json({ error: "Failed to delete product" });
    }
  }

  // Public: get session products by creator ID
  static async getCreatorProducts(req: JWTRequest, res: Response) {
    try {
      const { creator_id } = req.params;
      const products = await prisma.session_products.findMany({
        where: { creator_id, is_active: true },
        orderBy: { created_at: "desc" },
      });

      const creator = await prisma.users.findUnique({
        where: { id: creator_id },
        select: userSelect,
      });

      const expert = await prisma.session_experts.findFirst({
        where: { user_id: creator_id, is_active: true },
      });

      return res.json({ data: { products, creator, expert } });
    } catch (err: any) {
      console.error("getCreatorProducts error:", err);
      return res.status(500).json({ error: "Failed to fetch products" });
    }
  }

  // ============ EXPERT AVAILABILITY ============

  // Expert: set weekly availability slots
  static async setAvailability(req: JWTRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { slots } = req.body;
      // slots: [{ day_of_week: 1, start_time: "09:00", end_time: "12:00" }, ...]

      if (!slots || !Array.isArray(slots) || slots.length === 0) {
        return res.status(400).json({ error: "slots array is required" });
      }

      const expert = await prisma.session_experts.findUnique({ where: { user_id: userId } });
      if (!expert) {
        return res.status(404).json({ error: "Expert profile not found. Register as expert first." });
      }

      // Validate slots
      for (const slot of slots) {
        if (slot.day_of_week === undefined || !slot.start_time || !slot.end_time) {
          return res.status(400).json({ error: "Each slot needs day_of_week, start_time, end_time" });
        }
        if (slot.day_of_week < 0 || slot.day_of_week > 6) {
          return res.status(400).json({ error: "day_of_week must be 0-6 (Sun-Sat)" });
        }
        if (!/^\d{2}:\d{2}$/.test(slot.start_time) || !/^\d{2}:\d{2}$/.test(slot.end_time)) {
          return res.status(400).json({ error: "Time must be in HH:MM format" });
        }
        if (slot.start_time >= slot.end_time) {
          return res.status(400).json({ error: "start_time must be before end_time" });
        }
      }

      // Delete existing slots and create new ones (replace strategy)
      await prisma.expert_availability.deleteMany({ where: { expert_id: expert.id } });

      const created = await prisma.expert_availability.createMany({
        data: slots.map((s: any) => ({
          expert_id: expert.id,
          day_of_week: s.day_of_week,
          start_time: s.start_time,
          end_time: s.end_time,
        })),
      });

      const availability = await prisma.expert_availability.findMany({
        where: { expert_id: expert.id },
        orderBy: [{ day_of_week: "asc" }, { start_time: "asc" }],
      });

      return res.status(201).json({ data: availability });
    } catch (err: any) {
      console.error("setAvailability error:", err);
      return res.status(500).json({ error: "Failed to set availability" });
    }
  }

  // Expert: add a single availability slot
  static async addAvailabilitySlot(req: JWTRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { day_of_week, start_time, end_time } = req.body;

      if (day_of_week === undefined || !start_time || !end_time) {
        return res.status(400).json({ error: "day_of_week, start_time, end_time are required" });
      }

      const expert = await prisma.session_experts.findUnique({ where: { user_id: userId } });
      if (!expert) {
        return res.status(404).json({ error: "Expert profile not found" });
      }

      const slot = await prisma.expert_availability.create({
        data: { expert_id: expert.id, day_of_week, start_time, end_time },
      });

      return res.status(201).json({ data: slot });
    } catch (err: any) {
      console.error("addAvailabilitySlot error:", err);
      return res.status(500).json({ error: "Failed to add slot" });
    }
  }

  // Expert: remove an availability slot
  static async removeAvailabilitySlot(req: JWTRequest, res: Response) {
    try {
      const { slot_id } = req.params;
      await prisma.expert_availability.delete({ where: { id: slot_id } });
      return res.json({ message: "Slot removed" });
    } catch (err: any) {
      console.error("removeAvailabilitySlot error:", err);
      return res.status(500).json({ error: "Failed to remove slot" });
    }
  }

  // Expert: get my availability
  static async getMyAvailability(req: JWTRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const expert = await prisma.session_experts.findUnique({ where: { user_id: userId } });
      if (!expert) {
        return res.status(404).json({ error: "Expert profile not found" });
      }

      const availability = await prisma.expert_availability.findMany({
        where: { expert_id: expert.id, is_active: true },
        orderBy: [{ day_of_week: "asc" }, { start_time: "asc" }],
      });

      return res.json({ data: availability });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to fetch availability" });
    }
  }

  // Public: get expert availability + booked slots for a specific date
  static async getExpertAvailability(req: JWTRequest, res: Response) {
    try {
      const { expert_id } = req.params;
      const { date } = req.query; // format: "2026-05-20"

      const expert = await prisma.session_experts.findUnique({ where: { id: expert_id } });
      if (!expert) {
        return res.status(404).json({ error: "Expert not found" });
      }

      const user = await prisma.users.findUnique({
        where: { id: expert.user_id },
        select: userSelect,
      });

      // Get weekly availability schedule
      const weeklySchedule = await prisma.expert_availability.findMany({
        where: { expert_id: expert.id, is_active: true },
        orderBy: [{ day_of_week: "asc" }, { start_time: "asc" }],
      });

      // If a specific date is provided, compute available slots
      if (date) {
        const targetDate = new Date(date as string);
        if (isNaN(targetDate.getTime())) {
          return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
        }

        const dayOfWeek = targetDate.getDay(); // 0=Sun, 6=Sat

        // Get availability for that day
        const daySlots = weeklySchedule.filter((s) => s.day_of_week === dayOfWeek);

        if (daySlots.length === 0) {
          return res.json({
            data: {
              expert: { ...expert, user },
              date: date,
              day_of_week: dayOfWeek,
              day_name: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek],
              is_available_today: false,
              available_slots: [],
              booked_slots: [],
              message: "Expert is not available on this day",
            },
          });
        }

        // Get booked sessions for that date (PENDING or ACTIVE)
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const bookedSessions = await prisma.sessions.findMany({
          where: {
            receiver_id: expert.user_id,
            scheduled_at: { gte: startOfDay, lte: endOfDay },
            status: { in: ["PENDING", "ACTIVE"] },
          },
          orderBy: { scheduled_at: "asc" },
        });

        // Build time slots (30-min intervals) from availability
        const availableSlots: { start_time: string; end_time: string; is_booked: boolean; session_mode?: string }[] = [];

        for (const daySlot of daySlots) {
          const [startH, startM] = daySlot.start_time.split(":").map(Number);
          const [endH, endM] = daySlot.end_time.split(":").map(Number);
          const startMinutes = startH * 60 + startM;
          const endMinutes = endH * 60 + endM;

          // Generate 30-min slots
          for (let m = startMinutes; m + 30 <= endMinutes; m += 30) {
            const slotStart = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
            const slotEnd = `${String(Math.floor((m + 30) / 60)).padStart(2, "0")}:${String((m + 30) % 60).padStart(2, "0")}`;

            // Check if this slot overlaps with any booked session
            const slotStartDate = new Date(targetDate);
            slotStartDate.setHours(Math.floor(m / 60), m % 60, 0, 0);
            const slotEndDate = new Date(targetDate);
            slotEndDate.setHours(Math.floor((m + 30) / 60), (m + 30) % 60, 0, 0);

            const booked = bookedSessions.find((s) => {
              if (!s.scheduled_at) return false;
              const sessionStart = new Date(s.scheduled_at);
              const sessionEnd = new Date(sessionStart.getTime() + s.duration * 60000);
              return sessionStart < slotEndDate && sessionEnd > slotStartDate;
            });

            availableSlots.push({
              start_time: slotStart,
              end_time: slotEnd,
              is_booked: !!booked,
              session_mode: booked ? booked.mode : undefined,
            });
          }
        }

        return res.json({
          data: {
            expert: { ...expert, user },
            date: date,
            day_of_week: dayOfWeek,
            day_name: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek],
            is_available_today: true,
            available_slots: availableSlots,
            booked_slots: bookedSessions.map((s) => ({
              id: s.id,
              scheduled_at: s.scheduled_at,
              duration: s.duration,
              mode: s.mode,
              status: s.status,
            })),
          },
        });
      }

      // No date provided: return full weekly schedule
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const schedule = dayNames.map((name, i) => ({
        day_of_week: i,
        day_name: name,
        slots: weeklySchedule.filter((s) => s.day_of_week === i).map((s) => ({
          id: s.id,
          start_time: s.start_time,
          end_time: s.end_time,
        })),
        is_available: weeklySchedule.some((s) => s.day_of_week === i),
      }));

      return res.json({
        data: {
          expert: { ...expert, user },
          weekly_schedule: schedule,
        },
      });
    } catch (err: any) {
      console.error("getExpertAvailability error:", err);
      return res.status(500).json({ error: "Failed to fetch availability" });
    }
  }

  // User: book a session with payment via Cashfree
  static async bookSession(req: JWTRequest, res: Response) {
    try {
      const callerId = req.user!.userId;
      const { expert_id, mode, duration, scheduled_at } = req.body;

      if (!expert_id) {
        return res.status(400).json({ error: "expert_id is required" });
      }

      if (!scheduled_at) {
        return res.status(400).json({ error: "scheduled_at (date & time) is required" });
      }

      const scheduledDate = new Date(scheduled_at);
      if (isNaN(scheduledDate.getTime())) {
        return res.status(400).json({ error: "Invalid scheduled_at format" });
      }

      const expert = await prisma.session_experts.findUnique({ where: { id: expert_id } });
      if (!expert || !expert.is_active) {
        return res.status(404).json({ error: "Expert not found or inactive" });
      }

      if (callerId === expert.user_id) {
        return res.status(400).json({ error: "You cannot book a session with yourself" });
      }

      const user = await prisma.users.findUnique({ where: { id: callerId } });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const sessionMode = mode === "video" ? "VIDEO" : "CALL";
      const ratePerMin = sessionMode === "VIDEO" ? expert.video_rate : expert.audio_rate;
      const sessionDuration = duration || 30;
      const amount = ratePerMin * sessionDuration;

      const callId = `session_${callerId}_${expert.user_id}_${Date.now()}`;

      // Create the session with payment_status PENDING
      const session = await prisma.sessions.create({
        data: {
          call_id: callId,
          caller_id: callerId,
          receiver_id: expert.user_id,
          mode: sessionMode,
          rate_per_min: ratePerMin,
          amount,
          duration: sessionDuration,
          scheduled_at: scheduledDate,
          status: "PENDING",
          payment_status: amount > 0 ? "PENDING" : "SUCCESS",
        },
      });

      // If free session, return immediately
      if (amount === 0) {
        const [caller, receiver] = await Promise.all([
          prisma.users.findUnique({ where: { id: callerId }, select: userSelect }),
          prisma.users.findUnique({ where: { id: expert.user_id }, select: userSelect }),
        ]);

        // In-app notifications
        NotificationController.createNotification({
          userId: callerId,
          type: "SESSION",
          title: "Session Booked",
          message: `Your free session with ${receiver?.name || "the expert"} has been booked.`,
          data: { sessionId: session.id },
        }).catch(err => console.error("Notification error:", err));

        NotificationController.createNotification({
          userId: expert.user_id,
          type: "SESSION",
          title: "New Session Booking",
          message: `${caller?.name || "A user"} booked a free session with you.`,
          data: { sessionId: session.id },
        }).catch(err => console.error("Notification error:", err));

        return res.status(201).json({
          data: { ...session, caller, receiver, expert, is_free: true },
        });
      }

      // Create Cashfree order for paid session
      const orderId = `sess_${session.id.slice(0, 8)}_${Date.now()}`;

      const orderRequest = {
        order_id: orderId,
        order_amount: parseFloat(amount.toFixed(2)),
        order_currency: "INR",
        customer_details: {
          customer_id: callerId.slice(0, 50),
          customer_phone: (user.phone || "9999999999").replace(/^\+?91/, "").replace(/\D/g, "").slice(-10) || "9999999999",
          customer_name: (user.name || "User").slice(0, 100),
          customer_email: user.email,
        },
        order_meta: {
          return_url: `${process.env.APP_URL || 'https://manchly.com'}/payment/return?order_id={order_id}`,
          notify_url: `${process.env.APP_URL || 'https://server.manchly.com'}/payments/webhook`,
        },
        order_note: `Session with expert`,
        order_tags: {
          user_id: callerId,
          session_id: session.id,
          expert_id: expert.id,
          type: "session",
        },
      };

      const cashfreeOrder = await cashfreePG.PGCreateOrder(orderRequest);
      const orderData = cashfreeOrder.data;

      // Create session transaction record
      const transaction = await prisma.session_transactions.create({
        data: {
          user_id: callerId,
          session_id: session.id,
          expert_id: expert.id,
          amount: parseFloat(amount.toFixed(2)),
          currency: "INR",
          status: "PENDING",
          payment_method: "CASHFREE",
          cashfree_order_id: orderId,
          payment_details: JSON.parse(JSON.stringify({ cashfree_order: orderData })),
        },
      });

      const [caller, receiver] = await Promise.all([
        prisma.users.findUnique({ where: { id: callerId }, select: userSelect }),
        prisma.users.findUnique({ where: { id: expert.user_id }, select: userSelect }),
      ]);

      return res.status(201).json({
        data: {
          ...session,
          caller,
          receiver,
          expert,
          is_free: false,
          transaction,
          cashfree_order: {
            order_id: orderData.order_id,
            payment_session_id: orderData.payment_session_id,
            order_status: orderData.order_status,
          },
          cashfree_pg_app_id: process.env.CASHFREE_PG_APP_ID,
          cashfree_env: process.env.CASHFREE_PG_ENV || "SANDBOX",
        },
      });
    } catch (err: any) {
      const cfDetail = err?.response?.data || err?.data || err?.message || err;
      console.error("bookSession error:", JSON.stringify(cfDetail, null, 2));
      return res.status(500).json({ error: "Failed to book session" });
    }
  }

  // Verify session payment after Cashfree checkout
  static async verifySessionPayment(req: JWTRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const { order_id } = req.body;

      if (!order_id) {
        return res.status(400).json({ error: "order_id is required" });
      }

      const transaction = await prisma.session_transactions.findUnique({
        where: { cashfree_order_id: order_id },
      });

      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (transaction.user_id !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (transaction.status === "SUCCESS") {
        // Webhook may have already processed this payment — return success
        const session = await prisma.sessions.findUnique({
          where: { id: transaction.session_id },
        });
        const [caller, receiver] = await Promise.all([
          prisma.users.findUnique({ where: { id: session!.caller_id }, select: userSelect }),
          prisma.users.findUnique({ where: { id: session!.receiver_id }, select: userSelect }),
        ]);

        return res.json({
          data: {
            session: { ...session, caller, receiver },
            transaction,
            message: "Payment already verified and session booked successfully",
          },
        });
      }

      // Verify with Cashfree
      const orderResponse = await cashfreePG.PGFetchOrder(order_id);
      const orderData = orderResponse.data;

      if (orderData.order_status !== "PAID") {
        if (orderData.order_status === "EXPIRED") {
          await prisma.session_transactions.update({
            where: { id: transaction.id },
            data: { status: "FAILED", failure_reason: "Order expired" },
          });
          // Cancel the session
          await prisma.sessions.update({
            where: { id: transaction.session_id },
            data: { status: "CANCELLED", payment_status: "FAILED" },
          });
        }
        return res.status(400).json({ error: `Payment not completed. Status: ${orderData.order_status}` });
      }

      // Get payment details
      let paymentInfo = null;
      try {
        const paymentsResponse = await cashfreePG.PGOrderFetchPayments(order_id);
        paymentInfo = paymentsResponse.data;
      } catch (e) {
        console.error("Error fetching session payment details:", e);
      }

      const cfPaymentId = paymentInfo?.[0]?.cf_payment_id?.toString() || null;

      // Update transaction as SUCCESS
      const updatedTransaction = await prisma.session_transactions.update({
        where: { id: transaction.id },
        data: {
          status: "SUCCESS",
          cf_payment_id: cfPaymentId,
          completed_at: new Date(),
          payment_details: JSON.parse(JSON.stringify({
            order_info: orderData,
            payment_info: paymentInfo,
          })),
        },
      });

      // Update session payment_status
      const session = await prisma.sessions.update({
        where: { id: transaction.session_id },
        data: { payment_status: "SUCCESS" },
      });

      // Get expert user_id to credit wallet
      const expert = await prisma.session_experts.findUnique({ where: { id: transaction.expert_id } });
      if (expert) {
        SettlementService.creditCreatorWallet({
          creatorId: expert.user_id,
          grossAmount: transaction.amount,
          transactionType: "SESSION",
          transactionId: transaction.id,
          itemTitle: `Session booking`,
        }).catch(err => console.error("Session wallet credit error:", err));

        // Update expert stats
        await prisma.session_experts.update({
          where: { id: expert.id },
          data: {
            total_sessions: { increment: 1 },
            total_earnings: { increment: transaction.amount },
          },
        });
      }

      const [caller, receiver] = await Promise.all([
        prisma.users.findUnique({ where: { id: session.caller_id }, select: userSelect }),
        prisma.users.findUnique({ where: { id: session.receiver_id }, select: userSelect }),
      ]);

      // In-app notifications
      NotificationController.createNotification({
        userId,
        type: "SESSION",
        title: "Session Booked",
        message: `Your session has been booked successfully. Payment of Rs. ${transaction.amount} confirmed.`,
        data: { sessionId: session.id },
      }).catch(err => console.error("Notification error:", err));

      if (expert) {
        NotificationController.createNotification({
          userId: expert.user_id,
          type: "SESSION",
          title: "New Session Booking",
          message: `${caller?.name || "A user"} booked a session with you. Rs. ${transaction.amount} received.`,
          data: { sessionId: session.id },
        }).catch(err => console.error("Notification error:", err));
      }

      console.log(`Session payment verified! User ${userId} booked session ${session.id} for ₹${transaction.amount}`);

      return res.json({
        data: {
          session: { ...session, caller, receiver },
          transaction: updatedTransaction,
          message: "Payment verified and session booked successfully",
        },
      });
    } catch (err: any) {
      console.error("verifySessionPayment error:", err);
      return res.status(500).json({ error: "Failed to verify session payment" });
    }
  }

  // Dashboard stats (courses + webinars + sessions combined)
  static async getDashboardStats(req: JWTRequest, res: Response) {
    try {
      const userId = req.user!.userId;

      const [
        courseCount,
        courseEnrollments,
        courseRevenue,
        webinarCount,
        webinarEnrollments,
        webinarRevenue,
        completedSessions,
      ] = await Promise.all([
        prisma.courses.count({ where: { creator_id: userId } }),
        prisma.enrollments.count({
          where: { course: { creator_id: userId } },
        }),
        prisma.transactions.aggregate({
          where: { course: { creator_id: userId }, status: "SUCCESS" },
          _sum: { amount: true },
        }),
        prisma.webinars.count({ where: { creator_id: userId } }),
        prisma.webinar_enrollments.count({
          where: { webinar: { creator_id: userId } },
        }),
        prisma.webinar_transactions.aggregate({
          where: { webinar: { creator_id: userId }, status: "SUCCESS" },
          _sum: { amount: true },
        }),
        prisma.sessions.findMany({
          where: {
            OR: [{ caller_id: userId }, { receiver_id: userId }],
            status: "COMPLETED",
          },
        }),
      ]);

      const sessionEarnings = completedSessions.reduce((s, x) => s + x.amount, 0);
      const sessionEnrolled = completedSessions.length;
      const sessionMinutes = completedSessions.reduce((s, x) => s + x.duration, 0);

      const cRev = courseRevenue._sum.amount || 0;
      const wRev = webinarRevenue._sum.amount || 0;

      return res.json({
        data: {
          total_revenue: cRev + wRev + sessionEarnings,
          total_enrolled: courseEnrollments + webinarEnrollments + sessionEnrolled,
          total_products: courseCount + webinarCount,
          course: {
            count: courseCount,
            enrolled: courseEnrollments,
            revenue: cRev,
          },
          webinar: {
            count: webinarCount,
            enrolled: webinarEnrollments,
            revenue: wRev,
          },
          session: {
            count: sessionEnrolled,
            enrolled: sessionEnrolled,
            revenue: sessionEarnings,
            minutes: sessionMinutes,
          },
        },
      });
    } catch (err: any) {
      console.error("getDashboardStats error:", err);
      return res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  }
}
