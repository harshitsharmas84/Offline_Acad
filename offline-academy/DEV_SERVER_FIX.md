# Next.js Dev Server Issue - Root Cause Analysis & Fix

## 🔍 Root Causes Identified

### 1. **Lock File Conflict (Primary Issue)**
**Symptom:** `Unable to acquire lock at .next/dev/lock`

**Root Cause:**
- Multiple Node.js processes from previous `npm run dev` sessions remain running on Windows
- Windows doesn't always properly terminate child processes when Ctrl+C is pressed
- The lock file prevents multiple dev servers from running simultaneously

**Why it happens on Windows:**
- Windows handles process signals (SIGTERM, SIGKILL) differently than Unix systems
- Node.js child processes may not terminate when the parent terminal closes
- File locks persist until all processes release them

---

### 2. **Multiple package-lock.json Files**
**Symptom:** Warning about workspace root detection

**Root Cause:**
```
E:\Offline acdamy\
├── package-lock.json              ← Extra lock file (not needed)
└── S84-0126-Nebula-Nextjs-AWS-OfflineAcad\
    ├── package-lock.json           ← Extra lock file (not needed)
    └── offline-academy\
        └── package-lock.json       ← Actual project lock file
```

**Impact:**
- Turbopack tries to infer workspace root
- Finds multiple lock files and gets confused
- May use wrong directory as workspace root
- Causes performance issues and incorrect file watching

---

### 3. **Port 3000 Conflict**
**Symptom:** Port 3000 in use, switches to 3001

**Root Cause:**
- Previous dev server still running on port 3000
- Windows doesn't release ports immediately after process termination
- TIME_WAIT state on Windows lasts longer than Unix

---

## ✅ Solutions Applied

### Solution 1: Cleanup Script (cleanup-dev.bat)
**Location:** `offline-academy/cleanup-dev.bat`

**What it does:**
1. Kills all Node.js processes
2. Waits for graceful termination
3. Removes .next/dev/lock file
4. Optionally removes entire .next folder for deep clean

**Usage:**
```bash
# From offline-academy directory:
cleanup-dev.bat
```

---

### Solution 2: Turbopack Workspace Root Fix
**File:** `next.config.ts`

**Change:**
```typescript
experimental: {
  turbo: {
    root: __dirname,  // Explicitly set workspace root
  },
}
```

**Effect:**
- Tells Turbopack to use the offline-academy directory as root
- Ignores parent directory lock files
- Eliminates workspace root warning
- Improves Turbopack performance

---

### Solution 3: Clean Lock Files (Manual - Optional)
**Only if you want to remove the extra lock files:**

```bash
# Delete ONLY these two (keep offline-academy/package-lock.json):
del "E:\Offline acdamy\package-lock.json"
del "E:\Offline acdamy\S84-0126-Nebula-Nextjs-AWS-OfflineAcad\package-lock.json"
```

**⚠️ IMPORTANT:** Do NOT delete `offline-academy/package-lock.json`

---

## 🚀 How to Use

### Quick Fix (Recommended)
```bash
cd "E:\Offline acdamy\S84-0126-Nebula-Nextjs-AWS-OfflineAcad\offline-academy"
cleanup-dev.bat
npm run dev
```

### Manual Fix (If Script Fails)
```bash
# 1. Kill Node processes
taskkill /F /IM node.exe

# 2. Wait
timeout /t 2

# 3. Remove lock
del /F /Q ".next\dev\lock"

# 4. Start dev server
npm run dev
```

### Deep Clean (If Still Having Issues)
```bash
cd "E:\Offline acdamy\S84-0126-Nebula-Nextjs-AWS-OfflineAcad\offline-academy"

# Remove all node processes
taskkill /F /IM node.exe

# Remove build cache
rd /S /Q .next

# Remove node modules (nuclear option)
rd /S /Q node_modules
npm install

# Start fresh
npm run dev
```

---

## 🛡️ Prevention Tips

### 1. Always Use Ctrl+C Properly
- Press Ctrl+C once and wait
- Don't close terminal window directly
- Let Next.js shut down gracefully

### 2. Check Running Processes Before Starting
```bash
netstat -ano | findstr :3000
tasklist | findstr node.exe
```

### 3. Use the Cleanup Script
- Run `cleanup-dev.bat` if you experience any issues
- Safe to run anytime

### 4. Don't Have Multiple Terminals Running Dev Server
- Check all VS Code terminals
- Check command prompt/PowerShell windows

---

## 🔧 Troubleshooting Guide

### Issue: Script says "Access Denied"
**Fix:** Run terminal as Administrator

### Issue: Port 3000 still shows "in use"
**Fix:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill specific process (replace PID)
taskkill /F /PID <PID>
```

### Issue: Turbopack warning still appears
**Fix:** 
1. Verify next.config.ts has the turbo.root setting
2. Restart dev server
3. Clear .next folder if needed

### Issue: "Cannot find module" errors after cleanup
**Fix:**
```bash
npm install
```

---

## 📊 Verification

After applying fixes, you should see:
```
✓ Starting...
✓ Ready in X.Xs
- Local:    http://localhost:3000
```

**No warnings about:**
- ❌ Lock acquisition
- ❌ Multiple lockfiles
- ❌ Workspace root

---

## 🔄 Reverting Changes

All changes are safe and reversible:

### To revert next.config.ts:
Remove these lines from next.config.ts:
```typescript
experimental: {
  turbo: {
    root: __dirname,
  },
},
```

### To remove cleanup script:
```bash
del cleanup-dev.bat
```

---

## 📝 Summary

**Changes Made:**
1. ✅ Created `cleanup-dev.bat` - Windows cleanup script
2. ✅ Updated `next.config.ts` - Added Turbopack root configuration
3. ✅ No source code changes
4. ✅ All changes are environment-level only

**Expected Result:**
- Dev server starts cleanly with `npm run dev`
- No lock file errors
- No workspace root warnings
- Consistent port usage (3000)

---

## 🆘 Still Having Issues?

If problems persist:
1. Check antivirus isn't blocking files
2. Verify Windows Defender exceptions
3. Check disk permissions
4. Try running VS Code as Administrator
5. Restart Windows (clears all process states)
