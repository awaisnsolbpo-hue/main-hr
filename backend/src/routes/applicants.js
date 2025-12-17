import express from 'express';
import { supabase } from '../config/supabase.js';
import authMiddleware from '../middleware/auth.js';
import { requireRole } from '../middleware/roleVerification.js';
import { cacheMiddleware } from '../middleware/cache.js';
import Joi from 'joi';
import multer from 'multer';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

// Validation schemas
const updateApplicantSchema = Joi.object({
  first_name: Joi.string().min(1).max(100),
  last_name: Joi.string().min(1).max(100),
  email: Joi.string().email().max(255),
  phone: Joi.string().allow('', null),
  profession: Joi.string().min(1).max(100),
  industry: Joi.string().allow('', null),
  experience_level: Joi.string().valid('entry', 'mid', 'senior', 'executive'),
  bio: Joi.string().allow('', null),
  location: Joi.string().allow('', null),
  city: Joi.string().allow('', null),
  country: Joi.string().allow('', null),
  skills: Joi.array().items(Joi.string()),
  is_available_for_work: Joi.boolean(),
  preferred_job_titles: Joi.array().items(Joi.string()),
  preferred_locations: Joi.array().items(Joi.string()),
});

const applyJobSchema = Joi.object({
  job_id: Joi.string().uuid().required(),
  cover_letter: Joi.string().allow('', null),
});

/**
 * GET /api/applicants/:id
 * Get applicant profile (own profile or recruiter viewing applicant)
 */
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const applicantId = req.params.id;

    // Get applicant
    const { data: applicant, error } = await supabase
      .from('applicants')
      .select('*')
      .eq('id', applicantId)
      .single();

    if (error) throw error;
    if (!applicant) {
      return res.status(404).json({ error: 'Applicant not found' });
    }

    // Check permissions: applicant can view own profile, recruiter can view if applicant applied to their job
    if (applicant.user_id !== userId) {
      // Check if user is recruiter and applicant applied to their job
      const { data: jobApplication } = await supabase
        .from('job_applications')
        .select('job_id')
        .eq('applicant_id', applicantId)
        .single();

      if (jobApplication) {
        const { data: job } = await supabase
          .from('jobs')
          .select('user_id')
          .eq('id', jobApplication.job_id)
          .single();

        if (!job || job.user_id !== userId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      } else {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ applicant });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/applicants/me/profile
 * Get current user's applicant profile (requires applicant role)
 * Cached for 30 seconds
 */
router.get('/me/profile', authMiddleware, requireRole('applicant'), cacheMiddleware(30000), async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: applicant, error } = await supabase
      .from('applicants')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    if (!applicant) {
      return res.status(404).json({ error: 'Applicant profile not found' });
    }

    res.json({ applicant });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/applicants/:id
 * Update applicant profile (own profile only, requires applicant role)
 * If email is changed, cascade update across all related tables
 */
router.patch('/:id', authMiddleware, requireRole('applicant'), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const applicantId = req.params.id;

    // Verify applicant belongs to user and get current email
    const { data: applicant, error: checkError } = await supabase
      .from('applicants')
      .select('user_id, email')
      .eq('id', applicantId)
      .single();

    if (checkError) throw checkError;
    if (!applicant || applicant.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const oldEmail = applicant.email;
    const newEmail = req.body.email;

    const { error: validationError, value } = updateApplicantSchema.validate(req.body);

    if (validationError) {
      return res.status(400).json({
        error: 'Validation error',
        details: validationError.details.map(d => d.message),
      });
    }

    // Update applicant profile
    const { data: updatedApplicant, error } = await supabase
      .from('applicants')
      .update(value)
      .eq('id', applicantId)
      .select()
      .single();

    if (error) throw error;

    // If email changed, cascade update across all related tables
    if (newEmail && newEmail !== oldEmail && newEmail.trim() !== '') {
      console.log(`Email changed from ${oldEmail} to ${newEmail} - cascading updates...`);

      // Update candidates table (all rows with this email)
      const { error: candidatesError } = await supabase
        .from('candidates')
        .update({ email: newEmail })
        .eq('email', oldEmail);

      if (candidatesError) {
        console.error('Error updating candidates table:', candidatesError);
        // Don't fail the request, just log the error
      } else {
        console.log('Updated candidates table with new email');
      }

      // Get all candidate IDs with the old email to update related tables
      const { data: candidateIds, error: candidateIdsError } = await supabase
        .from('candidates')
        .select('id')
        .eq('email', newEmail); // After update, they should have new email

      if (!candidateIdsError && candidateIds && candidateIds.length > 0) {
        const ids = candidateIds.map(c => c.id);

        // Update qualified_for_final_interview table
        const { error: interviewError } = await supabase
          .from('qualified_for_final_interview')
          .update({ email: newEmail })
          .eq('email', oldEmail);

        if (interviewError) {
          console.error('Error updating qualified_for_final_interview table:', interviewError);
        } else {
          console.log('Updated qualified_for_final_interview table with new email');
        }

        // Note: mcqs_test and technical_practicals don't have email column,
        // they reference candidate_id, so they're automatically linked
        // But we should update any other tables that might have email
      } else {
        // Also update qualified_for_final_interview even if no candidates found
        // (in case interview records exist without candidate records)
        const { error: interviewError } = await supabase
          .from('qualified_for_final_interview')
          .update({ email: newEmail })
          .eq('email', oldEmail);

        if (interviewError) {
          console.error('Error updating qualified_for_final_interview table:', interviewError);
        } else {
          console.log('Updated qualified_for_final_interview table with new email');
        }
      }

      // Note: Auth email update requires admin privileges
      // The email in auth.users will be updated when user confirms email change
      // For now, we update all database records with the new email
      console.log('Note: Auth email update requires user confirmation. Database records have been updated.');

      console.log('Email cascade update completed');
    }

    res.json({ 
      applicant: updatedApplicant, 
      message: 'Profile updated successfully' + (newEmail && newEmail !== oldEmail ? ' (email updated across all records)' : '')
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/applicants/:id/upload-cv
 * Upload CV file (requires auth, own profile only, requires applicant role)
 */
router.post('/:id/upload-cv', authMiddleware, requireRole('applicant'), upload.single('cv'), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const applicantId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify applicant belongs to user
    const { data: applicant, error: checkError } = await supabase
      .from('applicants')
      .select('user_id')
      .eq('id', applicantId)
      .single();

    if (checkError) throw checkError;
    if (!applicant || applicant.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Upload to Supabase Storage
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('applicant-cv')
      .upload(fileName, req.file.buffer, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('applicant-cv')
      .getPublicUrl(fileName);

    // Update applicant record
    const { data: updatedApplicant, error: updateError } = await supabase
      .from('applicants')
      .update({
        cv_url: publicUrl,
        cv_file_name: req.file.originalname,
        cv_file_size: req.file.size,
      })
      .eq('id', applicantId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      applicant: updatedApplicant,
      message: 'CV uploaded successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/applicants/:id/applications
 * Get job applications for applicant (own applications only, requires applicant role)
 * Cached for 15 seconds
 */
router.get('/:id/applications', authMiddleware, requireRole('applicant'), cacheMiddleware(15000), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const applicantId = req.params.id;

    // Verify applicant belongs to user
    const { data: applicant, error: checkError } = await supabase
      .from('applicants')
      .select('user_id')
      .eq('id', applicantId)
      .single();

    if (checkError) throw checkError;
    if (!applicant || applicant.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: applications, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        job:jobs!job_applications_job_id_fkey(
          id,
          title,
          description,
          location,
          salary_min,
          salary_max,
          status,
          created_at
        )
      `)
      .eq('applicant_id', applicantId)
      .order('applied_at', { ascending: false });

    if (error) throw error;

    res.json({ applications: applications || [] });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/applicants/:id/apply-job
 * Apply to a job (requires auth, own profile only, requires applicant role)
 */
router.post('/:id/apply-job', authMiddleware, requireRole('applicant'), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const applicantId = req.params.id;

    const { error: validationError, value } = applyJobSchema.validate(req.body);

    if (validationError) {
      return res.status(400).json({
        error: 'Validation error',
        details: validationError.details.map(d => d.message),
      });
    }

    // Verify applicant belongs to user
    const { data: applicant, error: checkError } = await supabase
      .from('applicants')
      .select('user_id')
      .eq('id', applicantId)
      .single();

    if (checkError) throw checkError;
    if (!applicant || applicant.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify job exists and is visible to applicants
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, visible_to_applicants')
      .eq('id', value.job_id)
      .single();

    if (jobError) throw jobError;
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    if (!job.visible_to_applicants) {
      return res.status(403).json({ error: 'Job is not accepting applications' });
    }

    // Check if already applied
    const { data: existingApplication } = await supabase
      .from('job_applications')
      .select('id')
      .eq('applicant_id', applicantId)
      .eq('job_id', value.job_id)
      .single();

    if (existingApplication) {
      return res.status(400).json({ error: 'Already applied to this job' });
    }

    // Get full applicant data for webhook
    const { data: applicantData, error: applicantDataError } = await supabase
      .from('applicants')
      .select('*')
      .eq('id', applicantId)
      .single();

    if (applicantDataError) {
      console.error('Error fetching applicant data:', applicantDataError);
    }

    // Get full job data for webhook
    const { data: jobData, error: jobDataError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', value.job_id)
      .single();

    if (jobDataError) {
      console.error('Error fetching job data:', jobDataError);
    }

    // Create application
    const { data: application, error } = await supabase
      .from('job_applications')
      .insert({
        applicant_id: applicantId,
        job_id: value.job_id,
        cover_letter: value.cover_letter || null,
        status: 'applied',
      })
      .select(`
        *,
        job:jobs!job_applications_job_id_fkey(
          id,
          title,
          description,
          location
        )
      `)
      .single();

    if (error) throw error;

    // Send webhook notification with all job_applications data (non-blocking)
    const webhookUrl = process.env.WEBHOOK_URL || 'https://nsolbpo.app.n8n.cloud/webhook/maincvs';
    
    const webhookPayload = {
      event: 'job_application.created',
      timestamp: new Date().toISOString(),
      source: 'applicant_portal',
      // Send all job_applications columns
      job_application: {
        id: application.id,
        applicant_id: application.applicant_id,
        job_id: application.job_id,
        cover_letter: application.cover_letter,
        status: application.status,
        applied_at: application.applied_at,
        created_at: application.created_at,
        updated_at: application.updated_at,
        // Include any other columns from job_applications table
        ...application
      },
      // Include full applicant data
      applicant: applicantData || null,
      // Include full job data
      job: jobData || null,
      // Include related job data from the select query
      related_job: application.job || null,
      user_id: userId
    };

    // Send webhook asynchronously (don't block response)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HR-System/1.0'
      },
      body: JSON.stringify(webhookPayload),
      signal: controller.signal
    }).then(response => {
      clearTimeout(timeoutId);
      if (!response.ok) {
        console.warn(`Webhook returned status ${response.status} for job application ${application.id}`);
      } else {
        console.log(`Webhook delivered successfully for job application ${application.id}`);
      }
    }).catch(err => {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.warn(`Webhook request timed out after 5 seconds for job application ${application.id}`);
      } else {
        console.error(`Webhook delivery failed (non-blocking) for job application ${application.id}:`, err.message);
      }
    });

    res.status(201).json({
      application,
      message: 'Application submitted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

