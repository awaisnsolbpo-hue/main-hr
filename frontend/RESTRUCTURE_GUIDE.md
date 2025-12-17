# 📁 Project Restructure Guide

## Overview

This guide will help you reorganize the project into a clean structure with separate `frontend/` and `backend/` folders.

---

## ⚠️ IMPORTANT: Backup First!

Before restructuring, create a backup:
```bash
# Windows
xcopy /E /I . ..\hr-backup

# Or just commit your current changes to git
git add .
git commit -m "Before restructure"
```

---

## 🎯 Target Structure

```
hr-app/
├── frontend/                      # React/Vite application
│   ├── src/
│   ├── public/
│   ├── node_modules/
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   └── ... (all frontend files)
│
├── backend/                       # Express API server
│   ├── src/
│   ├── node_modules/
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   └── README.md
│
├── package.json                   # Root - manages both
├── .gitignore
├── README.md
├── SETUP.md
└── ... (documentation files)
```

---

## 🔧 Step-by-Step Instructions

### Step 1: Create New Folders

```bash
mkdir frontend
mkdir backend
```

### Step 2: Move Frontend Files

**Move these to `frontend/` folder:**

```bash
# Core frontend files
move src frontend\
move public frontend\
move node_modules frontend\
move index.html frontend\
move package.json frontend\
move package-lock.json frontend\

# Configuration files
move vite.config.ts frontend\
move tsconfig.json frontend\
move tsconfig.app.json frontend\
move tsconfig.node.json frontend\
move tailwind.config.ts frontend\
move postcss.config.js frontend\
move eslint.config.js frontend\
move components.json frontend\
move vitest.config.ts frontend\
move capacitor.config.ts frontend\

# Build artifacts (if present)
if exist bun.lockb move bun.lockb frontend\

# Android folder (if using Capacitor)
if exist android move android frontend\

# Environment files
if exist .env move .env frontend\
```

### Step 3: Move Backend Files

**Rename `server/` to `backend/`:**

```bash
# Option 1: Rename
rename server backend

# Option 2: If rename fails, copy then delete
xcopy /E /I server backend
rmdir /S /Q server
```

### Step 4: Create Environment Files

**Frontend `.env.example` (already exists, move to frontend/):**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_API_BASE_URL=http://localhost:3001/api
```

**Backend `.env.example` (already exists, stays in backend/):**
```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Step 5: Update .gitignore

The `.gitignore` in root should ignore environment files in both folders:

```gitignore
# Environment variables
.env
.env.local
.env.*.local
frontend/.env
backend/.env

# Dependencies
node_modules/
frontend/node_modules/
backend/node_modules/

# Build outputs
dist/
frontend/dist/
backend/dist/

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
```

---

## 📦 Root Package.json

Create a new `package.json` in the **root** directory to manage both servers:

```json
{
  "name": "hr-application",
  "version": "1.0.0",
  "description": "HR Application with React Frontend and Express Backend",
  "scripts": {
    "install:frontend": "cd frontend && npm install",
    "install:backend": "cd backend && npm install",
    "install:all": "npm run install:frontend && npm run install:backend",

    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",

    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "build": "npm run build:frontend && npm run build:backend",

    "start:frontend": "cd frontend && npm run preview",
    "start:backend": "cd backend && npm start",
    "start": "concurrently \"npm run start:backend\" \"npm run start:frontend\""
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

Install concurrently in root:
```bash
npm install
```

---

## 🔄 Update Frontend Package.json

In `frontend/package.json`, keep it as is - it's already correct.

---

## 🔄 Update Backend Package.json

In `backend/package.json`, keep it as is - it's already correct.

---

## 📝 Update Documentation References

Update all documentation files to reflect new paths:

### In SETUP.md, QUICKSTART.md, etc.:

**OLD:**
```bash
cd server
npm run dev
```

**NEW:**
```bash
cd backend
npm run dev
```

**OLD:**
```bash
npm run dev  # (for frontend)
```

**NEW:**
```bash
cd frontend
npm run dev
```

---

## 🚀 New Startup Commands

### Option 1: Run Both Servers with One Command

From **root** directory:
```bash
npm run dev
```

This runs both frontend and backend concurrently.

### Option 2: Run Servers Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## ✅ Verification Checklist

After restructuring, verify:

- [ ] `frontend/` folder exists with all frontend files
- [ ] `backend/` folder exists with all backend files
- [ ] `frontend/src/` contains React components
- [ ] `backend/src/` contains Express routes
- [ ] `frontend/package.json` exists
- [ ] `backend/package.json` exists
- [ ] Root `package.json` exists with scripts
- [ ] `frontend/.env` configured
- [ ] `backend/.env` configured
- [ ] No `server/` folder remains
- [ ] Run `npm run dev` from root works

---

## 🧪 Test the New Structure

```bash
# 1. Install all dependencies
npm run install:all

# 2. Start both servers
npm run dev

# 3. Open browser to http://localhost:5173
# 4. Verify backend is running at http://localhost:3001/health
# 5. Test creating a job
# 6. Check network tab - requests go to localhost:3001
```

---

## ❌ Troubleshooting

### "Cannot find module"

**Solution:** Reinstall dependencies
```bash
cd frontend && npm install
cd ../backend && npm install
```

### "Port already in use"

**Solution:** Kill processes on ports 3001 and 5173
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### "CORS Error"

**Solution:** Update `FRONTEND_URL` in `backend/.env`
```env
FRONTEND_URL=http://localhost:5173
```

---

## 📊 File Structure Comparison

### Before:
```
/
├── src/                    ❌ Mixed with backend
├── server/                 ❌ Not clear naming
├── package.json            ❌ Only frontend
└── ...
```

### After:
```
/
├── frontend/               ✅ Clear separation
├── backend/                ✅ Clear naming
├── package.json            ✅ Manages both
└── ...
```

---

## 🎯 Benefits of New Structure

1. ✅ **Clear Separation**: Frontend and backend are distinct
2. ✅ **Easier Deployment**: Deploy folders independently
3. ✅ **Better Organization**: Each folder is self-contained
4. ✅ **Team Collaboration**: Frontend and backend teams work independently
5. ✅ **Scalability**: Easy to add more services (e.g., admin panel)

---

## 📚 Next Steps

After restructuring:

1. Update all import paths (if needed)
2. Update deployment scripts
3. Update CI/CD pipelines
4. Test all functionality
5. Commit changes

---

## 🔒 Security Note

After restructuring, ensure:

- ✅ `frontend/.env` has ANON key only
- ✅ `backend/.env` has SERVICE_ROLE key
- ✅ Both `.env` files in `.gitignore`
- ✅ `.env.example` files committed (no secrets)

---

## Summary

This restructure gives you a professional, industry-standard project layout:

```
hr-app/
├── frontend/    # React app
├── backend/     # Express API
└── package.json # Root controller
```

Much cleaner and easier to manage! 🎉
