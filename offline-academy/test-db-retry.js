const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1}/${retries}: Connecting to database...`);
      const count = await prisma.user.count();
      console.log('✅ Connected successfully!');
      console.log('Users in database:', count);
      await prisma.$disconnect();
      return true;
    } catch (error) {
      console.log(`❌ Attempt ${i + 1} failed:`, error.message.split('\n')[0]);
      if (i < retries - 1) {
        console.log('Waiting 3 seconds before retry...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }
  console.error('\n❌ All connection attempts failed. Database might be sleeping.');
  console.log('💡 Tip: Open Neon console to wake up the database, or wait a few minutes.');
  await prisma.$disconnect();
  process.exit(1);
}

testConnection(5);
