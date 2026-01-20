import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // TODO: handle login logic
  return NextResponse.json({ message: "Login route working" });
}
