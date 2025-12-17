# HR Application - Complete Setup Guide

## 🔐 Security Improvements

This application has been refactored from direct database access to a secure backend API architecture.

### What Changed:
- ✅ **Backend API Layer**: Express.js server with REST API
- ✅ **Secure Authentication**: JWT token validation on every request
- ✅ **Input Validation**: Server-side validation with Joi
- ✅ **Rate Limiting**: Protection against brute force attacks
- ✅ **No Direct DB Access**: Frontend only communicates via API
- ✅ **Service Role Key**: Backend uses secure service role key (not exposed to frontend)

## Prerequisites

- Node.js 18+
- npm or bun
- Supabase account

## Installation

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Configure Frontend Environment

Create `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
VITE_API_BASE_URL=http://localhost:3001/api
```

**Important:** Only use the ANON/PUBLISHABLE key for frontend. Never use service role key in frontend.

### 3. Configure Backend Environment

Create `server/.env` file:

```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Important:** Use the SERVICE_ROLE_KEY for backend (found in Supabase Dashboard > Settings > API).

### 4. Start the Application

Open two terminal windows:

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Architecture

### Old Architecture (Insecure)
```
Frontend → Supabase Database (Direct Access)
❌ Database credentials exposed in frontend
❌ No server-side validation
❌ Limited security controls
```

### New Architecture (Secure)
```
Frontend → Backend API → Supabase Database
✅ Credentials secured in backend
✅ Server-side validation and security
✅ Rate limiting and authentication
```

## API Service Layer

The frontend now uses a centralized API service (`src/services/api.ts`):

```typescript
import { jobsApi, candidatesApi, dashboardApi, meetingsApi } from '@/services/api';

// Create a job
const { job } = await jobsApi.create(jobData);

// Get all jobs
const { jobs } = await jobsApi.getAll();

// Update job status
await jobsApi.updateStatus(jobId, 'closed');
```

## Security Features

1. **JWT Authentication**: Every API request validates the user's JWT token
2. **Row-Level Security**: Users can only access their own data
3. **Input Validation**: Joi schemas validate all inputs server-side
4. **Rate Limiting**: 100 requests per 15 minutes per IP
5. **CORS Protection**: Only allowed frontend origin can access API
6. **Helmet Security**: Standard security headers
7. **Error Handling**: Centralized error handling without exposing sensitive info

## Testing the Application

1. **Health Check**: Visit http://localhost:3001/health
2. **Create Account**: Sign up through the frontend
3. **Create Job**: Test job creation (goes through API)
4. **View Dashboard**: Check metrics (fetched from API)

## Production Deployment

### Frontend (Vercel/Netlify)

Update `.env` with production values:
```env
VITE_API_BASE_URL=https://your-backend-api.com/api
```

### Backend (Railway/Render/Heroku)

1. Deploy the `server` directory
2. Set environment variables:
   - `PORT`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FRONTEND_URL` (your production frontend URL)
   - `NODE_ENV=production`

## Troubleshooting

### CORS Errors
Ensure `FRONTEND_URL` in backend `.env` matches your frontend origin exactly.

### Authentication Errors
- Frontend: Check `VITE_SUPABASE_PUBLISHABLE_KEY`
- Backend: Check `SUPABASE_SERVICE_ROLE_KEY`

### API Connection Failed
- Ensure backend server is running on port 3001
- Check `VITE_API_BASE_URL` in frontend `.env`

## File Organization

```
/
├── src/                       # Frontend source
│   ├── pages/                 # React pages (now using API)
│   ├── services/
│   │   └── api.ts            # API service layer
│   └── integrations/
│       └── supabase/
│           └── client.ts      # Supabase client (auth only)
├── server/                    # Backend API
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   ├── middleware/       # Auth & error handling
│   │   ├── validators/       # Input validation
│   │   └── config/           # Supabase config
│   └── package.json
├── .env                      # Frontend environment
└── package.json              # Frontend dependencies
```

## Support

For issues or questions, please open an issue in the GitHub repository.
