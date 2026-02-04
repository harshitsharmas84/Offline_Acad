const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const count = await prisma.user.count();
    console.log('✅ Connected successfully!');
    console.log('Users in database:', count);
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();
