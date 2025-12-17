# Fix for applicant-cv Storage Bucket RLS Error

## Problem
When uploading CV files to the `applicant-cv` bucket, you may encounter this error:
```
{
    "statusCode": "403",
    "error": "Unauthorized",
    "message": "new row violates row-level security policy"
}
```

This happens because the storage bucket doesn't have proper Row Level Security (RLS) policies configured.

## Solution
Run the migration file `create_applicant_cv_bucket.sql` in your Supabase SQL Editor.

## Steps to Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of `create_applicant_cv_bucket.sql`
6. Paste it into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)

### Option 2: Using Supabase CLI

If you have Supabase CLI set up:
```bash
cd backend
supabase db push
```

Or run the migration directly:
```bash
supabase db execute -f migrations/create_applicant_cv_bucket.sql
```

## What This Migration Does

1. **Creates the bucket** (if it doesn't exist):
   - Name: `applicant-cv`
   - Public: `true` (allows public read access via URL)
   - File size limit: 5MB
   - Allowed MIME types: Only PDF files

2. **Sets up RLS Policies**:
   - **Upload Policy**: Authenticated users can upload files to their own folder (path format: `{user_id}/{timestamp}.pdf`)
   - **Read Policy**: Authenticated users can read files in their own folder
   - **Delete Policy**: Authenticated users can delete files in their own folder
   - **Public Read Policy**: Anyone with the URL can read the CV (since bucket is public)

## Verification

After running the migration, test the upload:

1. Try uploading a CV file through the application
2. Check that the file uploads successfully
3. Verify you can access the file via the generated URL

## File Path Format

The migration expects files to be uploaded with this path format:
```
{user_id}/{timestamp}.pdf
```

For example:
```
8aebb3c6-1547-49ec-9cc4-094a15ee5aa7/1765796725769.pdf
```

This matches the format used in:
- `backend/src/routes/applicants.js` (line 194)
- `frontend/src/pages/ApplicantSignup.tsx` (line 156, 216)

## Troubleshooting

If you still get errors after running the migration:

1. **Check bucket exists**: Go to Storage → Buckets in Supabase Dashboard
2. **Verify policies**: Go to Storage → Policies and check that policies for `applicant-cv` bucket exist
3. **Check authentication**: Ensure the user is authenticated when uploading
4. **Verify file path**: Make sure the file path starts with the user's ID

## Related Files

- Migration: `backend/migrations/create_applicant_cv_bucket.sql`
- Backend upload route: `backend/src/routes/applicants.js` (line 171-230)
- Frontend upload: `frontend/src/pages/ApplicantSignup.tsx` (line 124-185, 214-229)

