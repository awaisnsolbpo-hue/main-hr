import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Get candidate profile by email only
router.get('/profile', async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Get the most recent candidate record for this email
    const { data, error } = await supabase
      .from('candidates')
      .select('id, first_name, last_name, full_name, email, phone, location, city, state, country, skills, experience_years, total_experience_months, summary, linkedin_url, github_url, portfolio_url, website_url, cv_file_url, created_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Profile fetch error:', error);
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'No candidate found with this email address' });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Get candidate applications with scores (by email only)
router.get('/applications', async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Get all applications for this candidate by email
    const { data: applications, error: appError } = await supabase
      .from('candidates')
      .select(`
        id,
        job_id,
        ats_score,
        ats_breakdown,
        status,
        interview_status,
        Stage,
        created_at,
        updated_at,
        jobs (
          id,
          title,
          description,
          status,
          city,
          country
        )
      `)
      .eq('email', email)
      .order('created_at', { ascending: false });

    if (appError) {
      console.error('Applications fetch error:', appError);
      throw appError;
    }

    if (!applications || applications.length === 0) {
      return res.json([]);
    }

    // Get job details and scores for each application
    const enrichedApps = await Promise.all(
      applications.map(async (app) => {
        // Get job details (already included in query, but fallback if needed)
        const job = app.jobs || null;

        // Get interview details (from qualified_for_final_interview)
        let interviewScore = 0;
        let interviewDetails = null;
        const { data: interviewRecord } = await supabase
          .from('qualified_for_final_interview')
          .select('ai_score, Score, interview_transcript, screen_recording_url, interview_recording_url, interview_status, interview_date, interview_duration_minutes, interview_feedback, interview_result, hire_recommendation, hire_confidence, client_custom_questions, ai_generated_questions')
          .eq('email', email)
          .eq('job_id', app.job_id)
          .maybeSingle();

        if (interviewRecord) {
          interviewScore = interviewRecord.ai_score || interviewRecord.Score || 0;
          interviewDetails = {
            score: interviewScore,
            transcript: interviewRecord.interview_transcript || interviewRecord.Transcript || null,
            screenRecordingUrl: interviewRecord.screen_recording_url || interviewRecord.Screen_recording || null,
            recordingUrl: interviewRecord.interview_recording_url || interviewRecord['Recording URL'] || null,
            status: interviewRecord.interview_status,
            date: interviewRecord.interview_date,
            duration: interviewRecord.interview_duration_minutes,
            feedback: interviewRecord.interview_feedback,
            result: interviewRecord.interview_result,
            hireRecommendation: interviewRecord.hire_recommendation,
            hireConfidence: interviewRecord.hire_confidence,
            clientQuestions: interviewRecord.client_custom_questions || interviewRecord['Question Ask by Client'] || null,
            aiGeneratedQuestions: interviewRecord.ai_generated_questions || interviewRecord['AI Generated Question'] || null,
          };
        }

        // Get MCQ test details for this specific application
        let mcqScore = 0;
        let mcqDetails = null;
        const { data: mcq } = await supabase
          .from('mcqs_test')
          .select('score, percentage, total_questions, correct_answers, wrong_answers, test_duration_minutes, created_at, recording_url')
          .eq('candidate_id', app.id)
          .eq('job_id', app.job_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (mcq) {
          mcqScore = mcq.percentage || mcq.score || 0;
          mcqDetails = {
            score: mcqScore,
            totalQuestions: mcq.total_questions,
            correctAnswers: mcq.correct_answers,
            wrongAnswers: mcq.wrong_answers,
            duration: mcq.test_duration_minutes,
            takenAt: mcq.created_at,
            recordingUrl: mcq.recording_url,
          };
        }

        // Get technical practical test details for this specific application
        let technicalScore = 0;
        let technicalDetails = null;
        const { data: technical } = await supabase
          .from('technical_practicals')
          .select('overall_score, code_quality_score, correctness_score, approach_score, communication_score, task_description, submission_url, feedback, created_at, completed_at')
          .eq('candidate_id', app.id)
          .eq('job_id', app.job_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (technical) {
          technicalScore = technical.overall_score || 0;
          technicalDetails = {
            overallScore: technicalScore,
            codeQualityScore: technical.code_quality_score,
            correctnessScore: technical.correctness_score,
            approachScore: technical.approach_score,
            communicationScore: technical.communication_score,
            taskDescription: technical.task_description,
            submissionUrl: technical.submission_url,
            feedback: technical.feedback,
            startedAt: technical.created_at,
            completedAt: technical.completed_at,
          };
        }

        // Calculate overall score (average of all scores)
        const scores = [
          app.ats_score || 0,
          interviewScore,
          mcqScore,
          technicalScore
        ].filter(s => s > 0);

        const overallScore = scores.length > 0
          ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
          : 0;

        // Determine stage from status
        const stage = app.interview_status || app.status || 'New';

        // Get next step based on current stage
        const nextStep = getNextStep(stage);

        return {
          id: app.id,
          job_id: app.job_id,
          job_title: job?.title || 'Unknown Job',
          job_description: job?.description || null,
          job_status: job?.status || null,
          job_location: job?.city && job?.country ? `${job.city}, ${job.country}` : (job?.city || job?.country || null),
          company: '', // company_name removed from jobs table
          status: app.status || 'new',
          stage: app.Stage || stage,
          applied_at: app.created_at,
          updated_at: app.updated_at,
          ats_score: app.ats_score ? Number(app.ats_score) : 0,
          ats_breakdown: app.ats_breakdown || null,
          ats_strength: app.ats_strength || null,
          ats_weakness: app.ats_Weekness || app.ats_weakness || null,
          ats_recommendation: app.ats_recommendation || null,
          interview_score: interviewScore,
          interview_details: interviewDetails,
          mcq_score: mcqScore,
          mcq_details: mcqDetails,
          technical_score: technicalScore,
          technical_details: technicalDetails,
          overall_score: overallScore,
          hire_recommendation: app.ats_breakdown?.hire_recommendation || app.ats_breakdown?.recommendation || interviewDetails?.hireRecommendation || '',
          next_step: nextStep,
        };
      })
    );

    res.json(enrichedApps);
  } catch (error) {
    next(error);
  }
});

// Get candidate scheduled meetings (by email only)
router.get('/meetings', async (req, res, next) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // First, get all candidate IDs for this email
    const { data: candidates } = await supabase
      .from('candidates')
      .select('id')
      .eq('email', email);

    const candidateIds = candidates?.map(c => c.id) || [];
    
    if (candidateIds.length === 0) {
      return res.json([]);
    }

    const meetings = [];

    // Get interview records from qualified_for_final_interview
    const { data: interviews } = await supabase
      .from('qualified_for_final_interview')
      .select(`
        id,
        email,
        interview_status,
        created_at,
        updated_at
      `)
      .eq('email', email);

    if (interviews && interviews.length > 0) {
      interviews.forEach((int) => {
        if (int.interview_status === 'Scheduled' || int.interview_status === 'Completed') {
          meetings.push({
            id: int.id,
            type: 'interview',
            job_title: 'Final Interview',
            scheduled_at: int.created_at,
            duration_minutes: 30,
            status: determineStatus(int.interview_status),
          });
        }
      });
    }

    // Get MCQ tests for all candidate IDs
    const { data: mcqs } = await supabase
      .from('mcqs_test')
      .select(`
        id,
        candidate_id,
        job_title,
        scheduled_at,
        time_limit_minutes,
        status,
        created_at
      `)
      .in('candidate_id', candidateIds);

    if (mcqs && mcqs.length > 0) {
      mcqs.forEach((mcq) => {
        meetings.push({
          id: mcq.id,
          type: 'mcq',
          job_title: mcq.job_title || 'MCQ Assessment',
          scheduled_at: mcq.scheduled_at || mcq.created_at,
          duration_minutes: mcq.time_limit_minutes || 15,
          status: determineStatus(mcq.status),
        });
      });
    }

    // Get technical practicals for all candidate IDs
    const { data: technicals } = await supabase
      .from('technical_practicals')
      .select(`
        id,
        candidate_id,
        task_title,
        scheduled_at,
        time_limit_minutes,
        status,
        created_at
      `)
      .in('candidate_id', candidateIds);

    if (technicals && technicals.length > 0) {
      technicals.forEach((tech) => {
        meetings.push({
          id: tech.id,
          type: 'technical',
          job_title: tech.task_title || 'Technical Practical',
          scheduled_at: tech.scheduled_at || tech.created_at,
          duration_minutes: tech.time_limit_minutes || 60,
          status: determineStatus(tech.status),
        });
      });
    }

    // Get scheduled meetings from scheduled_meetings table
    const { data: scheduledMeetings } = await supabase
      .from('scheduled_meetings')
      .select(`
        id,
        candidate_email,
        job_title,
        meeting_date,
        meeting_duration,
        meeting_status
      `)
      .eq('candidate_email', email);

    if (scheduledMeetings && scheduledMeetings.length > 0) {
      scheduledMeetings.forEach((meeting) => {
        meetings.push({
          id: meeting.id,
          type: 'interview',
          job_title: meeting.job_title || 'Interview',
          scheduled_at: meeting.meeting_date,
          duration_minutes: meeting.meeting_duration || 30,
          status: determineStatus(meeting.meeting_status || 'scheduled'),
        });
      });
    }

    // Sort by scheduled date (most recent first)
    meetings.sort((a, b) => {
      const dateA = new Date(a.scheduled_at || 0);
      const dateB = new Date(b.scheduled_at || 0);
      return dateB - dateA;
    });

    res.json(meetings);
  } catch (error) {
    next(error);
  }
});

// Helper functions
function getNextStep(stage) {
  const status = stage?.toLowerCase() || '';
  
  if (status.includes('new')) return 'CV Review';
  if (status.includes('reviewed') || status.includes('cv')) return 'Interview Scheduled';
  if (status.includes('interview scheduled')) return 'Interview';
  if (status.includes('interview completed') || status.includes('interview')) return 'MCQ Test';
  if (status.includes('mcq') && status.includes('completed')) return 'Technical Practical';
  if (status.includes('practical') && status.includes('completed')) return 'Final Review';
  if (status.includes('selected') || status.includes('hired')) return 'Offer';
  if (status.includes('rejected')) return 'Application Closed';
  
  return 'Pending';
}

function determineStatus(status) {
  if (!status) return 'cancelled';
  
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('scheduled') || statusLower.includes('pending') || statusLower === 'in_progress') {
    return 'upcoming';
  }
  if (statusLower.includes('completed') || statusLower.includes('submitted') || statusLower.includes('finished')) {
    return 'completed';
  }
  if (statusLower.includes('cancelled') || statusLower.includes('rejected')) {
    return 'cancelled';
  }
  
  return 'upcoming';
}

export default router;

