const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function wakeDatabase() {
  console.log('🔄 Attempting to wake Neon database...');
  console.log('This may take 10-15 seconds on first connection.\n');
  
  for (let i = 1; i <= 10; i++) {
    try {
      console.log(`⏳ Attempt ${i}/10: Connecting...`);
      await prisma.$connect();
      const count = await prisma.user.count();
      console.log('\n✅ SUCCESS! Database is awake and responding!');
      console.log(`📊 Current users in database: ${count}\n`);
      await prisma.$disconnect();
      return true;
    } catch (error) {
      if (i < 10) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  console.error('\n❌ Could not wake database after 10 attempts.');
  console.log('💡 Please visit https://console.neon.tech to manually wake it.');
  await prisma.$disconnect();
  return false;
}

wakeDatabase().then(success => {
  if (success) {
    console.log('✨ You can now use signup/login!');
    process.exit(0);
  } else {
    process.exit(1);
  }
});
