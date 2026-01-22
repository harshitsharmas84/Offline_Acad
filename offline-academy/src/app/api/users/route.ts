

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // User data injected by middleware.ts
  const userEmail = req.headers.get("x-user-email");
  const userRole = req.headers.get("x-user-role");

  // Safety check (middleware already blocks unauthorized users)
  if (!userEmail || !userRole) {
    return NextResponse.json(
      { success: false, message: "Unauthorized access" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "User route accessible to all authenticated users",
    user: {
      email: userEmail,
      role: userRole,
    },
  });
=======
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token missing" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    return NextResponse.json({
      success: true,
      message: "Protected data access granted",
      user: decoded,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid or expired token" },
      { status: 403 }
    );
  }

}
