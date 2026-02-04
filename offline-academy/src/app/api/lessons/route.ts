import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyAuth } from "@/lib/auth-server";

// GET all lessons
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const published = searchParams.get("published");

    const lessons = await prisma.lesson.findMany({
      where: {
        ...(courseId && { courseId }),
        ...(published === "true" && { isPublished: true }),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            subject: true,
          },
        },
        _count: {
          select: {
            progress: true,
          },
        },
      },
      orderBy: [
        { courseId: "asc" },
        { order: "asc" },
      ],
    });

    return NextResponse.json(lessons);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch lessons", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new lesson (Admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, duration, contentUrl, courseId, order, isPublished } = body;

    if (!title || !duration) {
      return NextResponse.json(
        { error: "Title and duration are required" },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description,
        duration: parseInt(duration),
        contentUrl,
        courseId,
        order: order || 0,
        isPublished: isPublished || false,
      },
    });

    return NextResponse.json(lesson, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create lesson", details: error.message },
      { status: 500 }
    );
  }
}
