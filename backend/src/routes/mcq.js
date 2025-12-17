import express from 'express';
import { supabase } from '../config/supabase.js';
import Joi from 'joi';
import OpenAI from 'openai';

const router = express.Router();

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// Validation schema for MCQ test
const mcqTestSchema = Joi.object({
  candidate_id: Joi.string().uuid().required(),
  job_id: Joi.string().uuid().required(),
  candidate_email: Joi.string().email().required(),
  candidate_name: Joi.string().required(),
  job_title: Joi.string().allow(null),
  stage_name: Joi.string().allow(null),
  status: Joi.string().valid('scheduled', 'in_progress', 'completed').default('scheduled'),
  total_questions: Joi.number().integer().default(30),
  attempted_questions: Joi.number().integer().default(0),
  correct_answers: Joi.number().integer().default(0),
  questions: Joi.array().allow(null),
  answers: Joi.object().allow(null),
  score: Joi.number().allow(null),
  percentage: Joi.number().allow(null),
  screen_recording_url: Joi.string().uri().allow(null, ''),
  recording_duration_seconds: Joi.number().integer().allow(null),
  started_at: Joi.string().isoDate().allow(null),
  completed_at: Joi.string().isoDate().allow(null),
  duration_minutes: Joi.number().integer().allow(null),
  time_limit_minutes: Joi.number().integer().default(15),
  ai_evaluation: Joi.object().allow(null),
  passing_score: Joi.number().default(60),
  passed: Joi.boolean().allow(null),
  review_notes: Joi.string().allow(null),
  reviewed_at: Joi.string().isoDate().allow(null),
});

/**
 * POST /api/public/mcq-tests/generate
 * Generate MCQ questions for a job (no auth required)
 */
router.post('/generate', async (req, res, next) => {
  try {
    if (!openai) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const { title, description, experience_required, skills } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Job title is required' });
    }

    const prompt = `Generate exactly 30 multiple-choice questions for a job assessment test.

Job Position: ${title}
Job Description: ${description || "Not provided"}
Experience Required: ${experience_required || 0} years
Required Skills: ${(skills || []).join(", ") || "Not specified"}

DISTRIBUTION REQUIREMENTS:
- 18 Technical questions (60%) - Focus on job-specific skills and knowledge
- 8 Behavioral questions (27%) - Soft skills, teamwork, problem-solving
- 4 Office Environment questions (13%) - Workplace conduct, policies, communication

For EACH question, provide:
1. A clear, unambiguous multiple-choice question
2. Exactly 4 options (A, B, C, D)
3. The correct answer (A, B, C, or D)
4. A brief explanation of why the answer is correct

Response format - Return ONLY valid JSON array with NO markdown:

[
  {
    "id": "q1",
    "question": "What is the primary benefit of...",
    "options": {
      "A": "First option",
      "B": "Second option",
      "C": "Third option",
      "D": "Fourth option"
    },
    "correct_answer": "C",
    "category": "technical",
    "difficulty": "easy",
    "explanation": "The correct answer is C because..."
  },
  ...
]

IMPORTANT:
- Exactly 30 questions total
- 18 technical, 8 behavioral, 4 office environment
- Return ONLY JSON, no markdown or extra text
- No code blocks (\`\`\`)
- All answers must be properly escaped
- Questions must be specific to the job role`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using GPT-4o Mini (faster and cheaper than GPT-4 Turbo)
      temperature: 0.7,
      max_tokens: 8000, // Optimized for 30 questions (~250-270 tokens per question)
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR and technical assessment specialist. Generate professional, relevant MCQ questions. Return ONLY valid JSON array, no markdown, no code blocks, no extra text. Ensure all strings are properly escaped.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    let jsonResponse = completion.choices[0].message.content || '';

    // More aggressive cleaning of markdown and extra text
    jsonResponse = jsonResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^[^{[]*/, '') // Remove any text before first [ or {
      .replace(/[^}\]]*$/, '') // Remove any text after last } or ]
      .trim();

    // Try to find JSON array in the response
    const jsonMatch = jsonResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonResponse = jsonMatch[0];
    }

    let questions;
    try {
      questions = JSON.parse(jsonResponse);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Response length:', jsonResponse.length);
      console.error('Response preview:', jsonResponse.substring(0, 500));
      throw new Error(`Invalid JSON response from AI: ${parseError.message}. Response may be truncated or malformed.`);
    }

    // Validate we have exactly 30 questions
    if (!Array.isArray(questions)) {
      throw new Error(`Expected array of questions, got ${typeof questions}`);
    }

    if (questions.length !== 30) {
      throw new Error(`Expected 30 questions, got ${questions.length}`);
    }

    // Validate each question has required fields
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.id || !q.question || !q.options || !q.correct_answer) {
        throw new Error(`Question ${i + 1} is missing required fields`);
      }
    }

    res.json({ questions });
  } catch (error) {
    console.error('Error generating MCQ questions:', error);
    const errorMessage = error.message || 'Failed to generate MCQ questions';
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/public/mcq-tests
 * Create or update MCQ test results (no auth required)
 */
router.post('/', async (req, res, next) => {
  try {
    const { error: validationError, value } = mcqTestSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    // Check if test already exists
    const { data: existingTest } = await supabase
      .from('mcqs_test')
      .select('id')
      .eq('candidate_id', value.candidate_id)
      .eq('job_id', value.job_id)
      .single();

    let test;
    if (existingTest) {
      // Update existing test - ensure screen_recording_url is included
      const updateData = {
        ...value,
        updated_at: new Date().toISOString(),
      };
      
      // Always include screen_recording_url if provided (even if null)
      // Only update if explicitly provided to avoid overwriting with null
      if (value.screen_recording_url !== undefined) {
        updateData.screen_recording_url = value.screen_recording_url;
        console.log('Updating MCQ test with screen_recording_url:', value.screen_recording_url || 'null');
      } else {
        // If not provided, don't overwrite existing value
        delete updateData.screen_recording_url;
      }

      const { data: updatedTest, error: updateError } = await supabase
        .from('mcqs_test')
        .update(updateData)
        .eq('id', existingTest.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating MCQ test:', updateError);
        throw updateError;
      }
      test = updatedTest;
      
      // Log if screen_recording_url was saved
      if (value.screen_recording_url) {
        console.log('MCQ test updated with screen_recording_url:', value.screen_recording_url);
      }
    } else {
      // Create new test - ensure screen_recording_url is included
      const insertData = {
        ...value,
      };
      
      // Explicitly include screen_recording_url if provided
      if (value.screen_recording_url !== undefined) {
        insertData.screen_recording_url = value.screen_recording_url;
      }

      const { data: newTest, error: insertError } = await supabase
        .from('mcqs_test')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting MCQ test:', insertError);
        throw insertError;
      }
      test = newTest;
      
      // Log if screen_recording_url was saved
      if (value.screen_recording_url) {
        console.log('MCQ test created with screen_recording_url:', value.screen_recording_url);
      }
    }

    res.status(200).json({ test, message: 'MCQ test results saved successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/mcq-tests/:candidateId/:jobId
 * Get MCQ test for a candidate and job (no auth required)
 */
router.get('/:candidateId/:jobId', async (req, res, next) => {
  try {
    const { candidateId, jobId } = req.params;

    const { data: test, error } = await supabase
      .from('mcqs_test')
      .select('*')
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ test: test || null });
  } catch (error) {
    next(error);
  }
});

export default router;

