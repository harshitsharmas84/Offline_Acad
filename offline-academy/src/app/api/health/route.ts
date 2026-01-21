import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const result = await prisma.$queryRaw`SELECT 1`;
  return NextResponse.json({ status: "ok", db: result });
}
