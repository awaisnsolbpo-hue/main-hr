import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import jobsRouter from './routes/jobs.js';
import candidatesRouter from './routes/candidates.js';
import meetingsRouter from './routes/meetings.js';
import dashboardRouter from './routes/dashboard.js';
import profileRouter from './routes/profile.js';
import storageRouter from './routes/storage.js';
import publicRouter from './routes/public.js';
import interviewsRouter from './routes/interviews.js';
import vapiRouter from './routes/vapi.js';
import mcqRouter from './routes/mcq.js';
import candidatePortalRouter from './routes/candidatePortal.js';
import activityLogsRouter from './routes/activityLogs.js';
import chatbotRouter from './routes/chatbot.js';
import communityRouter from './routes/community.js';
import applicantsRouter from './routes/applicants.js';
import authRouter from './routes/auth.js';
import authMiddleware from './middleware/auth.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));


// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes (no auth required)
app.use('/api/public', publicRouter);
app.use('/api/public/mcq-tests', mcqRouter);
app.use('/api/public/candidates', candidatePortalRouter);
app.use('/api/public/chatbot', chatbotRouter);
app.use('/api/vapi', vapiRouter);
app.use('/api/community', communityRouter); // Community routes (some public, some require auth)
app.use('/api/auth', authRouter); // Auth routes (signup/login)

// API routes - all protected by auth middleware
app.use('/api/jobs', authMiddleware, jobsRouter);
app.use('/api/candidates', authMiddleware, candidatesRouter);
app.use('/api/meetings', authMiddleware, meetingsRouter);
app.use('/api/dashboard', authMiddleware, dashboardRouter);
app.use('/api/profile', authMiddleware, profileRouter);
app.use('/api/storage', authMiddleware, storageRouter);
app.use('/api/interviews', authMiddleware, interviewsRouter);
app.use('/api/activity-logs', authMiddleware, activityLogsRouter);
app.use('/api/applicants', authMiddleware, applicantsRouter);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
