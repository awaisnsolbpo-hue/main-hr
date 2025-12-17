import express from 'express';
import { supabase } from '../config/supabase.js';
import Joi from 'joi';
import authMiddleware from '../middleware/auth.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// Validation schemas
const recruiterSignupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  fullName: Joi.string().min(1).required(),
  company: Joi.string().min(1).required(),
});

const applicantSignupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(1).required(),
  lastName: Joi.string().min(1).required(),
  phone: Joi.string().allow('', null),
  profession: Joi.string().min(1).required(),
  industry: Joi.string().allow('', null),
  experienceLevel: Joi.string().valid('entry', 'mid', 'senior', 'executive').required(),
  bio: Joi.string().allow('', null),
  location: Joi.string().allow('', null),
  city: Joi.string().allow('', null),
  country: Joi.string().allow('', null),
  skills: Joi.array().items(Joi.string()),
  cvUrl: Joi.string().uri().allow('', null),
  cvFileName: Joi.string().allow('', null),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

/**
 * POST /api/auth/signup/recruiter
 * Sign up as recruiter - creates auth user, profile, and role
 */
router.post('/signup/recruiter', async (req, res, next) => {
  try {
    const { error: validationError, value } = recruiterSignupSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        error: 'Validation error',
        details: validationError.details.map(d => d.message),
      });
    }

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: value.email,
      password: value.password,
      options: {
        data: {
          full_name: value.fullName,
          company_name: value.company,
        },
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/recruiter/dashboard`,
      },
    });

    if (authError) throw authError;
    if (!authData.user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    // Step 2: Check if email is already used by an applicant
    const { data: existingApplicant } = await supabase
      .from('applicants')
      .select('user_id, email')
      .eq('email', value.email)
      .maybeSingle();

    if (existingApplicant && existingApplicant.user_id !== authData.user.id) {
      return res.status(400).json({ 
        error: 'This email is already registered as an applicant. Please use a different email or log in with your applicant account.' 
      });
    }

    // Step 3: Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: value.email,
        full_name: value.fullName,
        company_name: value.company,
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      throw profileError;
    }

    // Step 4: Check if user already has a role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (existingRole) {
      // User already has a role - check if it's different
      if (existingRole.role !== 'recruiter') {
        return res.status(400).json({ 
          error: `User already has role '${existingRole.role}'. Cannot create recruiter account. Each user can only have one role.` 
        });
      }
      // Role already exists, continue
    } else {
      // Create user role (recruiter)
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'recruiter',
        });

      if (roleError) {
        console.error('Role creation error:', roleError);
        throw roleError;
      }
    }

    res.status(201).json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      message: 'Recruiter account created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/signup/applicant
 * Sign up as applicant - creates auth user, applicant profile, and role
 */
router.post('/signup/applicant', async (req, res, next) => {
  try {
    const { error: validationError, value } = applicantSignupSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        error: 'Validation error',
        details: validationError.details.map(d => d.message),
      });
    }

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: value.email,
      password: value.password,
      options: {
        data: {
          first_name: value.firstName,
          last_name: value.lastName,
        },
        emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/applicant/dashboard`,
      },
    });

    if (authError) throw authError;
    if (!authData.user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    // Step 2: Check if user already has a role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (existingRole) {
      // User already has a role - check if it's different
      if (existingRole.role !== 'applicant') {
        return res.status(400).json({ 
          error: `User already has role '${existingRole.role}'. Cannot create applicant account. Each user can only have one role.` 
        });
      }
      // Role already exists, continue
    } else {
      // Create user role (applicant)
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'applicant',
        });

      if (roleError) {
        console.error('Role creation error:', roleError);
        throw roleError;
      }
    }

    // Step 2.5: Check if email is already used by a recruiter (in profiles table)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', value.email)
      .maybeSingle();

    if (existingProfile && existingProfile.id !== authData.user.id) {
      return res.status(400).json({ 
        error: 'This email is already registered as a recruiter. Please use a different email or log in with your recruiter account.' 
      });
    }

    // Step 3: Create or update applicant profile (upsert based on user_id)
    const applicantData = {
      user_id: authData.user.id,
      first_name: value.firstName,
      last_name: value.lastName,
      email: value.email,
      phone: value.phone || null,
      profession: value.profession,
      industry: value.industry || null,
      experience_level: value.experienceLevel,
      bio: value.bio || null,
      location: value.location || null,
      city: value.city || null,
      country: value.country || null,
      skills: value.skills || [],
      cv_url: value.cvUrl || null,
      cv_file_name: value.cvFileName || null,
      is_available_for_work: true,
    };

    // Check if applicant already exists for this user_id
    const { data: existingApplicant } = await supabase
      .from('applicants')
      .select('id')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    let applicantError;
    if (existingApplicant) {
      // Update existing applicant
      const { error } = await supabase
        .from('applicants')
        .update(applicantData)
        .eq('user_id', authData.user.id);
      applicantError = error;
    } else {
      // Insert new applicant
      const { error } = await supabase
        .from('applicants')
        .insert(applicantData);
      applicantError = error;
    }

    if (applicantError) {
      console.error('Applicant creation/update error:', applicantError);
      throw applicantError;
    }

    res.status(201).json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      message: 'Applicant account created successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login/recruiter
 * Login as recruiter - ensures profile exists and role is set
 */
router.post('/login/recruiter', async (req, res, next) => {
  try {
    const { error: validationError, value } = loginSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        error: 'Validation error',
        details: validationError.details.map(d => d.message),
      });
    }

    // Authenticate user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: value.email,
      password: value.password,
    });

    if (authError) throw authError;
    if (!authData.user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user role
    const { data: userRole, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    // Check if user has recruiter role
    if (!userRole || userRole.role !== 'recruiter') {
      if (userRole && userRole.role === 'applicant') {
        return res.status(403).json({ 
          error: 'This account is registered as an applicant. Please use the applicant login page.' 
        });
      }
      // User doesn't have a role - create recruiter role and profile
      await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'recruiter',
        });

      // Ensure profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (!existingProfile) {
        await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: authData.user.email,
            full_name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'User',
          });
      }
    } else {
      // Ensure profile exists for recruiter
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (!existingProfile) {
        await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: authData.user.email,
            full_name: authData.user.user_metadata?.full_name || authData.user.email?.split('@')[0] || 'User',
          });
      }
    }

    res.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      session: authData.session,
      role: 'recruiter',
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login/applicant
 * Login as applicant - ensures applicant profile exists and role is set
 */
router.post('/login/applicant', async (req, res, next) => {
  try {
    const { error: validationError, value } = loginSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        error: 'Validation error',
        details: validationError.details.map(d => d.message),
      });
    }

    // Authenticate user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: value.email,
      password: value.password,
    });

    if (authError) throw authError;
    if (!authData.user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user role
    const { data: userRole, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    // Check if user has applicant role
    if (!userRole || userRole.role !== 'applicant') {
      if (userRole && userRole.role === 'recruiter') {
        return res.status(403).json({ 
          error: 'This account is registered as a recruiter. Please use the recruiter login page.' 
        });
      }
      // User doesn't have a role - create applicant role
      await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'applicant',
        });
    }

    // Ensure applicant profile exists
    const { data: existingApplicant } = await supabase
      .from('applicants')
      .select('id')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (!existingApplicant) {
      // Create basic applicant profile if it doesn't exist
      const firstName = authData.user.user_metadata?.first_name || authData.user.email?.split('@')[0] || 'User';
      const lastName = authData.user.user_metadata?.last_name || '';
      
      await supabase
        .from('applicants')
        .insert({
          user_id: authData.user.id,
          first_name: firstName,
          last_name: lastName || firstName,
          email: authData.user.email,
          is_available_for_work: true,
        });
    }

    res.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      session: authData.session,
      role: 'applicant',
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Generic login - returns user data and roles (for backward compatibility)
 */
router.post('/login', async (req, res, next) => {
  try {
    const { error: validationError, value } = loginSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        error: 'Validation error',
        details: validationError.details.map(d => d.message),
      });
    }

    // Authenticate user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: value.email,
      password: value.password,
    });

    if (authError) throw authError;
    if (!authData.user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id);

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
    }

    const roles = (userRoles || []).map(r => r.role);

    res.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      session: authData.session,
      roles,
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current user info and roles (requires auth)
 * Cached for 30 seconds for faster page loads
 */
router.get('/me', authMiddleware, cacheMiddleware(30000), async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
    }

    const role = userRoles?.role || null;

    // Get appropriate profile based on role
    let profile = null;
    if (role === 'recruiter') {
      const { data: recruiterProfile } = await supabase
        .from('profiles')
        .select('id, email, full_name, company_name, company_logo_url, is_company_profile_complete')
        .eq('id', userId)
        .maybeSingle();
      profile = recruiterProfile;
    } else if (role === 'applicant') {
      const { data: applicantProfile } = await supabase
        .from('applicants')
        .select('id, user_id, email, first_name, last_name, profession, skills, cv_url')
        .eq('user_id', userId)
        .maybeSingle();
      profile = applicantProfile;
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
      },
      role,
      recruiterProfile: role === 'recruiter' ? profile : null,
      applicantProfile: role === 'applicant' ? profile : null,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

