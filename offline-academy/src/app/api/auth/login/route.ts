import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/schemas";
import { prisma } from "@/lib/db/prisma"; // Ensure you have this from Module 2.15
import { createAccessToken, createRefreshToken } from "@/lib/jwt";
import { cookies } from "next/headers";
// import bcrypt from "bcrypt"; // Commented out until bcrypt is confirmed installed/used

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = loginSchema.parse(body);

    // 1. Find User (Mocking password check for now as we didn't do hashing yet)
    // In production: await bcrypt.compare(password, user.password)
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 401 });
    }

    // 2. Generate Tokens
    // CRITICAL: Include role in payload for RBAC checks
    const accessToken = await createAccessToken({ userId: user.id, role: user.role });
    const refreshToken = await createRefreshToken({ userId: user.id, role: user.role }); // Include role in refresh token too for auth-server check

    // 3. Set Refresh Token in HTTP-Only Cookie (Security Critical)
    // This prevents XSS attacks from stealing the refresh token
    const cookieStore = await cookies();
    cookieStore.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // 4. Return Access Token to Client (Memory Storage)
    return NextResponse.json({
      success: true,
      accessToken, // Frontend stores this in memory/Context
      user: { id: user.id, email: user.email, role: user.role },
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ success: false, message: "Invalid Request" }, { status: 400 });
  }
}
