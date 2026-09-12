import { Response } from "express";
import prisma from "../prismaClient";
import { JWTRequest } from "../middleware/jwtAuth";

export class ActivityController {
  // Returns current streak length + a Mon–Sun grid of activity for this week
  static async getMyStreak(req: JWTRequest, res: Response) {
    try {
      const userId = req.user!.userId;

      const since = new Date();
      since.setUTCDate(since.getUTCDate() - 60); // 60 days of history is plenty to compute a real streak
      since.setUTCHours(0, 0, 0, 0);

      const logs = await prisma.user_activity_log.findMany({
        where: { user_id: userId, activity_date: { gte: since } },
        select: { activity_date: true },
      });

      const activeDates = new Set(
        logs.map((l) => l.activity_date.toISOString().slice(0, 10)),
      );

      // Current streak: count consecutive days ending today. If today has no
      // activity yet, don't break the streak — start counting from yesterday.
      let streak = 0;
      const cursor = new Date();
      cursor.setUTCHours(0, 0, 0, 0);
      if (!activeDates.has(cursor.toISOString().slice(0, 10))) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }
      while (activeDates.has(cursor.toISOString().slice(0, 10))) {
        streak++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
      }

      // This week's Mon–Sun grid, for the M T W T F S S UI
      const startOfWeek = new Date();
      const dayOfWeek = startOfWeek.getUTCDay(); // 0 = Sun
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startOfWeek.setUTCDate(startOfWeek.getUTCDate() + diffToMonday);
      startOfWeek.setUTCHours(0, 0, 0, 0);

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const week = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setUTCDate(d.getUTCDate() + i);
        const key = d.toISOString().slice(0, 10);
        return {
          date: key,
          label: ["M", "T", "W", "T", "F", "S", "S"][i],
          active: activeDates.has(key),
          isFuture: d > today,
        };
      });

      return res.json({ data: { current_streak: streak, week } });
    } catch (err: any) {
      console.error("getMyStreak error:", err);
      return res.status(500).json({ error: "Failed to fetch streak" });
    }
  }
}