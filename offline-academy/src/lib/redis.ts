import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!, {
  tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
});

redis.on("connect", () => {
  console.log("✅ Redis Cloud connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis error", err);
});

export default redis;
