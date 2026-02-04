# Database Connection Troubleshooting

## ❌ Current Issue
Your Neon database endpoint is not reachable:
- DNS Resolution: **FAILED**
- Connection: **Cannot reach server**

## 🔍 Possible Causes

1. **Database is Suspended/Deleted**
   - Free tier databases can be suspended after 7 days of inactivity
   - Check Neon Console: https://console.neon.tech

2. **Database Endpoint Changed**
   - Neon may have changed your database URL
   - Verify in Neon Console under your project

3. **Network/Firewall Issue**
   - Corporate firewall blocking PostgreSQL port (5432)
   - VPN/Proxy interference

## 🔧 Solutions

### Option 1: Get New Connection String from Neon

1. Visit https://console.neon.tech
2. Login to your account
3. Select your project "neondb"
4. Go to **Dashboard** → **Connection Details**
5. Copy the connection string (starts with `postgresql://`)
6. Update `.env` file:
   ```env
   DATABASE_URL="your-new-connection-string-here"
   ```

### Option 2: Create New Database (If Old One Deleted)

1. Visit https://console.neon.tech
2. Click **Create Project**
3. Name: `offline-academy`
4. Copy the connection string
5. Update `.env` file
6. Run migration:
   ```bash
   npx prisma migrate dev
   ```

### Option 3: Use Local PostgreSQL Instead

Install PostgreSQL locally and use:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/offline_academy"
```

Then run:
```bash
npx prisma migrate dev
```

## 🎯 Quick Test

After updating DATABASE_URL:
```bash
cd "E:\Offline acdamy\S84-0126-Nebula-Nextjs-AWS-OfflineAcad\offline-academy"
node wake-db.js
```

## 📝 Current DATABASE_URL
Check your `.env` file for the current connection string.

## ⚡ Once Fixed

1. Restart the dev server: `npm run dev`
2. Try signup again
3. Database will create your user successfully!
