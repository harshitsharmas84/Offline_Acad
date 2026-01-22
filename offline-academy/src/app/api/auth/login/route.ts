import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db/prisma";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}
const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return NextResponse.json({
      success: true,
      message: "Login successful",
      token,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 500 }
    );
  }
}
