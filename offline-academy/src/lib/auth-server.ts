import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

export async function getCurrentUserRole(): Promise<Role | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("refreshToken")?.value; // In real app, check Access Token header first

    if (!token) return null;

    const payload = await verifyToken(token);
    return payload?.role as Role || null;
}

export function unauthorized() {
    return NextResponse.json(
        { success: false, message: "⛔ RBAC: Access Denied. Insufficient Permissions." },
        { status: 403 }
    );
}
