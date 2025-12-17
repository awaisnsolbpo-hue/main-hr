# Chatbot Conversation Storage Setup

This document explains how to set up conversation storage for the chatbot.

## Database Setup

### Step 1: Run SQL Script

Run the SQL script `backend/chatbot_conversations.sql` in your Supabase SQL Editor:

```sql
-- This creates the chatbot_conversations table
-- See chatbot_conversations.sql for the full script
```

The table structure:
- `id`: UUID primary key
- `session_id`: Text field to group messages in a conversation
- `user_id`: Optional user ID if authenticated
- `role`: Either 'user' or 'assistant'
- `message`: The actual message content
- `created_at`: Timestamp when message was created

### Step 2: Verify Table Creation

Check that the table was created successfully in your Supabase dashboard.

## How It Works

### Backend
- When a user sends a message, it's saved to the database with role 'user'
- When the AI responds, it's saved to the database with role 'assistant'
- Each conversation is tracked by a `session_id` (generated automatically or provided by frontend)
- If a user is authenticated, their `user_id` is also saved

### Frontend
- The frontend maintains a `session_id` in localStorage
- This `session_id` is sent with each message
- The backend returns the `session_id` to ensure consistency

### API Endpoints

1. **POST `/api/public/chatbot`**
   - Sends a message and gets a response
   - Automatically saves both user message and assistant response
   - Returns `session_id` for tracking

2. **GET `/api/public/chatbot/history/:session_id`**
   - Retrieves conversation history for a session
   - Optional `user_id` query parameter for additional filtering

## Features

✅ **Automatic Saving**: All messages are automatically saved
✅ **Session Tracking**: Messages are grouped by session_id
✅ **User Identification**: Authenticated users' messages are linked to their user_id
✅ **History Retrieval**: Can retrieve full conversation history
✅ **Error Handling**: Database errors don't break the chatbot functionality

## Usage Example

The frontend automatically handles session management and saves conversations. No additional code needed!

To retrieve conversation history programmatically:

```typescript
const history = await publicApi.getChatHistory(sessionId, userId);
```

## Security

- Row Level Security (RLS) is enabled on the table
- Service role key is used in the backend to save/retrieve messages
- Users can only access their own conversations through the API

