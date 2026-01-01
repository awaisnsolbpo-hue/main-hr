import express from 'express';
import { supabase } from '../config/supabase.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

/**
 * GET /api/dashboard/metrics
 * Get dashboard metrics for authenticated user
 * Cached for 15 seconds for faster dashboard loading
 */
router.get('/metrics', cacheMiddleware(15000), async (req, res, next) => {
  try {
    const userId = req.user.id;

    // 1. COUNT ACTIVE JOBS
    const { count: activeJobsCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');

    // 2. COUNT LINKEDIN JOBS
    const { count: linkedInJobsCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('linkedin_post_id', 'is', null);

    // 3. COUNT TOTAL UNIQUE CANDIDATES
    const { data: candidateData } = await supabase
      .from('candidates')
      .select('email, created_at')
      .eq('user_id', userId);

    const candidatesCount = candidateData?.length || 0;

    // 4. COUNT INITIAL INTERVIEW QUALIFIED
    const { count: qualifiedCount } = await supabase
      .from('qualified_for_final_interview')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 5. COUNT SCHEDULED INTERVIEWS (upcoming only)
    const now = new Date();
    const { data: upcomingMeetingsData } = await supabase
      .from('scheduled_meetings')
      .select('*')
      .eq('user_id', userId)
      .gte('meeting_date', now.toISOString());

    const scheduledMeetingsCount = upcomingMeetingsData?.filter(meeting => {
      const status = meeting.meeting_status?.toLowerCase();
      return status !== 'completed' && status !== 'cancelled';
    }).length || 0;

    // 6. COUNT SHORTLISTED CANDIDATES
    const { count: shortlistedCount } = await supabase
      .from('Shortlisted_candidates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 7. COUNT MCQ TESTS (filter through jobs)
    // Get user's job IDs first
    const { data: userJobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('user_id', userId);

    const jobIds = (userJobs || []).map(j => j.id);

    let mcqTotalCount = 0;
    let mcqCandidatesCount = 0; // Unique candidates who took MCQ tests
    let mcqCompletedCount = 0;
    let mcqPassedData = [];

    if (jobIds.length > 0) {
      const { count: mcqTotal } = await supabase
        .from('mcqs_test')
        .select('*', { count: 'exact', head: true })
        .in('job_id', jobIds);

      // Count unique candidates who took MCQ tests
      const { data: mcqCandidates } = await supabase
        .from('mcqs_test')
        .select('candidate_id, candidate_email')
        .in('job_id', jobIds);

      const { count: mcqCompleted } = await supabase
        .from('mcqs_test')
        .select('*', { count: 'exact', head: true })
        .in('job_id', jobIds)
        .eq('status', 'completed');

      const { data: mcqPassed } = await supabase
        .from('mcqs_test')
        .select('passed')
        .in('job_id', jobIds)
        .eq('status', 'completed');

      mcqTotalCount = mcqTotal || 0;
      // Count unique candidates by candidate_id or candidate_email
      if (mcqCandidates && mcqCandidates.length > 0) {
        const uniqueCandidates = new Set();
        mcqCandidates.forEach(test => {
          if (test.candidate_id) uniqueCandidates.add(test.candidate_id);
          else if (test.candidate_email) uniqueCandidates.add(test.candidate_email);
        });
        mcqCandidatesCount = uniqueCandidates.size;
      }
      mcqCompletedCount = mcqCompleted || 0;
      mcqPassedData = mcqPassed || [];
    }

    const mcqPassedCount = mcqPassedData.filter(m => m.passed === true).length;
    const mcqPassRate = mcqCompletedCount > 0 
      ? Math.round((mcqPassedCount / mcqCompletedCount) * 100)
      : 0;

    // 8. COUNT TECHNICAL TESTS (filter through jobs - jobIds already fetched above)

    let technicalTotalCount = 0;
    let technicalCandidatesCount = 0; // Unique candidates who took Technical tests
    let technicalCompletedCount = 0;
    let technicalPassedData = [];

    if (jobIds.length > 0) {
      const { count: techTotal } = await supabase
        .from('technical_practicals')
        .select('*', { count: 'exact', head: true })
        .in('job_id', jobIds);

      // Count unique candidates who took Technical tests
      const { data: techCandidates } = await supabase
        .from('technical_practicals')
        .select('candidate_id, candidate_email')
        .in('job_id', jobIds);

      const { count: techCompleted } = await supabase
        .from('technical_practicals')
        .select('*', { count: 'exact', head: true })
        .in('job_id', jobIds)
        .eq('status', 'completed');

      const { data: techPassed } = await supabase
        .from('technical_practicals')
        .select('overall_score, passing_score')
        .in('job_id', jobIds)
        .eq('status', 'completed');

      technicalTotalCount = techTotal || 0;
      // Count unique candidates by candidate_id or candidate_email
      if (techCandidates && techCandidates.length > 0) {
        const uniqueCandidates = new Set();
        techCandidates.forEach(test => {
          if (test.candidate_id) uniqueCandidates.add(test.candidate_id);
          else if (test.candidate_email) uniqueCandidates.add(test.candidate_email);
        });
        technicalCandidatesCount = uniqueCandidates.size;
      }
      technicalCompletedCount = techCompleted || 0;
      technicalPassedData = techPassed || [];
    }

    const technicalPassedCount = technicalPassedData.filter(t => 
      t.overall_score && t.passing_score && t.overall_score >= t.passing_score
    ).length;
    const technicalPassRate = technicalCompletedCount > 0
      ? Math.round((technicalPassedCount / technicalCompletedCount) * 100)
      : 0;

    // 9. CALCULATE SUCCESS RATE
    const successRate = candidatesCount > 0 && shortlistedCount
      ? Math.round((shortlistedCount / candidatesCount) * 100)
      : 0;

    const metrics = {
      activeJobs: activeJobsCount ?? null,
      linkedInJobs: linkedInJobsCount ?? null,
      totalCandidates: candidatesCount,
      initialInterviewQualified: qualifiedCount ?? null,
      scheduledInterviews: scheduledMeetingsCount,
      shortlistedCandidates: shortlistedCount ?? null,
      successRate: successRate ?? null,
      mcqTests: {
        total: mcqTotalCount ?? null,
        candidates: mcqCandidatesCount ?? null, // Unique candidates who took the test
        completed: mcqCompletedCount ?? null,
        passed: mcqPassedCount ?? null,
        passRate: mcqPassRate ?? null,
      },
      technicalTests: {
        total: technicalTotalCount ?? null,
        candidates: technicalCandidatesCount ?? null, // Unique candidates who took the test
        completed: technicalCompletedCount ?? null,
        passed: technicalPassedCount ?? null,
        passRate: technicalPassRate ?? null,
      },
    };

    res.json({ metrics });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/upcoming-meetings
 * Get upcoming meetings for next 7 days
 */
router.get('/upcoming-meetings', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    const { data: meetings, error } = await supabase
      .from('scheduled_meetings')
      .select('*')
      .eq('user_id', userId)
      .gte('meeting_date', now.toISOString())
      .lte('meeting_date', nextWeek.toISOString())
      .order('meeting_date', { ascending: true })
      .limit(3);

    if (error) throw error;

    const filtered = (meetings || []).filter(meeting => {
      const status = meeting.meeting_status?.toLowerCase();
      return status !== 'completed' && status !== 'cancelled';
    });

    res.json({ meetings: filtered });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/dashboard/recent-activities
 * Get recent activities from activity_logs table
 * Cached for 10 seconds
 */
router.get('/recent-activities', cacheMiddleware(10000), async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get recent activities from activity_logs table
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

/**
 * GET /api/dashboard/pipeline-funnel
 * Get pipeline funnel data showing candidate flow through stages
 * Cached for 15 seconds
 */
router.get('/pipeline-funnel', cacheMiddleware(15000), async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user's job IDs for filtering
    const { data: userJobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('user_id', userId);

    const jobIds = (userJobs || []).map(j => j.id);

    // Get counts from each stage
    const queries = [
      supabase
        .from('candidates')
        .select('email', { count: 'exact', head: true })
        .eq('user_id', userId),
    ];

    // Add MCQ and Technical queries if we have job IDs
    if (jobIds.length > 0) {
      queries.push(
        supabase
          .from('mcqs_test')
          .select('candidate_email', { count: 'exact', head: true })
          .in('job_id', jobIds),
        supabase
          .from('technical_practicals')
          .select('candidate_email', { count: 'exact', head: true })
          .in('job_id', jobIds)
      );
    } else {
      queries.push(
        Promise.resolve({ count: 0, error: null }),
        Promise.resolve({ count: 0, error: null })
      );
    }

    // Add Final Interview and Shortlisted queries
    queries.push(
      supabase
        .from('qualified_for_final_interview')
        .select('email', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('Shortlisted_candidates')
        .select('email', { count: 'exact', head: true })
        .eq('user_id', userId)
    );

    const [applicantsRes, mcqRes, technicalRes, finalRes, shortlistedRes] = await Promise.all(queries);

    const funnel = {
      applied: applicantsRes.count ?? null,
      mcq: mcqRes.count ?? null,
      technical: technicalRes.count ?? null,
      finalInterview: finalRes.count ?? null,
      shortlisted: shortlistedRes.count ?? null,
    };

    res.json({ funnel });
  } catch (error) {
    next(error);
  }
});

export default router;
