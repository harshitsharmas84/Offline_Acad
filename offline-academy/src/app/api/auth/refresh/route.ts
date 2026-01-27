import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import redis from "@/lib/redis";

const JWT_SECRET = process.env.JWT_SECRET!;
const ACCESS_TOKEN_EXPIRY = "15m";

export async function POST(req: Request) {
  try {
    const cookies = req.headers.get("cookie");
    const refreshToken = cookies
      ?.split("; ")
      .find(row => row.startsWith("refreshToken="))
      ?.split("=")[1];

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: "Refresh token missing" },
        { status: 401 }
      );
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { id: string };

    // Check Redis
    const storedToken = await redis.get(`refresh:${decoded.id}`);

    if (!storedToken || storedToken !== refreshToken) {
      return NextResponse.json(
        { success: false, message: "Invalid refresh token" },
        { status: 403 }
      );
    }

    // Issue new access token
    const newAccessToken = jwt.sign(
      { id: decoded.id },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    return NextResponse.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Refresh token expired or invalid" },
      { status: 403 }
    );
  }
}
