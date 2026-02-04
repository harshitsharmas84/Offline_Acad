import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { handleError } from "@/lib/errorHandler";
import { sanitizeText, sanitizeHtmlContent } from "@/lib/sanitizer";

// 🔒 Example: Creating a Lesson (using actual Prisma schema)
const createLessonSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(10000).optional(),
  duration: z.number().int().min(1).max(600),
  contentUrl: z.string().url().optional().or(z.literal("")),
});

type CreateLessonInput = z.infer<typeof createLessonSchema>;

export async function POST(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");

    if (!userId || !userRole) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // 🔒 Authorization: Only ADMIN can create lessons
    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Permission denied" },
        { status: 403 }
      );
    }

    const body = await req.json();

    let validatedData: CreateLessonInput;
    try {
      validatedData = createLessonSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
        {
            success: false,
            message: "Validation error",
            errors: error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
        })),
        },
        { status: 400 }
    );
}

      throw error;
    }

    const sanitizedTitle = sanitizeText(validatedData.title);
    const sanitizedDescription = validatedData.description 
      ? sanitizeHtmlContent(validatedData.description)
      : null;

    if (!sanitizedTitle) {
      return NextResponse.json(
        { success: false, message: "Invalid input" },
        { status: 400 }
      );
    }

    // 🔒 Use Prisma ORM - SQL injection prevention
    const lesson = await prisma.lesson.create({
      data: {
        title: sanitizedTitle,
        description: sanitizedDescription,
        duration: validatedData.duration,
        contentUrl: validatedData.contentUrl || null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        contentUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lesson created successfully",
        data: lesson,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error, "POST /api/lessons/create");
  }
}
