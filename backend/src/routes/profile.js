import express from 'express';
import { supabase } from '../config/supabase.js';
import Joi from 'joi';
import { requireRole } from '../middleware/roleVerification.js';

const router = express.Router();

// Validation schema
const updateProfileSchema = Joi.object({
  full_name: Joi.string().allow('', null),
  company_name: Joi.string().allow('', null),
  company_description: Joi.string().allow('', null),
  company_website: Joi.string().uri().allow('', null),
  company_size: Joi.string().allow('', null),
  company_industry: Joi.string().allow('', null),
  company_founded_year: Joi.string().allow('', null),
  company_email: Joi.string().email().allow('', null),
  company_phone: Joi.string().allow('', null),
  company_address: Joi.string().allow('', null),
  company_city: Joi.string().allow('', null),
  company_country: Joi.string().allow('', null),
  company_linkedin_url: Joi.string().uri().allow('', null),
  company_instagram_url: Joi.string().uri().allow('', null),
  company_facebook_url: Joi.string().uri().allow('', null),
  privacy_policy_url: Joi.string().uri().allow('', null),
  profile_picture_url: Joi.string().uri().allow('', null),
});

/**
 * GET /api/profile
 * Get user profile (requires recruiter role)
 */
router.get('/', requireRole('recruiter'), async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found

    res.json({ profile: profile || null });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/profile
 * Update user profile (requires recruiter role)
 */
router.patch('/', requireRole('recruiter'), async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Validate request body
    const { error: validationError, value } = updateProfileSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    let profile;
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('profiles')
        .update(value)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      profile = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('profiles')
        .insert({ id: userId, ...value })
        .select()
        .single();

      if (error) throw error;
      profile = data;
    }

    res.json({ profile, message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

