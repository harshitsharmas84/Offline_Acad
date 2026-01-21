import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/schemas";
import { ZodError } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 🛡️ Zod Validation Layer
    // .parse() throws an error if validation fails
    const validatedData = loginSchema.parse(body);

    // If we get here, data is guaranteed to be clean
    return NextResponse.json({
      success: true,
      message: "Validation Passed",
      data: {
        email: validatedData.email,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    // 🛡️ Error Handling Layer
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation Error",
          errors: error.issues.map((e) => ({
            field: e.path[0],
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
