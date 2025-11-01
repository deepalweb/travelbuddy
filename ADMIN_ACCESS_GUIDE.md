# TravelBuddy Admin Panel Access Guide

## Quick Access Instructions

### Option 1: Run Admin Panel Locally
1. Open terminal in the `admin` folder:
   ```cmd
   cd c:\Users\DeepalRupasinghe\travelbuddy-2\admin
   ```

2. Install dependencies (if not done):
   ```cmd
   npm install
   ```

3. Start the admin panel:
   ```cmd
   npm run dev
   ```

4. Open browser and go to: `http://localhost:5173`

### Option 2: Access via Main Application
If the admin panel is integrated into the main app, try:
- `http://localhost:3000/admin` (if main app is running)
- `http://localhost:5173/admin` (if admin app is running)

## Login Credentials

**Demo Admin Account:**
- **Email:** `admin@travelbuddy.com`
- **Password:** `password`

## Troubleshooting

### If Admin Panel Won't Load:
1. Make sure backend is running:
   ```cmd
   cd c:\Users\DeepalRupasinghe\travelbuddy-2\backend
   npm start
   ```

2. Create admin user if needed:
   ```cmd
   cd c:\Users\DeepalRupasinghe\travelbuddy-2\backend
   node create-admin.js
   ```

### If Login Fails:
- Ensure backend is running on port 3001
- Check if MongoDB is connected
- Try the demo credentials exactly as shown above

## Admin Panel Features
Once logged in, you'll have access to:
- Dashboard Overview
- User Management
- Partner Management
- Content Moderation
- Business Management
- Analytics Hub
- System Settings

## Backend API Endpoints
The admin panel connects to:
- Local: `http://localhost:3001/api`
- Production: `https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api`