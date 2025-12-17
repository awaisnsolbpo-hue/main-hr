# Single Role Enforcement & Email Uniqueness

## Overview

This migration enforces that:
1. **Each user can only have ONE role** (either `applicant` OR `recruiter`, not both)
2. **Email must be unique across roles** - An email cannot be used by both an applicant and a recruiter
3. **One profile per user** - Each user can only have one applicant profile OR one recruiter profile

## SQL Migration

Run the migration file: `backend/migrations/enforce_single_role_and_email_uniqueness.sql`

### What the Migration Does

1. **Enforces Single Role:**
   - Drops composite unique constraint `user_roles_user_id_role_unique`
   - Adds unique constraint `user_roles_user_id_unique` (one role per user)
   - Creates trigger `trigger_check_single_role` to prevent multiple roles

2. **Enforces Email Uniqueness:**
   - Creates function `check_email_uniqueness_across_roles()`
   - Creates triggers on both `applicants` and `profiles` tables
   - Prevents same email from being used by both applicant and recruiter

3. **Database Constraints:**
   - `applicants.user_id` - Unique (one applicant profile per user)
   - `user_roles.user_id` - Unique (one role per user)

## How It Works

### Single Role Enforcement

**Database Level:**
- Unique constraint on `user_roles.user_id` prevents multiple roles
- Trigger checks before insert/update and raises error if user already has a role

**Application Level:**
- API checks if user already has a role before creating new one
- Returns clear error message if user tries to create conflicting role

### Email Uniqueness

**Database Level:**
- Trigger on `applicants` table checks if email exists in `profiles` table
- Trigger on `profiles` table checks if email exists in `applicants` table
- Raises error if email is already used by different role

**Application Level:**
- API checks email in both tables before creating account
- Returns clear error message if email is already registered

## Error Messages

### When User Already Has Different Role:
```
"User already has role 'applicant'. Cannot create recruiter account. Each user can only have one role."
```

### When Email Already Used by Different Role:
```
"This email is already registered as an applicant. Please use a different email or log in with your applicant account."
```

## Testing

### Test Single Role Enforcement:
1. Create recruiter account with email `test@example.com`
2. Try to create applicant account with same email → Should fail with role conflict
3. Try to create applicant account with different email but same user → Should fail (user already has role)

### Test Email Uniqueness:
1. Create recruiter account with email `test@example.com`
2. Try to create applicant account with email `test@example.com` (different user) → Should fail
3. Create applicant account with different email → Should succeed

## Rollback (If Needed)

If you need to allow multiple roles again:

```sql
-- Drop single role constraint
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_unique;

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_check_single_role ON public.user_roles;
DROP TRIGGER IF EXISTS trigger_check_email_applicants ON public.applicants;
DROP TRIGGER IF EXISTS trigger_check_email_profiles ON public.profiles;

-- Drop functions
DROP FUNCTION IF EXISTS check_single_role();
DROP FUNCTION IF EXISTS check_email_uniqueness_across_roles();

-- Add back composite unique constraint
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_role_unique UNIQUE (user_id, role);
```

## Related Files

- Migration: `backend/migrations/enforce_single_role_and_email_uniqueness.sql`
- API: `backend/src/routes/auth.js` (updated with role and email checks)
- Frontend: Signup pages will show appropriate error messages

