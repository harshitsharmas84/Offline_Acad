import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // User data injected by authorization middleware
  const userEmail = req.headers.get("x-user-email");
  const userRole = req.headers.get("x-user-role");

  // Extra safety check (middleware already protects this)
  if (!userEmail || !userRole) {
    return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    message: "User route accessible to all authenticated users",
    user: {
      email: userEmail,
      role: userRole,
    },
  });
}
