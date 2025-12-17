# Multiple Roles Support - Migration Guide

## Overview

This migration enables users to have multiple roles (e.g., both `applicant` and `recruiter`). Previously, users could only have one role due to a unique constraint on `user_id`.

## Changes Made

### 1. Database Migration
- **File**: `backend/migrations/update_user_roles_multiple_roles.sql`
- **Changes**:
  - Removed unique constraint on `user_id` 
  - Added composite unique constraint on `(user_id, role)` to prevent duplicate role assignments
  - Added index for better query performance

### 2. Frontend Updates

#### Login Flows
- **Login.tsx**: Updated to fetch all roles and redirect based on available roles
- **ApplicantLogin.tsx**: Updated to check if user has applicant role (not exact match)
- Both login pages now support users with multiple roles

#### Protected Routes
- **ProtectedRoute.tsx**: Updated to check if user has the required role (not exact match)
- Now uses `includes()` instead of `===` to check roles

#### Signup Flows
- **Signup.tsx**: Updated to use `upsert` instead of `insert` to avoid errors if role already exists
- **ApplicantSignup.tsx**: Updated to use `upsert` instead of `insert`

#### Dashboard Layout
- **DashboardLayout.tsx**: Updated to check if user has recruiter role (not exact match)

#### New Components
- **useUserRoles.tsx**: Custom hook to fetch and manage user roles
- **RoleSelector.tsx**: Component to allow users with multiple roles to choose which dashboard to access

## How to Apply

### Step 1: Run the Migration

Go to your Supabase Dashboard → SQL Editor and run:

```sql
-- Copy contents from backend/migrations/update_user_roles_multiple_roles.sql
```

Or use Supabase CLI:
```bash
supabase db push
```

### Step 2: Verify the Changes

1. Check that the unique constraint is removed:
```sql
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'user_roles' AND constraint_type = 'UNIQUE';
```

2. Verify the composite unique constraint exists:
```sql
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'user_roles' 
AND constraint_name = 'user_roles_user_id_role_unique';
```

## Usage Examples

### Creating a User with Multiple Roles

```typescript
// User signs up as recruiter
await supabase
  .from('user_roles')
  .upsert({ user_id: userId, role: 'recruiter' }, { onConflict: 'user_id,role' });

// Later, same user signs up as applicant
await supabase
  .from('user_roles')
  .upsert({ user_id: userId, role: 'applicant' }, { onConflict: 'user_id,role' });

// Now user has both roles!
```

### Checking User Roles

```typescript
import { useUserRoles } from '@/hooks/useUserRoles';

const { roles, hasRole, hasAnyRole } = useUserRoles();

// Check if user has specific role
if (hasRole('recruiter')) {
  // Show recruiter features
}

// Check if user has any of the roles
if (hasAnyRole(['recruiter', 'applicant'])) {
  // User has at least one role
}
```

### Login Flow

1. User logs in via `/recruiter/login` or `/applicant/login`
2. System checks all roles for the user
3. If user has only one role → redirect to that role's dashboard
4. If user has multiple roles → show role selector (or redirect to default based on login page)
5. User can switch roles later via navigation

## Benefits

1. **Flexibility**: Users can be both recruiters and applicants
2. **No Data Loss**: Existing users keep their roles, new roles are added
3. **Better UX**: Users can access all features they're entitled to
4. **Scalable**: Easy to add more roles in the future

## Testing

1. Create a user with recruiter role
2. Add applicant role to the same user
3. Log in via recruiter login → should access recruiter dashboard
4. Log in via applicant login → should access applicant dashboard
5. Verify both dashboards are accessible

## Rollback

If you need to rollback:

```sql
-- Remove composite unique constraint
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_role_unique;

-- Add back unique constraint on user_id
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);
```

**Note**: This will require cleaning up users with multiple roles first.

