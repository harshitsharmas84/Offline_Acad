@echo off
REM OfflineAcad - Database Setup Script (Windows)
REM Run this script to set up the database with the new admin system

echo.
echo 🎓 OfflineAcad - Admin System Setup
echo ====================================
echo.

REM Step 1: Generate Prisma Client
echo 📦 Step 1: Generating Prisma Client...
call npx prisma generate

REM Step 2: Run Migrations
echo.
echo 🗄️ Step 2: Running database migrations...
call npx prisma migrate dev --name add_course_and_enrollment_models

REM Step 3: Open Prisma Studio (Optional)
echo.
echo 🔍 Would you like to open Prisma Studio to view your database? (Y/N)
set /p answer=
if /i "%answer%"=="Y" (
    echo Opening Prisma Studio...
    start cmd /k "npx prisma studio"
)

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Run: npm run dev
echo 2. Login as admin
echo 3. Go to: http://localhost:3000/admin
echo 4. Start creating courses!
echo.
pause
