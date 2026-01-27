import { NextResponse } from "next/server";
import redis from "@/lib/redis";
import { handleError } from "@/lib/errorHandler";

export async function GET(req: Request) {
  try {
    // 🔐 User data injected by authorization middleware
    const userEmail = req.headers.get("x-user-email");
    const userRole = req.headers.get("x-user-role");

    if (!userEmail || !userRole) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    // 🗝️ Cache key (user-specific)
    const cacheKey = `user:info:${userEmail}`;

    // 1️⃣ Check Redis cache
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      console.log("🟢 Cache Hit");
      return NextResponse.json({
        success: true,
        source: "cache",
        data: JSON.parse(cachedData),
      });
    }

    console.log("🔵 Cache Miss");

    // 2️⃣ Build response data
    const responseData = {
      email: userEmail,
      role: userRole,
    };

    // 3️⃣ Store in Redis with TTL = 60s
    await redis.set(cacheKey, JSON.stringify(responseData), "EX", 60);

    return NextResponse.json({
      success: true,
      source: "db",
      data: responseData,
    });
  } catch (error) {
    return handleError(error, "GET /api/users");
  }
}
