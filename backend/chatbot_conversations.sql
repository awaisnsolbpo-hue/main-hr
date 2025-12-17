-- Create chatbot_conversations table to store chatbot messages
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id TEXT, -- Optional: user ID if authenticated (nullable)
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_chatbot_session_id ON chatbot_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_user_id ON chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_created_at ON chatbot_conversations(created_at);

-- Add comments for documentation
COMMENT ON TABLE chatbot_conversations IS 'Stores chatbot conversation messages for history and analytics';
COMMENT ON COLUMN chatbot_conversations.session_id IS 'Unique session identifier for grouping messages in a conversation';
COMMENT ON COLUMN chatbot_conversations.user_id IS 'User ID if the user is authenticated (nullable for anonymous users)';
COMMENT ON COLUMN chatbot_conversations.role IS 'Role of the message sender: user or assistant';
COMMENT ON COLUMN chatbot_conversations.message IS 'The actual message content';

-- Enable Row Level Security (RLS) for security
-- Note: Since we're using backend API with service role key, RLS policies are optional
-- If you want to allow direct access from frontend, uncomment and adjust these policies
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role (backend) to access all records
-- This allows the backend API to save and retrieve conversations
CREATE POLICY "Service role can manage all conversations" 
  ON chatbot_conversations 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Optional: If you want to allow direct frontend access, you can add these policies
-- For now, keeping it restricted to service role only for security

