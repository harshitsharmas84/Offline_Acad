import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // TODO: handle signup logic
  return NextResponse.json({ message: "Signup route working" });
}
