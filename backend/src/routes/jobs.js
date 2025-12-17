import express from 'express';
import { supabase } from '../config/supabase.js';
import { createJobSchema, updateJobSchema, updateJobStatusSchema } from '../validators/jobValidators.js';
import { logActivity, generateActivityDescription } from '../utils/activityLogger.js';
import OpenAI from 'openai';

const router = express.Router();

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

/**
 * GET /api/jobs
 * Get all jobs for authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get application count for each job
    const jobsWithCount = await Promise.all(
      (jobs || []).map(async (job) => {
        const { count } = await supabase
          .from('candidates')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', job.id);

        return {
          ...job,
          applications: count || 0,
        };
      })
    );

    res.json({ jobs: jobsWithCount });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/jobs/:id
 * Get a specific job by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ job });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/jobs/generate
 * Generate job details with AI
 */
router.post('/generate', async (req, res, next) => {
  try {
    if (!openai) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const userId = req.user.id;
    const { job_title, user_city, user_country } = req.body;

    if (!job_title) {
      return res.status(400).json({ error: 'Job title is required' });
    }

    // Get user profile for location if not provided
    let locationCity = user_city;
    let locationCountry = user_country;

    if (!locationCity || !locationCountry) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_city, company_country')
          .eq('id', userId)
          .single();

        if (profile) {
          locationCity = locationCity || profile.company_city || '';
          locationCountry = locationCountry || profile.company_country || '';
        }
      } catch (error) {
        console.log('Could not fetch profile for location:', error);
      }
    }

    // Build location context for AI
    const locationContext = locationCity && locationCountry 
      ? `The job is located in ${locationCity}, ${locationCountry}. Use this location to determine market-competitive salary ranges based on local cost of living and industry standards for this specific location.`
      : 'Use general market rates, but if a location is suggested, ensure salaries are competitive for that market.';

    const prompt = `You are an expert HR specialist and job description writer with deep knowledge of global job markets, salary benchmarks, and location-based compensation analysis.

Generate a comprehensive job posting for the role: "${job_title}"

${locationContext}

IMPORTANT SALARY REQUIREMENTS:
- Analyze the job title and determine the appropriate job level (entry/mid/senior/lead/exec)
- Research market-rate salaries for this role in the specified location (or general market if no location)
- Consider cost of living, industry standards, and experience level
- Provide competitive salary ranges that would attract top talent
- Salary should be in the local currency (USD for US, EUR for Europe, etc.)
- Ensure salary_min and salary_max are realistic market rates, not placeholder values

LOCATION ANALYSIS:
- If location is provided, use it as the primary location
- If no location provided, suggest a typical location for this role type
- Consider remote/hybrid/onsite options based on the role type

FORMATTING REQUIREMENTS - CRITICAL:
All text fields must use proper markdown formatting for professional display. The content will be displayed in text areas, so ensure proper line breaks and clear structure.

1. **description**: Write 2-3 well-structured paragraphs with:
   - Clear introduction about the role and company
   - Key highlights and what makes this role exciting
   - What the company is looking for in candidates
   - Use **bold** for important terms, company values, and key phrases
   - Each paragraph should be separated by a blank line
   - Example: "We are seeking a **Senior Software Engineer** to join our **innovative** team..."

2. **responsibilities**: Format as markdown bullet list with:
   - Each responsibility MUST be on a new line starting with "- " (dash space)
   - Use **bold** for section headers when grouping related responsibilities
   - Include 6-10 specific, actionable responsibilities
   - Use clear, action-oriented language
   - Example format (exactly like this):
- **Core Development:**
- Design and develop scalable software solutions using modern technologies
- Write clean, maintainable code following best practices
- Collaborate with cross-functional teams to deliver high-quality products
- **Technical Leadership:**
- Lead technical decision-making processes
- Mentor junior developers and conduct code reviews
- **Project Management:**
- Manage project timelines and deliverables
- Participate in sprint planning and agile ceremonies

3. **benefits**: Format as markdown bullet list with:
   - Each benefit MUST be on a new line starting with "- " (dash space)
   - Use **bold** for benefit category headers
   - Include 8-12 comprehensive benefits organized by category
   - Example format (exactly like this):
- **Compensation & Equity:**
- Competitive salary package with performance bonuses
- Stock options and equity participation
- Annual salary reviews and merit increases
- **Health & Wellness:**
- Comprehensive health, dental, and vision insurance
- Mental health support programs and counseling
- Gym membership reimbursement
- **Work-Life Balance:**
- Flexible working hours and remote work options
- Generous paid time off and holidays
- Parental leave and family support programs
- **Professional Development:**
- Annual learning and development budget
- Conference attendance and training opportunities
- Career growth and advancement paths

4. **requirements**: Format requirements clearly with:
   - Use **bold** for section headers (e.g., "**Required Skills:**", "**Education:**")
   - List skills as clear, specific items

Return a JSON object with the following structure:
{
  "job_details": {
    "title": "The exact job title",
    "description": "Well-formatted description with **bold** for key terms, 2-3 paragraphs with proper structure",
    "responsibilities": "Markdown-formatted bullet list with **bold** headers for sections, each item on new line with '- '",
    "benefits": "Markdown-formatted bullet list with **bold** category headers, each item on new line with '- '",
    "salary_min": <numeric value - market-competitive minimum salary>,
    "salary_max": <numeric value - market-competitive maximum salary>,
    "location": "${locationCity && locationCountry ? `${locationCity}, ${locationCountry}` : 'Typical location for this role'}",
    "location_type": "remote/hybrid/onsite (choose based on role)",
    "job_level": "entry/mid/senior/lead/exec (analyze from title)",
    "company_about": "Brief company description (1-2 sentences)"
  },
  "requirements": {
    "required_skills": ["skill1", "skill2", "skill3", "skill4"],
    "preferred_skills": ["skill5", "skill6"],
    "years_required": <number based on job level>,
    "education_required": "High School/Bachelor/Master/PhD",
    "certifications": ["relevant cert if applicable"],
    "languages": ["English", "other if relevant"]
  }
}

CRITICAL: All text fields (description, responsibilities, benefits) MUST use proper markdown formatting with:
- **Bold text** using **text** syntax
- Bullet points using "- " at the start of each line
- Section headers in **bold**
- Proper line breaks between sections

Make it realistic, specific to the role, professionally formatted, and ensure salaries are market-competitive. Return ONLY valid JSON with numeric salary values.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR and recruitment specialist. Return valid JSON with markdown-formatted text fields (description, responsibilities, benefits) that include proper formatting like **bold**, bullet points with "- ", and section headers. The JSON structure must be valid, but text content can contain markdown.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    let responseText = completion.choices[0].message.content;
    
    // Clean markdown if present
    responseText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const jobData = JSON.parse(responseText);

    res.json(jobData);
  } catch (error) {
    console.error('Job generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate job details' });
  }
});

/**
 * POST /api/jobs
 * Create a new job
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Validate request body
    const { error: validationError, value } = createJobSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    // If posting to community, verify user is a recruiter
    if (value.community_post_flag) {
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (!userRole || userRole.role !== 'recruiter') {
        return res.status(403).json({ 
          error: 'Only recruiters can post jobs to the community' 
        });
      }
    }

    // Convert questions array to JSON string
    const questionsJson = value.questions && value.questions.length > 0
      ? JSON.stringify(value.questions)
      : null;

    const jobData = {
      title: value.title,
      description: value.description,
      city: value.city || null,
      country: value.country || null,
      salary_min: value.salary_min || null,
      salary_max: value.salary_max || null,
      location_type: value.location_type || null,
      job_level: value.job_level || null,
      close_date: value.close_date || null,
      questions: questionsJson,
      user_id: userId,
      status: value.status || 'active',
      posted_to_linkedin: false,
      // New fields for advanced job creation
      ats_criteria: value.ats_criteria || {
        skills_importance: 8,
        experience_importance: 6,
        education_importance: 5,
        projects_importance: 4,
        certifications_importance: 3,
        languages_importance: 3,
        overall_strictness: 7,
      },
      job_requirements: value.job_requirements || null,
      ai_generated: value.ai_generated || false,
      published_platforms: value.published_platforms || ['internal'],
      generated_at: value.ai_generated ? new Date().toISOString() : null,
      community_post_flag: value.community_post_flag || false,
      visible_to_applicants: value.visible_to_applicants !== undefined ? value.visible_to_applicants : true,
    };

    const { data: job, error } = await supabase
      .from('jobs')
      .insert(jobData)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity({
      userId,
      actionType: 'job_created',
      entityType: 'job',
      entityId: job.id,
      entityName: job.title,
      description: generateActivityDescription('job_created', 'job', job.title),
      category: 'job_management',
      severity: 'info',
      metadata: { job_id: job.id, status: job.status },
    });

    res.status(201).json({ job, message: 'Job created successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/jobs/:id
 * Update a job
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Validate request body
    const { error: validationError, value } = updateJobSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    // Check if job exists and belongs to user
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Convert questions array to JSON string if provided
    if (value.questions) {
      value.questions = value.questions.length > 0
        ? JSON.stringify(value.questions)
        : null;
    }

    const { data: job, error } = await supabase
      .from('jobs')
      .update(value)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity({
      userId,
      actionType: 'job_updated',
      entityType: 'job',
      entityId: job.id,
      entityName: job.title,
      description: generateActivityDescription('job_updated', 'job', job.title),
      category: 'job_management',
      severity: 'info',
      metadata: { job_id: job.id, updated_fields: Object.keys(value) },
    });

    res.json({ job, message: 'Job updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/jobs/:id/status
 * Update job status
 */
router.patch('/:id/status', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Validate request body
    const { error: validationError, value } = updateJobStatusSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    const { data: job, error } = await supabase
      .from('jobs')
      .update({ status: value.status })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity({
      userId,
      actionType: 'job_status_changed',
      entityType: 'job',
      entityId: job.id,
      entityName: job.title,
      description: generateActivityDescription('job_status_changed', 'job', job.title, { newStatus: value.status }),
      category: 'job_management',
      severity: 'info',
      metadata: { job_id: job.id, new_status: value.status },
    });

    res.json({ job, message: 'Job status updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/jobs/:id
 * Delete a job
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Get job title before deletion for activity log
    const { data: jobToDelete } = await supabase
      .from('jobs')
      .select('title')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    // Log activity
    if (jobToDelete) {
      await logActivity({
        userId,
        actionType: 'job_deleted',
        entityType: 'job',
        entityId: id,
        entityName: jobToDelete.title,
        description: generateActivityDescription('job_deleted', 'job', jobToDelete.title),
        category: 'job_management',
        severity: 'warning',
        metadata: { job_id: id },
      });
    }

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
