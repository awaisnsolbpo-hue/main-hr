# 🏗️ Project Structure Overview

## 📁 Clean Architecture

This project follows a **monorepo structure** with clear separation between frontend and backend:

```
hr-application/
│
├── frontend/                          # React + Vite Application
│   ├── src/
│   │   ├── pages/                     # React pages
│   │   ├── components/                # Reusable components
│   │   ├── services/
│   │   │   └── api.ts                 # Backend API calls
│   │   ├── integrations/
│   │   │   └── supabase/              # Supabase client
│   │   ├── lib/                       # Utilities
│   │   └── hooks/                     # Custom React hooks
│   │
│   ├── public/                        # Static assets
│   ├── .env                           # Frontend environment
│   ├── .env.example                   # Environment template
│   ├── package.json                   # Frontend dependencies
│   ├── vite.config.ts                 # Vite configuration
│   └── tsconfig.json                  # TypeScript config
│
├── backend/                           # Express.js API Server
│   ├── src/
│   │   ├── routes/                    # API endpoints
│   │   │   ├── jobs.js                # Jobs CRUD
│   │   │   ├── candidates.js          # Candidates CRUD
│   │   │   ├── meetings.js            # Meetings CRUD
│   │   │   └── dashboard.js           # Dashboard data
│   │   │
│   │   ├── middleware/                # Express middleware
│   │   │   ├── auth.js                # JWT authentication
│   │   │   └── errorHandler.js        # Error handling
│   │   │
│   │   ├── validators/                # Input validation
│   │   │   └── jobValidators.js       # Joi schemas
│   │   │
│   │   ├── config/                    # Configuration
│   │   │   └── supabase.js            # Supabase setup
│   │   │
│   │   └── index.js                   # Express app entry
│   │
│   ├── .env                           # Backend environment
│   ├── .env.example                   # Environment template
│   ├── package.json                   # Backend dependencies
│   └── README.md                      # API documentation
│
├── .gitignore                         # Git ignore rules
├── package.json                       # Root - manages both
│
└── docs/                              # Documentation
    ├── README.md                      # Main readme
    ├── SETUP.md                       # Setup guide
    ├── SECURITY.md                    # Security docs
    ├── QUICKSTART.md                  # Quick start
    └── API.md                         # API reference
```

---

## 🎯 Why This Structure?

### ✅ Benefits

1. **Clear Separation**
   - Frontend and backend are completely independent
   - Easy to understand what code belongs where

2. **Independent Deployment**
   - Deploy frontend to Vercel/Netlify
   - Deploy backend to Railway/Render
   - No mixing of concerns

3. **Team Collaboration**
   - Frontend team works in `frontend/`
   - Backend team works in `backend/`
   - Minimal conflicts

4. **Scalability**
   - Easy to add more services (admin panel, mobile app, etc.)
   - Each service is self-contained

5. **Development Experience**
   - Run both servers with one command: `npm run dev`
   - Or run them separately for focused work

---

## 🚀 Getting Started

### Quick Start (One Command)

```bash
# Install all dependencies
npm run install:all

# Start both servers
npm run dev
```

### Manual Start (Two Terminals)

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 📦 Package Management

### Root `package.json`

The root `package.json` provides convenient scripts to manage both applications:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "install:all": "npm run install:frontend && npm run install:backend",
    "build": "npm run build:frontend && npm run build:backend"
  }
}
```

### Frontend `package.json`

Located at `frontend/package.json` - manages React, Vite, and UI dependencies.

### Backend `package.json`

Located at `backend/package.json` - manages Express, validation, and database dependencies.

---

## 🔧 Environment Variables

### Frontend (`.env` in `frontend/`)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_API_BASE_URL=http://localhost:3001/api
```

**Note:** Only ANON key here (safe for browser)

### Backend (`.env` in `backend/`)

```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Note:** SERVICE_ROLE key here (never exposed to browser)

---

## 🌐 Application Flow

```
┌─────────────────────────────────────────────┐
│  User Browser                                │
│  http://localhost:5173                       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Frontend (React + Vite)                     │
│  Port: 5173                                  │
│  Location: ./frontend/                       │
│                                              │
│  - Serves UI                                 │
│  - Handles routing                           │
│  - Makes API calls                           │
└──────────────────┬──────────────────────────┘
                   │ HTTP/HTTPS
                   │ Authorization: Bearer <JWT>
                   ▼
┌─────────────────────────────────────────────┐
│  Backend (Express API)                       │
│  Port: 3001                                  │
│  Location: ./backend/                        │
│                                              │
│  - Validates JWT                             │
│  - Validates input                           │
│  - Business logic                            │
│  - Database queries                          │
└──────────────────┬──────────────────────────┘
                   │ Authenticated queries
                   ▼
┌─────────────────────────────────────────────┐
│  Supabase Database                           │
│  PostgreSQL + Row Level Security             │
└─────────────────────────────────────────────┘
```

---

## 📝 Development Workflow

### Adding a New Feature

1. **Backend First:**
   ```bash
   cd backend/src/routes
   # Create new route file
   # Add to backend/src/index.js
   ```

2. **Add API Method:**
   ```bash
   cd frontend/src/services
   # Update api.ts with new method
   ```

3. **Use in Frontend:**
   ```bash
   cd frontend/src/pages
   # Import and use API method
   ```

### Example:

**1. Backend (`backend/src/routes/tasks.js`):**
```javascript
router.get('/', async (req, res) => {
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', req.user.id);
  res.json({ tasks: data });
});
```

**2. API Service (`frontend/src/services/api.ts`):**
```typescript
export const tasksApi = {
  getAll: () => apiRequest('/tasks')
};
```

**3. Frontend Page (`frontend/src/pages/Tasks.tsx`):**
```typescript
import { tasksApi } from '@/services/api';

const { tasks } = await tasksApi.getAll();
```

---

## 🏗️ Build & Deploy

### Frontend Build

```bash
cd frontend
npm run build
# Output: frontend/dist/
```

Deploy `dist/` folder to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting

### Backend Build

```bash
cd backend
npm run build  # (if using TypeScript)
# Or just deploy src/ folder
```

Deploy to:
- Railway
- Render
- Heroku
- AWS EC2/ECS
- Any Node.js hosting

---

## 🧪 Testing

### Frontend Tests

```bash
cd frontend
npm test
```

### Backend Tests

```bash
cd backend
npm test
```

### Integration Tests

```bash
# From root
npm test
```

---

## 📊 Folder Sizes

Approximate sizes after `npm install`:

```
frontend/
├── node_modules/     ~500 MB
├── src/              ~5 MB
└── dist/ (built)     ~2 MB

backend/
├── node_modules/     ~100 MB
└── src/              ~1 MB
```

---

## 🔒 Security Notes

### Frontend
- ✅ Only has ANON key (limited permissions)
- ✅ No direct database access
- ✅ All requests go through backend
- ✅ Client-side code is visible (by design)

### Backend
- ✅ Has SERVICE_ROLE key (full access)
- ✅ Not exposed to browser
- ✅ Validates all requests
- ✅ Enforces authentication
- ✅ Rate limiting enabled

---

## 📚 Documentation Structure

```
/
├── README.md                    # This file
├── SETUP.md                     # Detailed setup
├── SECURITY.md                  # Security architecture
├── QUICKSTART.md                # 5-minute setup
├── RESTRUCTURE_GUIDE.md         # How to restructure
├── frontend/
│   └── README.md                # Frontend-specific docs
└── backend/
    └── README.md                # API documentation
```

---

## ⚡ Performance Tips

1. **Development:**
   - Use `npm run dev` to start both servers
   - Hot reload enabled on both

2. **Production:**
   - Build frontend: `npm run build:frontend`
   - Minified and optimized
   - Backend: Enable compression, caching

3. **Optimization:**
   - Frontend uses code splitting
   - Backend uses connection pooling
   - API responses are minimal

---

## 🎯 Next Steps

1. ✅ Follow [RESTRUCTURE_GUIDE.md](./RESTRUCTURE_GUIDE.md) to reorganize
2. ✅ Read [SETUP.md](./SETUP.md) for environment setup
3. ✅ Review [SECURITY.md](./SECURITY.md) for security details
4. ✅ Check `backend/README.md` for API docs

---

## Summary

**Clean, Professional Structure:**
- `frontend/` - All React code
- `backend/` - All Express code
- Root - Manages both with one command

**Easy to work with, easy to deploy, easy to scale!** 🚀
