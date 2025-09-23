# 🔄 Database Reset Guide

## Problem
Local testing created incomplete data that blocks super admin creation and login.

## Solution: Complete Database Reset

### Step 1: Reset Database Tables
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste content from `scripts/reset-database.sql`
3. Click **Run** to execute

### Step 2: Reset Authentication Users  
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. **Delete all users manually** (click delete on each user)
   
   OR
   
   Copy content from `scripts/reset-auth-users.sql` and run in SQL Editor

### Step 3: Verify Clean State
After reset, these should return 0:
```sql
SELECT COUNT(*) FROM organizations;
SELECT COUNT(*) FROM users; 
SELECT COUNT(*) FROM auth.users;
```

### Step 4: Fresh Super Admin Setup
1. Visit: https://yaya-pos-system.vercel.app
2. You should see the homepage (no existing setup detected)
3. Go to: https://yaya-pos-system.vercel.app/super-admin-setup
4. Use setup key: `YAYA_SUPER_2024`
5. Create your super admin account fresh

## ✅ After Reset
- Clean database with no corrupted data
- Fresh super admin creation will work
- All login flows will function properly
- Ready for production use

## 🚨 Warning
This deletes ALL data including:
- All users and authentication
- All organizations and locations  
- All products, orders, and transactions
- Everything starts from scratch