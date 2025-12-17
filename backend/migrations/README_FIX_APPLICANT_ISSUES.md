# Fix for Applicant Signup Issues

## Problems Fixed

1. **RLS Policy Error**: `"new row violates row-level security policy for table \"applicants\""`
   - The `applicants` table didn't have RLS policies set up
   - Solution: Created RLS policies migration

2. **Upsert Conflict Error**: `"there is no unique or exclusion constraint matching the ON CONFLICT specification"`
   - The `onConflict` syntax was incorrect for Supabase JS client
   - Solution: Changed to simple `insert` with error handling for duplicates

## How to Fix

### Step 1: Run the RLS Policies Migration

Go to Supabase Dashboard → SQL Editor and run:

```sql
-- Copy contents from backend/migrations/create_applicants_rls_policies.sql
```

This will:
- Enable RLS on the `applicants` table
- Create policies allowing users to:
  - View their own applicant profile
  - Create their own applicant profile
  - Update their own applicant profile
  - Delete their own applicant profile
  - Allow recruiters to view applicants who applied to their jobs

### Step 2: Verify the Migration Ran Successfully

Check that policies exist:
```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'applicants';
```

You should see 5 policies:
1. Users can view their own applicant profile
2. Users can create their own applicant profile
3. Users can update their own applicant profile
4. Users can delete their own applicant profile
5. Recruiters can view applicants who applied to their jobs

### Step 3: Code Changes (Already Applied)

The following code changes have been made:

1. **Signup.tsx**: Changed from `upsert` with `onConflict` to simple `insert` with duplicate error handling
2. **ApplicantSignup.tsx**: Same change - using `insert` and ignoring duplicate key errors (code 23505)

## What Changed in Code

### Before (Incorrect):
```typescript
const { error: roleError } = await supabase
  .from('user_roles')
  .upsert({
    user_id: data.user.id,
    role: 'recruiter',
  }, {
    onConflict: 'user_id,role'
  });
```

### After (Correct):
```typescript
const { error: roleError } = await supabase
  .from('user_roles')
  .insert({
    user_id: data.user.id,
    role: 'recruiter',
  });

// Ignore duplicate key errors (role already exists)
if (roleError && roleError.code !== '23505') {
  console.error("Role creation error:", roleError);
}
```

## Testing

After running the migration:

1. Try signing up as an applicant
2. Verify the applicant profile is created successfully
3. Try signing up the same user as a recruiter (should add recruiter role without error)
4. Verify both roles exist for the user

## Error Codes Reference

- `23505`: Unique violation (duplicate key) - This is expected and ignored when role already exists
- `42501`: RLS policy violation - This should be fixed after running the migration

## Related Files

- Migration: `backend/migrations/create_applicants_rls_policies.sql`
- Code: `frontend/src/pages/Signup.tsx`
- Code: `frontend/src/pages/ApplicantSignup.tsx`

