# Environment Variables Setup

## Backend (.env)

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# VAPI Configuration
VAPI_PUBLIC_KEY=b20ebfed-ff48-43f9-a287-84b64f553d14

# OpenAI Configuration (for chatbot)
OPENAI_API_KEY=your_openai_api_key_here
```

## Frontend (.env)

Create a `.env` file in the `frontend` directory with the following variables:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api

# Supabase Configuration (for auth only)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key_here

# VAPI Configuration (fallback, prefer backend)
VITE_VAPI_PUBLIC_KEY=b20ebfed-ff48-43f9-a287-84b64f553d14
```

## Notes

- Replace all placeholder values with your actual credentials
- The backend uses the Supabase Service Role Key for server-side operations
- The frontend uses the Supabase Anon Key only for authentication
- VAPI public key is fetched from the backend API, but a fallback can be set in frontend env

