import prisma from "../prismaClient";

/** Default number of devices an account may be logged into simultaneously. */
export const DEFAULT_DEVICE_LIMIT = Number(process.env.DEVICE_LIMIT) || 3;

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
  info: DeviceInfo,
  limit: number = DEFAULT_DEVICE_LIMIT,
) {
  const { device_id, device_name, platform } = info;

  const existing = await prisma.user_devices.findUnique({
    where: { user_id_device_id: { user_id: userId, device_id } },
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

  // New device — evict oldest devices if adding this one would exceed the limit
  const effectiveLimit = limit > 0 ? limit : DEFAULT_DEVICE_LIMIT;
  const devices = await prisma.user_devices.findMany({
    where: { user_id: userId },
    orderBy: { last_seen_at: "asc" },
  });
  const overflow = devices.length - (effectiveLimit - 1);
  if (overflow > 0) {
    const toEvict = devices.slice(0, overflow).map(d => d.id);
    await prisma.user_devices.deleteMany({ where: { id: { in: toEvict } } });
  }

  return prisma.user_devices.create({
    data: { user_id: userId, device_id, device_name, platform },
  });
}
