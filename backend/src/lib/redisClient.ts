import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

let redis: Redis | null = null;
try {
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    redis.connect().catch((e) => console.warn("[Redis] connect warning:", e.message));
  } else if (process.env.REDIS_HOST) {
    redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    redis.connect().catch((e) => console.warn("[Redis] connect warning:", e.message));
  }
} catch (err: any) {
  console.warn("[Redis] init warning:", err.message);
}

// In-memory fallback if Redis is not configured or offline
const inMemoryDeviceMap = new Map<string, string>();

const DEVICE_KEY_PREFIX = "device_session:";

export async function setActiveDevice(userId: string, deviceId: string): Promise<void> {
  inMemoryDeviceMap.set(userId, deviceId);
  if (redis && redis.status === "ready") {
    try {
      await redis.set(DEVICE_KEY_PREFIX + userId, deviceId);
    } catch (err: any) {
      console.warn("[Redis] setActiveDevice error:", err.message);
    }
  }
}

export async function getActiveDevice(userId: string): Promise<string | null> {
  if (redis && redis.status === "ready") {
    try {
      const dev = await redis.get(DEVICE_KEY_PREFIX + userId);
      if (dev) return dev;
    } catch (err: any) {
      console.warn("[Redis] getActiveDevice error:", err.message);
    }
  }
  return inMemoryDeviceMap.get(userId) || null;
}

export async function clearActiveDevice(userId: string): Promise<void> {
  inMemoryDeviceMap.delete(userId);
  if (redis && redis.status === "ready") {
    try {
      await redis.del(DEVICE_KEY_PREFIX + userId);
    } catch (err: any) {
      console.warn("[Redis] clearActiveDevice error:", err.message);
    }
  }
}

export default redis;
