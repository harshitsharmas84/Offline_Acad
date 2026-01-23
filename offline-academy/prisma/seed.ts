import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Seed Teacher
  await prisma.user.upsert({
    where: { email: "teacher@kalvium.community" },
    update: {},
    create: {
      email: "teacher@kalvium.community",
      name: "Ms. Frizzle",
      role: Role.TEACHER,
      password: hashedPassword,
    },
  });

  // 2. Seed Student
  await prisma.user.upsert({
    where: { email: "student@kalvium.community" },
    update: {},
    create: {
      email: "student@kalvium.community",
      name: "Arnold Perlstein",
      role: Role.STUDENT,
      password: hashedPassword,
    },
  });

  // 3. Seed Lessons
  await prisma.lesson.upsert({
    where: { id: "lesson-1" }, // Hardcoded ID for stability
    update: {},
    create: {
      id: "lesson-1",
      title: "Intro to Offline-First Architecture",
      description: "Learn how to build apps that work without internet.",
      duration: 45,
    },
  });

  console.warn("🌱 Database seeded successfully");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
