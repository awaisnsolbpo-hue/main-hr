import express from 'express';
import { supabase } from '../config/supabase.js';
import Joi from 'joi';
import multer from 'multer';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit for videos
});

// Validation schema for public job application
const applyJobSchema = Joi.object({
  name: Joi.string().required().min(2).max(200),
  email: Joi.string().email().required(),
  phone: Joi.string().allow('', null),
  resume_url: Joi.string().uri().allow('', null),
  linkedin_url: Joi.string().uri().allow('', null),
  job_id: Joi.string().uuid().required(),
});

// Validation schema for demo booking
const demoBookingSchema = Joi.object({
  name: Joi.string().required().min(2).max(200),
  email: Joi.string().email().required(),
  phone: Joi.string().allow('', null),
  company: Joi.string().required().min(2).max(200),
  role: Joi.string().required().min(2).max(200),
  about_me: Joi.string().required().min(10).max(2000),
  meeting_date: Joi.string().isoDate().allow(null),
  meeting_duration: Joi.number().integer().min(15).max(120).default(30),
  additional_notes: Joi.string().allow('', null).max(1000),
  user_id: Joi.string().uuid().allow(null),
});

/**
 * GET /api/public/job/:jobId
 * Get public job details (no auth required)
 * Returns jobs that are active or paused (not closed or archived)
 */
router.get('/job/:jobId', async (req, res, next) => {
  try {
    const { jobId } = req.params;

    // Get job - allow active and paused statuses for public viewing
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .in('status', ['active', 'paused'])
      .single();

    if (error || !job) {
      return res.status(404).json({ error: 'Job not found or not available for public viewing' });
    }

    // Check if job has closed_at timestamp (manually closed)
    if (job.closed_at) {
      return res.status(404).json({ error: 'Job has been closed and is no longer accepting applications' });
    }

    // Check if job has a close_date and if it has passed
    if (job.close_date) {
      const closeDate = new Date(job.close_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (closeDate < today) {
        return res.status(404).json({ error: 'The application deadline for this position has passed' });
      }
    }

    // Get company profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, company_description, company_website, company_size, industry, profile_image_url, email, full_name')
      .eq('id', job.user_id)
      .single();

    res.json({ job, profile: profile || null });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/job/:jobId/link
 * Get or create public upload link for a job (no auth required)
 * Checks upload_links table first, then public_upload_links, creates one if needed
 */
router.get('/job/:jobId/link', async (req, res, next) => {
  try {
    const { jobId } = req.params;

    // First, verify the job exists and get user_id
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, user_id, title')
      .eq('id', jobId)
      .in('status', ['active', 'paused'])
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: 'Job not found or not available' });
    }

    // Check upload_links table first (this is what's actually used for uploads)
    let { data: linkData, error: linkError } = await supabase
      .from('upload_links')
      .select('*')
      .eq('job_id', jobId)
      .eq('is_active', true)
      .maybeSingle();

    // If not found in upload_links, check public_upload_links
    if (!linkData) {
      const { data: publicLinkData, error: publicLinkError } = await supabase
        .from('public_upload_links')
        .select('*')
        .eq('job_id', jobId)
        .eq('is_active', true)
        .maybeSingle();

      if (publicLinkData) {
        linkData = publicLinkData;
      }
    }

    // If still not found, create a new link automatically
    if (!linkData) {
      const linkCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const { data: newLink, error: createError } = await supabase
        .from('upload_links')
        .insert({
          job_id: jobId,
          user_id: job.user_id,
          link_code: linkCode,
          is_active: true,
          upload_count: 0,
        })
        .select()
        .single();

      if (createError) {
        return res.status(500).json({ error: 'Failed to create upload link' });
      }

      linkData = newLink;
    }

    res.json({ link: linkData });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/public/apply
 * Apply to a job (public, no auth required)
 */
router.post('/apply', async (req, res, next) => {
  try {
    // Validate request body
    const { error: validationError, value } = applyJobSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    // Verify job exists and is active
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, user_id, title')
      .eq('id', value.job_id)
      .eq('status', 'active')
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: 'Job not found or not active' });
    }

    // Check if already applied
    const { data: existing } = await supabase
      .from('candidates')
      .select('id')
      .eq('job_id', value.job_id)
      .eq('email', value.email)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'You have already applied for this position' });
    }

    // Create application in candidates table
    const applicationData = {
      full_name: value.name,
      email: value.email,
      phone: value.phone || null,
      cv_file_url: value.resume_url || null,
      linkedin_url: value.linkedin_url || null,
      job_id: value.job_id,
      user_id: job.user_id,
      status: 'pending',
    };

    const { data: application, error: insertError } = await supabase
      .from('candidates')
      .insert(applicationData)
      .select()
      .single();

    if (insertError) throw insertError;

    res.status(201).json({
      application,
      message: 'Application submitted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/check-application
 * Check if email has already applied (no auth required)
 */
router.get('/check-application', async (req, res, next) => {
  try {
    const { job_id, email } = req.query;

    if (!job_id || !email) {
      return res.status(400).json({ error: 'job_id and email are required' });
    }

    const { data, error } = await supabase
      .from('candidates')
      .select('id')
      .eq('job_id', job_id)
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;

    res.json({ hasApplied: !!data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/upload-link/:linkCode
 * Get upload link details (no auth required)
 */
router.get('/upload-link/:linkCode', async (req, res, next) => {
  try {
    const { linkCode } = req.params;

    const { data: linkData, error } = await supabase
      .from('upload_links')
      .select('*')
      .eq('link_code', linkCode)
      .single();

    if (error || !linkData) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // Check if link is active
    if (!linkData.is_active) {
      return res.status(410).json({ 
        error: 'This upload link has expired and is no longer active',
        link: linkData,
        expired: true
      });
    }

    // Check if link has expired (if expires_at is set)
    if (linkData.expires_at) {
      const expiresAt = new Date(linkData.expires_at);
      const now = new Date();
      if (now > expiresAt) {
        // Deactivate expired link
        await supabase
          .from('upload_links')
          .update({ is_active: false })
          .eq('id', linkData.id);
        return res.status(410).json({ 
          error: 'This upload link has expired',
          link: { ...linkData, is_active: false },
          expired: true
        });
      }
    }

    res.json({ link: linkData });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/public/upload-candidate
 * Upload candidate via public link with file (no auth required)
 * Uploads file to storage for shareable link, sends to webhook, does NOT store in database
 */
router.post('/upload-candidate', upload.single('file'), async (req, res, next) => {
  try {
    const { linkCode, name, email, phone } = req.body;
    const file = req.file;

    if (!linkCode || !name || !email) {
      return res.status(400).json({ error: 'linkCode, name, and email are required' });
    }

    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Accept any document type - no validation needed

    // Get link details for job info
    const { data: linkData, error: linkError } = await supabase
      .from('upload_links')
      .select('id, job_id, user_id, is_active, expires_at, upload_count')
      .eq('link_code', linkCode)
      .single();

    if (linkError || !linkData) {
      return res.status(404).json({ error: 'Link not found or invalid' });
    }

    // Check if link is active
    if (!linkData.is_active) {
      return res.status(410).json({ error: 'This upload link has expired and is no longer active' });
    }

    // Check if link has expired (if expires_at is set)
    if (linkData.expires_at) {
      const expiresAt = new Date(linkData.expires_at);
      const now = new Date();
      if (now > expiresAt) {
        // Deactivate expired link
        await supabase
          .from('upload_links')
          .update({ is_active: false })
          .eq('id', linkData.id);
        return res.status(410).json({ error: 'This upload link has expired' });
      }
    }

    // Check if this email has already applied for this job
    if (linkData.job_id) {
      const { data: existingApplication } = await supabase
        .from('candidates')
        .select('id, email')
        .eq('job_id', linkData.job_id)
        .eq('email', email)
        .maybeSingle();

      if (existingApplication) {
        return res.status(409).json({ 
          error: 'You have already applied for this position. Each candidate can only apply once per job.',
          alreadyApplied: true
        });
      }
    }

    // Get job details
    let jobTitle = null;
    if (linkData.job_id) {
      const { data: job } = await supabase
        .from('jobs')
        .select('title')
        .eq('id', linkData.job_id)
        .single();
      jobTitle = job?.title || null;
    }

    // Upload file to storage to get shareable public URL
    const fileName = `public/${linkCode}/${Date.now()}_${file.originalname}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('candidate-cvs')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('File upload error:', uploadError);
      return res.status(500).json({ error: 'Failed to upload CV file to storage' });
    }

    // Get public URL for CV
    const { data: { publicUrl } } = supabase.storage
      .from('candidate-cvs')
      .getPublicUrl(fileName);

    // Send webhook notification (non-blocking)
    const webhookUrl = process.env.WEBHOOK_URL || 'https://auto.nsolbpo.com/webhook/maincvs';
    
    const webhookPayload = {
      event: 'candidate.uploaded',
      timestamp: new Date().toISOString(),
      source: 'public_upload',
      candidate: {
        name,
        email,
        phone: phone || null,
      },
      file: {
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        url: publicUrl
      },
      job: {
        id: linkData.job_id || null,
        title: jobTitle
      },
      link_code: linkCode,
      user_id: linkData.user_id || null
    };

    // Deactivate the link after successful upload (one-time use)
    const { error: deactivateError } = await supabase
      .from('upload_links')
      .update({ 
        is_active: false,
        upload_count: (linkData.upload_count || 0) + 1
      })
      .eq('id', linkData.id);

    if (deactivateError) {
      console.error('Error deactivating link:', deactivateError);
      // Don't fail the request, but log the error
    }

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
        console.warn(`Webhook returned status ${response.status}`);
      } else {
        console.log('Webhook delivered successfully');
      }
    }).catch(err => {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.warn('Webhook request timed out after 5 seconds');
      } else {
        console.error('Webhook delivery failed (non-blocking):', err.message);
      }
    });

    res.status(200).json({
      success: true,
      file: {
        name: file.originalname,
        size: file.size,
        url: publicUrl
      },
      message: 'CV uploaded successfully. This link has been deactivated and cannot be used again.',
      linkExpired: true
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to process CV upload' });
  }
});

/**
 * GET /api/public/interview-candidate
 * Get interview candidate by email and/or candidate ID (no auth required for public interviews)
 * Only checks candidates table for MCQ tests
 */
router.get('/interview-candidate', async (req, res, next) => {
  try {
    const { email, candidate_id, job_id } = req.query;

    if (!email && !candidate_id) {
      return res.status(400).json({ error: 'Email or candidate ID is required' });
    }

    // Only check candidates table
    let query = supabase
      .from('candidates')
      .select('id, first_name, last_name, full_name, email, phone, status, job_id, created_at, Stage, jobs(title)');

    if (email) {
      query = query.eq('email', email);
    }

    if (candidate_id) {
      query = query.eq('id', candidate_id);
    }

    if (job_id) {
      query = query.eq('job_id', job_id);
    }

    const { data: candidatesData, error: candidatesError } = await query.order('created_at', { ascending: true });

    if (candidatesError) {
      throw candidatesError;
    }

    // Map to common format
    const mappedCandidates = (candidatesData || []).map(c => ({
      id: c.id,
      name: c.full_name || `${c.first_name} ${c.last_name}`,
      full_name: c.full_name || `${c.first_name} ${c.last_name}`,
      email: c.email,
      phone: c.phone,
      status: c.status,
      job_id: c.job_id,
      stage_name: c.Stage,
      created_at: c.created_at,
      jobs: c.jobs,
    }));

    res.json({ candidates: mappedCandidates });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/qualified-interview-candidate
 * Get qualified interview candidate from qualified_for_final_interview table (no auth required)
 */
router.get('/qualified-interview-candidate', async (req, res, next) => {
  try {
    const { email, candidate_id, job_id } = req.query;

    if (!email || !candidate_id) {
      return res.status(400).json({ error: 'Email and candidate_id are required' });
    }

    // Normalize inputs (trim and lowercase email for comparison)
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCandidateId = candidate_id.trim();

    console.log('Fetching qualified interviews:', {
      email: normalizedEmail,
      candidate_id: normalizedCandidateId,
      candidate_id_length: normalizedCandidateId.length,
      job_id: job_id || 'not provided'
    });

    // First, try searching by candidate_id
    let query = supabase
      .from('qualified_for_final_interview')
      .select(`
        id,
        name,
        email,
        phone,
        job_id,
        candidate_id,
        interview_status,
        interview_date,
        interview_duration_minutes,
        interview_type,
        interviewer_name,
        interviewer_email,
        client_custom_questions,
        ai_generated_questions,
        interview_transcript,
        interview_recording_url,
        screen_recording_url,
        created_at,
        updated_at,
        jobs(title)
      `)
      .eq('candidate_id', normalizedCandidateId);

    if (job_id) {
      query = query.eq('job_id', job_id.trim());
    }

    let { data: interviewsData, error: interviewsError } = await query.order('created_at', { ascending: false });

    if (interviewsError) {
      console.error('Qualified interview fetch error (by candidate_id):', interviewsError);
      throw interviewsError;
    }

    // Filter by email (case-insensitive) since Supabase .eq() is case-sensitive
    let filteredData = (interviewsData || []).filter(record => 
      record.email && record.email.trim().toLowerCase() === normalizedEmail
    );

    console.log('Search by candidate_id results:', {
      total: interviewsData?.length || 0,
      afterEmailFilter: filteredData.length,
      sample_candidate_ids: interviewsData?.slice(0, 3).map(r => r.candidate_id) || []
    });

    // If no results found by candidate_id, try searching by email only as fallback
    if (filteredData.length === 0) {
      console.log('No results by candidate_id, trying email-only search...');
      
      let emailQuery = supabase
        .from('qualified_for_final_interview')
        .select(`
          id,
          name,
          email,
          phone,
          job_id,
          candidate_id,
          interview_status,
          interview_date,
          interview_duration_minutes,
          interview_type,
          interviewer_name,
          interviewer_email,
          client_custom_questions,
          ai_generated_questions,
          interview_transcript,
          interview_recording_url,
          screen_recording_url,
          created_at,
          updated_at,
          jobs(title)
        `)
        .ilike('email', normalizedEmail); // Use ilike for case-insensitive search

      if (job_id) {
        emailQuery = emailQuery.eq('job_id', job_id.trim());
      }

      const { data: emailResults, error: emailError } = await emailQuery.order('created_at', { ascending: false });

      if (emailError) {
        console.error('Qualified interview fetch error (by email):', emailError);
        // Don't throw, just log - we'll return empty array
      } else {
        filteredData = emailResults || [];
        console.log('Search by email results:', {
          total: emailResults?.length || 0,
          sample_emails: emailResults?.slice(0, 3).map(r => r.email) || [],
          sample_candidate_ids: emailResults?.slice(0, 3).map(r => r.candidate_id) || []
        });
      }
    }

    // Map to common format
    const mappedInterviews = filteredData.map(i => ({
      id: i.id,
      name: i.name,
      email: i.email,
      phone: i.phone,
      job_id: i.job_id,
      candidate_id: i.candidate_id,
      interview_status: i.interview_status,
      interview_date: i.interview_date,
      interview_duration_minutes: i.interview_duration_minutes,
      interview_type: i.interview_type,
      interviewer_name: i.interviewer_name,
      interviewer_email: i.interviewer_email,
      client_custom_questions: i.client_custom_questions,
      ai_generated_questions: i.ai_generated_questions,
      interview_transcript: i.interview_transcript,
      interview_recording_url: i.interview_recording_url,
      screen_recording_url: i.screen_recording_url,
      job_title: i.jobs?.title || null,
      created_at: i.created_at,
      updated_at: i.updated_at,
      jobs: i.jobs,
    }));

    res.json({ interviews: mappedInterviews });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/public/interview/:id/status
 * Update interview status (public, no auth required)
 */
router.patch('/interview/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { interview_status } = req.body;

    if (!interview_status) {
      return res.status(400).json({ error: 'interview_status is required' });
    }

    const { data: candidate, error } = await supabase
      .from('qualified_for_final_interview')
      .update({ interview_status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ candidate, message: 'Interview status updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/public/interview/:id/recording
 * Update interview recording and transcript (public, no auth required)
 */
router.patch('/interview/:id/recording', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      Screen_recording, 
      Transcript,
      screen_recording_url,
      interview_transcript 
    } = req.body;

    const updateData = {};
    
    // Support both field name formats for backward compatibility
    if (Screen_recording !== undefined) {
      updateData.screen_recording_url = Screen_recording;
    }
    if (screen_recording_url !== undefined) {
      updateData.screen_recording_url = screen_recording_url;
    }
    
    if (Transcript !== undefined) {
      updateData.interview_transcript = Transcript;
    }
    if (interview_transcript !== undefined) {
      updateData.interview_transcript = interview_transcript;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'At least one field (Screen_recording/screen_recording_url or Transcript/interview_transcript) is required' });
    }

    console.log('Updating interview recording/transcript:', {
      id,
      updateData,
      fields: Object.keys(updateData)
    });

    const { data: candidate, error } = await supabase
      .from('qualified_for_final_interview')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating interview recording:', error);
      throw error;
    }

    console.log('Interview recording/transcript updated successfully:', {
      id: candidate?.id,
      has_recording: !!candidate?.screen_recording_url,
      has_transcript: !!candidate?.interview_transcript
    });

    res.json({ candidate, message: 'Recording updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/public/candidates/:id/status
 * Update candidate status (no auth required)
 */
router.patch('/candidates/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Try to update in candidates table first
    let { data: candidate, error } = await supabase
      .from('candidates')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ candidate, message: 'Candidate status updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/technical-practicals
 * Get practical test task for a candidate (no auth required)
 */
router.get('/technical-practicals', async (req, res, next) => {
  try {
    const { email, job_id } = req.query;

    if (!email || !job_id) {
      return res.status(400).json({ error: 'Email and job_id are required' });
    }

    // First, verify candidate exists
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('id, email, job_id, status, interview_status, first_name, last_name, full_name')
      .eq('email', email)
      .eq('job_id', job_id)
      .single();

    if (candidateError || !candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Fetch practical test task from database
    // Check for status 'Pending' (primary check) or 'scheduled' (backward compatibility)
    const { data: practicalTask, error: taskError } = await supabase
      .from('technical_practicals')
      .select('*')
      .eq('candidate_id', candidate.id)
      .eq('job_id', job_id)
      .in('status', ['Pending', 'pending', 'scheduled'])
      .single();

    // If task not found, check if candidate status indicates they should have access
    if (taskError || !practicalTask) {
      // Check if candidate is scheduled for practical interview/test (fallback check)
      const isScheduled = 
        candidate.status?.trim() === 'Scheduled For Practical Interview' ||
        candidate.status?.trim() === 'Scheduled For Practical Test' ||
        candidate.status?.trim() === 'Scheduled For Practical' ||
        candidate.interview_status?.trim() === 'Scheduled For Practical Interview' ||
        candidate.interview_status?.trim() === 'Scheduled For Practical Test';

      if (!isScheduled) {
        return res.status(404).json({ 
          error: 'Practical test task not found. Please ensure the task has been created for this candidate with status "Pending".',
          hint: 'Create a technical_practicals record with status "Pending" for this candidate'
        });
      }

      // If candidate is scheduled but task doesn't exist, return error
      return res.status(404).json({ 
        error: 'Practical test task not found. Please ensure the task has been created for this candidate.',
        hint: 'Create a technical_practicals record with status "Pending" for this candidate'
      });
    }

    if (taskError || !practicalTask) {
      // If table doesn't exist, return a placeholder task structure
      // You'll need to create the actual table and populate it
      return res.status(404).json({ 
        error: 'Practical test task not found. Please ensure the task has been created for this candidate.',
        hint: 'Create a technical_practicals table and add a task for this candidate'
      });
    }

    // Format response to match frontend interface (using actual schema fields)
    const formattedTask = {
      id: practicalTask.id,
      task_title: practicalTask.task_title,
      task_description: practicalTask.task_description,
      task_requirements: practicalTask.task_requirements || [],
      difficulty: practicalTask.difficulty || 'medium',
      time_limit_minutes: practicalTask.time_limit_minutes || 60,
      programming_language: practicalTask.programming_language,
      tools_allowed: practicalTask.tools_allowed || [],
      starter_code: practicalTask.starter_code,
      expected_output_example: practicalTask.expected_output_example,
      success_criteria: practicalTask.success_criteria || [],
      bonus_features: practicalTask.bonus_features || [],
      disqualifying_factors: practicalTask.disqualifying_factors || [],
      task_notes: practicalTask.task_notes,
      evaluation_focus: practicalTask.evaluation_focus || {},
      job_title: practicalTask.job_title,
      candidate_id: candidate.id,
      candidate_name: candidate.full_name || `${candidate.first_name} ${candidate.last_name}`,
      candidate_email: candidate.email,
    };

    res.json(formattedTask);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/public/mcq-recording/upload
 * Upload MCQ test screen recording (no auth required)
 */
router.post('/mcq-recording/upload', upload.single('file'), async (req, res, next) => {
  try {
    const { candidate_email, candidate_id, job_id } = req.body;
    const file = req.file;

    console.log('MCQ Recording upload request received:', {
      hasFile: !!file,
      candidate_email,
      candidate_id,
      job_id,
      fileSize: file?.size,
      fileMimetype: file?.mimetype,
      fileName: file?.originalname
    });

    if (!file) {
      console.error('No file in request');
      return res.status(400).json({ error: 'No file provided' });
    }

    // Validate file type (video only)
    if (!file.mimetype || !file.mimetype.startsWith('video/')) {
      console.error('Invalid file type:', file.mimetype);
      return res.status(400).json({ error: 'Only video files are allowed' });
    }

    // Validate file size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      console.error('File too large:', file.size);
      return res.status(400).json({ error: 'File size must be less than 500MB' });
    }

    // Check if file buffer exists
    if (!file.buffer) {
      console.error('File buffer is missing');
      return res.status(400).json({ error: 'File buffer is missing. Please ensure the file was uploaded correctly.' });
    }

    // Create file path with candidate email and timestamp
    const fileName = file.originalname || `mcq_recording_${Date.now()}.webm`;
    // Use lowercase bucket name to match documentation (mcqs-test)
    const bucketName = 'mcqs-test';
    const filePath = candidate_email 
      ? `${candidate_email}/${Date.now()}_${fileName}`
      : `${Date.now()}_${fileName}`;

    console.log('Uploading MCQ recording to Supabase storage:', { 
      bucket: bucketName, 
      filePath,
      fileSize: file.size,
      fileMimetype: file.mimetype,
      bufferLength: file.buffer?.length || 0
    });

    // Validate file buffer before upload
    if (!file.buffer || file.buffer.length === 0) {
      console.error('File buffer is empty or invalid');
      return res.status(400).json({ 
        error: 'File buffer is empty or invalid. Please ensure the file was uploaded correctly.',
        details: `Expected buffer length: ${file.size}, Actual: ${file.buffer?.length || 0}`
      });
    }

    // Check if buffer size matches file size (within reasonable tolerance)
    if (Math.abs(file.buffer.length - file.size) > 1024) {
      console.warn(`File buffer size mismatch: expected ${file.size}, got ${file.buffer.length}`);
    }

    // Check if bucket exists (optional check - will fail on upload if not exists anyway)
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      if (!listError && buckets) {
        const bucketExists = buckets.some(b => b.id === bucketName || b.name === bucketName);
        if (!bucketExists) {
          console.warn(`Bucket "${bucketName}" not found in available buckets. Available: ${buckets.map(b => b.name).join(', ')}`);
        }
      }
    } catch (checkErr) {
      // Non-critical - just log, continue with upload attempt
      console.warn('Could not check bucket existence:', checkErr);
    }

    // Upload file to Supabase storage
    let uploadResult;
    try {
      uploadResult = await supabase.storage
        .from(bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });
    } catch (uploadErr) {
      console.error('Storage upload exception:', uploadErr);
      return res.status(500).json({ 
        error: 'Failed to upload file to storage',
        details: uploadErr.message || 'Unknown upload error',
        hint: `Check if bucket "${bucketName}" exists and has proper permissions`
      });
    }

    const { data, error } = uploadResult;

    if (error) {
      console.error('Storage upload error:', {
        error: error,
        message: error.message,
        statusCode: error.statusCode,
        status: error.status
      });
      
      // Handle bucket not found error
      if (error.statusCode === '404' || 
          error.status === 404 ||
          error.message?.includes('Bucket not found') ||
          error.message?.includes('does not exist')) {
        return res.status(500).json({ 
          error: `Storage bucket "${bucketName}" not found. Please create the bucket in Supabase Storage.`,
          details: error.message,
          hint: `Create a public bucket named "${bucketName}" in your Supabase Storage settings (Storage → New bucket)`
        });
      }

      // Handle permission errors
      if (error.statusCode === '403' || error.status === 403 || error.message?.includes('permission')) {
        return res.status(500).json({ 
          error: `Permission denied for bucket "${bucketName}". Please check bucket permissions.`,
          details: error.message,
          hint: `Ensure bucket "${bucketName}" is set to public or has proper RLS policies`
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to upload file to storage',
        details: error.message || 'Unknown storage error',
        errorCode: error.statusCode || error.status,
        hint: `Check Supabase Storage configuration for bucket "${bucketName}"`
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log('MCQ recording uploaded successfully:', { path: data.path, publicUrl: urlData.publicUrl });

    res.json({
      path: data.path,
      publicUrl: urlData.publicUrl,
      message: 'MCQ recording uploaded successfully',
    });
  } catch (error) {
    console.error('Unexpected MCQ recording upload error:', error);
    next(error);
  }
});

/**
 * POST /api/public/practical-test/upload
 * Upload practical test video (no auth required)
 */
router.post('/practical-test/upload', upload.single('file'), async (req, res, next) => {
  try {
    const { bucket, path } = req.body;
    const file = req.file;

    console.log('Upload request received:', {
      hasFile: !!file,
      bucket,
      path,
      fileSize: file?.size,
      fileMimetype: file?.mimetype,
      fileName: file?.originalname
    });

    if (!file) {
      console.error('No file in request');
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!bucket) {
      console.error('No bucket specified');
      return res.status(400).json({ error: 'Bucket name is required' });
    }

    // Validate file type (video only)
    if (!file.mimetype || !file.mimetype.startsWith('video/')) {
      console.error('Invalid file type:', file.mimetype);
      return res.status(400).json({ error: 'Only video files are allowed' });
    }

    // Validate file size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      console.error('File too large:', file.size);
      return res.status(400).json({ error: 'File size must be less than 500MB' });
    }

    // Check if file buffer exists
    if (!file.buffer) {
      console.error('File buffer is missing');
      return res.status(400).json({ error: 'File buffer is missing. Please ensure the file was uploaded correctly.' });
    }

    const filePath = path || `practical-tests/${Date.now()}_${file.originalname}`;

    console.log('Uploading to Supabase storage:', { bucket, filePath });

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      
      // Handle bucket not found error
      if (error.statusCode === '404' || error.message?.includes('Bucket not found')) {
        return res.status(500).json({ 
          error: `Storage bucket "${bucket}" not found. Please create the bucket in Supabase Storage.`,
          details: error.message,
          hint: `Create a bucket named "${bucket}" in your Supabase Storage settings`
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to upload file to storage',
        details: error.message 
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log('File uploaded successfully:', { path: data.path, publicUrl: urlData.publicUrl });

    res.json({
      path: data.path,
      publicUrl: urlData.publicUrl,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('Unexpected upload error:', error);
    next(error);
  }
});

/**
 * PATCH /api/public/technical-practicals/:taskId/start
 * Mark practical test as started (no auth required)
 */
router.patch('/technical-practicals/:taskId/start', async (req, res, next) => {
  try {
    const { taskId } = req.params;

    const { data: updatedTask, error: updateError } = await supabase
      .from('technical_practicals')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Failed to start practical test: ' + updateError.message });
    }

    if (!updatedTask) {
      return res.status(404).json({ error: 'Practical test task not found' });
    }

    res.json({ 
      task: updatedTask, 
      message: 'Practical test started successfully' 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/public/technical-practicals/:taskId/submit
 * Submit practical test results (no auth required)
 */
router.patch('/technical-practicals/:taskId/submit', async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { 
      submission_url, 
      submitted_at, 
      video_duration_seconds, 
      duration_minutes, 
      status,
      screen_recording_saved 
    } = req.body;

    if (!submission_url) {
      return res.status(400).json({ error: 'submission_url is required' });
    }

    // First, get the task to access candidate_id
    const { data: existingTask, error: fetchError } = await supabase
      .from('technical_practicals')
      .select('candidate_id, candidate_email, job_id')
      .eq('id', taskId)
      .single();

    if (fetchError || !existingTask) {
      console.error('Task fetch error:', fetchError);
      return res.status(404).json({ error: 'Practical test task not found' });
    }

    // Update practical test record with submission URL and status
    // File is already saved in bucket via /practical-test/upload endpoint
    const updateData = {
      submission_url, // File URL from bucket (already uploaded)
      submitted_at: submitted_at || new Date().toISOString(),
      video_duration_seconds,
      duration_minutes,
      status: status || 'submitted',
      completed_at: new Date().toISOString(),
      screen_recording_saved: screen_recording_saved !== undefined ? screen_recording_saved : true,
      updated_at: new Date().toISOString(),
    };

    console.log('Updating practical test submission:', {
      taskId,
      submission_url,
      status: updateData.status,
      candidate_id: existingTask.candidate_id
    });

    const { data: updatedTask, error: updateError } = await supabase
      .from('technical_practicals')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({ error: 'Failed to submit practical test: ' + updateError.message });
    }

    if (!updatedTask) {
      return res.status(404).json({ error: 'Practical test task not found' });
    }

    console.log('Practical test updated successfully:', {
      task_id: updatedTask.id,
      submission_url: updatedTask.submission_url,
      status: updatedTask.status
    });

    // Update BOTH status columns in candidates table
    if (existingTask.candidate_id) {
      const candidateUpdate = {
        status: 'Practical Test Completed', // Update status column
        interview_status: 'Practical Test Completed', // Update interview_status column
        updated_at: new Date().toISOString()
      };

      console.log('Updating candidate status:', {
        candidate_id: existingTask.candidate_id,
        update: candidateUpdate
      });

      const { data: updatedCandidate, error: candidateUpdateError } = await supabase
        .from('candidates')
        .update(candidateUpdate)
        .eq('id', existingTask.candidate_id)
        .select('id, status, interview_status')
        .single();

      if (candidateUpdateError) {
        console.error('Candidate status update error:', candidateUpdateError);
        // Don't fail the request, but log the error for debugging
        console.error('Failed to update candidate status, but practical test submission succeeded');
      } else if (updatedCandidate) {
        console.log('Candidate status updated successfully:', {
          candidate_id: updatedCandidate.id,
          status: updatedCandidate.status,
          interview_status: updatedCandidate.interview_status
        });
      } else {
        console.warn('Candidate update returned no data, but no error occurred');
      }
    } else {
      console.warn('No candidate_id found in task, skipping candidate status update');
    }

    res.json({ 
      task: updatedTask, 
      message: 'Practical test submitted successfully' 
    });
  } catch (error) {
    next(error);
  }
});

export default router;

