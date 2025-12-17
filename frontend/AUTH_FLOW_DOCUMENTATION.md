# Authentication Flow Documentation

## Overview

This document explains the complete authentication flow that:
1. Gets the authenticated user from Supabase Auth (`/auth/v1/user`)
2. Checks the `user_roles` table
3. Loads the appropriate profile based on role
4. Redirects to the correct dashboard

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Authentication                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────┐
        │  GET /auth/v1/user (Supabase)     │
        │  Returns authenticated user        │
        └───────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────┐
        │  Query user_roles table           │
        │  WHERE user_id = auth.user.id      │
        └───────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────┐
        │  Check role: recruiter or applicant│
        └───────────────────────────────────┘
                            ↓
        ┌───────────────┬───────────────────┐
        │   RECRUITER   │    APPLICANT       │
        └───────────────┴───────────────────┘
                ↓                    ↓
    ┌──────────────────┐    ┌──────────────────┐
    │ Load from        │    │ Load from        │
    │ profiles table   │    │ applicants table │
    └──────────────────┘    └──────────────────┘
                ↓                    ↓
    ┌──────────────────┐    ┌──────────────────┐
    │ Redirect to      │    │ Redirect to      │
    │ /recruiter/      │    │ /applicant/      │
    │ dashboard        │    │ dashboard        │
    └──────────────────┘    └──────────────────┘
```

## Implementation

### Hook: `useUserRoleAndProfile`

**Location:** `frontend/src/hooks/useUserRoleAndProfile.tsx`

**Purpose:** Centralized hook that handles the complete auth flow:
1. Gets authenticated user from Supabase
2. Checks `user_roles` table
3. Loads appropriate profile (recruiter from `profiles`, applicant from `applicants`)
4. Automatically redirects to correct dashboard

**Usage:**

```typescript
import { useUserRoleAndProfile } from "@/hooks/useUserRoleAndProfile";

const MyComponent = () => {
  const { 
    user,              // Authenticated user from Supabase
    role,              // 'recruiter' | 'applicant' | null
    recruiterProfile,  // Profile data from profiles table (if recruiter)
    applicantProfile,   // Profile data from applicants table (if applicant)
    loading,           // Loading state
    error              // Error message if any
  } = useUserRoleAndProfile(true); // true = auto redirect

  if (loading) return <Loader />;
  if (error) return <Error message={error} />;
  
  // Use user, role, and profile data...
};
```

**Parameters:**
- `autoRedirect` (boolean, default: true): If true, automatically redirects to appropriate dashboard based on role

**Returns:**
- `user`: Authenticated user object from Supabase
- `role`: User's role ('recruiter' | 'applicant' | null)
- `recruiterProfile`: Profile data from `profiles` table (null if not recruiter)
- `applicantProfile`: Profile data from `applicants` table (null if not applicant)
- `loading`: Boolean indicating if auth check is in progress
- `error`: Error message string or null

## Components Using the Hook

### 1. ApplicantDashboard
**Location:** `frontend/src/pages/ApplicantDashboard.tsx`

**Before:** Manually checked auth, role, and loaded applicant profile

**After:** Uses `useUserRoleAndProfile` hook

```typescript
const { user, role, applicantProfile, loading } = useUserRoleAndProfile(true);

useEffect(() => {
  if (applicantProfile?.id) {
    setApplicantId(applicantProfile.id);
  }
}, [applicantProfile]);
```

### 2. Dashboard (Recruiter)
**Location:** `frontend/src/pages/Dashboard.tsx`

**Before:** Manually checked auth, role, and loaded recruiter profile

**After:** Uses `useUserRoleAndProfile` hook

```typescript
const { user: authUser, role, recruiterProfile, loading: authLoading } = useUserRoleAndProfile(true);

useEffect(() => {
  if (authUser && recruiterProfile) {
    setProfile({
      id: recruiterProfile.id,
      full_name: recruiterProfile.full_name,
      email: recruiterProfile.email,
      company_name: recruiterProfile.company_name || null,
      company_logo_url: recruiterProfile.company_logo_url || null,
      is_company_profile_complete: recruiterProfile.is_company_profile_complete || false,
    });
    // Load metrics, meetings, etc.
  }
}, [authUser, recruiterProfile]);
```

### 3. DashboardLayout
**Location:** `frontend/src/components/DashboardLayout.tsx`

**Before:** Manually checked auth, role, and loaded profile

**After:** Uses `useUserRoleAndProfile` hook

```typescript
const { user, role, recruiterProfile, loading } = useUserRoleAndProfile(true);

useEffect(() => {
  if (recruiterProfile) {
    setProfile({
      id: recruiterProfile.id,
      full_name: recruiterProfile.full_name,
      email: recruiterProfile.email,
    });
  }
}, [recruiterProfile]);
```

## Profile Data Structure

### Recruiter Profile (from `profiles` table)
```typescript
interface RecruiterProfile {
  id: string;                          // Same as user_id
  email: string;
  full_name: string;
  company_name?: string;
  company_logo_url?: string;
  is_company_profile_complete?: boolean;
}
```

### Applicant Profile (from `applicants` table)
```typescript
interface ApplicantProfile {
  id: string;                          // Applicant record ID
  user_id: string;                     // References auth.users.id
  email: string;
  first_name: string;
  last_name: string;
  profession?: string;
  skills?: string[];
  cv_url?: string;
}
```

## Automatic Profile Creation

The hook automatically creates a basic profile if one doesn't exist:

- **Recruiter:** Creates a basic entry in `profiles` table with:
  - `id`: user.id
  - `email`: user.email
  - `full_name`: user.user_metadata.full_name or email prefix

- **Applicant:** Creates a basic entry in `applicants` table with:
  - `user_id`: user.id
  - `email`: user.email
  - `first_name`: user.user_metadata.first_name or email prefix
  - `last_name`: user.user_metadata.last_name or empty
  - `is_available_for_work`: true

## Redirect Behavior

When `autoRedirect` is `true` (default):

1. **No user authenticated** → Redirects to `/` (home)
2. **User has recruiter role** → Redirects to `/recruiter/dashboard`
3. **User has applicant role** → Redirects to `/applicant/dashboard`
4. **User has no role** → Redirects to `/` (home)

**Note:** The hook checks the current path and won't redirect if the user is already on the correct dashboard page.

## Error Handling

The hook handles various error scenarios:

1. **Auth Error:** User not authenticated → Redirects to home
2. **Role Error:** Failed to fetch role → Sets error state
3. **Profile Error:** Failed to fetch profile → Logs error, continues with basic data
4. **No Role:** User has no role assigned → Redirects to home

## Auth State Changes

The hook listens to Supabase auth state changes:

- **SIGNED_OUT:** Clears all state, redirects to home
- **SIGNED_IN:** Re-checks user, role, and loads profile

## Best Practices

1. **Use the hook at the page level** for dashboards and protected routes
2. **Set `autoRedirect: false`** if you want to handle redirects manually
3. **Check `loading` state** before rendering content
4. **Handle `error` state** appropriately in your UI
5. **Use profile data** from the hook instead of fetching separately

## Example: Custom Implementation

If you need to handle redirects manually:

```typescript
const { user, role, recruiterProfile, loading } = useUserRoleAndProfile(false);

useEffect(() => {
  if (!loading && user && role) {
    if (role === 'recruiter' && !recruiterProfile) {
      // Handle missing recruiter profile
    } else if (role === 'applicant' && !applicantProfile) {
      // Handle missing applicant profile
    }
  }
}, [loading, user, role, recruiterProfile, applicantProfile]);
```

## Testing Checklist

- [ ] User with recruiter role loads recruiter dashboard
- [ ] User with applicant role loads applicant dashboard
- [ ] User without role is redirected appropriately
- [ ] Profile data is loaded correctly for each role
- [ ] Auth state changes trigger re-check
- [ ] Sign out clears state and redirects
- [ ] Missing profiles are created automatically
- [ ] Error states are handled gracefully

