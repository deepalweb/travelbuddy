# Admin Panel Quick Start

## ✅ What's Been Built

I've created a complete admin panel for TravelBuddy with:

### Backend (Already Integrated)
- ✅ Admin API routes at `/api/admin/*`
- ✅ Authentication middleware using `ADMIN_SECRET`
- ✅ Dashboard stats endpoint
- ✅ User management endpoints
- ✅ Content moderation endpoints
- ✅ Business approval endpoints
- ✅ Deals management endpoints
- ✅ System health monitoring

### Frontend
- ✅ Admin panel page at `/admin`
- ✅ Login screen with secret authentication
- ✅ Dashboard with key metrics
- ✅ User management table
- ✅ Post moderation interface
- ✅ Business approval workflow
- ✅ Deals management table

## 🚀 How to Use

### Step 1: Set Admin Secret
Add to `backend/.env`:
```env
ADMIN_SECRET=MySecureAdminPassword123
```

### Step 2: Start Your Servers
```bash
# Backend
cd backend
npm start

# Frontend
cd frontend
npm run dev
```

### Step 3: Access Admin Panel
1. Open browser: `http://localhost:3000/admin`
2. Enter your admin secret
3. Click "Login"

## 📊 Features Available

### Dashboard Tab
- Total users count
- Total posts count
- Total deals count
- Merchants, agents, providers count

### Users Tab
- View all users
- See username, email, tier
- Delete users

### Posts Tab
- View pending posts
- Approve or reject posts
- Content moderation

### Businesses Tab
- View pending business applications
- Approve merchants
- Approve travel agents
- Approve transport providers

### Deals Tab
- View all deals
- See deal status (active/inactive)
- Monitor views and claims

## 🔒 Security Notes

- Admin secret is stored in localStorage after login
- All API calls include `x-admin-secret` header
- 403 error = invalid admin secret
- Logout clears the secret from localStorage

## 🎯 Next Steps

1. **Test the admin panel** with your local setup
2. **Set a strong admin secret** for production
3. **Deploy to Azure** with admin secret in App Settings
4. **Access via** `https://your-domain.com/admin`

## 📝 Files Created

1. `backend/routes/admin.js` - Admin API routes
2. `frontend/src/pages/AdminPanel.tsx` - Admin UI
3. `frontend/src/App.tsx` - Updated with admin route
4. `ADMIN_PANEL.md` - Full documentation
5. `ADMIN_QUICK_START.md` - This file

## 🐛 Troubleshooting

**Can't login?**
- Check `ADMIN_SECRET` is set in backend/.env
- Restart backend server after adding secret

**403 Forbidden?**
- Verify admin secret matches backend
- Check browser console for errors

**No data showing?**
- Ensure MongoDB is connected
- Check backend console for errors
- Verify API endpoints are working

## 💡 Tips

- Use a password manager for admin secret
- Don't share admin secret in code/commits
- Change admin secret regularly
- Monitor admin access logs
- Use HTTPS in production

---

**Ready to use!** Your admin panel is fully functional and integrated. 🎉
