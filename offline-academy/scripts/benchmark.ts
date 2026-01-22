import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function benchmark() {
  console.warn("🚀 Starting Benchmark...");

  // 1. Unoptimized (Fetching unnecessary relations)
  const startBad = performance.now();
  await prisma.user.findMany({
    include: {
      progress: {
        include: { lesson: true }, // ⚠️ N+1 Problem waiting to happen
      },
    },
    take: 100,
  });
  const endBad = performance.now();
  console.warn(`⚠️ Unoptimized Query: ${(endBad - startBad).toFixed(2)}ms`);

  // 2. Optimized (Selecting only what we need)
  const startGood = performance.now();
  await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      // Only fetching the count, not the full objects
      _count: {
        select: { progress: true },
      },
    },
    take: 100,
  });
  const endGood = performance.now();
  console.warn(`✅ Optimized Query:   ${(endGood - startGood).toFixed(2)}ms`);
}

benchmark()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
