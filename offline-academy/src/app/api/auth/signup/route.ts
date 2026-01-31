import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db/prisma";
import { handleError } from "@/lib/errorHandler";
import { sanitizeEmail, sanitizeText } from "@/lib/sanitizer";
import { getCorsHeaders, getSecurityHeaders, mergeHeaders } from '@/lib/security';

/**
 * OWASP Security: Signup API Route
 * 
 * Security measures implemented:
 * 1. XSS Prevention: User input sanitized before storage
 * 2. SQL Injection Prevention: Using Prisma ORM parameterized queries
 * 3. Input validation: Email and password requirements checked
 * 4. Password security: Bcrypt hashing with salt rounds
 */
export async function POST(req: Request) {
  try {
    const { email: rawEmail, password, name: rawName } = await req.json();

    if (!rawEmail || !password) {
      const headers = mergeHeaders(getSecurityHeaders(), getCorsHeaders());
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400, headers }
      );
    }

    // 🔒 XSS Prevention: Sanitize user input before storing
    // Removes any HTML tags or JavaScript injection attempts
    const email = sanitizeEmail(rawEmail);
    const name = sanitizeText(rawName || "");

    // Validate sanitized email is not empty after cleaning
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    // 🔒 SQL Injection Prevention: Prisma ORM uses parameterized queries
    // User input treated as DATA, never as SQL code
    // Even malicious input like "' OR '1'='1" is treated as literal string
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const headers = mergeHeaders(getSecurityHeaders(), getCorsHeaders());
      return NextResponse.json(
        { success: false, message: "User already exists" },
        { status: 409, headers }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    const headers = mergeHeaders(getSecurityHeaders(), getCorsHeaders());
    return NextResponse.json(
      {
        success: true,
        message: "Signup successful",
        user,
      },
      { status: 201, headers }
    );
  } catch (error) {
    return handleError(error, "POST /api/auth/signup");
  }
}
