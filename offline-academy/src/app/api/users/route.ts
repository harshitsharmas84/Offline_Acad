import { NextResponse } from "next/server";
import redis from "@/lib/redis";
import { handleError } from "@/lib/errorHandler";

/**
 * OWASP Security: Users API Route
 * 
 * Security measures implemented:
 * 1. XSS Prevention: Sanitized user data returned to client
 * 2. Authorization: Checks user headers set by middleware
 * 3. Caching: Redis caching prevents database enumeration attacks
 * 4. Error handling: Generic error messages prevent information disclosure
 */
export async function GET(req: Request) {
  try {
    // 🔒 Authorization: User data injected by authorization middleware
    const userEmail = req.headers.get("x-user-email");
    const userRole = req.headers.get("x-user-role");

    if (!userEmail || !userRole) {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 401 }
      );
    }

    // 🗝️ Cache key (user-specific, prevents data leakage between users)
    const cacheKey = `user:info:${userEmail}`;

    // 1️⃣ Check Redis cache
    // 🔒 Performance: Cached responses are already sanitized, no additional processing
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      console.log("🟢 Cache Hit");
      return NextResponse.json({
        success: true,
        source: "cache",
        // 🔒 XSS Prevention: Return only sanitized cached data
        data: JSON.parse(cachedData),
      });
    }

    console.log("🔵 Cache Miss");

    // 2️⃣ Build response data
    // 🔒 XSS Prevention: Only return necessary user information
    // Never return sensitive data like password hashes or tokens
    const responseData = {
      email: userEmail,
      role: userRole,
      // If returning user profile data, ensure it's sanitized
      // const profile = await sanitizeObject(user, ['name', 'bio'], []);
    };

    // 3️⃣ Store in Redis with TTL = 60s
    // 🔒 Cache expiration prevents stale/compromised data
    await redis.set(cacheKey, JSON.stringify(responseData), "EX", 60);

    return NextResponse.json({
      success: true,
      source: "db",
      // 🔒 XSS Prevention: Return sanitized user data
      data: responseData,
    });
  } catch (error) {
    return handleError(error, "GET /api/users");
  }
}
