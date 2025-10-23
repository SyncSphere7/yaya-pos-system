# Admin Login Troubleshooting Guide

## 🔍 Problem
Admin login shows authentication in Supabase but cannot access dashboard.

## 🎯 Root Causes

1. **User Profile Inactive** - `is_active: false` in the database
2. **Missing User Profile** - Auth exists but no user record in `users` table
3. **Wrong Role** - User role is not 'admin'
4. **Missing Organization/Location** - User not assigned to org/location

## ✅ Solutions

### Option 1: Use Debug Page (Recommended)

1. **Visit the debug page** (after deployment completes):
   - Local: http://localhost:3000/debug-auth
   - Production: https://yaya-pos-system.vercel.app/debug-auth

2. **Click "Test Login"** to attempt login with admin credentials

3. **Read the diagnosis** at the bottom - it will tell you exactly what's wrong

4. **Follow the recommended action**

### Option 2: Run Activation Script

If the debug page shows "User profile is INACTIVE":

```bash
cd /Users/syncsphere/Desktop/yaya-pos-system
node scripts/activate-admin.js
```

This will:
- ✅ Set `is_active: true`
- ✅ Set role to 'admin'
- ✅ Enable super_admin
- ✅ Add all permissions
- ✅ Set PIN to 1234

### Option 3: Recreate Admin Account

If the user profile is completely missing:

```bash
cd /Users/syncsphere/Desktop/yaya-pos-system
node scripts/fix-admin-login.js
```

This will:
- ✅ Create organization if missing
- ✅ Create location if missing
- ✅ Create/update auth user
- ✅ Create/update user profile
- ✅ Setup departments

### Option 4: Manual Supabase Fix

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Table Editor** → **users**
4. Find the user with email `yayaxtra@gmail.com`
5. Edit the row and set:
   - `is_active`: `true`
   - `role`: `admin`
   - `is_super_admin`: `true`
   - `permissions`: `["all"]`
6. Click **Save**

## 📊 Check Current Status

### On Production (Vercel)

Once deployed, visit:
```
https://yaya-pos-system.vercel.app/debug-auth
```

### On Local

```bash
npm run dev
# Then visit: http://localhost:3000/debug-auth
```

## 🔐 Login Credentials

**Email Login:**
- Email: `yayaxtra@gmail.com`
- Password: `Admin@123`

**PIN Login:**
- PIN: `1234`

## 🚀 Access URLs

After fixing:

1. **Admin Dashboard:**
   - Local: http://localhost:3000/admin
   - Production: https://yaya-pos-system.vercel.app/admin

2. **POS Dashboard (Waiter):**
   - Local: http://localhost:3000/pos
   - Production: https://yaya-pos-system.vercel.app/pos

## 📝 What to Check

When using the debug page, look for:

1. **Supabase Auth Session** - Should show "✅ Exists"
2. **Database User Profile** - Should show "✅ Exists"
3. **Is Active** - Should be "✅ Active" (NOT ❌ Inactive)
4. **Role** - Should be "admin"
5. **Zustand Store State** - Should show "✅ Exists"

## 🛠️ Common Issues & Fixes

| Issue | Diagnosis | Fix |
|-------|-----------|-----|
| Can't login at all | Auth session shows ❌ | Check Supabase credentials in `.env.local` |
| Login works but redirects to login | User profile ❌ Null | Run `fix-admin-login.js` |
| Profile exists but can't access | Is Active: ❌ Inactive | Run `activate-admin.js` |
| Access denied | Role is not 'admin' | Run `activate-admin.js` |
| Logged in but no dashboard | Zustand store ❌ Null | Clear browser cache & refresh |

## 🔄 After Fixing

1. Clear browser cache
2. Sign out completely
3. Close all browser tabs
4. Visit login page fresh
5. Try logging in again

## 📞 Still Having Issues?

1. Check the **debug page diagnosis** section
2. Look at browser console for errors (F12 → Console)
3. Check Supabase Dashboard → Authentication → Users
4. Verify `.env.local` has correct Supabase credentials

---

**Last Updated:** October 23, 2025
