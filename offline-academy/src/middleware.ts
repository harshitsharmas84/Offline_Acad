import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Enforce HTTPS in production (redirect non-HTTPS requests)
  if (process.env.NODE_ENV === 'production') {
    const proto = req.headers.get('x-forwarded-proto') || '';
    if (proto !== 'https') {
      const url = new URL(req.nextUrl.toString());
      url.protocol = 'https:';
      return NextResponse.redirect(url);
    }
  }

  // ✅ Ignore preflight requests
  if (req.method === "OPTIONS") {
    return NextResponse.next();
  }

  /**
   * 🔓 PUBLIC ROUTES (no auth)
   * - Used for Redis caching assignment
   */
  if (pathname.startsWith("/api/users")) {
    return NextResponse.next();
  }

  /**
   * 🔐 PROTECTED ADMIN ROUTES
   */
  if (pathname.startsWith("/api/admin")) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token missing" },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
        role: "STUDENT" | "TEACHER" | "ADMIN";
      };

      if (decoded.role !== "ADMIN") {
        return NextResponse.json(
          { success: false, message: "Access denied" },
          { status: 403 }
        );
      }

      // Attach user info
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-user-id", decoded.id);
      requestHeaders.set("x-user-email", decoded.email);
      requestHeaders.set("x-user-role", decoded.role);

      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

/**
 * ✅ Run middleware only for API routes
 */
export const config = {
  matcher: ["/api/:path*"],
};
