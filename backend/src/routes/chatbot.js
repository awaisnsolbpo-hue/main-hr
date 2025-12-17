import express from 'express';
import Joi from 'joi';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Chat message schema
const chatMessageSchema = Joi.object({
  message: Joi.string().required().max(2000),
  session_id: Joi.string().optional(), // Session ID for conversation tracking
  user_id: Joi.string().optional(), // User ID if authenticated
  conversationHistory: Joi.array().items(
    Joi.object({
      role: Joi.string().valid('user', 'assistant').required(),
      content: Joi.string().required(),
    })
  ).optional(),
});

// Helper function to save message to database
async function saveMessage(sessionId, userId, role, message) {
  try {
    const { error } = await supabase
      .from('chatbot_conversations')
      .insert({
        session_id: sessionId,
        user_id: userId || null,
        role: role,
        message: message,
      });

    if (error) {
      console.error('Error saving chatbot message:', error);
      // Don't throw error - just log it, conversation should still work
    }
  } catch (error) {
    console.error('Error saving chatbot message:', error);
    // Don't throw error - just log it, conversation should still work
  }
}

// Platform information for the chatbot context
const PLATFORM_INFO = `
You are a helpful AI assistant for an HR Management and Recruitment Platform. Your purpose is to answer questions about the platform's features, services, and how to use it. You should ONLY provide information about the platform and NOT answer technical, backend, or programming-related questions.

## Platform Overview:
This is an AI-powered HR management platform designed to streamline the recruitment process for companies and provide a smooth experience for candidates.

## Main Features:

### For Employers/HR:
1. **Job Management**: Create, post, and manage job openings
2. **AI-Powered Resume Screening**: Automatically analyze and score resumes against job requirements. The AI extracts key information, matches skills, and ranks candidates.
3. **Automated Video Interviews**: Conduct intelligent video interviews with AI interviewers. Questions can be tailored based on candidate profiles, with real-time transcripts and automatic evaluation.
4. **Smart Candidate Ranking**: Get AI-generated candidate scores based on skills, experience, and interview performance.
5. **Candidate Management**: Import candidates from LinkedIn, Gmail, direct uploads, or public job links. Search and manage candidate profiles.
6. **Multi-Channel Candidate Import**: Import candidates from various sources like LinkedIn, Gmail, direct uploads, or public job links.
7. **Automated Scheduling**: Schedule interviews automatically with calendar integration.
8. **Analytics & Insights**: Track hiring metrics, success rates, and pipeline health.
9. **Bias-Free Evaluation**: AI focuses on skills, qualifications, and performance - not demographics.

### For Candidates:
1. **MCQ Tests**: Multiple choice questions to assess knowledge and skills. Candidates can take timed MCQ tests with screen recording.
2. **Practical/Technical Tests**: Hands-on tests where candidates can demonstrate their skills through coding or practical tasks. These include screen recording and video submissions.
3. **Video Interviews**: Automated video interviews with AI interviewers.
4. **Application Tracking**: Track application status and interview progress.
5. **Profile Management**: Upload CVs and manage profile information.

## Assessment Types:

### MCQ Tests:
- Multiple choice questions (typically 30 questions)
- Timed assessment
- Screen recording during the test
- Automatic scoring based on correct answers
- Covers various topics relevant to the job position

### Practical/Technical Tests:
- Hands-on coding or practical tasks
- Candidates record their screen and themselves
- Video submission of their work
- Evaluation based on solution quality and approach
- Time-limited assessment (typically 1-2 hours)

### Video Interviews:
- Automated interviews with AI interviewer
- Real-time transcription
- Questions tailored to the candidate's profile
- Evaluation of responses and communication skills

## Important Guidelines:
- ONLY answer questions about the platform, its features, tests, and how to use it
- DO NOT provide technical details about backend systems, database structure, API endpoints, or code implementation
- DO NOT answer programming questions or provide code examples
- DO NOT answer questions about server configuration, deployment, or technical architecture
- If asked about technical details, politely redirect to platform features or suggest contacting support
- Be friendly, helpful, and concise
- You can answer in any language the user asks in
- Focus on user-facing features and benefits
`;

// Generate OpenAI API request
async function getChatbotResponse(userMessage, conversationHistory = []) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const messages = [
    {
      role: 'system',
      content: PLATFORM_INFO,
    },
    ...conversationHistory.slice(-10), // Keep last 10 messages for context
    {
      role: 'user',
      content: userMessage,
    },
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
}

// POST /api/public/chatbot - Public endpoint for chatbot
router.post('/', async (req, res, next) => {
  try {
    const { error: validationError, value } = chatMessageSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError.details[0].message });
    }

    const { message, session_id, user_id, conversationHistory = [] } = value;

    // Generate session_id if not provided
    const sessionId = session_id || `chat_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Save user message to database
    await saveMessage(sessionId, user_id || null, 'user', message);

    // Get response from OpenAI
    const botResponse = await getChatbotResponse(message, conversationHistory);

    // Save assistant response to database
    await saveMessage(sessionId, user_id || null, 'assistant', botResponse);

    res.json({
      response: botResponse,
      message: botResponse, // For compatibility
      session_id: sessionId, // Return session_id for frontend to use
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    
    // Provide user-friendly error message
    if (error.message.includes('API key')) {
      return res.status(500).json({ 
        error: 'Chatbot service is temporarily unavailable. Please try again later.',
        response: 'I apologize, but I\'m having technical difficulties. Please try again in a moment or contact support if the issue persists.'
      });
    }

    next(error);
  }
});

// GET /api/public/chatbot/history/:session_id - Get conversation history
router.get('/history/:session_id', async (req, res, next) => {
  try {
    const { session_id } = req.params;
    const { user_id } = req.query; // Optional user_id for additional filtering

    let query = supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true });

    // If user_id provided, filter by it as well
    if (user_id && user_id !== 'null' && user_id !== 'undefined') {
      query = query.eq('user_id', user_id);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      messages: data || [],
      session_id: session_id,
    });
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    next(error);
  }
});

export default router;

