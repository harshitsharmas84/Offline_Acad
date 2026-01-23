import { NextResponse } from "next/server";
import { handleError } from "@/lib/errorHandler";

export async function GET(req: Request) {
  try {
    const email = req.headers.get("x-user-email");

    return NextResponse.json({
      success: true,
      message: "Welcome Admin! You have full access.",
      email,
    });
  } catch (error) {
    return handleError(error, "GET /api/admin");
  }
}
