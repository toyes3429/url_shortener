import dotenv from "dotenv";
import { createClient } from "redis";

dotenv.config();

const client = createClient({
  url: process.env.REDIS_URL,
  disableOfflineQueue: true,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 250, 3000),
  },
});

client.on("error", (error) => {
  console.error("Redis error:", error.message);
});

export const connectRedis = async () => {
  if (client.isReady) return true;

  try {
    if (!client.isOpen) await client.connect();
    return client.isReady;
  } catch (error) {
    console.error("Redis connection failed:", error.message);
    return false;
  }
};

export const safeRedisGet = async (key) => {
  if (process.env.DISABLE_REDIS_CACHE === "true") return null;
  try {
    if (!(await connectRedis())) return null;
    return await client.get(key);
  } catch (error) {
    console.error("Redis read failed:", error.message);
    return null;
  }
};

export const safeRedisSet = async (key, value, options = {}) => {
  if (process.env.DISABLE_REDIS_CACHE === "true") return false;
  try {
    if (!(await connectRedis())) return false;
    await client.set(key, value, options);
    return true;
  } catch (error) {
    console.error("Redis write failed:", error.message);
    return false;
  }
};

export const safeRedisDel = async (...keys) => {
  if (process.env.DISABLE_REDIS_CACHE === "true") return false;
  try {
    if (!(await connectRedis())) return false;
    if (keys.length) await client.del(keys);
    return true;
  } catch (error) {
    console.error("Redis delete failed:", error.message);
    return false;
  }
};

export default client;
