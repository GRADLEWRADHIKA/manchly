import prisma from "../prismaClient";
import { getIO } from "./socketHandler";

/**
 * Default number of devices allowed *per user-type session* (Feature #2).
 * The limit is applied independently to each role (USER / CREATOR), so a single
 * account can be signed in as Creator on one device and as User on another.
 */
export const DEFAULT_DEVICE_LIMIT = Number(process.env.DEVICE_LIMIT) || 1;

export interface DeviceInfo {
  device_id: string;
  device_name?: string | null;
  platform?: string | null;
}

/**
 * Register a device for a user at login and enforce the device limit.
 *
 * - Known device → refreshes `last_seen_at` (and name/platform).
 * - New device → if the account is at/over its limit, evicts the
 *   least-recently-seen device(s) so the new one fits. Evicted devices lose
 *   access because their device-bound token no longer matches a stored device
 *   (see jwtAuth).
 *
 * Returns the up-to-date device row.
 */
export async function registerDevice(
  userId: string,
  userType: string,
  info: DeviceInfo,
  limit: number = DEFAULT_DEVICE_LIMIT,
) {
  const { device_id, device_name, platform } = info;

  const existing = await prisma.user_devices.findFirst({
    where: { user_id: userId, user_type: userType, device_id },
  });

  if (existing) {
    return prisma.user_devices.update({
      where: { id: existing.id },
      data: {
        last_seen_at: new Date(),
        device_name: device_name ?? existing.device_name,
        platform: platform ?? existing.platform,
      },
    });
  }

  // New device for this role — evict this role's oldest device(s) if adding this
  // one would exceed the per-type limit. Eviction is scoped to (user_id,
  // user_type), so the account's *other* role session is never touched.
  const effectiveLimit = limit > 0 ? limit : DEFAULT_DEVICE_LIMIT;
  const devices = await prisma.user_devices.findMany({
    where: { user_id: userId, user_type: userType },
    orderBy: { last_seen_at: "asc" },
  });
  const overflow = devices.length - (effectiveLimit - 1);
  if (overflow > 0) {
    const evicted = devices.slice(0, overflow);
    await prisma.user_devices.deleteMany({ where: { id: { in: evicted.map(d => d.id) } } });

    // Immediately force-logout each evicted device over its socket (Feature #2)
    // so it doesn't linger until its next API call. Targets only the evicted
    // device's room — the new device is never touched.
    const io = getIO();
    if (io) {
      for (const d of evicted) {
        io.to(`device_${d.device_id}`).emit("force_logout", {
          reason: "signed_in_elsewhere",
          message:
            "You've been logged out because your account was signed in on another device.",
        });
      }
    }
  }

  return prisma.user_devices.create({
    data: { user_id: userId, user_type: userType, device_id, device_name, platform },
  });
}
