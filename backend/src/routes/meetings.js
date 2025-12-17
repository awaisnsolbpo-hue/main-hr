import express from 'express';
import { supabase } from '../config/supabase.js';
import { logActivity, generateActivityDescription } from '../utils/activityLogger.js';
import Joi from 'joi';

const router = express.Router();

// Validation schema
const createMeetingSchema = Joi.object({
  candidate_name: Joi.string().required().min(2).max(200),
  candidate_email: Joi.string().email().required(),
  job_id: Joi.string().uuid().allow(null),
  job_title: Joi.string().allow('', null),
  meeting_date: Joi.date().iso().required(),
  meeting_duration: Joi.number().integer().positive().default(30),
  meeting_link: Joi.string().uri().required(),
  ai_score: Joi.number().min(0).max(100).allow(null)
});

/**
 * GET /api/meetings
 * Get all meetings for authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { upcoming, job_id } = req.query;

    let query = supabase
      .from('scheduled_meetings')
      .select('*')
      .eq('user_id', userId)
      .order('meeting_date', { ascending: true });

    if (upcoming === 'true') {
      const now = new Date().toISOString();
      query = query.gte('meeting_date', now);
    }

    if (job_id) {
      query = query.eq('job_id', job_id);
    }

    const { data: meetings, error } = await query;

    if (error) throw error;

    // Filter out completed/cancelled if requesting upcoming
    const filteredMeetings = upcoming === 'true'
      ? meetings?.filter(m => {
          const status = m.meeting_status?.toLowerCase();
          return status !== 'completed' && status !== 'cancelled';
        })
      : meetings;

    res.json({ meetings: filteredMeetings });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/meetings/:id
 * Get a specific meeting by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: meeting, error } = await supabase
      .from('scheduled_meetings')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json({ meeting });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/meetings
 * Create a new meeting
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Validate request body
    const { error: validationError, value } = createMeetingSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    const meetingData = {
      ...value,
      user_id: userId,
      meeting_status: 'scheduled'
    };

    const { data: meeting, error } = await supabase
      .from('scheduled_meetings')
      .insert(meetingData)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logActivity({
      userId,
      actionType: 'meeting_created',
      entityType: 'meeting',
      entityId: meeting.id,
      entityName: `${meeting.candidate_name} - ${meeting.job_title || 'Meeting'}`,
      description: generateActivityDescription('meeting_created', 'meeting', meeting.job_title || 'Meeting', { meetingTitle: meeting.job_title }),
      category: 'interviews',
      severity: 'info',
      metadata: { meeting_id: meeting.id, candidate_email: meeting.candidate_email, job_id: meeting.job_id },
    });

    res.status(201).json({ meeting, message: 'Meeting scheduled successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/meetings/:id
 * Update meeting
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if meeting exists and belongs to user
    const { data: existingMeeting, error: fetchError } = await supabase
      .from('scheduled_meetings')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingMeeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Update only allowed fields
    const allowedUpdates = ['meeting_date', 'meeting_duration', 'meeting_link', 'meeting_status', 'ai_score'];
    const updateData = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    const { data: meeting, error } = await supabase
      .from('scheduled_meetings')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ meeting, message: 'Meeting updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/meetings/:id
 * Delete a meeting
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabase
      .from('scheduled_meetings')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
