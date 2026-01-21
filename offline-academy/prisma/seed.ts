import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      name: "Test Student",
      email: "student@test.com",
      password: "hashed-password",
    },
  });

  const course = await prisma.course.create({
    data: {
      title: "Offline Web Basics",
      description: "Learn web offline",
      lessons: {
        create: [
          { title: "HTML Basics", content: "Intro", order: 1 },
          { title: "CSS Basics", content: "Styling", order: 2 },
        ],
      },
    },
  });

  await prisma.enrollment.create({
    data: {
      userId: user.id,
      courseId: course.id,
    },
  });
}

main();
