import { Response } from "express";
import prisma from "../prismaClient";
import { JWTRequest } from "../middleware/jwtAuth";

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

      if (!profession || !audio_rate) {
        return res.status(400).json({ error: "profession and audio_rate are required" });
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
          audio_rate,
          video_rate: video_rate || audio_rate,
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

      const where: any = { is_active: true };
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

      return res.json({ data: { products, creator } });
    } catch (err: any) {
      console.error("getCreatorProducts error:", err);
      return res.status(500).json({ error: "Failed to fetch products" });
    }
  }

  // User: book a session from a product
  static async bookSession(req: JWTRequest, res: Response) {
    try {
      const callerId = req.user!.userId;
      const { product_id } = req.body;

      if (!product_id) {
        return res.status(400).json({ error: "product_id is required" });
      }

      const product = await prisma.session_products.findUnique({
        where: { id: product_id },
      });

      if (!product || !product.is_active) {
        return res.status(404).json({ error: "Session product not found or inactive" });
      }

      const ratePerMin = product.price / product.duration;
      const callId = `session_${callerId}_${product.creator_id}_${Date.now()}`;

      const session = await prisma.sessions.create({
        data: {
          call_id: callId,
          caller_id: callerId,
          receiver_id: product.creator_id,
          mode: product.mode,
          rate_per_min: ratePerMin,
          amount: product.price,
          duration: product.duration,
          status: "PENDING",
        },
      });

      const [caller, receiver] = await Promise.all([
        prisma.users.findUnique({ where: { id: callerId }, select: userSelect }),
        prisma.users.findUnique({ where: { id: product.creator_id }, select: userSelect }),
      ]);

      return res.status(201).json({
        data: { ...session, caller, receiver, product },
      });
    } catch (err: any) {
      console.error("bookSession error:", err);
      return res.status(500).json({ error: "Failed to book session" });
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
