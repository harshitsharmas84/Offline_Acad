import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCorsHeaders, getSecurityHeaders, mergeHeaders } from '@/lib/security';

export async function GET() {
  const result = await prisma.$queryRaw`SELECT 1`;
  const headers = mergeHeaders(getSecurityHeaders(), getCorsHeaders());
  return NextResponse.json({ status: "ok", db: result }, { status: 200, headers });
}
