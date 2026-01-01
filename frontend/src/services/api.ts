import { supabase } from '@/integrations/supabase/client';
import { env } from '@/config/env';

const API_BASE_URL = env.VITE_API_BASE_URL;

/**
 * Get authorization token from Supabase
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return session?.access_token || null;
  } catch (err) {
    console.error('Unexpected error getting auth token:', err);
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Handle rate limiting (429) gracefully
    if (response.status === 429) {
      throw new Error('Rate limit reached. Please wait a moment and try again.');
    }
    
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Jobs API
export const jobsApi = {
  getAll: () => apiRequest<{ jobs: any[] }>('/jobs'),

  getById: (id: string) => apiRequest<{ job: any }>(`/jobs/${id}`),

  generate: (jobTitle: string, location?: { city?: string; country?: string }) => apiRequest<{ job_details: any; requirements: any }>('/jobs/generate', {
    method: 'POST',
    body: JSON.stringify({ 
      job_title: jobTitle,
      user_city: location?.city,
      user_country: location?.country,
    }),
  }),

  create: (jobData: any) => apiRequest<{ job: any; message: string }>('/jobs', {
    method: 'POST',
    body: JSON.stringify(jobData),
  }),

  update: (id: string, jobData: any) => apiRequest<{ job: any; message: string }>(`/jobs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(jobData),
  }),

  updateStatus: (id: string, status: string) => apiRequest<{ job: any; message: string }>(`/jobs/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  delete: (id: string) => apiRequest<{ message: string }>(`/jobs/${id}`, {
    method: 'DELETE',
  }),
};

// Candidates API
export const candidatesApi = {
  getAll: (params?: { job_id?: string; status?: string }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiRequest<{ candidates: any[] }>(`/candidates${queryParams ? `?${queryParams}` : ''}`);
  },

  getById: (id: string) => apiRequest<{ candidate: any }>(`/candidates/${id}`),

  create: (candidateData: any) => apiRequest<{ candidate: any; message: string }>('/candidates', {
    method: 'POST',
    body: JSON.stringify(candidateData),
  }),

  update: (id: string, candidateData: any) => apiRequest<{ candidate: any; message: string }>(`/candidates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(candidateData),
  }),

  delete: (id: string) => apiRequest<{ message: string }>(`/candidates/${id}`, {
    method: 'DELETE',
  }),

  getShortlisted: () => apiRequest<{ candidates: any[] }>('/candidates/status/shortlisted'),

  getQualified: () => apiRequest<{ candidates: any[] }>('/candidates/status/qualified'),

  move: (id: string, destination: 'qualified' | 'shortlisted') => apiRequest<{ candidate: any; message: string }>(`/candidates/${id}/move`, {
    method: 'POST',
    body: JSON.stringify({ destination }),
  }),

  updateShortlisted: (id: string, candidateData: any) => apiRequest<{ candidate: any; message: string }>(`/candidates/shortlisted/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(candidateData),
  }),

  deleteShortlisted: (id: string) => apiRequest<{ message: string }>(`/candidates/shortlisted/${id}`, {
    method: 'DELETE',
  }),

  analyzeAndShortlist: (params?: { job_id?: string; candidate_ids?: string[] }) => {
    const body: any = {};
    if (params?.job_id) body.job_id = params.job_id;
    if (params?.candidate_ids) body.candidate_ids = params.candidate_ids;
    
    return apiRequest<{ 
      message: string; 
      analyzed: number; 
      candidates: any[]; 
      errors?: any[] 
    }>('/candidates/analyze-and-shortlist', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getShortlistedFullDetails: (id: string) => apiRequest<{
    candidate: any;
    shortlisted: any;
    mcqTest: any;
    technicalTest: any;
    interviewRecord: any;
    job: any;
  }>(`/candidates/shortlisted/${id}/full-details`),
};

// Meetings API
export const meetingsApi = {
  getAll: (params?: { upcoming?: boolean; job_id?: string }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiRequest<{ meetings: any[] }>(`/meetings${queryParams ? `?${queryParams}` : ''}`);
  },

  getById: (id: string) => apiRequest<{ meeting: any }>(`/meetings/${id}`),

  create: (meetingData: any) => apiRequest<{ meeting: any; message: string }>('/meetings', {
    method: 'POST',
    body: JSON.stringify(meetingData),
  }),

  update: (id: string, meetingData: any) => apiRequest<{ meeting: any; message: string }>(`/meetings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(meetingData),
  }),

  delete: (id: string) => apiRequest<{ message: string }>(`/meetings/${id}`, {
    method: 'DELETE',
  }),
};

// Dashboard API
export const dashboardApi = {
  getMetrics: () => apiRequest<{ metrics: any }>('/dashboard/metrics'),

  getUpcomingMeetings: () => apiRequest<{ meetings: any[] }>('/dashboard/upcoming-meetings'),

  getRecentActivities: () => apiRequest<{ activities: any[] }>('/dashboard/recent-activities'),

  getPipelineFunnel: () => apiRequest<{ funnel: any }>('/dashboard/pipeline-funnel'),
};

// Activity Logs API
export const activityLogsApi = {
  getAll: (params?: { limit?: number; offset?: number; category?: string; severity?: string; entity_type?: string }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiRequest<{ 
      activities: any[]; 
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    }>(`/activity-logs${queryParams ? `?${queryParams}` : ''}`);
  },

  getTotalCount: () => {
    return apiRequest<{ total: number }>('/activity-logs?count_only=true');
  },

  getRecent: () => apiRequest<{ activities: any[] }>('/activity-logs/recent'),

  create: (activityData: any) => apiRequest<{ activity: any; message: string }>('/activity-logs', {
    method: 'POST',
    body: JSON.stringify(activityData),
  }),
};

/**
 * Make public API request (no auth required)
 */
async function publicApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Don't set Content-Type for FormData - let browser set it with boundary
  const isFormData = options.body instanceof FormData;
  const headers = isFormData
    ? { ...options.headers }
    : {
        'Content-Type': 'application/json',
        ...options.headers,
      };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Handle rate limiting (429) gracefully
    if (response.status === 429) {
      throw new Error('Rate limit reached. Please wait a moment and try again.');
    }
    
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Make authenticated file upload request (handles FormData correctly)
 */
async function uploadRequest<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Don't set Content-Type - let browser set it with FormData boundary
    },
    body: formData,
  });

  if (!response.ok) {
    // Handle rate limiting (429) gracefully
    if (response.status === 429) {
      throw new Error('Rate limit reached. Please wait a moment and try again.');
    }
    
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Auth API (public endpoints - no auth required)
export const authApi = {
  signupRecruiter: async (data: {
    email: string;
    password: string;
    fullName: string;
    company: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup/recruiter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Signup failed' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  signupApplicant: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    profession: string;
    industry?: string;
    experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
    bio?: string;
    location?: string;
    city?: string;
    country?: string;
    skills?: string[];
    cvUrl?: string;
    cvFileName?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup/applicant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Signup failed' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Set session in Supabase client
    if (data.session) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
      
      if (sessionError) {
        console.error('Error setting session:', sessionError);
      }
    }

    return data;
  },

  loginRecruiter: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/recruiter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Set session in Supabase client
    if (data.session && data.session.access_token && data.session.refresh_token) {
      try {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        
        if (sessionError) {
          console.error('Error setting session:', sessionError);
          // Don't throw - still return data even if session setting fails
          // The session might still be usable
        } else {
          // Verify session was set by getting it immediately
          const { data: { session: verifySession } } = await supabase.auth.getSession();
          if (!verifySession) {
            console.warn('Session was set but could not be verified immediately');
          }
        }
      } catch (err) {
        console.error('Unexpected error setting Supabase session:', err);
        // Don't throw - still return data
      }
    }

    // Always return data, even if session setting had issues
    return data;
  },

  loginApplicant: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/applicant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Set session in Supabase client
    if (data.session && data.session.access_token && data.session.refresh_token) {
      try {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        
        if (sessionError) {
          console.error('Error setting session:', sessionError);
          // Don't throw - still return data even if session setting fails
          // The session might still be usable
        } else {
          // Verify session was set by getting it immediately
          const { data: { session: verifySession } } = await supabase.auth.getSession();
          if (!verifySession) {
            console.warn('Session was set but could not be verified immediately');
          }
        }
      } catch (err) {
        console.error('Unexpected error setting Supabase session:', err);
        // Don't throw - still return data
      }
    }

    // Always return data, even if session setting had issues
    return data;
  },

  getMe: () => apiRequest<{ 
    user: any; 
    role: 'recruiter' | 'applicant' | null;
    recruiterProfile: any | null;
    applicantProfile: any | null;
  }>('/auth/me'),
};

// Profile API
export const profileApi = {
  get: () => apiRequest<{ profile: any }>('/profile'),

  update: (profileData: any) => apiRequest<{ profile: any; message: string }>('/profile', {
    method: 'PATCH',
    body: JSON.stringify(profileData),
  }),
};

// Storage API
export const storageApi = {
  upload: (file: File, bucket: string, path?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    if (path) {
      formData.append('path', path);
    }
    return uploadRequest<{ path: string; publicUrl: string; message: string }>('/storage/upload', formData);
  },

  delete: (bucket: string, path: string) => apiRequest<{ message: string }>('/storage/delete', {
    method: 'DELETE',
    body: JSON.stringify({ bucket, path }),
  }),
};

// Public API (no auth required)
export const publicApi = {
  getJob: (jobId: string) => publicApiRequest<{ job: any; profile: any }>(`/public/job/${jobId}`),

  getJobLink: (jobId: string) => publicApiRequest<{ link: any }>(`/public/job/${jobId}/link`),

  apply: (applicationData: any) => publicApiRequest<{ application: any; message: string }>('/public/apply', {
    method: 'POST',
    body: JSON.stringify(applicationData),
  }),

  checkApplication: (jobId: string, email: string) => {
    const queryParams = new URLSearchParams({ job_id: jobId, email }).toString();
    return publicApiRequest<{ hasApplied: boolean }>(`/public/check-application?${queryParams}`);
  },

  getUploadLink: (linkCode: string) => publicApiRequest<{ link: any; expired?: boolean }>(`/public/upload-link/${linkCode}`),

  uploadCandidate: (linkCode: string, candidateData: any) => publicApiRequest<{ candidate: any; message: string }>('/public/upload-candidate', {
    method: 'POST',
    body: JSON.stringify({ linkCode, candidateData }),
  }),

  uploadCandidateWithFile: (formData: FormData) => {
    // Don't set Content-Type for FormData - let browser set it with boundary
    return publicApiRequest<{ success: boolean; file: any; message: string; linkExpired?: boolean }>('/public/upload-candidate', {
      method: 'POST',
      body: formData,
    });
  },

  getInterviewCandidate: (email: string, candidateId?: string) => {
    const queryParams = new URLSearchParams({ email });
    if (candidateId) queryParams.append('candidate_id', candidateId);
    return publicApiRequest<{ candidates: any[] }>(`/public/interview-candidate?${queryParams.toString()}`);
  },

  getQualifiedInterviewCandidate: (email: string, candidateId: string) => {
    const queryParams = new URLSearchParams({ 
      email, 
      candidate_id: candidateId 
    });
    return publicApiRequest<{ interviews: any[] }>(`/public/qualified-interview-candidate?${queryParams.toString()}`);
  },

  getTechnicalPractical: (email: string, jobId: string) => {
    const queryParams = new URLSearchParams({ email, job_id: jobId });
    return publicApiRequest<any>(`/public/technical-practicals?${queryParams.toString()}`);
  },

  startPracticalTest: (taskId: string) => {
    return publicApiRequest<any>(`/public/technical-practicals/${taskId}/start`, {
      method: 'PATCH',
    });
  },

  submitPracticalTest: (taskId: string, submissionData: any) => {
    return publicApiRequest<any>(`/public/technical-practicals/${taskId}/submit`, {
      method: 'PATCH',
      body: JSON.stringify(submissionData),
    });
  },

  uploadPracticalTestVideo: (file: File, bucket: string, path?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    if (path) formData.append('path', path);

    return publicApiRequest<{ path: string; publicUrl: string; message: string }>('/public/practical-test/upload', {
      method: 'POST',
      body: formData,
    });
  },

  uploadMCQRecording: (file: File, candidateEmail: string, candidateId?: string, jobId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('candidate_email', candidateEmail);
    if (candidateId) formData.append('candidate_id', candidateId);
    if (jobId) formData.append('job_id', jobId);

    return publicApiRequest<{ path: string; publicUrl: string; message: string }>('/public/mcq-recording/upload', {
      method: 'POST',
      body: formData,
    });
  },

  updateInterviewStatusPublic: (id: string, status: string) => publicApiRequest<{ candidate: any; message: string }>(`/public/interview/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ interview_status: status }),
  }),

  updateInterviewRecordingPublic: (id: string, recordingData: { Screen_recording?: string; Transcript?: string; screen_recording_url?: string; interview_transcript?: string }) => publicApiRequest<{ candidate: any; message: string }>(`/public/interview/${id}/recording`, {
    method: 'PATCH',
    body: JSON.stringify(recordingData),
  }),

  createDemoBooking: (bookingData: any) => publicApiRequest<{ booking: any; message: string }>('/public/demo-booking', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  }),

  // MCQ Test Results
  saveMCQTestResults: (testData: any) => publicApiRequest<{ test: any; message: string }>('/public/mcq-tests', {
    method: 'POST',
    body: JSON.stringify(testData),
  }),

  updateCandidateStatus: (candidateId: string, status: string) => publicApiRequest<{ candidate: any; message: string }>(`/public/candidates/${candidateId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  getJobDetails: (jobId: string) => publicApiRequest<{ job: any }>(`/public/job/${jobId}`),

  // Candidate Portal
  getCandidateProfile: (email: string, candidateId?: string) => {
    const queryParams = new URLSearchParams({ email });
    if (candidateId) {
      queryParams.append('candidate_id', candidateId);
    }
    return publicApiRequest<any>(`/public/candidates/profile?${queryParams.toString()}`);
  },

  getCandidateApplications: (email: string, candidateId?: string) => {
    const queryParams = new URLSearchParams({ email });
    if (candidateId) {
      queryParams.append('candidate_id', candidateId);
    }
    return publicApiRequest<any[]>(`/public/candidates/applications?${queryParams.toString()}`);
  },

  getCandidateMeetings: (email: string, candidateId?: string) => {
    const queryParams = new URLSearchParams({ email });
    if (candidateId) {
      queryParams.append('candidate_id', candidateId);
    }
    return publicApiRequest<any[]>(`/public/candidates/meetings?${queryParams.toString()}`);
  },

  sendChatMessage: (message: string, conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>, sessionId?: string, userId?: string | null) => 
    publicApiRequest<{ response: string; message: string; session_id?: string }>('/public/chatbot', {
      method: 'POST',
      body: JSON.stringify({ message, conversationHistory, session_id: sessionId, user_id: userId || undefined }),
    }),
  
  getChatHistory: (sessionId: string, userId?: string | null) => {
    const queryParams = new URLSearchParams({ session_id: sessionId });
    if (userId) {
      queryParams.append('user_id', userId);
    }
    return publicApiRequest<{ messages: Array<{ id: string; session_id: string; user_id: string | null; role: string; message: string; created_at: string }>; session_id: string }>(`/public/chatbot/history/${sessionId}?${queryParams.toString()}`);
  },
};

// Interviews API
export const interviewsApi = {
  getQualified: () => apiRequest<{ candidates: any[] }>('/interviews/qualified'),

  getQualifiedById: (id: string) => apiRequest<{ candidate: any }>(`/interviews/qualified/${id}`),

  updateInterviewStatus: (id: string, status: string) => apiRequest<{ candidate: any; message: string }>(`/interviews/qualified/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ interview_status: status }),
  }),

  updateRecording: (id: string, recordingData: { recording_url?: string; Screen_recording?: string; transcript?: string; Transcript?: string; ai_score?: number }) => apiRequest<{ candidate: any; message: string }>(`/interviews/qualified/${id}/recording`, {
    method: 'PATCH',
    body: JSON.stringify(recordingData),
  }),

  getScheduled: (upcoming?: boolean) => {
    const queryParams = upcoming ? '?upcoming=true' : '';
    return apiRequest<{ meetings: any[] }>(`/interviews/scheduled${queryParams}`);
  },

  getInitialQualified: () => apiRequest<{ candidates: any[] }>('/interviews/initial-qualified'),
};

// VAPI API
export const vapiApi = {
  getConfig: () => publicApiRequest<{ publicKey: string }>('/vapi/config'),
};

// Community API
export const communityApi = {
  getPosts: (params?: { page?: number; limit?: number; category?: string }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiRequest<{ posts: any[]; pagination: any }>(`/community/posts${queryParams ? `?${queryParams}` : ''}`);
  },

  getJobs: (params?: { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiRequest<{ jobs: any[]; pagination: any }>(`/community/jobs${queryParams ? `?${queryParams}` : ''}`);
  },

  getDiscussions: (params?: { page?: number; limit?: number; category?: string }) => {
    const queryParams = new URLSearchParams(params as any).toString();
    return apiRequest<{ discussions: any[]; pagination: any }>(`/community/discussions${queryParams ? `?${queryParams}` : ''}`);
  },

  getDiscussionById: (id: string) => apiRequest<{ discussion: any; replies: any[] }>(`/community/discussions/${id}`),

  createDiscussion: (discussionData: { title: string; content: string; category?: string }) => 
    apiRequest<{ discussion: any }>('/community/discussions', {
      method: 'POST',
      body: JSON.stringify(discussionData),
    }),

  createReply: (discussionId: string, replyData: { content: string; parent_reply_id?: string }) =>
    apiRequest<{ reply: any }>(`/community/discussions/${discussionId}/replies`, {
      method: 'POST',
      body: JSON.stringify(replyData),
    }),

  likePost: (postId: string, targetType: 'discussion' | 'reply') =>
    apiRequest<{ like: any; message: string }>(`/community/posts/${postId}/like`, {
      method: 'POST',
      body: JSON.stringify({ target_type: targetType }),
    }),

  unlikePost: (postId: string, targetType: 'discussion' | 'reply') =>
    apiRequest<{ message: string }>(`/community/posts/${postId}/like`, {
      method: 'DELETE',
      body: JSON.stringify({ target_type: targetType }),
    }),
};

// Applicants API
export const applicantsApi = {
  getProfile: (id: string) => apiRequest<{ applicant: any }>(`/applicants/${id}`),

  getMyProfile: () => apiRequest<{ applicant: any }>('/applicants/me/profile'),

  updateProfile: (id: string, profileData: any) =>
    apiRequest<{ applicant: any; message: string }>(`/applicants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    }),

  uploadCV: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('cv', file);
    return uploadRequest<{ applicant: any; message: string }>(`/applicants/${id}/upload-cv`, formData);
  },

  getApplications: (id: string) => apiRequest<{ applications: any[] }>(`/applicants/${id}/applications`),

  applyToJob: (id: string, jobId: string, coverLetter?: string) =>
    apiRequest<{ application: any; message: string }>(`/applicants/${id}/apply-job`, {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId, cover_letter: coverLetter }),
    }),
};