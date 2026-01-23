import { NextResponse } from "next/server";
import { logger } from "./logger";

export function handleError(error: any, context: string) {
  const isProduction = process.env.NODE_ENV === "production";

  // Log full error internally
  logger.error(`Error in ${context}`, {
    message: error?.message,
    stack: isProduction ? "REDACTED" : error?.stack,
  });

  // User-safe response
  return NextResponse.json(
    {
      success: false,
      message: isProduction
        ? "Something went wrong. Please try again later."
        : error?.message || "Unknown error occurred",
      ...(isProduction ? {} : { stack: error?.stack }),
    },
    { status: 500 }
  );
}
