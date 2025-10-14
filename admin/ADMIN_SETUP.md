# Travel Buddy Admin Portal Setup

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB running locally or connection string
- Backend server configured

### 1. Install Dependencies
```bash
cd admin
npm install
```

### 2. Configure Environment
Create `.env` file in the admin directory:
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### 3. Start Backend Server
```bash
cd ../backend
npm install
npm start
```

### 4. Start Admin Portal
```bash
cd admin
npm run dev
```

### 5. Access Admin Portal
Open http://localhost:5173 in your browser

## 🔧 Alternative Startup Methods

### Method 1: Use Batch Script (Windows)
```bash
# From project root
start-admin.bat
```

### Method 2: Use NPM Script
```bash
cd admin
npm run start:full
```

## 📊 Features

### Live Dashboard
- Real-time user statistics
- API usage monitoring
- Revenue tracking
- System health status

### User Management
- View all users
- Manage subscriptions
- Update user tiers
- Delete users

### Content Moderation
- Review flagged posts
- Handle user reports
- Approve/reject content
- Delete inappropriate posts

### Business Management
- Create and manage deals
- Monitor deal performance
- Business analytics
- Partner management

### Analytics Hub
- API cost tracking
- Usage statistics
- Performance metrics
- Real-time monitoring

### System Settings
- Database status
- API configuration
- Feature toggles
- System health checks

## 🔌 API Endpoints

The admin portal connects to these backend endpoints:

- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/users` - User management
- `GET /api/posts` - Content management
- `GET /api/deals` - Business deals
- `GET /api/usage` - API usage stats
- `GET /api/health/db` - System health

## 🛠️ Development

### File Structure
```
admin/
├── src/
│   ├── components/          # React components
│   │   ├── DashboardOverview.tsx
│   │   ├── UserManagement.tsx
│   │   ├── ContentModeration.tsx
│   │   ├── BusinessManagement.tsx
│   │   ├── AnalyticsHub.tsx
│   │   └── SystemSettings.tsx
│   ├── services/
│   │   └── apiService.ts    # API client
│   └── App.tsx             # Main app component
├── .env                    # Environment config
└── package.json
```

### Adding New Features
1. Create component in `src/components/`
2. Add API methods to `apiService.ts`
3. Update navigation in `AdminSidebar.tsx`
4. Add route handling in `App.tsx`

## 🔒 Security Notes

- Admin portal should be deployed behind authentication
- Use environment variables for sensitive configuration
- Implement proper CORS settings for production
- Consider IP whitelisting for admin access

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Azure/AWS
1. Build the admin portal
2. Upload dist files to static hosting
3. Configure API_BASE_URL for production backend
4. Set up proper authentication

## 📝 Troubleshooting

### Backend Connection Issues
- Verify backend is running on port 8080
- Check CORS configuration
- Ensure MongoDB is connected

### Data Not Loading
- Check browser console for errors
- Verify API endpoints are responding
- Check network tab for failed requests

### Build Issues
- Clear node_modules and reinstall
- Check TypeScript errors
- Verify all dependencies are installed

## 🔄 Updates

To update the admin portal:
1. Pull latest changes
2. Run `npm install` to update dependencies
3. Restart the development server
4. Check for any breaking changes in API

## 📞 Support

For issues or questions:
1. Check the console for error messages
2. Verify backend connectivity
3. Review API response formats
4. Check component state management