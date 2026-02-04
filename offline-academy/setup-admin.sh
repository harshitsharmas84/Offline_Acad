#!/bin/bash

# OfflineAcad - Database Setup Script
# Run this script to set up the database with the new admin system

echo "🎓 OfflineAcad - Admin System Setup"
echo "===================================="
echo ""

# Step 1: Generate Prisma Client
echo "📦 Step 1: Generating Prisma Client..."
npx prisma generate

# Step 2: Run Migrations
echo ""
echo "🗄️ Step 2: Running database migrations..."
npx prisma migrate dev --name add_course_and_enrollment_models

# Step 3: (Optional) Seed Database
echo ""
echo "🌱 Step 3: Would you like to seed the database with sample data? (y/n)"
read -r answer
if [ "$answer" = "y" ]; then
    echo "Seeding database..."
    npx prisma db seed
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Login as admin"
echo "3. Go to: http://localhost:3000/admin"
echo "4. Start creating courses!"
echo ""
