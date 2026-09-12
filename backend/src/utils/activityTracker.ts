import prisma from "../prismaClient";

export async function recordUserActivity(userId: string): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  try {
    await prisma.user_activity_log.upsert({
      where: {
        user_id_activity_date: { user_id: userId, activity_date: today },
      },
      update: {},
      create: { user_id: userId, activity_date: today },
    });
  } catch (err) {
    // Never let activity tracking break the actual request it's attached to
    console.error("recordUserActivity error:", err);
  }
}