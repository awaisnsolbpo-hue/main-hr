import Joi from 'joi';

export const createJobSchema = Joi.object({
  title: Joi.string().required().min(3).max(200),
  description: Joi.string().required().min(10),
  city: Joi.string().allow('').max(100),
  country: Joi.string().allow('').max(100),
  salary_min: Joi.number().positive().allow(null),
  salary_max: Joi.number().positive().allow(null),
  location_type: Joi.string().valid('hybrid', 'remote', 'onsite').allow(''),
  job_level: Joi.string().valid('entry', 'mid', 'senior', 'lead', 'exec').allow(''),
  close_date: Joi.date().iso().allow(null),
  questions: Joi.array().items(Joi.string()).allow(null),
  status: Joi.string().valid('active', 'draft', 'paused', 'closed').default('active'),
  linkedin_organization_id: Joi.string().allow('', null),
  post_to_linkedin: Joi.boolean(),
  // New fields for advanced job creation
  ats_criteria: Joi.object().allow(null),
  job_requirements: Joi.object().allow(null),
  ai_generated: Joi.boolean().default(false),
  published_platforms: Joi.array().items(Joi.string()).default(['internal']),
  location: Joi.string().allow('', null).max(200),
  community_post_flag: Joi.boolean().default(false),
  visible_to_applicants: Joi.boolean().default(true)
});

export const updateJobSchema = Joi.object({
  title: Joi.string().min(3).max(200),
  description: Joi.string().min(10),
  city: Joi.string().allow('').max(100),
  country: Joi.string().allow('').max(100),
  salary_min: Joi.number().positive().allow(null),
  salary_max: Joi.number().positive().allow(null),
  location_type: Joi.string().valid('hybrid', 'remote', 'onsite').allow(''),
  job_level: Joi.string().valid('entry', 'mid', 'senior', 'lead', 'exec').allow(''),
  close_date: Joi.date().iso().allow(null),
  questions: Joi.array().items(Joi.string()).allow(null),
  status: Joi.string().valid('active', 'draft', 'paused', 'closed'),
  // New fields for advanced job creation
  ats_criteria: Joi.object().allow(null),
  job_requirements: Joi.object().allow(null),
  ai_generated: Joi.boolean(),
  published_platforms: Joi.array().items(Joi.string()),
  location: Joi.string().allow('', null).max(200),
  community_post_flag: Joi.boolean(),
  visible_to_applicants: Joi.boolean()
}).min(1);

export const updateJobStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'draft', 'paused', 'closed').required()
});
