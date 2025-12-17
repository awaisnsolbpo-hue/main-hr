# Route Organization Documentation

## Overview

All routes are now organized by user role:
- **Recruiter routes**: All under `/recruiter/*`
- **Applicant routes**: All under `/applicant/*`
- **Public routes**: No prefix (community, public job views, etc.)

## Route Structure

### Recruiter Routes (`/recruiter/*`)

#### Authentication
- `/recruiter/signup` - Recruiter signup page
- `/recruiter/login` - Recruiter login page

#### Dashboard & Profile
- `/recruiter/dashboard` - Main recruiter dashboard
- `/recruiter/profile` - Recruiter profile page
- `/recruiter/settings` - Recruiter settings page
- `/recruiter/activity-logs` - Activity logs page

#### Dashboard Metrics (Detailed Views)
- `/recruiter/dashboard/active-jobs` - Active jobs detail page
- `/recruiter/dashboard/total-candidates` - Total candidates detail page
- `/recruiter/dashboard/qualified` - Qualified candidates detail page
- `/recruiter/dashboard/scheduled-interviews` - Scheduled interviews detail page
- `/recruiter/dashboard/shortlisted` - Shortlisted candidates detail page
- `/recruiter/dashboard/success-rate` - Success rate detail page

#### Job Management
- `/recruiter/jobs` - Job listings page
- `/recruiter/create-job` - Create new job page
- `/recruiter/jobs/:jobId` - Job detail page
- `/recruiter/edit-job/:jobId` - Edit job page

#### Candidate Management
- `/recruiter/candidates` - Candidate listings page
- `/recruiter/candidates/:candidateId` - Candidate detail page
- `/recruiter/import-candidates` - Import candidates page
- `/recruiter/search-candidates` - Search candidates page
- `/recruiter/advanced-search` - Advanced search page

#### Interview Management
- `/recruiter/interviews` - Interviews page
- `/recruiter/scheduled-meetings` - Scheduled meetings page

#### Assessment Routes
- `/recruiter/mcq-tests` - MCQ tests page
- `/recruiter/technical-tests` - Technical tests page
- `/recruiter/final-interviews` - Final interviews page
- `/recruiter/shortlisted` - Shortlisted candidates page

#### Integration Routes
- `/recruiter/gmail-import` - Gmail import page
- `/recruiter/connect-linkedin` - LinkedIn connection page
- `/recruiter/integrations-settings` - Integration settings page

### Applicant Routes (`/applicant/*`)

#### Authentication
- `/applicant/signup` - Applicant signup page
- `/applicant/login` - Applicant login page

#### Dashboard
- `/applicant/dashboard` - Main applicant dashboard

### Public Routes (No Prefix)

#### Landing & Auth
- `/` - Landing page
- `/reset-password` - Password reset page

#### Community
- `/community` - Community page
- `/community/new-discussion` - New discussion page
- `/community/discussions/:id` - Discussion detail page

#### Public Job Application
- `/jobs/public/:jobId` - Public job view page
- `/upload/:linkCode` - Public upload page

#### Public Interview/Test Routes
- `/interview-landing` - Interview landing page
- `/interview-room` - Interview room page
- `/mcqs-landing` - MCQ landing page
- `/mcqs-room` - MCQ room page
- `/practical-test-landing` - Practical test landing page
- `/practical-test-room` - Practical test room page

#### OAuth Callbacks
- `/gmail-callback` - Gmail OAuth callback
- `/linkedin-callback` - LinkedIn OAuth callback

### Legacy Route Redirects

All old routes without the `/recruiter/` prefix automatically redirect to their new paths:

- `/dashboard` → `/recruiter/dashboard`
- `/profile` → `/recruiter/profile`
- `/settings` → `/recruiter/settings`
- `/activity-logs` → `/recruiter/activity-logs`
- `/jobs` → `/recruiter/jobs`
- `/create-job` → `/recruiter/create-job`
- `/candidates` → `/recruiter/candidates`
- `/import-candidates` → `/recruiter/import-candidates`
- `/search-candidates` → `/recruiter/search-candidates`
- `/advanced-search` → `/recruiter/advanced-search`
- `/interviews` → `/recruiter/interviews`
- `/scheduled-meetings` → `/recruiter/scheduled-meetings`
- `/mcq-tests` → `/recruiter/mcq-tests`
- `/technical-tests` → `/recruiter/technical-tests`
- `/final-interviews` → `/recruiter/final-interviews`
- `/shortlisted` → `/recruiter/shortlisted`
- `/gmail-import` → `/recruiter/gmail-import`
- `/connect-linkedin` → `/recruiter/connect-linkedin`
- `/integrations-settings` → `/recruiter/integrations-settings`

## Component Organization

### Recruiter Components
- `Dashboard.tsx` - Recruiter dashboard (uses `DashboardLayout`)
- `DashboardLayout.tsx` - Layout wrapper for recruiter pages (includes sidebar)
- `DashboardSidebar.tsx` - Sidebar navigation for recruiters
- All other recruiter pages use `DashboardLayout` wrapper

### Applicant Components
- `ApplicantDashboard.tsx` - Applicant dashboard (standalone, no layout wrapper)
- Future applicant pages should follow `/applicant/*` pattern

## Navigation Updates

### DashboardSidebar
All menu items have been updated to use `/recruiter/*` paths:
- Dashboard → `/recruiter/dashboard`
- Create Job → `/recruiter/create-job`
- Import Candidates → `/recruiter/import-candidates`
- Search → `/recruiter/search-candidates`
- Jobs → `/recruiter/jobs`
- Candidates → `/recruiter/candidates`
- MCQ Tests → `/recruiter/mcq-tests`
- Technical Tests → `/recruiter/technical-tests`
- Final Interviews → `/recruiter/final-interviews`
- Shortlisted → `/recruiter/shortlisted`
- Scheduled Meetings → `/recruiter/scheduled-meetings`
- Activity Logs → `/recruiter/activity-logs`
- Profile → `/recruiter/profile`
- Settings → `/recruiter/settings`

### Other Components
- `Dashboard.tsx` - Profile link updated to `/recruiter/profile`
- `DashboardLayout.tsx` - Activity logs link updated to `/recruiter/activity-logs`

## Benefits

1. **Clear Separation**: Easy to identify which routes belong to which role
2. **Better Security**: Can apply role-based route protection more easily
3. **Scalability**: Easy to add new routes for each role
4. **Maintainability**: Clear organization makes code easier to maintain
5. **URL Clarity**: URLs clearly indicate the user type and context

## Future Additions

### Applicant Routes (To Be Added)
- `/applicant/profile` - Applicant profile page
- `/applicant/applications` - Applied jobs page
- `/applicant/settings` - Applicant settings page
- `/applicant/jobs` - Browse available jobs (if needed)

## Testing Checklist

- [ ] All recruiter routes work with `/recruiter/*` prefix
- [ ] All legacy routes redirect correctly
- [ ] DashboardSidebar navigation works correctly
- [ ] Profile and settings links work
- [ ] Applicant dashboard is accessible at `/applicant/dashboard`
- [ ] No broken links in the application
- [ ] Role-based redirects work correctly

