import express from 'express';
import { supabase } from '../config/supabase.js';
import Joi from 'joi';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// Validation schema for creating activity log
const createActivityLogSchema = Joi.object({
  action_type: Joi.string().required(),
  entity_type: Joi.string().required(),
  entity_id: Joi.string().required(),
  entity_name: Joi.string().allow('', null),
  description: Joi.string().required(),
  category: Joi.string().required(),
  severity: Joi.string().valid('info', 'warning', 'error', 'success').default('info'),
  metadata: Joi.object().allow(null),
});

/**
 * POST /api/activity-logs
 * Create a new activity log
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user profile for actor info
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    // Validate request body
    const { error: validationError, value } = createActivityLogSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    const activityData = {
      user_id: userId,
      company_id: userId, // Using user_id as company_id for now
      actor_name: profile?.full_name || 'System',
      actor_email: profile?.email || req.user.email || '',
      action_type: value.action_type,
      entity_type: value.entity_type,
      entity_id: value.entity_id,
      entity_name: value.entity_name || null,
      description: value.description,
      category: value.category,
      severity: value.severity,
      metadata: value.metadata || null,
    };

    const { data: activity, error } = await supabase
      .from('activity_logs')
      .insert(activityData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ activity, message: 'Activity logged successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/activity-logs
 * Get activity logs for authenticated user with pagination and total count
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 100, offset = 0, category, severity, entity_type, count_only } = req.query;

    // Get total count
    let countQuery = supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (category) {
      countQuery = countQuery.eq('category', category);
    }

    if (severity) {
      countQuery = countQuery.eq('severity', severity);
    }

    if (entity_type) {
      countQuery = countQuery.eq('entity_type', entity_type);
    }

    const { count, error: countError } = await countQuery;

    if (countError) throw countError;

    // If only count requested, return early
    if (count_only === 'true') {
      return res.json({ total: count || 0 });
    }

    // Fetch activity logs with pagination
    let query = supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (category) {
      query = query.eq('category', category);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (entity_type) {
      query = query.eq('entity_type', entity_type);
    }

    const { data: activities, error } = await query;

    if (error) throw error;

    res.json({ 
      activities: activities || [], 
      total: count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (activities?.length || 0) === parseInt(limit)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/activity-logs/recent
 * Get recent activities for dashboard (last 5)
 * Cached for 10 seconds for faster dashboard loading
 */
router.get('/recent', cacheMiddleware(10000), async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: activities, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    // Map to ActivityFeed format
    const mappedActivities = (activities || []).map(activity => ({
      id: activity.id,
      action_type: activity.action_type,
      entity_type: activity.entity_type,
      entity_name: activity.entity_name,
      description: activity.description,
      created_at: activity.created_at,
      actor_name: activity.actor_name,
      metadata: activity.metadata,
    }));

    res.json({ activities: mappedActivities });
  } catch (error) {
    next(error);
  }
});

export default router;

