# 🚀 Quick Start Guide

## TL;DR

```bash
# 1. Install dependencies
npm install
cd server && npm install && cd ..

# 2. Create environment files
cp .env.example .env
cp server/.env.example server/.env

# 3. Edit .env files with your Supabase credentials

# 4. Start backend (Terminal 1)
cd server && npm run dev

# 5. Start frontend (Terminal 2)
npm run dev
```

---

## Step-by-Step Setup

### 1️⃣ Get Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (e.g., `https://xxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`)

### 2️⃣ Configure Frontend Environment

Create `.env` in **root directory**:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi...  # Use ANON key
VITE_API_BASE_URL=http://localhost:3001/api
```

### 3️⃣ Configure Backend Environment

Create `server/.env` in **server directory**:

```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...  # Use SERVICE_ROLE key
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

⚠️ **IMPORTANT:**
- Frontend uses **ANON key** (limited permissions)
- Backend uses **SERVICE_ROLE key** (full access)
- **NEVER** use service_role key in frontend!

### 4️⃣ Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 5️⃣ Start the Application

**Option A: Two Terminals (Recommended)**

Terminal 1 - Backend:
```bash
cd server
npm run dev
```

Terminal 2 - Frontend:
```bash
npm run dev
```

**Option B: Single Command (if you have concurrently installed)**

```bash
npm run dev:all
```

### 6️⃣ Verify It's Working

1. **Backend Health Check:**
   - Open http://localhost:3001/health
   - Should see: `{"status":"ok","timestamp":"..."}`

2. **Frontend:**
   - Open http://localhost:5173
   - Should see the login page

3. **Test the Flow:**
   - Create an account
   - Login
   - Create a job
   - Check network tab - requests go to `http://localhost:3001/api/*`

---

## Common Issues & Solutions

### ❌ "CORS Error"

**Problem:** Frontend can't connect to backend

**Solution:**
- Check `FRONTEND_URL` in `server/.env` matches your frontend URL exactly
- Default: `http://localhost:5173`

### ❌ "Unauthorized" or "Invalid Token"

**Problem:** Authentication failing

**Solution:**
- Verify `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env` is correct (anon key)
- Verify `SUPABASE_SERVICE_ROLE_KEY` in `server/.env` is correct
- Make sure you're logged in

### ❌ "Cannot connect to backend"

**Problem:** Frontend can't reach backend

**Solution:**
- Ensure backend is running (`cd server && npm run dev`)
- Check `VITE_API_BASE_URL` in `.env` is `http://localhost:3001/api`
- Verify backend is running on port 3001

### ❌ "Port already in use"

**Problem:** Port 3001 or 5173 is taken

**Solution:**

Backend port:
```env
# In server/.env
PORT=3002  # Use different port
```

Then update frontend:
```env
# In .env
VITE_API_BASE_URL=http://localhost:3002/api
```

### ❌ Dependencies not installing

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Same for backend
cd server
rm -rf node_modules package-lock.json
npm install
```

---

## Environment Variables Cheat Sheet

### Frontend (`.env`)
| Variable | Example | Where to Find |
|----------|---------|---------------|
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGci...` | Supabase Dashboard → Settings → API → anon/public |
| `VITE_API_BASE_URL` | `http://localhost:3001/api` | Your backend URL |

### Backend (`server/.env`)
| Variable | Example | Where to Find |
|----------|---------|---------------|
| `PORT` | `3001` | Any available port |
| `SUPABASE_URL` | `https://xxx.supabase.co` | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Supabase Dashboard → Settings → API → service_role |
| `FRONTEND_URL` | `http://localhost:5173` | Your frontend URL |
| `NODE_ENV` | `development` | Environment type |

---

## Testing the Security

### ✅ Test 1: Direct DB Access is Blocked

1. Open browser DevTools → Console
2. Try:
   ```javascript
   // This should NOT work anymore
   await supabase.from('jobs').insert({ title: 'test' })
   ```
3. Should fail or require complex auth

### ✅ Test 2: API Authentication Works

1. Open Network tab in DevTools
2. Create a job
3. Look for request to `http://localhost:3001/api/jobs`
4. Check headers - should have `Authorization: Bearer ...`

### ✅ Test 3: Validation Works

1. Try to create a job with:
   - Empty title → Should fail
   - Title with 1 character → Should fail
   - Invalid email → Should fail

### ✅ Test 4: Rate Limiting Works

1. Make 101 API requests quickly
2. The 101st should return `429 Too Many Requests`

---

## Next Steps

Once everything is running:

1. ✅ Read [SECURITY.md](./SECURITY.md) for security details
2. ✅ Read [SETUP.md](./SETUP.md) for complete setup guide
3. ✅ Read [README_REFACTORING.md](./README_REFACTORING.md) for architecture details
4. ✅ Check `server/README.md` for API documentation

---

## Production Deployment

### Frontend (Vercel/Netlify)

1. Update `.env` with production values:
   ```env
   VITE_API_BASE_URL=https://your-backend.com/api
   ```

2. Deploy:
   ```bash
   npm run build
   # Upload dist/ folder
   ```

### Backend (Railway/Render)

1. Push `server/` directory
2. Set environment variables in hosting dashboard
3. Ensure `FRONTEND_URL` matches your production frontend

---

## Need Help?

1. Check [Common Issues](#common-issues--solutions) above
2. Review [SETUP.md](./SETUP.md) for detailed instructions
3. Check Supabase logs for database issues
4. Check browser console for frontend errors
5. Check backend terminal for server errors

---

## Success! 🎉

You should now have:
- ✅ Backend API running on http://localhost:3001
- ✅ Frontend running on http://localhost:5173
- ✅ Secure authentication
- ✅ All requests going through backend API
- ✅ Input validation working
- ✅ Rate limiting active

**You're ready to develop!** 🚀
