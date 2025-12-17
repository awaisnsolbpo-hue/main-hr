# HR Backend API

Secure backend API server for the HR Application.

## Features

- ✅ Express.js REST API
- ✅ JWT Authentication with Supabase
- ✅ Input validation with Joi
- ✅ Security with Helmet & CORS
- ✅ Rate limiting
- ✅ Centralized error handling

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `server` directory:

```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Important:** Use the `SUPABASE_SERVICE_ROLE_KEY` (not the anon key) for backend operations.

### 3. Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication
All API endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Jobs API
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create new job
- `PATCH /api/jobs/:id` - Update job
- `PATCH /api/jobs/:id/status` - Update job status
- `DELETE /api/jobs/:id` - Delete job

### Candidates API
- `GET /api/candidates` - Get all candidates
- `GET /api/candidates/:id` - Get candidate by ID
- `POST /api/candidates` - Create candidate
- `PATCH /api/candidates/:id` - Update candidate
- `DELETE /api/candidates/:id` - Delete candidate
- `GET /api/candidates/status/shortlisted` - Get shortlisted candidates
- `GET /api/candidates/status/qualified` - Get qualified candidates

### Meetings API
- `GET /api/meetings` - Get all meetings
- `GET /api/meetings/:id` - Get meeting by ID
- `POST /api/meetings` - Create meeting
- `PATCH /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting

### Dashboard API
- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/dashboard/upcoming-meetings` - Get upcoming meetings
- `GET /api/dashboard/recent-activities` - Get recent activities

## Security Features

1. **Authentication Middleware**: Validates JWT tokens from Supabase
2. **Input Validation**: Joi schemas validate all request data
3. **Rate Limiting**: 100 requests per 15 minutes per IP
4. **CORS**: Configured for specific frontend origin
5. **Helmet**: Security headers protection
6. **Row Level Security**: All queries filter by user_id

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── supabase.js          # Supabase client config
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   └── errorHandler.js      # Error handling
│   ├── routes/
│   │   ├── jobs.js              # Jobs endpoints
│   │   ├── candidates.js        # Candidates endpoints
│   │   ├── meetings.js          # Meetings endpoints
│   │   └── dashboard.js         # Dashboard endpoints
│   ├── validators/
│   │   └── jobValidators.js     # Input validation schemas
│   └── index.js                 # App entry point
├── .env                         # Environment variables
├── .env.example                 # Example environment file
├── package.json
└── README.md
```

## Error Handling

All errors return JSON responses with proper status codes:

```json
{
  "error": "Error message",
  "details": ["Additional error details"]
}
```

Common status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (auth errors)
- `404` - Not Found
- `500` - Internal Server Error
