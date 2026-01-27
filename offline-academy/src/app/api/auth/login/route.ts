import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db/prisma";
import redis from "@/lib/redis";
import { handleError } from "@/lib/errorHandler";

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_TOKEN_EXPIRY = "15m"; // short-lived
const REFRESH_TOKEN_EXPIRY = "7d"; // long-lived

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 🔑 Access Token
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    // 🔁 Refresh Token
    const refreshToken = jwt.sign(
      { id: user.id },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // 🧠 Store refresh token in Redis
    await redis.set(
      `refresh:${user.id}`,
      refreshToken,
      "EX",
      7 * 24 * 60 * 60 // 7 days
    );

    // 🍪 Set refresh token as HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      accessToken,
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    return handleError(error, "POST /api/auth/login");
  }
}
