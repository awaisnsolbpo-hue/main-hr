# Recruiter Role Verification Flow

## Overview

This document explains how the recruiter login and dashboard access flow verifies user roles and redirects appropriately.

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              Recruiter Login Flow                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────┐
        │  User visits /recruiter/login     │
        └───────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────┐
        │  User enters credentials           │
        │  Submits login form                 │
        └───────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────┐
        │  Call authApi.loginRecruiter()    │
        │  - Validates credentials           │
        │  - Checks user_roles table         │
        │  - Verifies recruiter role         │
        │  - Creates/updates profile         │
        └───────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────┐
        │  checkRoleAndNavigate()            │
        │  - Queries user_roles table        │
        │  - Verifies role = 'recruiter'     │
        └───────────────────────────────────┘
                            ↓
        ┌───────────────┬───────────────────┐
        │   RECRUITER   │    NOT RECRUITER   │
        └───────────────┴───────────────────┘
                ↓                    ↓
    ┌──────────────────┐    ┌──────────────────┐
    │ Redirect to      │    │ Show error       │
    │ /recruiter/      │    │ Sign out         │
    │ dashboard        │    │ Redirect to      │
    └──────────────────┘    │ /applicant/login │
                            └──────────────────┘
```

## Implementation Details

### 1. Login Page (`Login.tsx`)

**Location:** `frontend/src/pages/Login.tsx`

**Key Functions:**

#### `checkRoleAndNavigate(userId: string)`
- Queries `user_roles` table to get user's role
- Verifies role is `'recruiter'`
- Redirects to `/recruiter/dashboard` if recruiter
- Shows error and redirects to `/applicant/login` if user is applicant
- Handles errors gracefully

#### `handleLogin()`
- Calls `authApi.loginRecruiter()` (backend validates role)
- After successful login, calls `checkRoleAndNavigate()` to verify role
- Shows appropriate error messages

**Error Handling:**
- If user is applicant: Shows error and redirects to applicant login
- If credentials invalid: Shows generic error
- If role check fails: Falls back to redirecting to recruiter dashboard

### 2. Dashboard Layout (`DashboardLayout.tsx`)

**Location:** `frontend/src/components/DashboardLayout.tsx`

**Role Verification:**
- Uses `useUserRoleAndProfile(true)` hook
- Automatically checks role on mount
- Redirects to `/applicant/dashboard` if user is applicant
- Redirects to `/recruiter/login` if user has no role or unknown role
- Shows loading state while checking

**Protection:**
- All recruiter pages wrapped in `DashboardLayout` are automatically protected
- Role is verified before rendering content
- Unauthorized users are redirected immediately

### 3. Protected Route Component (`ProtectedRoute.tsx`)

**Location:** `frontend/src/components/ProtectedRoute.tsx`

**Usage:**
- Can be used to wrap routes that need role verification
- Accepts `requiredRole` prop (`'recruiter'` or `'applicant'`)
- Checks user role before rendering children
- Redirects to appropriate login page if not authenticated
- Redirects to appropriate dashboard if wrong role

**Example:**
```tsx
<Route 
  path="/recruiter/some-page" 
  element={
    <ProtectedRoute requiredRole="recruiter">
      <SomePage />
    </ProtectedRoute>
  } 
/>
```

### 4. useUserRoleAndProfile Hook

**Location:** `frontend/src/hooks/useUserRoleAndProfile.tsx`

**Features:**
- Gets authenticated user from Supabase
- Queries `user_roles` table
- Loads appropriate profile (recruiter from `profiles`, applicant from `applicants`)
- Automatically redirects based on role if `autoRedirect=true`
- Returns user, role, and profile data

**Usage in Recruiter Pages:**
```tsx
const { user, role, recruiterProfile, loading } = useUserRoleAndProfile(true);

// Hook automatically:
// - Checks if user is authenticated
// - Verifies recruiter role
// - Loads profile from profiles table
// - Redirects to /recruiter/dashboard
```

## Role Verification Points

### 1. Login (`/recruiter/login`)
- ✅ Backend API validates role (`authApi.loginRecruiter`)
- ✅ Frontend verifies role after login (`checkRoleAndNavigate`)
- ✅ Redirects to appropriate dashboard based on role

### 2. Dashboard Access (`/recruiter/dashboard`)
- ✅ `DashboardLayout` uses `useUserRoleAndProfile` hook
- ✅ Hook verifies recruiter role
- ✅ Redirects if user doesn't have recruiter role

### 3. All Recruiter Routes
- ✅ Protected by `DashboardLayout` wrapper
- ✅ Role verified on every page load
- ✅ Automatic redirect if wrong role

## Error Scenarios

### Scenario 1: Applicant tries to access recruiter login
1. User enters credentials on `/recruiter/login`
2. `authApi.loginRecruiter()` returns error (user is applicant)
3. Error message shown: "This account is registered as an applicant..."
4. User redirected to `/applicant/login`

### Scenario 2: Applicant somehow accesses recruiter dashboard
1. User navigates to `/recruiter/dashboard`
2. `DashboardLayout` checks role via `useUserRoleAndProfile`
3. Role is `'applicant'`, not `'recruiter'`
4. User automatically redirected to `/applicant/dashboard`

### Scenario 3: User with no role tries to access
1. User navigates to `/recruiter/dashboard`
2. `DashboardLayout` checks role
3. No role found
4. User redirected to `/recruiter/login`

## Security Features

1. **Backend Validation**: API endpoints validate role before processing requests
2. **Frontend Verification**: Multiple layers of role checking
3. **Automatic Redirects**: Users are redirected to appropriate pages based on role
4. **Session Checking**: Role is verified on every page load
5. **Error Handling**: Graceful error messages and fallbacks

## Testing Checklist

- [ ] Recruiter can log in via `/recruiter/login`
- [ ] Recruiter is redirected to `/recruiter/dashboard` after login
- [ ] Applicant cannot log in via `/recruiter/login` (shows error)
- [ ] Applicant is redirected to `/applicant/login` if they try recruiter login
- [ ] Recruiter can access all `/recruiter/*` routes
- [ ] Applicant cannot access `/recruiter/*` routes (redirected to applicant dashboard)
- [ ] User with no role is redirected to login
- [ ] Role is verified on every page navigation
- [ ] Loading states show while checking role
- [ ] Error messages are user-friendly

## Best Practices

1. **Always use `DashboardLayout`** for recruiter pages - it handles role verification automatically
2. **Use `useUserRoleAndProfile` hook** when you need role/profile data
3. **Use `ProtectedRoute`** for additional route-level protection if needed
4. **Handle loading states** while role is being verified
5. **Provide clear error messages** when role verification fails

