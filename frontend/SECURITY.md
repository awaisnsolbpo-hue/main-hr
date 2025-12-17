# Security Documentation

## 🔒 Security Architecture

This application implements a secure three-tier architecture to protect sensitive data and prevent unauthorized access.

## Architecture Overview

```
┌─────────────────┐
│   Frontend      │  - React/Vite Application
│   (Public)      │  - Only has ANON key (read-only)
│                 │  - No direct database access
└────────┬────────┘
         │ HTTPS/JWT Token
         ▼
┌─────────────────┐
│  Backend API    │  - Express.js Server
│  (Private)      │  - Has SERVICE_ROLE key (full access)
│                 │  - Authentication & Validation
│                 │  - Rate Limiting
└────────┬────────┘
         │ Authenticated
         ▼
┌─────────────────┐
│   Supabase DB   │  - PostgreSQL Database
│   (Protected)   │  - Row Level Security (RLS)
│                 │  - Encrypted at rest
└─────────────────┘
```

## Security Layers

### 1. Authentication & Authorization

**JWT Token Validation**
- Every API request must include a valid JWT token
- Token validated using Supabase Auth
- User identity extracted and verified
- Invalid/expired tokens rejected with 401

```javascript
// Backend auth middleware
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = user;
  next();
};
```

**Row-Level Security (RLS)**
- All database queries filter by `user_id`
- Users can ONLY access their own data
- Backend enforces this on every query

### 2. Input Validation

**Server-Side Validation with Joi**

All inputs are validated before processing:

```javascript
// Example: Job creation validation
const createJobSchema = Joi.object({
  title: Joi.string().required().min(3).max(200),
  description: Joi.string().required().min(10),
  salary_min: Joi.number().positive().allow(null),
  // ... more validations
});
```

**Protection Against:**
- SQL Injection ✅
- XSS Attacks ✅
- Invalid data types ✅
- Missing required fields ✅
- Malformed requests ✅

### 3. Rate Limiting

**Brute Force Protection**
```javascript
// 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});
```

**Prevents:**
- Brute force attacks
- DDoS attempts
- API abuse
- Credential stuffing

### 4. CORS Protection

**Strict Origin Control**
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,  // Only allow your frontend
  credentials: true
}));
```

**Blocks:**
- Unauthorized cross-origin requests
- CSRF attacks from malicious sites

### 5. HTTP Security Headers (Helmet)

```javascript
app.use(helmet());
```

**Provides:**
- XSS Protection
- Content Security Policy
- Clickjacking protection (X-Frame-Options)
- MIME-type sniffing prevention
- Hide X-Powered-By header

## Environment Variables

### ⚠️ CRITICAL: Never Commit These

**Frontend (.env)**
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJxxx...  # ANON key only
VITE_API_BASE_URL=http://localhost:3001/api
```

**Backend (server/.env)**
```env
PORT=3001
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # Service role - NEVER expose
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Key Security Rules:

1. **NEVER** commit `.env` files to git
2. **NEVER** use SERVICE_ROLE_KEY in frontend
3. **ALWAYS** use ANON key in frontend (limited permissions)
4. **ALWAYS** rotate keys if exposed

## Database Security

### Supabase Configuration

1. **Row Level Security (RLS)** enabled on all tables
2. **Policies** enforce user_id filtering
3. **Service role** bypasses RLS (backend only)
4. **Anon key** respects RLS policies

Example RLS Policy:
```sql
-- Users can only see their own jobs
CREATE POLICY "Users can view own jobs"
ON jobs FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert jobs with their user_id
CREATE POLICY "Users can insert own jobs"
ON jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

## Error Handling

**Security-Conscious Error Messages**

```javascript
// ❌ BAD - Exposes internal details
res.status(500).json({ error: error.stack });

// ✅ GOOD - Generic message
res.status(500).json({ error: 'Internal server error' });
```

**Never Expose:**
- Database schema details
- Stack traces (in production)
- Internal file paths
- Environment variables

## Data Protection

### Sensitive Data

**Passwords:** Never stored (handled by Supabase Auth)
**Tokens:** JWT tokens expire and are validated on every request
**PII:** Email, names - encrypted in transit (HTTPS)
**Resumes/Files:** Stored in Supabase Storage with access controls

### HTTPS in Production

**ALWAYS** use HTTPS in production:
- Encrypts data in transit
- Prevents man-in-the-middle attacks
- Required for modern browser features

## Security Checklist

### Before Deployment:

- [ ] `.env` files in `.gitignore`
- [ ] SERVICE_ROLE_KEY only in backend
- [ ] HTTPS enabled (production)
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] Error messages don't expose sensitive info
- [ ] All API endpoints require authentication
- [ ] Input validation on all endpoints
- [ ] Helmet security headers enabled
- [ ] RLS policies active on all tables
- [ ] Environment variables set on hosting platform

## Incident Response

### If Service Role Key is Exposed:

1. **Immediately** rotate the key in Supabase Dashboard
2. Update backend environment variables
3. Redeploy backend service
4. Audit database for unauthorized access
5. Review all recent API logs

### If Database Breach Suspected:

1. Check Supabase logs for suspicious activity
2. Review RLS policies
3. Verify all user_id filtering is in place
4. Force password reset for affected users
5. Enable 2FA if not already active

## Security Updates

- Keep dependencies updated: `npm audit`
- Monitor security advisories for Express.js and Supabase
- Review and update RLS policies regularly
- Conduct security audits periodically

## Best Practices

1. **Principle of Least Privilege**: Give minimum necessary permissions
2. **Defense in Depth**: Multiple security layers (auth + validation + RLS)
3. **Fail Securely**: Default deny, explicit allow
4. **Logging & Monitoring**: Track authentication failures and unusual activity
5. **Regular Audits**: Review code and access patterns

## Contact

For security concerns or to report vulnerabilities, please contact the security team immediately.
