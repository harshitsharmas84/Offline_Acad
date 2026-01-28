import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, createAccessToken } from "@/lib/jwt";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) {
    return NextResponse.json({ success: false, message: "No refresh token" }, { status: 401 });
  }

  // 1. Verify Refresh Token
  const payload: any = await verifyToken(refreshToken);
  if (!payload) {
    return NextResponse.json({ success: false, message: "Invalid refresh token" }, { status: 401 });
  }

  // 2. Issue New Access Token
  // We need to keep the role in the access token
  const newAccessToken = await createAccessToken({ userId: payload.userId, role: payload.role });

  return NextResponse.json({
    success: true,
    accessToken: newAccessToken,
  });
}
