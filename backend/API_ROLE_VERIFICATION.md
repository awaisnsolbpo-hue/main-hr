# API Role Verification & Data Flow

## Overview

This document describes how signup/login data flows to the correct tables (profiles for recruiters, applicants for applicants) and how role verification works throughout the application.

## Architecture

### Data Flow

```
Recruiter Signup/Login → API → Creates/Updates:
  - auth.users (Supabase Auth)
  - profiles table (company info, recruiter profile)
  - user_roles table (role: 'recruiter')

Applicant Signup/Login → API → Creates/Updates:
  - auth.users (Supabase Auth)
  - applicants table (applicant profile, CV, skills, etc.)
  - user_roles table (role: 'applicant')
```

## API Endpoints

### Auth Endpoints (Public - No Auth Required)

#### `POST /api/auth/signup/recruiter`
Creates recruiter account:
- Creates auth user
- Creates profile in `profiles` table
- Creates role in `user_roles` table

**Request Body:**
```json
{
  "email": "recruiter@company.com",
  "password": "SecurePass123",
  "fullName": "John Doe",
  "company": "Acme Inc."
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "recruiter@company.com"
  },
  "message": "Recruiter account created successfully"
}
```

#### `POST /api/auth/signup/applicant`
Creates applicant account:
- Creates auth user
- Creates applicant profile in `applicants` table
- Creates role in `user_roles` table

**Request Body:**
```json
{
  "email": "applicant@example.com",
  "password": "SecurePass123",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890",
  "profession": "Software Engineer",
  "industry": "Technology",
  "experienceLevel": "mid",
  "bio": "Experienced developer...",
  "location": "New York",
  "city": "New York",
  "country": "USA",
  "skills": ["JavaScript", "React", "Node.js"],
  "cvUrl": "https://...",
  "cvFileName": "resume.pdf"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "applicant@example.com"
  },
  "message": "Applicant account created successfully"
}
```

#### `POST /api/auth/login`
Authenticates user and returns roles:
- Validates credentials
- Returns user info and roles
- Sets session in Supabase client

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "...",
    "refresh_token": "..."
  },
  "roles": ["recruiter", "applicant"],
  "message": "Login successful"
}
```

#### `GET /api/auth/me`
Get current user info and roles (requires auth):
- Returns user info
- Returns all user roles

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "roles": ["recruiter"]
}
```

## Role Verification

### Backend Middleware

#### `requireRole(role | roles[])`
Middleware that verifies user has required role(s) before accessing route.

**Usage:**
```javascript
import { requireRole } from '../middleware/roleVerification.js';

// Single role
router.get('/profile', authMiddleware, requireRole('recruiter'), handler);

// Multiple roles (user needs at least one)
router.get('/dashboard', authMiddleware, requireRole(['recruiter', 'applicant']), handler);
```

**Protected Routes:**
- `/api/profile/*` - Requires `recruiter` role
- `/api/applicants/me/profile` - Requires `applicant` role
- `/api/applicants/:id/*` - Requires `applicant` role (for own profile)

### Frontend Hook

#### `useRoleVerification(options)`
Hook that verifies user role on page navigation.

**Usage:**
```typescript
import { useRoleVerification } from '@/hooks/useRoleVerification';

const MyComponent = () => {
  const { loading, hasAccess, userRoles } = useRoleVerification({
    requiredRole: 'recruiter',
    redirectTo: '/recruiter/dashboard'
  });

  if (loading) return <Loading />;
  if (!hasAccess) return null; // Redirecting

  return <div>Protected Content</div>;
};
```

#### `RoleVerificationGuard`
Component wrapper for role verification.

**Usage:**
```typescript
import { RoleVerificationGuard } from '@/hooks/useRoleVerification';

<RoleVerificationGuard requiredRole="recruiter">
  <Dashboard />
</RoleVerificationGuard>
```

## Frontend Integration

### Signup Pages

**Recruiter Signup** (`/recruiter/signup`):
- Uses `authApi.signupRecruiter()`
- Creates profile in `profiles` table
- Creates `recruiter` role
- Redirects to `/recruiter/dashboard`

**Applicant Signup** (`/applicant/signup`):
- Uses `authApi.signupApplicant()`
- Creates profile in `applicants` table
- Creates `applicant` role
- Handles CV upload
- Redirects to `/applicant/dashboard`

### Login Pages

**Recruiter Login** (`/recruiter/login`):
- Uses `authApi.login()`
- Gets user roles from API
- Redirects based on roles

**Applicant Login** (`/applicant/login`):
- Uses `authApi.login()`
- Verifies user has `applicant` role
- Redirects to applicant dashboard

## Role-Based Access Control

### Route Protection

All protected routes verify:
1. **Authentication** - User is logged in (via `authMiddleware`)
2. **Authorization** - User has required role (via `requireRole`)

### Page Navigation

When navigating to protected pages:
1. `useRoleVerification` hook checks user roles
2. If user doesn't have required role → redirects to appropriate dashboard
3. If user has multiple roles → can access both dashboards

## Error Handling

### API Errors

- **401 Unauthorized**: Invalid or missing token
- **403 Forbidden**: User doesn't have required role
- **400 Bad Request**: Validation error

### Frontend Errors

- **Not authenticated**: Redirects to login page
- **Wrong role**: Redirects to user's dashboard
- **No roles**: Redirects to home page

## Testing

### Test Recruiter Signup
1. POST to `/api/auth/signup/recruiter`
2. Verify profile created in `profiles` table
3. Verify role created in `user_roles` table
4. Login and verify access to recruiter routes

### Test Applicant Signup
1. POST to `/api/auth/signup/applicant`
2. Verify applicant created in `applicants` table
3. Verify role created in `user_roles` table
4. Login and verify access to applicant routes

### Test Role Verification
1. Try accessing `/api/profile` without recruiter role → 403
2. Try accessing `/api/applicants/me/profile` without applicant role → 403
3. Verify frontend redirects work correctly

## Migration Notes

- All signup/login now goes through API
- Direct Supabase calls removed from frontend
- Role verification added to all protected routes
- Navigation automatically verifies roles

