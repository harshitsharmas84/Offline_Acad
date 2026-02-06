import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyAuth } from "@/lib/auth-server";

// GET single lesson by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        course: true,
        _count: {
          select: {
            progress: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { error: "Lesson not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(lesson);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch lesson", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update lesson (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, duration, contentUrl, courseId, order, isPublished } = body;

    // Build update data object with only provided fields
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (duration !== undefined) updateData.duration = parseInt(duration);
    if (contentUrl !== undefined) updateData.contentUrl = contentUrl;
    if (courseId !== undefined) updateData.courseId = courseId;
    if (order !== undefined) updateData.order = order;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const lesson = await prisma.lesson.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(lesson);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update lesson", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE lesson (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuth(request);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    await prisma.lesson.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Lesson deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete lesson", details: error.message },
      { status: 500 }
    );
  }
}
