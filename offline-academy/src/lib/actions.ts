"use server";
import { prisma } from "@/lib/db/prisma";

export async function completeLesson(userId: string, lessonId: string) {
  try {
    // Atomic transaction: Mark lesson complete + Award XP
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Mark Lesson as Completed
      const progress = await tx.userProgress.upsert({
        where: {
          userId_lessonId: { userId, lessonId },
        },
        update: { completed: true },
        create: {
          userId,
          lessonId,
          completed: true,
        },
      });

      // Step 2: Award XP to User (atomic increment)
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          xp: { increment: 10 },
        },
      });

      return { progress, user };
    });

    console.warn("Transaction Success:", result);
    return { success: true, newXp: result.user.xp };
  } catch (error) {
    console.error("Transaction Failed (Rolled Back):", error);
    return { success: false, error: "Failed to complete lesson" };
  }
}
