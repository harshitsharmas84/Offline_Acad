import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/schemas";
import { prisma } from "@/lib/db/prisma";
<<<<<<< Updated upstream
import { createAccessToken, createRefreshToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { sanitizeEmail } from "@/lib/sanitizer";
=======
import { handleError } from "@/lib/errorHandler";
import { getCorsHeaders, getSecurityHeaders, mergeHeaders } from '@/lib/security';

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}
const JWT_SECRET = process.env.JWT_SECRET;
>>>>>>> Stashed changes

/**
 * OWASP Security: Login API Route
 * 
 * Security measures implemented:
 * 1. XSS Prevention: Email sanitized before querying
 * 2. SQL Injection Prevention: Prisma parameterized queries
 * 3. Input validation: Zod schema validation
 * 4. Token security: HTTP-only cookies for refresh tokens
 * 5. Session management: CSRF protection via sameSite cookie
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email: rawEmail } = loginSchema.parse(body);

    // 🔒 XSS & SQL Injection Prevention: Sanitize email before database query
    // Even though Prisma prevents SQL injection, sanitizing ensures clean data
    const email = sanitizeEmail(rawEmail);

    // 1. Find User using Prisma parameterized query
    // 🔒 SQL Injection Prevention: Prisma ORM ensures email is treated as DATA
    // Attack attempt: email = "' OR '1'='1" results in query for literal string
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 401 }
      );
    }

    // 2. Generate Tokens (CRITICAL: Include role for RBAC)
    const accessToken = await createAccessToken({
      userId: user.id,
      role: user.role,
    });
    const refreshToken = await createRefreshToken({
      userId: user.id,
      role: user.role,
    });

    // 3. Set Refresh Token in HTTP-Only Cookie
    // 🔒 XSS Prevention: httpOnly prevents JavaScript from accessing token
    // 🔒 CSRF Prevention: sameSite=strict prevents cross-site token submission
    const cookieStore = await cookies();
    cookieStore.set("refreshToken", refreshToken, {
      httpOnly: true, // Block XSS attacks from stealing token
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict", // Prevent CSRF attacks
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

<<<<<<< Updated upstream
    // 4. Return Access Token to Client (Memory Storage)
    // 🔒 Security: Access token in memory, refresh token in secure cookie
    return NextResponse.json({
      success: true,
      accessToken, // Frontend stores in memory/Context
      user: { id: user.id, email: user.email, role: user.role },
=======
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      accessToken: token,
>>>>>>> Stashed changes
    });

    // Attach security and CORS headers
    const headers = mergeHeaders(getSecurityHeaders(), getCorsHeaders());
    Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Invalid Request" },
      { status: 400 }
    );
  }
}
