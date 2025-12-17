import { supabase } from '../config/supabase.js';

/**
 * Utility function to log activities automatically
 * This can be called from any route handler
 */
export async function logActivity({
  userId,
  actionType,
  entityType,
  entityId,
  entityName = null,
  description,
  category,
  severity = 'info',
  metadata = null,
}) {
  try {
    // Get user profile for actor info
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    // Map action type to valid database constraint value
    const validActionType = mapToValidActionType(actionType);

    const activityData = {
      user_id: userId,
      company_id: userId, // Using user_id as company_id
      actor_name: profile?.full_name || 'System',
      actor_email: profile?.email || '',
      action_type: validActionType, // Use mapped valid action type
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      description: description,
      category: category,
      severity: severity,
      metadata: metadata,
    };

    const { error } = await supabase
      .from('activity_logs')
      .insert(activityData);

    if (error) {
      console.error('Error logging activity:', error);
      // Don't throw - activity logging should not break main operations
    }
  } catch (error) {
    console.error('Error in activity logger:', error);
    // Don't throw - activity logging should not break main operations
  }
}

/**
 * Helper to generate activity descriptions
 */
/**
 * Map action types to valid database constraint values
 * The database likely has a check constraint that only allows specific action types
 */
export function mapToValidActionType(actionType) {
  // Map complex action types to simple valid ones
  const actionTypeMap = {
    // Job activities -> "created"
    'job_created': 'created',
    'job_updated': 'updated',
    'job_deleted': 'deleted',
    'job_status_changed': 'status_changed',
    'job_published': 'published',
    
    // Candidate activities
    'candidate_added': 'created',
    'candidate_updated': 'updated',
    'candidate_deleted': 'deleted',
    'candidate_moved': 'moved',
    'candidate_shortlisted': 'shortlisted',
    'candidate_qualified': 'qualified',
    'candidate_status_changed': 'status_changed',
    
    // Meeting activities
    'meeting_created': 'created',
    'meeting_updated': 'updated',
    'meeting_deleted': 'deleted',
    'meeting_completed': 'completed',
    
    // Interview activities
    'interview_scheduled': 'created',
    'interview_completed': 'completed',
    'interview_status_changed': 'status_changed',
    
    // Test activities
    'mcq_started': 'created',
    'mcq_completed': 'completed',
    'technical_started': 'created',
    'technical_completed': 'completed',
    
    // Profile activities
    'profile_updated': 'updated',
    
    // Application activities
    'application_received': 'created',
  };

  return actionTypeMap[actionType] || actionType;
}

export function generateActivityDescription(actionType, entityType, entityName, details = {}) {
  const descriptions = {
    // Job activities
    'job_created': `Created job: ${entityName}`,
    'job_updated': `Updated job: ${entityName}`,
    'job_deleted': `Deleted job: ${entityName}`,
    'job_status_changed': `Changed job status: ${entityName} → ${details.newStatus || 'updated'}`,
    'job_published': `Published job: ${entityName}`,
    
    // Candidate activities
    'candidate_added': `Added candidate: ${entityName || details.candidateName || 'New candidate'}`,
    'candidate_updated': `Updated candidate: ${entityName || details.candidateName || 'Candidate'}`,
    'candidate_deleted': `Deleted candidate: ${entityName || details.candidateName || 'Candidate'}`,
    'candidate_moved': `Moved candidate: ${entityName || details.candidateName || 'Candidate'} → ${details.destination || 'new stage'}`,
    'candidate_shortlisted': `Shortlisted candidate: ${entityName || details.candidateName || 'Candidate'}`,
    'candidate_qualified': `Qualified candidate: ${entityName || details.candidateName || 'Candidate'}`,
    'candidate_status_changed': `Changed candidate status: ${entityName || details.candidateName || 'Candidate'} → ${details.newStatus || 'updated'}`,
    
    // Meeting activities
    'meeting_created': `Scheduled meeting: ${entityName || details.meetingTitle || 'Meeting'}`,
    'meeting_updated': `Updated meeting: ${entityName || details.meetingTitle || 'Meeting'}`,
    'meeting_deleted': `Cancelled meeting: ${entityName || details.meetingTitle || 'Meeting'}`,
    'meeting_completed': `Completed meeting: ${entityName || details.meetingTitle || 'Meeting'}`,
    
    // Interview activities
    'interview_scheduled': `Scheduled interview: ${entityName || details.candidateName || 'Candidate'}`,
    'interview_completed': `Completed interview: ${entityName || details.candidateName || 'Candidate'}`,
    'interview_status_changed': `Changed interview status: ${entityName || details.candidateName || 'Candidate'}`,
    
    // Test activities
    'mcq_started': `Started MCQ test: ${entityName || details.candidateName || 'Candidate'}`,
    'mcq_completed': `Completed MCQ test: ${entityName || details.candidateName || 'Candidate'}`,
    'technical_started': `Started technical test: ${entityName || details.candidateName || 'Candidate'}`,
    'technical_completed': `Completed technical test: ${entityName || details.candidateName || 'Candidate'}`,
    
    // Profile activities
    'profile_updated': `Updated profile: ${entityName || 'Profile'}`,
    
    // Application activities
    'application_received': `Received application: ${entityName || details.candidateName || 'New application'}`,
  };

  return descriptions[actionType] || `${actionType}: ${entityName || entityType}`;
}

