# Localhost Development Setup

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
node server.js
```
Backend runs on: http://localhost:5000

### 2. Frontend Setup (New Terminal)
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: http://localhost:5173

### 3. Environment Variables

Create `backend/.env`:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
```

Create `frontend/public/config.json`:
```json
{
  "apiBaseUrl": "http://localhost:5000"
}
```

## Common Errors & Fixes

### Error: "Cannot find module"
```bash
cd backend
npm install
cd ../frontend
npm install
```

### Error: "Port already in use"
**Backend (5000):**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change port in backend/.env
PORT=5001
```

**Frontend (5173):**
```bash
# Vite will auto-increment to 5174
```

### Error: "MongoDB connection failed"
- Check MONGODB_URI in backend/.env
- Make sure MongoDB is running
- Use MongoDB Atlas connection string

### Error: "CORS error"
Already configured in backend for localhost:5173

## Development Workflow

1. **Make changes locally**
2. **Test on localhost**
3. **Commit only when working**
4. **Push to GitHub**

## Testing Before Push

```bash
# Test backend
cd backend
node server.js
# Check: http://localhost:5000/api/test

# Test frontend
cd frontend
npm run dev
# Check: http://localhost:5173
```

## Git Branches (Recommended)

```bash
# Create development branch
git checkout -b development

# Make changes and test
# ... your changes ...

# Commit to development
git add .
git commit -m "your changes"
git push origin development

# When stable, merge to master
git checkout master
git merge development
git push origin master
```

## Quick Commands

**Start Both:**
```bash
# Terminal 1
cd backend && node server.js

# Terminal 2
cd frontend && npm run dev
```

**Stop Both:**
- Press `Ctrl+C` in each terminal

## Need Help?
- Backend logs: Check terminal running server.js
- Frontend logs: Check browser console (F12)
- Network errors: Check browser Network tab (F12)
