# Database Setup Guide

## ✅ What's Been Completed

1. **Removed TEACHER Role**: Updated Prisma schema to only include STUDENT and ADMIN roles
2. **Connected Signup to Database**: Signup page now creates real users in PostgreSQL
3. **Role-Based Redirects**: 
   - Admin signup → `/admin` dashboard
   - Student signup → `/dashboard`
   - Login redirects based on user role
4. **Updated All API Routes**: Only ADMIN can create/edit courses and lessons
5. **Prisma Client Regenerated**: Schema updated and client regenerated

## 🔄 Database Migration Required

Your Neon database is currently **sleeping** (free tier auto-sleeps after inactivity).

### To Complete Setup:

#### Option 1: Wake Database & Run Migration
```bash
# 1. Open Neon Console (https://console.neon.tech)
#    - This will automatically wake your database

# 2. Then run migration:
cd "E:\Offline acdamy\S84-0126-Nebula-Nextjs-AWS-OfflineAcad\offline-academy"
npx prisma migrate dev --name remove_teacher_role
```

#### Option 2: Push Schema Directly (Faster)
```bash
cd "E:\Offline acdamy\S84-0126-Nebula-Nextjs-AWS-OfflineAcad\offline-academy"
npx prisma db push
```

### Test Connection
Once database is awake, test with:
```bash
node test-db.js
```

## 🎯 How Signup Works Now

### Student Signup Flow:
1. User fills form with name, email, password
2. Selects "Student 🎓" role
3. Clicks "Create Account"
4. API creates user in database with role="STUDENT"
5. User is logged in automatically
6. Redirected to `/dashboard`

### Admin Signup Flow:
1. User fills form with name, email, password
2. Selects "Admin 👑" role
3. Clicks "Create Account"
4. API creates user in database with role="ADMIN"
5. User is logged in automatically
6. Redirected to `/admin`

### Login Flow:
1. User enters email and password
2. API verifies credentials against database
3. Returns user object with role
4. Redirects to `/admin` (if ADMIN) or `/dashboard` (if STUDENT)

## 📝 Database Schema Changes

### Before:
```prisma
enum Role {
  STUDENT
  TEACHER    ← REMOVED
  ADMIN
}
```

### After:
```prisma
enum Role {
  STUDENT
  ADMIN
}
```

## 🔐 Role Permissions

- **STUDENT**: Can view courses, track progress, enroll in courses
- **ADMIN**: Full access to create/edit courses, manage lessons, view all analytics

## 🚀 Current Status

- ✅ All code updated and error-free
- ✅ Server running on http://localhost:3000
- ✅ Signup page connected to real API
- ✅ Login page connected to real API
- ⏳ Database migration pending (waiting for database to wake up)

## 📱 Test After Migration

1. **Visit** http://localhost:3000/signup
2. **Create Admin Account**: Select "Admin 👑" role
3. **Verify Redirect**: Should go to `/admin` dashboard
4. **Logout** and **Create Student Account**: Select "Student 🎓" role
5. **Verify Redirect**: Should go to `/dashboard`
6. **Test Login**: Try logging in with both accounts

## 🔧 Connection String
```
DATABASE_URL="postgresql://neondb_owner:npg_Dc72niWTxzwP@ep-crimson-pine-ah02t4vb-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

## 📊 Next Steps

Once migration runs successfully:
1. Create your first admin account via signup
2. Login as admin
3. Create courses from `/admin/courses/new`
4. Add lessons to courses
5. Students can then browse and enroll in courses
