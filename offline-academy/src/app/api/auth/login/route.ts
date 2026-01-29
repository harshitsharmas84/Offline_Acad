import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { loginSchema } from "@/lib/schemas";
import { prisma } from "@/lib/db/prisma";
import { createAccessToken, createRefreshToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { sanitizeEmail } from "@/lib/sanitizer";
import { getCorsHeaders, getSecurityHeaders, mergeHeaders } from '@/lib/security';
import { handleError } from "@/lib/errorHandler";

/**
 * Login route: validates input, verifies password, issues tokens
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email: rawEmail, password } = loginSchema.parse(body);

    const email = sanitizeEmail(rawEmail);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const headers = mergeHeaders(getSecurityHeaders(), getCorsHeaders());
      return NextResponse.json({ success: false, message: "User not found" }, { status: 401, headers });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      const headers = mergeHeaders(getSecurityHeaders(), getCorsHeaders());
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401, headers });
    }

    const accessToken = await createAccessToken({ userId: user.id, role: user.role });
    const refreshToken = await createRefreshToken({ userId: user.id, role: user.role });

    const cookieStore = await cookies();
    cookieStore.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    const headers = mergeHeaders(getSecurityHeaders(), getCorsHeaders());
    return NextResponse.json({ success: true, accessToken, user: { id: user.id, email: user.email, role: user.role } }, { status: 200, headers });
  } catch (error) {
    return handleError(error, "POST /api/auth/login");
  }
}
