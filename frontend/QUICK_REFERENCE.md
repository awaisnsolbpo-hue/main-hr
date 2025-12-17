# ⚡ Quick Reference Card

## 🚀 Getting Started (5 Minutes)

### Step 1: Restructure
```bash
# Run automated script
restructure.bat

# OR manually create:
mkdir frontend
mkdir backend
# Move files as per RESTRUCTURE_GUIDE.md
```

### Step 2: Install Dependencies
```bash
npm install                  # Root
cd frontend && npm install   # Frontend
cd ../backend && npm install # Backend
```

### Step 3: Configure Environment

**`frontend/.env`:**
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...anon_key
VITE_API_BASE_URL=http://localhost:3001/api
```

**`backend/.env`:**
```env
PORT=3001
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_key
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Step 4: Start
```bash
npm run dev  # From root - starts both servers
```

---

## 📁 Project Structure

```
/
├── frontend/          # React app (port 5173)
│   ├── src/
│   └── .env
├── backend/           # Express API (port 3001)
│   ├── src/
│   └── .env
└── package.json       # Runs both
```

---

## 🔧 Common Commands

### Root Directory
```bash
npm run dev              # Start both servers
npm run install:all      # Install all deps
npm run build            # Build both
npm run clean            # Clean everything
```

### Frontend Only
```bash
cd frontend
npm run dev              # Start frontend
npm run build            # Build for production
```

### Backend Only
```bash
cd backend
npm run dev              # Start backend
npm start                # Production mode
```

---

## 🌐 URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | React app |
| Backend | http://localhost:3001 | API server |
| Health Check | http://localhost:3001/health | API status |

---

## 🔐 Environment Keys

| File | Key | Type | Use |
|------|-----|------|-----|
| `frontend/.env` | `VITE_SUPABASE_PUBLISHABLE_KEY` | ANON | Browser-safe |
| `backend/.env` | `SUPABASE_SERVICE_ROLE_KEY` | SERVICE | Backend only |

⚠️ **NEVER** use service role key in frontend!

---

## 🛠️ Troubleshooting

### CORS Error
```env
# In backend/.env
FRONTEND_URL=http://localhost:5173  # Must match exactly
```

### Port in Use
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Auth Failed
- Check `VITE_SUPABASE_PUBLISHABLE_KEY` (frontend)
- Check `SUPABASE_SERVICE_ROLE_KEY` (backend)
- Verify you're logged in

### Cannot Connect to Backend
- Is backend running? `cd backend && npm run dev`
- Check `VITE_API_BASE_URL` in frontend `.env`

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `FINAL_SUMMARY.md` | Complete overview |
| `QUICKSTART.md` | 5-minute setup |
| `RESTRUCTURE_GUIDE.md` | How to reorganize |
| `SECURITY.md` | Security details |
| `SETUP.md` | Full setup guide |
| `backend/README.md` | API documentation |

---

## 🔒 Security Checklist

- [ ] Frontend uses ANON key only
- [ ] Backend uses SERVICE_ROLE key
- [ ] Both `.env` files in `.gitignore`
- [ ] JWT token in Authorization header
- [ ] All API requests authenticated
- [ ] Input validation enabled
- [ ] Rate limiting active

---

## ✅ Verification

### Quick Test
```bash
# 1. Health check
curl http://localhost:3001/health

# 2. Open browser
http://localhost:5173

# 3. Login and create a job

# 4. Check Network tab
# Should see: http://localhost:3001/api/jobs
# With: Authorization: Bearer <token>
```

---

## 🎯 Key Files

### Frontend
- `frontend/src/services/api.ts` - API calls
- `frontend/src/pages/CreateJob.tsx` - Uses API
- `frontend/.env` - Environment config

### Backend
- `backend/src/index.js` - Server entry
- `backend/src/routes/jobs.js` - Jobs API
- `backend/src/middleware/auth.js` - Authentication
- `backend/.env` - Environment config

---

## 📞 Need Help?

1. Check `QUICKSTART.md` → Common Issues
2. Read `SECURITY.md` for security
3. See `SETUP.md` for detailed steps
4. Review error messages in:
   - Browser console (frontend)
   - Terminal (backend)

---

## 🚀 Deploy

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Render)
```bash
# Deploy backend/ folder
# Set environment variables in dashboard
```

---

## 📊 Status Indicators

✅ Working correctly
⚠️ Needs attention
❌ Critical issue

### Check Status:
- Frontend running → ✅ http://localhost:5173 loads
- Backend running → ✅ http://localhost:3001/health returns OK
- API connected → ✅ Network tab shows localhost:3001
- Auth working → ✅ Authorization header present

---

**Keep this file handy for quick reference!** 📌
