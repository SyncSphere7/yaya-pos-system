# Deployment Guide - Yaya Xtra Residence POS

## 🚀 Deploy to Vercel

### 1. Connect GitHub Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import from GitHub: `SyncSphere7/yaya-pos-system`

### 2. Configure Environment Variables
Add these environment variables in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://twdxyamivwwtwlkkrdgi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
PESAPAL_CONSUMER_KEY=your_pesapal_consumer_key
PESAPAL_CONSUMER_SECRET=your_pesapal_consumer_secret
PESAPAL_API_URL=https://pay.pesapal.com/v3
NEXT_PUBLIC_SUPER_ADMIN_KEY=YAYA_SUPER_2024
NODE_ENV=production
```

### 3. Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Visit your live URL

### 4. Setup Super Admin
1. Go to `https://your-app.vercel.app/super-admin-setup`
2. Enter setup key: `YAYA_SUPER_2024`
3. Create your organization and admin account

## 🔧 Environment Variables Needed

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `PESAPAL_CONSUMER_KEY` | Pesapal consumer key | `your_consumer_key` |
| `PESAPAL_CONSUMER_SECRET` | Pesapal consumer secret | `your_consumer_secret` |
| `PESAPAL_API_URL` | Pesapal API endpoint | `https://pay.pesapal.com/v3` |
| `NEXT_PUBLIC_SUPER_ADMIN_KEY` | Super admin setup key | `YAYA_SUPER_2024` |

## 📱 Post-Deployment Checklist

- [ ] Super admin account created
- [ ] Department managers added
- [ ] Staff accounts created with PINs
- [ ] Menu items configured
- [ ] Tables set up
- [ ] Payment methods tested
- [ ] Real-time features working

## 🔗 Repository
**GitHub**: https://github.com/SyncSphere7/yaya-pos-system