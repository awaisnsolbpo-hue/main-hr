import express from 'express';
import { supabase } from '../config/supabase.js';
import { logActivity, generateActivityDescription } from '../utils/activityLogger.js';
import Joi from 'joi';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'cvs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads - Accept any document type
const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    // Accept any file type
    cb(null, true);
  }
});

// Validation schemas
const createCandidateSchema = Joi.object({
  name: Joi.string().required().min(2).max(200),
  email: Joi.string().email().required(),
  phone: Joi.string().allow('', null).max(50),
  resume_url: Joi.string().uri().allow('', null),
  linkedin_url: Joi.string().uri().allow('', null),
  job_id: Joi.string().uuid().required(),
  status: Joi.string().allow('', null),
  skills: Joi.array().items(Joi.string()).allow(null),
  experience: Joi.string().allow('', null),
  education: Joi.string().allow('', null)
});

/**
 * GET /api/candidates
 * Get all candidates for authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { job_id, status } = req.query;

    let query = supabase
      .from('candidates')
      .select(`
        *,
        jobs(
          id,
          title,
          description,
          status,
          location,
          city,
          country
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (job_id) {
      query = query.eq('job_id', job_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: candidates, error } = await query;

    if (error) throw error;

    res.json({ candidates });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/candidates/upload
 * Upload PDF file and send to webhook
 */
router.post('/upload', upload.single('cv'), async (req, res, next) => {
  try {
    const { job_id } = req.body;
    const cvFile = req.file;

    if (!cvFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!job_id) {
      return res.status(400).json({ error: 'job_id is required' });
    }

    const userId = req.user.id;

    // Verify job belongs to user
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('id', job_id)
      .eq('user_id', userId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Upload CV file to Supabase Storage
    const fileName = `${userId}/${job_id}/${Date.now()}_${path.basename(cvFile.originalname)}`;
    const fileBuffer = fs.readFileSync(cvFile.path);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('candidate-cvs')
      .upload(fileName, fileBuffer, {
        contentType: cvFile.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('File upload error:', uploadError);
      // Cleanup temp file
      if (fs.existsSync(cvFile.path)) {
        fs.unlinkSync(cvFile.path);
      }
      
      // Provide helpful error message
      if (uploadError.message && uploadError.message.includes('Bucket not found')) {
        return res.status(500).json({ 
          error: 'Storage bucket not found. Please create a bucket named "candidate-cvs" in Supabase Storage.' 
        });
      }
      
      return res.status(500).json({ 
        error: `Failed to upload CV file to storage: ${uploadError.message || 'Unknown error'}` 
      });
    }

    // Get public URL for CV
    const { data: { publicUrl } } = supabase.storage
      .from('candidate-cvs')
      .getPublicUrl(fileName);

    // Cleanup temp file
    if (fs.existsSync(cvFile.path)) {
      fs.unlinkSync(cvFile.path);
    }

    // Send webhook notification (non-blocking)
    const webhookUrl = process.env.WEBHOOK_URL || 'https://nsolbpo.app.n8n.cloud/webhook/maincvs';
    
    const webhookPayload = {
      event: 'candidate.uploaded',
      timestamp: new Date().toISOString(),
      source: 'manual_upload',
      file: {
        name: cvFile.originalname,
        size: cvFile.size,
        type: cvFile.mimetype,
        url: publicUrl
      },
      job: {
        id: job_id,
        title: job.title || null
      },
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

    res.json({
      success: true,
      file: {
        name: cvFile.originalname,
        size: cvFile.size,
        type: cvFile.mimetype,
        url: publicUrl
      },
      message: 'File uploaded and sent to webhook successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    // Cleanup temp file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message || 'Failed to process CV upload' });
  }
});

/**
 * GET /api/candidates/job/:jobId
 * Get candidates for a specific job
 */
router.get('/job/:jobId', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { jobId } = req.params;

    // Try candidates table first
    let { data: candidates, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('job_id', jobId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(candidates || []);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/candidates/:id
 * Get a specific candidate by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: candidate, error } = await supabase
      .from('candidates')
      .select('*, jobs(title, description)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json({ candidate });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/candidates
 * Create a new candidate (applicant)
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Validate request body
    const { error: validationError, value } = createCandidateSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    // Verify job belongs to user
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', value.job_id)
      .eq('user_id', userId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const candidateData = {
      ...value,
      user_id: userId,
      skills: value.skills ? JSON.stringify(value.skills) : null,
    };

    // Map to candidates table schema
    // Parse name into first_name and last_name
    const nameParts = value.name.trim().split(' ');
    const firstName = nameParts[0] || null;
    const lastName = nameParts.slice(1).join(' ') || nameParts[0] || null;

    const mappedData = {
      user_id: userId,
      job_id: value.job_id,
      first_name: firstName,
      last_name: lastName, // last_name is required in schema, so use name if only one part
      email: value.email,
      phone: value.phone || null,
      linkedin_url: value.linkedin_url || null,
      cv_file_url: value.resume_url || null,
      status: value.status || 'new',
      skills: Array.isArray(value.skills) ? value.skills : (value.skills ? [value.skills] : []),
      experience_years: value.experience ? parseInt(value.experience) || 0 : 0,
      education: value.education ? (typeof value.education === 'string' ? JSON.parse(value.education) : value.education) : null,
      source: 'manual_upload',
    };

    const { data: candidate, error } = await supabase
      .from('candidates')
      .insert(mappedData)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    const candidateName = candidate.full_name || `${candidate.first_name} ${candidate.last_name}` || candidate.email;
    await logActivity({
      userId,
      actionType: 'candidate_added',
      entityType: 'candidate',
      entityId: candidate.id,
      entityName: candidateName,
      description: generateActivityDescription('candidate_added', 'candidate', candidateName),
      category: 'candidate_pipeline',
      severity: 'info',
      metadata: { candidate_id: candidate.id, job_id: candidate.job_id },
    });

    res.status(201).json({ candidate, message: 'Candidate added successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/candidates/:id
 * Update candidate information
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if candidate exists and belongs to user
    const { data: existingCandidate, error: fetchError } = await supabase
      .from('candidates')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingCandidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Update only allowed fields - map to new schema
    const allowedUpdates = [
      'first_name', 'last_name', 'email', 'phone', 'location', 'city', 'state', 'country',
      'summary', 'status', 'skills', 'experience_years', 'total_experience_months',
      'education', 'linkedin_url', 'github_url', 'portfolio_url', 'website_url',
      'cv_file_url', 'cv_file_name', 'cv_file_size', 'interview_status',
      'ats_score', 'ats_breakdown', 'ats_recommendation', 'source', 'import_source',
      'Work_Experience', 'Projects', 'ats_Weekness', 'ats_strength', 'matching_summary', 'Stage'
    ];
    const updateData = {};

    Object.keys(req.body).forEach(key => {
      if (key === 'full_name' || key === 'name') {
        // Parse name into first_name and last_name
        const nameParts = (req.body[key] || '').trim().split(' ');
        updateData['first_name'] = nameParts[0] || null;
        updateData['last_name'] = nameParts.slice(1).join(' ') || nameParts[0] || null;
      } else if (key === 'resume_url') {
        updateData['cv_file_url'] = req.body[key];
      } else if (key === 'experience') {
        updateData['experience_years'] = parseInt(req.body[key]) || 0;
      } else if (key === 'ai_score') {
        updateData['ats_score'] = req.body[key];
      } else if (key === 'notes' || key === 'Analysis') {
        updateData['summary'] = req.body[key];
      } else if (allowedUpdates.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    // Ensure skills is an array
    if (updateData.skills && !Array.isArray(updateData.skills)) {
      updateData.skills = [updateData.skills];
    }

    // Ensure education is proper JSONB format
    if (updateData.education && typeof updateData.education === 'string') {
      try {
        updateData.education = JSON.parse(updateData.education);
      } catch (e) {
        // If parsing fails, keep as is
      }
    }

    if (updateData.skills && Array.isArray(updateData.skills)) {
      // Keep as array for candidates table
    }

    const { data: candidate, error } = await supabase
      .from('candidates')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    const candidateName = candidate.full_name || `${candidate.first_name} ${candidate.last_name}` || candidate.email;
    await logActivity({
      userId,
      actionType: 'candidate_updated',
      entityType: 'candidate',
      entityId: candidate.id,
      entityName: candidateName,
      description: generateActivityDescription('candidate_updated', 'candidate', candidateName),
      category: 'candidate_pipeline',
      severity: 'info',
      metadata: { candidate_id: candidate.id, updated_fields: Object.keys(updateData) },
    });

    res.json({ candidate, message: 'Candidate updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/candidates/:id
 * Delete a candidate
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Get candidate info before deletion
    const { data: candidateToDelete } = await supabase
      .from('candidates')
      .select('full_name, first_name, last_name, email')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    // Log activity
    if (candidateToDelete) {
      const candidateName = candidateToDelete.full_name || 
        `${candidateToDelete.first_name} ${candidateToDelete.last_name}` || 
        candidateToDelete.email;
      await logActivity({
        userId,
        actionType: 'candidate_deleted',
        entityType: 'candidate',
        entityId: id,
        entityName: candidateName,
        description: generateActivityDescription('candidate_deleted', 'candidate', candidateName),
        category: 'candidate_pipeline',
        severity: 'warning',
        metadata: { candidate_id: id },
      });
    }

    res.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/candidates/shortlisted
 * Get shortlisted candidates
 */
router.get('/status/shortlisted', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: candidates, error } = await supabase
      .from('Shortlisted_candidates')
      .select('*, jobs(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ candidates });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/candidates/qualified
 * Get qualified for final interview candidates
 */
router.get('/status/qualified', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: candidates, error } = await supabase
      .from('qualified_for_final_interview')
      .select('*, jobs(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ candidates });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/candidates/:id/move
 * Move candidate to qualified or shortlisted
 */
router.post('/:id/move', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { destination } = req.body; // 'qualified' or 'shortlisted'

    if (!destination || !['qualified', 'shortlisted'].includes(destination)) {
      return res.status(400).json({ error: 'Invalid destination. Must be "qualified" or "shortlisted"' });
    }

    // Get the candidate from candidates table
    const { data: candidate, error: fetchError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Prepare payload - map from candidates table schema to target table
    const name = candidate.full_name || 
                 (candidate.first_name && candidate.last_name 
                   ? `${candidate.first_name} ${candidate.last_name}` 
                   : candidate.first_name || candidate.last_name || candidate.email);

    const payload = {
      id: candidate.id,
      name: name,
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      full_name: candidate.full_name || name,
      email: candidate.email,
      phone: candidate.phone || null,
      location: candidate.location || null,
      city: candidate.city || null,
      state: candidate.state || null,
      country: candidate.country || null,
      summary: candidate.summary || null,
      skills: candidate.skills || [],
      experience_years: candidate.experience_years || 0,
      total_experience_months: candidate.total_experience_months || null,
      education: candidate.education || null,
      linkedin_url: candidate.linkedin_url || null,
      github_url: candidate.github_url || null,
      portfolio_url: candidate.portfolio_url || null,
      website_url: candidate.website_url || null,
      cv_file_url: candidate.cv_file_url || null,
      cv_file_name: candidate.cv_file_name || null,
      cv_file_size: candidate.cv_file_size || null,
      status: candidate.status || 'new',
      interview_status: candidate.interview_status || null,
      ats_score: candidate.ats_score || null,
      ats_breakdown: candidate.ats_breakdown || null,
      ats_recommendation: candidate.ats_recommendation || null,
      source: candidate.source || 'manual_upload',
      import_source: candidate.import_source || null,
      job_id: candidate.job_id || null,
      user_id: userId,
      Work_Experience: candidate.Work_Experience || null,
      Projects: candidate.Projects || null,
      ats_Weekness: candidate.ats_Weekness || null,
      ats_strength: candidate.ats_strength || null,
      matching_summary: candidate.matching_summary || null,
      Stage: candidate.Stage || null,
      updated_at: new Date().toISOString(),
    };

    // Insert into target table
    const tableName = destination === 'qualified' ? 'qualified_for_final_interview' : 'Shortlisted_candidates';
    const { data: movedCandidate, error: moveError } = await supabase
      .from(tableName)
      .upsert(payload)
      .select()
      .single();

    if (moveError) throw moveError;

    // Log activity
    const candidateName = name || candidate.email;
    const actionType = destination === 'qualified' ? 'candidate_qualified' : 'candidate_shortlisted';
    await logActivity({
      userId,
      actionType: actionType,
      entityType: 'candidate',
      entityId: candidate.id,
      entityName: candidateName,
      description: generateActivityDescription('candidate_moved', 'candidate', candidateName, { destination }),
      category: 'candidate_pipeline',
      severity: 'info',
      metadata: { candidate_id: candidate.id, destination, job_id: candidate.job_id },
    });

    res.json({ candidate: movedCandidate, message: `Candidate moved to ${destination} successfully` });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/candidates/shortlisted/:id
 * Update shortlisted candidate
 */
router.patch('/shortlisted/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if candidate exists and belongs to user
    const { data: existingCandidate, error: fetchError } = await supabase
      .from('Shortlisted_candidates')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingCandidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Update only allowed fields
    const allowedUpdates = ['name', 'email', 'phone', 'interview_status', 'ai_score', 'notes', 'Analysis'];
    const updateData = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    const { data: candidate, error } = await supabase
      .from('Shortlisted_candidates')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ candidate, message: 'Shortlisted candidate updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/candidates/shortlisted/:id
 * Delete shortlisted candidate
 */
router.delete('/shortlisted/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabase
      .from('Shortlisted_candidates')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'Shortlisted candidate deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/candidates/analyze-and-shortlist
 * Comprehensive analysis of all candidate tests and shortlist/reject
 */
router.post('/analyze-and-shortlist', async (req, res, next) => {
  try {
    if (!openai) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const userId = req.user.id;
    const { job_id, candidate_ids } = req.body; // Optional: specific candidates or all for a job

    // Get all candidates for the job (or specific candidates)
    let candidatesQuery = supabase
      .from('candidates')
      .select('*')
      .eq('user_id', userId);

    if (job_id) {
      candidatesQuery = candidatesQuery.eq('job_id', job_id);
    }

    if (candidate_ids && Array.isArray(candidate_ids) && candidate_ids.length > 0) {
      candidatesQuery = candidatesQuery.in('id', candidate_ids);
    }

    const { data: candidates, error: candidatesError } = await candidatesQuery;

    if (candidatesError) throw candidatesError;
    if (!candidates || candidates.length === 0) {
      return res.json({ message: 'No candidates found', analyzed: 0, candidates: [] });
    }

    // Get job details
    const jobIds = [...new Set(candidates.map(c => c.job_id).filter(Boolean))];
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, title, description, required_skills, preferred_skills, experience_required')
      .in('id', jobIds);

    const jobsMap = new Map(jobs?.map(j => [j.id, j]) || []);

    const analyzedCandidates = [];
    const errors = [];

    // Analyze each candidate - ONLY those who completed ALL tests
    for (const candidate of candidates) {
      try {
        // 1. Get ATS Score
        const atsScore = candidate.ats_score || 0;
        const atsBreakdown = candidate.ats_breakdown || {};

        // 2. Get MCQ Test Results
        const { data: mcqTest } = await supabase
          .from('mcqs_test')
          .select('*')
          .eq('candidate_id', candidate.id)
          .eq('job_id', candidate.job_id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // 3. Get Technical Test Results
        const { data: technicalTest } = await supabase
          .from('technical_practicals')
          .select('*')
          .eq('candidate_id', candidate.id)
          .eq('job_id', candidate.job_id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // 4. Get Interview Results
        const { data: interviewRecord } = await supabase
          .from('qualified_for_final_interview')
          .select('*')
          .eq('email', candidate.email)
          .eq('job_id', candidate.job_id)
          .maybeSingle();

        // Skip candidates who haven't completed ALL tests
        if (!atsScore || atsScore === 0) {
          console.log(`Skipping candidate ${candidate.id}: No ATS score`);
          continue;
        }

        if (!mcqTest || mcqTest.status !== 'completed') {
          console.log(`Skipping candidate ${candidate.id}: MCQ test not completed`);
          continue;
        }

        if (!technicalTest || technicalTest.status !== 'completed') {
          console.log(`Skipping candidate ${candidate.id}: Technical test not completed`);
          continue;
        }

        if (!interviewRecord || !interviewRecord.Transcript) {
          console.log(`Skipping candidate ${candidate.id}: Interview not completed`);
          continue;
        }

        // Prepare data for OpenAI analysis
        const job = jobsMap.get(candidate.job_id);
        
        const candidateName = candidate.full_name || 
          (candidate.first_name && candidate.last_name 
            ? `${candidate.first_name} ${candidate.last_name}` 
            : candidate.email);
        
        const analysisData = {
          candidate: {
            name: candidateName,
            email: candidate.email,
            skills: candidate.skills || [],
            experience_years: candidate.experience_years || 0,
            summary: candidate.summary || '',
            education: candidate.education || null,
          },
          job: {
            title: job?.title || 'Unknown',
            description: job?.description || '',
            required_skills: job?.required_skills || [],
            preferred_skills: job?.preferred_skills || [],
            experience_required: job?.experience_required || 0,
          },
          scores: {
            ats_score: atsScore,
            ats_breakdown: atsBreakdown,
            mcq_score: mcqTest?.percentage || mcqTest?.score || 0,
            mcq_details: {
              total_questions: mcqTest?.total_questions || 0,
              attempted: mcqTest?.attempted_questions || 0,
              correct: mcqTest?.correct_answers || 0,
              passed: mcqTest?.passed || false,
            },
            technical_score: technicalTest?.overall_score || 0,
            technical_details: {
              code_quality: technicalTest?.code_quality_score || 0,
              correctness: technicalTest?.correctness_score || 0,
              approach: technicalTest?.approach_score || 0,
              communication: technicalTest?.communication_score || 0,
              feedback: technicalTest?.feedback || '',
              code_review: technicalTest?.code_review || '',
            },
            interview_score: interviewRecord?.ai_score || interviewRecord?.Score || 0,
            interview_details: {
              transcript: interviewRecord?.Transcript || '',
              analysis: interviewRecord?.Analysis || '',
            },
          },
        };

        // Calculate overall score
        const scores = [
          atsScore,
          analysisData.scores.mcq_score,
          analysisData.scores.technical_score,
          analysisData.scores.interview_score,
        ].filter(s => s > 0);

        const overallScore = scores.length > 0
          ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
          : 0;

        // Generate comprehensive analysis using OpenAI
        const prompt = `You are an expert HR analyst. Analyze this candidate comprehensively and provide a detailed assessment.

CANDIDATE INFORMATION:
Name: ${analysisData.candidate.name}
Email: ${analysisData.candidate.email}
Skills: ${analysisData.candidate.skills.join(', ') || 'Not specified'}
Experience: ${analysisData.candidate.experience_years} years
Summary: ${analysisData.candidate.summary || 'Not provided'}

JOB REQUIREMENTS:
Title: ${analysisData.job.title}
Description: ${analysisData.job.description || 'Not provided'}
Required Skills: ${analysisData.job.required_skills.join(', ') || 'Not specified'}
Preferred Skills: ${analysisData.job.preferred_skills.join(', ') || 'Not specified'}
Experience Required: ${analysisData.job.experience_required} years

ASSESSMENT SCORES:
1. ATS Score (Resume Analysis): ${atsScore}/100
   Breakdown: ${JSON.stringify(atsBreakdown)}

2. MCQ Test Score: ${analysisData.scores.mcq_score}/100
   Details: ${analysisData.scores.mcq_details.correct}/${analysisData.scores.mcq_details.total_questions} correct
   Attempted: ${analysisData.scores.mcq_details.attempted}/${analysisData.scores.mcq_details.total_questions}
   Passed: ${analysisData.scores.mcq_details.passed ? 'Yes' : 'No'}

3. Technical Test Score: ${analysisData.scores.technical_score}/100
   Code Quality: ${analysisData.scores.technical_details.code_quality}/100
   Correctness: ${analysisData.scores.technical_details.correctness}/100
   Approach: ${analysisData.scores.technical_details.approach}/100
   Communication: ${analysisData.scores.technical_details.communication}/100
   Feedback: ${analysisData.scores.technical_details.feedback || 'Not provided'}
   Code Review: ${analysisData.scores.technical_details.code_review || 'Not provided'}

4. Interview Score: ${analysisData.scores.interview_score}/100
   Transcript: ${analysisData.scores.interview_details.transcript ? 'Available' : 'Not available'}
   Analysis: ${analysisData.scores.interview_details.analysis || 'Not provided'}

OVERALL SCORE: ${overallScore}/100

TASK:
Provide a comprehensive analysis in JSON format with the following structure:
{
  "recommendation": "shortlist" or "reject",
  "confidence": 0-100,
  "total_score": ${overallScore},
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "detailed_analysis": "Comprehensive 2-3 paragraph analysis covering all aspects",
  "ats_evaluation": "Analysis of resume/CV match",
  "mcq_evaluation": "Analysis of MCQ test performance",
  "technical_evaluation": "Analysis of technical test performance",
  "interview_evaluation": "Analysis of interview performance",
  "overall_assessment": "Final comprehensive assessment",
  "recommendation_reason": "Detailed reason for shortlist/reject decision",
  "improvement_areas": ["area1", "area2", ...],
  "hire_readiness": "ready" | "conditional" | "not_ready",
  "priority": "high" | "medium" | "low"
}

Be thorough, objective, and provide actionable insights.`;

        // Use a model that supports JSON mode (gpt-3.5-turbo, gpt-4, gpt-4-turbo, gpt-4o all support it)
        // Fallback to text parsing if needed
        let aiAnalysis;
        try {
          // Try with models that support JSON mode
          const modelsToTry = ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
          let lastError = null;
          
          for (const model of modelsToTry) {
            try {
              const completion = await openai.chat.completions.create({
                model: model,
                messages: [
                  {
                    role: 'system',
                    content: 'You are an expert HR analyst specializing in comprehensive candidate evaluation. Provide detailed, objective analysis in JSON format only. Return ONLY valid JSON, no markdown or additional text.',
                  },
                  {
                    role: 'user',
                    content: prompt,
                  },
                ],
                temperature: 0.3,
                response_format: { type: 'json_object' },
              });

              aiAnalysis = JSON.parse(completion.choices[0].message.content);
              break; // Success, exit loop
            } catch (modelError) {
              lastError = modelError;
              console.warn(`Model ${model} failed, trying next...`, modelError.message);
              continue; // Try next model
            }
          }
          
          // If all models with JSON mode failed, try without JSON mode
          if (!aiAnalysis) {
            console.warn('All JSON mode attempts failed, trying without response_format');
            const completion = await openai.chat.completions.create({
              model: 'gpt-4o',
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert HR analyst specializing in comprehensive candidate evaluation. Provide detailed, objective analysis in JSON format only. Return ONLY valid JSON, no markdown or additional text. Start your response with { and end with }.',
                },
                {
                  role: 'user',
                  content: prompt,
                },
              ],
              temperature: 0.3,
            });

            let content = completion.choices[0].message.content || '';
            // Remove markdown code blocks if present
            content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            // Extract JSON from response if there's extra text
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              content = jsonMatch[0];
            }
            aiAnalysis = JSON.parse(content);
          }
        } catch (error) {
          console.error('Error getting AI analysis:', error);
          throw new Error(`Failed to get AI analysis: ${error.message}`);
        }

        // Determine status
        const status = aiAnalysis.recommendation === 'shortlist' ? 'shortlisted' : 'rejected';

        // Prepare candidate data for Shortlisted_candidates table
        const shortlistData = {
          id: candidate.id,
          user_id: userId,
          job_id: candidate.job_id,
          name: candidateName,
          email: candidate.email,
          phone: candidate.phone || null,
          cv_file_url: candidate.cv_file_url || null,
          ai_score: overallScore,
          status: status,
          interview_status: candidate.interview_status || null,
          notes: aiAnalysis.detailed_analysis || null,
          Analysis: JSON.stringify(aiAnalysis),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Store all scores
          ats_score: atsScore,
          mcq_score: analysisData.scores.mcq_score,
          technical_score: analysisData.scores.technical_score,
          interview_score: analysisData.scores.interview_score,
          total_score: overallScore,
          recommendation: aiAnalysis.recommendation,
          confidence: aiAnalysis.confidence,
          hire_readiness: aiAnalysis.hire_readiness,
          priority: aiAnalysis.priority,
        };

        // Upsert to Shortlisted_candidates table
        const { data: savedCandidate, error: saveError } = await supabase
          .from('Shortlisted_candidates')
          .upsert(shortlistData, {
            onConflict: 'id',
          })
          .select()
          .single();

        if (saveError) {
          console.error(`Error saving candidate ${candidate.id}:`, saveError);
          errors.push({ candidate_id: candidate.id, error: saveError.message });
          continue;
        }

        analyzedCandidates.push({
          candidate_id: candidate.id,
          name: candidateName,
          status,
          total_score: overallScore,
          recommendation: aiAnalysis.recommendation,
        });

        // Log activity
        await logActivity(
          userId,
          candidate.job_id,
          'candidate_analyzed',
          `Candidate ${candidateName} analyzed and ${status}`,
          { candidate_id: candidate.id, analysis: aiAnalysis }
        );

      } catch (error) {
        console.error(`Error analyzing candidate ${candidate.id}:`, error);
        errors.push({
          candidate_id: candidate.id,
          error: error.message || 'Unknown error',
        });
      }
    }

    res.json({
      message: `Analyzed ${analyzedCandidates.length} candidates`,
      analyzed: analyzedCandidates.length,
      candidates: analyzedCandidates,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/candidates/shortlisted/:id/full-details
 * Get comprehensive details for a shortlisted candidate including all test data
 */
router.get('/shortlisted/:id/full-details', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Get shortlisted candidate
    const { data: shortlistedCandidate, error: shortlistedError } = await supabase
      .from('Shortlisted_candidates')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (shortlistedError || !shortlistedCandidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Get original candidate data
    const { data: candidate } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();

    // Get MCQ test data
    const { data: mcqTest } = await supabase
      .from('mcqs_test')
      .select('*')
      .eq('candidate_id', id)
      .eq('job_id', shortlistedCandidate.job_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get Technical test data
    const { data: technicalTest } = await supabase
      .from('technical_practicals')
      .select('*')
      .eq('candidate_id', id)
      .eq('job_id', shortlistedCandidate.job_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get Interview data
    const { data: interviewRecord } = await supabase
      .from('qualified_for_final_interview')
      .select('*')
      .eq('email', shortlistedCandidate.email)
      .eq('job_id', shortlistedCandidate.job_id)
      .maybeSingle();

    // Get job data
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', shortlistedCandidate.job_id)
      .single();

    res.json({
      candidate: candidate || shortlistedCandidate,
      shortlisted: shortlistedCandidate,
      mcqTest,
      technicalTest,
      interviewRecord,
      job,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
