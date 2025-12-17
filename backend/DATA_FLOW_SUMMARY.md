# Data Flow Summary - Recruiters & Applicants

## Overview

This document explains how user data flows to the correct tables based on which signup/login page they use.

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SIGNUP/LOGIN FLOW                        │
└─────────────────────────────────────────────────────────────┘

Recruiter Signup/Login (/recruiter/signup or /recruiter/login)
    ↓
    Creates/Updates:
    ✓ auth.users (Supabase Auth)
    ✓ profiles table (recruiter data)
    ✓ user_roles table (role: 'recruiter')
    ↓
    Redirects to: /recruiter/dashboard

Applicant Signup/Login (/applicant/signup or /applicant/login)
    ↓
    Creates/Updates:
    ✓ auth.users (Supabase Auth)
    ✓ applicants table (applicant data)
    ✓ user_roles table (role: 'applicant')
    ↓
    Redirects to: /applicant/dashboard
```

## API Endpoints

### Recruiter Endpoints

#### `POST /api/auth/signup/recruiter`
**Used by:** `/recruiter/signup` page

**What it does:**
1. Creates auth user in `auth.users`
2. Creates/updates profile in `profiles` table
3. Creates `recruiter` role in `user_roles` table
4. Validates email is not used by applicant

**Request:**
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
  "user": { "id": "uuid", "email": "recruiter@company.com" },
  "message": "Recruiter account created successfully"
}
```

#### `POST /api/auth/login/recruiter`
**Used by:** `/recruiter/login` page

**What it does:**
1. Authenticates user
2. Verifies/creates `recruiter` role
3. Ensures profile exists in `profiles` table
4. Returns session and role

**Request:**
```json
{
  "email": "recruiter@company.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "user": { "id": "uuid", "email": "recruiter@company.com" },
  "session": { "access_token": "...", "refresh_token": "..." },
  "role": "recruiter",
  "message": "Login successful"
}
```

### Applicant Endpoints

#### `POST /api/auth/signup/applicant`
**Used by:** `/applicant/signup` page

**What it does:**
1. Creates auth user in `auth.users`
2. Creates/updates applicant in `applicants` table
3. Creates `applicant` role in `user_roles` table
4. Validates email is not used by recruiter

**Request:**
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
  "user": { "id": "uuid", "email": "applicant@example.com" },
  "message": "Applicant account created successfully"
}
```

#### `POST /api/auth/login/applicant`
**Used by:** `/applicant/login` page

**What it does:**
1. Authenticates user
2. Verifies/creates `applicant` role
3. Ensures applicant profile exists in `applicants` table
4. Returns session and role

**Request:**
```json
{
  "email": "applicant@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "user": { "id": "uuid", "email": "applicant@example.com" },
  "session": { "access_token": "...", "refresh_token": "..." },
  "role": "applicant",
  "message": "Login successful"
}
```

## Database Tables

### `profiles` Table (Recruiters)
- Stores recruiter/company information
- Linked to `auth.users` via `id` (which is `user_id`)
- Created when user signs up/logs in as recruiter

**Key Fields:**
- `id` (UUID, references `auth.users.id`)
- `email`
- `full_name`
- `company_name`
- `company_description`
- etc.

### `applicants` Table (Applicants)
- Stores applicant profile information
- Linked to `auth.users` via `user_id`
- Created when user signs up/logs in as applicant

**Key Fields:**
- `id` (UUID, primary key)
- `user_id` (UUID, references `auth.users.id`)
- `email`
- `first_name`
- `last_name`
- `profession`
- `skills`
- `cv_url`
- etc.

### `user_roles` Table
- Stores user roles (one role per user)
- Links to `auth.users` via `user_id`

**Key Fields:**
- `id` (UUID, primary key)
- `user_id` (UUID, references `auth.users.id`, UNIQUE)
- `role` (enum: 'applicant' | 'recruiter')

## Enforcement Rules

### Single Role Per User
- Database constraint: `user_roles.user_id` is UNIQUE
- Trigger prevents multiple roles
- API checks before creating role

### Email Uniqueness Across Roles
- Trigger on `applicants` table checks `profiles` table
- Trigger on `profiles` table checks `applicants` table
- Prevents same email from being used by both roles

### Data Routing
- **Recruiter signup/login** → Always saves to `profiles` table
- **Applicant signup/login** → Always saves to `applicants` table
- Roles are automatically assigned based on signup/login page

## Frontend Integration

### Recruiter Pages
- **Signup:** `frontend/src/pages/Signup.tsx` → Uses `authApi.signupRecruiter()`
- **Login:** `frontend/src/pages/Login.tsx` → Uses `authApi.loginRecruiter()`

### Applicant Pages
- **Signup:** `frontend/src/pages/ApplicantSignup.tsx` → Uses `authApi.signupApplicant()`
- **Login:** `frontend/src/pages/ApplicantLogin.tsx` → Uses `authApi.loginApplicant()`

## Error Handling

### Role Conflicts
- If user tries to sign up as recruiter but already has applicant role → Error
- If user tries to sign up as applicant but already has recruiter role → Error

### Email Conflicts
- If email is used by recruiter, cannot create applicant account → Error
- If email is used by applicant, cannot create recruiter account → Error

## Testing Checklist

- [ ] Recruiter signup creates profile and recruiter role
- [ ] Applicant signup creates applicant profile and applicant role
- [ ] Recruiter login ensures profile exists
- [ ] Applicant login ensures applicant profile exists
- [ ] Cannot create recruiter account if email is used by applicant
- [ ] Cannot create applicant account if email is used by recruiter
- [ ] Cannot have both roles (enforced by database)

