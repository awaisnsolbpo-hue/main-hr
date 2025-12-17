import express from 'express';
import { supabase } from '../config/supabase.js';
import authMiddleware from '../middleware/auth.js';
import { cacheMiddleware } from '../middleware/cache.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createDiscussionSchema = Joi.object({
  title: Joi.string().required().min(3).max(200),
  content: Joi.string().required().min(10),
  category: Joi.string().valid('jobs', 'questions', 'general').default('general'),
});

const createReplySchema = Joi.object({
  content: Joi.string().required().min(1),
  parent_reply_id: Joi.string().uuid().allow(null),
});

/**
 * GET /api/community/posts
 * Get all community posts (jobs + discussions) with pagination
 */
router.get('/posts', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const category = req.query.category;
    const offset = (page - 1) * limit;

    // Get discussions
    let discussionsQuery = supabase
      .from('community_discussions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      discussionsQuery = discussionsQuery.eq('category', category);
    }

    const { data: discussions, error: discussionsError } = await discussionsQuery;

    if (discussionsError) throw discussionsError;

    // Get user profiles for discussions
    const discussionUserIds = [...new Set((discussions || []).map(d => d.user_id))];
    const { data: discussionProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', discussionUserIds);

    const profilesMap = new Map((discussionProfiles || []).map(p => [p.id, p]));

    // Attach user info to discussions
    const discussionsWithUsers = (discussions || []).map(d => ({
      ...d,
      user: profilesMap.get(d.user_id) || { id: d.user_id, full_name: null, email: null },
    }));

    // Get community jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('community_post_flag', true)
      .eq('visible_to_applicants', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (jobsError) throw jobsError;

    // Get user profiles for jobs
    const jobUserIds = [...new Set((jobs || []).map(j => j.user_id))];
    const { data: jobProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, company_name')
      .in('id', jobUserIds);

    const jobProfilesMap = new Map((jobProfiles || []).map(p => [p.id, p]));

    // Attach user info to jobs
    const jobsWithUsers = (jobs || []).map(j => ({
      ...j,
      user: jobProfilesMap.get(j.user_id) || { id: j.user_id, full_name: null, email: null, company_name: null },
    }));

    // Combine and sort by date
    const allPosts = [
      ...discussionsWithUsers.map(d => ({ ...d, type: 'discussion' })),
      ...jobsWithUsers.map(j => ({ ...j, type: 'job' })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      posts: allPosts.slice(0, limit),
      pagination: {
        page,
        limit,
        total: allPosts.length,
        hasMore: allPosts.length > offset + limit,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/community/jobs
 * Get jobs posted to community
 */
router.get('/jobs', cacheMiddleware(30000), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data: jobs, error, count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('community_post_flag', true)
      .eq('visible_to_applicants', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Get user profiles for jobs
    const jobUserIds = [...new Set((jobs || []).map(j => j.user_id))];
    const { data: jobProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, company_name')
      .in('id', jobUserIds);

    const jobProfilesMap = new Map((jobProfiles || []).map(p => [p.id, p]));

    // Attach user info to jobs
    const jobsWithUsers = (jobs || []).map(j => ({
      ...j,
      user: jobProfilesMap.get(j.user_id) || { id: j.user_id, full_name: null, email: null, company_name: null },
    }));

    res.json({
      jobs: jobsWithUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/community/discussions
 * Get discussion threads with pagination
 */
router.get('/discussions', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const category = req.query.category;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('community_discussions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    const { data: discussions, error, count } = await query;

    if (error) throw error;

    // Get user profiles for discussions
    const discussionUserIds = [...new Set((discussions || []).map(d => d.user_id))];
    const { data: discussionProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', discussionUserIds);

    const profilesMap = new Map((discussionProfiles || []).map(p => [p.id, p]));

    // Attach user info to discussions
    const discussionsWithUsers = (discussions || []).map(d => ({
      ...d,
      user: profilesMap.get(d.user_id) || { id: d.user_id, full_name: null, email: null },
    }));

    res.json({
      discussions: discussionsWithUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/community/discussions/:id
 * Get single discussion with replies
 */
router.get('/discussions/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get discussion
    const { data: discussion, error: discussionError } = await supabase
      .from('community_discussions')
      .select('*')
      .eq('id', id)
      .single();

    if (discussionError) throw discussionError;
    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    // Get user profile for discussion
    const { data: discussionProfile } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', discussion.user_id)
      .single();

    const discussionWithUser = {
      ...discussion,
      user: discussionProfile || { id: discussion.user_id, full_name: null, email: null },
    };

    // Get replies
    const { data: replies, error: repliesError } = await supabase
      .from('community_replies')
      .select('*')
      .eq('discussion_id', id)
      .order('created_at', { ascending: true });

    if (repliesError) throw repliesError;

    // Get user profiles for replies
    const replyUserIds = [...new Set((replies || []).map(r => r.user_id))];
    const { data: replyProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', replyUserIds);

    const replyProfilesMap = new Map((replyProfiles || []).map(p => [p.id, p]));

    // Attach user info to replies
    const repliesWithUsers = (replies || []).map(r => ({
      ...r,
      user: replyProfilesMap.get(r.user_id) || { id: r.user_id, full_name: null, email: null },
    }));

    if (repliesError) throw repliesError;

    res.json({
      discussion: discussionWithUser,
      replies: repliesWithUsers,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/community/discussions
 * Create new discussion (requires auth)
 */
router.post('/discussions', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { error: validationError, value } = createDiscussionSchema.validate(req.body);

    if (validationError) {
      return res.status(400).json({
        error: 'Validation error',
        details: validationError.details.map(d => d.message),
      });
    }

    const { data: discussion, error } = await supabase
      .from('community_discussions')
      .insert({
        user_id: userId,
        title: value.title,
        content: value.content,
        category: value.category,
      })
      .select('*')
      .single();

    if (error) throw error;

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', userId)
      .single();

    const discussionWithUser = {
      ...discussion,
      user: profile || { id: userId, full_name: null, email: null },
    };

    res.status(201).json({ discussion: discussionWithUser });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/community/discussions/:id/replies
 * Add reply to discussion (requires auth)
 */
router.post('/discussions/:id/replies', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { error: validationError, value } = createReplySchema.validate(req.body);

    if (validationError) {
      return res.status(400).json({
        error: 'Validation error',
        details: validationError.details.map(d => d.message),
      });
    }

    // Verify discussion exists
    const { data: discussion, error: discussionError } = await supabase
      .from('community_discussions')
      .select('id')
      .eq('id', id)
      .single();

    if (discussionError || !discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }

    const { data: reply, error } = await supabase
      .from('community_replies')
      .insert({
        discussion_id: id,
        user_id: userId,
        content: value.content,
        parent_reply_id: value.parent_reply_id || null,
      })
      .select('*')
      .single();

    if (error) throw error;

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', userId)
      .single();

    const replyWithUser = {
      ...reply,
      user: profile || { id: userId, full_name: null, email: null },
    };

    res.status(201).json({ reply: replyWithUser });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/community/posts/:id/like
 * Like a post (discussion or reply) (requires auth)
 */
router.post('/posts/:id/like', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { target_type } = req.body; // 'discussion' or 'reply'

    if (!target_type || !['discussion', 'reply'].includes(target_type)) {
      return res.status(400).json({ error: 'Invalid target_type. Must be "discussion" or "reply"' });
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('community_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('target_type', target_type)
      .eq('target_id', id)
      .single();

    if (existingLike) {
      return res.status(400).json({ error: 'Already liked' });
    }

    const { data: like, error } = await supabase
      .from('community_likes')
      .insert({
        user_id: userId,
        target_type,
        target_id: id,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ like, message: 'Liked successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/community/posts/:id/like
 * Unlike a post (requires auth)
 */
router.delete('/posts/:id/like', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { target_type } = req.body;

    if (!target_type || !['discussion', 'reply'].includes(target_type)) {
      return res.status(400).json({ error: 'Invalid target_type' });
    }

    const { error } = await supabase
      .from('community_likes')
      .delete()
      .eq('user_id', userId)
      .eq('target_type', target_type)
      .eq('target_id', id);

    if (error) throw error;

    res.json({ message: 'Unliked successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

