-- Add model field to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'google/gemini-2.5-flash';