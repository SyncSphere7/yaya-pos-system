# Admin Login Credentials

## ✅ FIXED - Admin Login Working

### Login Details

**Email Login:**
- Email: `yayaxtra@gmail.com`
- Password: `Admin@123`

**PIN Login (Quick Access):**
- PIN: `1234`

### Access URLs

- **Local Development:** http://localhost:3000
- **Production:** https://yaya-pos-system.vercel.app

### Login Methods

1. **Email + Password Login**
   - Go to `/login/admin`
   - Enter email and password
   - Full admin access

2. **PIN Login (Staff Quick Login)**
   - Go to `/login` or `/pos`
   - Enter 4-digit PIN: `1234`
   - Quick access for staff

### Admin Capabilities

- Full system access
- User management
- Product management
- Order management
- Analytics and reports
- Settings configuration

### Troubleshooting

If login fails:
1. Clear browser cache
2. Check Supabase connection in `.env.local`
3. Run: `node scripts/fix-admin-login.js`
4. Verify user exists in Supabase Dashboard > Authentication

### Security Notes

⚠️ **IMPORTANT:** Change these default credentials in production!

To change password:
1. Go to Admin Dashboard > Settings
2. Or run: `node scripts/reset-admin-password.js`

---

**Last Updated:** $(date)
**Status:** ✅ Working
