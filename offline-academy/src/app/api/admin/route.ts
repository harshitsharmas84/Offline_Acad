import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const email = req.headers.get("x-user-email");

  return NextResponse.json({
    success: true,
    message: "Welcome Admin! You have full access.",
    email,
  });
}
