import express from 'express';
import { supabase } from '../config/supabase.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const updateInterviewStatusSchema = Joi.object({
  interview_status: Joi.string().valid('Scheduled', 'In Progress', 'Completed', 'Cancelled').required(),
});

const updateInterviewRecordingSchema = Joi.object({
  recording_url: Joi.string().uri().allow('', null),
  transcript: Joi.string().allow('', null),
  ai_score: Joi.number().min(0).max(100).allow(null),
  Screen_recording: Joi.string().uri().allow('', null),
  Transcript: Joi.string().allow('', null),
});

/**
 * GET /api/interviews/qualified
 * Get qualified candidates for final interview
 */
router.get('/qualified', async (req, res, next) => {
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
 * GET /api/interviews/qualified/:id
 * Get a specific qualified candidate
 */
router.get('/qualified/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: candidate, error } = await supabase
      .from('qualified_for_final_interview')
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
 * PATCH /api/interviews/qualified/:id/status
 * Update interview status
 */
router.patch('/qualified/:id/status', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Validate request body
    const { error: validationError, value } = updateInterviewStatusSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    // Check if candidate exists and belongs to user
    const { data: existingCandidate, error: fetchError } = await supabase
      .from('qualified_for_final_interview')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingCandidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const { data: candidate, error } = await supabase
      .from('qualified_for_final_interview')
      .update({ interview_status: value.interview_status })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ candidate, message: 'Interview status updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/interviews/qualified/:id/recording
 * Update interview recording and transcript
 */
router.patch('/qualified/:id/recording', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Validate request body
    const { error: validationError, value } = updateInterviewRecordingSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    // Check if candidate exists and belongs to user
    const { data: existingCandidate, error: fetchError } = await supabase
      .from('qualified_for_final_interview')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingCandidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    const updateData = {};
    
    if (value.recording_url !== undefined) updateData.recording_url = value.recording_url;
    if (value.Screen_recording !== undefined) updateData.Screen_recording = value.Screen_recording;
    if (value.transcript !== undefined) updateData.transcript = value.transcript;
    if (value.Transcript !== undefined) updateData.Transcript = value.Transcript;
    if (value.ai_score !== undefined) updateData.ai_score = value.ai_score;

    const { data: candidate, error } = await supabase
      .from('qualified_for_final_interview')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ candidate, message: 'Recording updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/interviews/scheduled
 * Get scheduled interviews
 */
router.get('/scheduled', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { upcoming } = req.query;

    let query = supabase
      .from('scheduled_meetings')
      .select('*')
      .eq('user_id', userId)
      .order('meeting_date', { ascending: true });

    if (upcoming === 'true') {
      const now = new Date().toISOString();
      query = query.gte('meeting_date', now);
    }

    const { data: meetings, error } = await query;

    if (error) throw error;

    res.json({ meetings: meetings || [] });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/interviews/initial-qualified
 * Get initial interview qualified candidates
 */
router.get('/initial-qualified', async (req, res, next) => {
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

export default router;

