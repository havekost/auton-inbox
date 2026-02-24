-- Auton Inbox Database Schema
-- Run this in the Supabase SQL Editor

-- Table: inboxes
CREATE TABLE IF NOT EXISTS inboxes (
  id TEXT PRIMARY KEY,
  secret_key_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  label TEXT,
  message_count INTEGER NOT NULL DEFAULT 0
);

-- Table: messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  inbox_id TEXT NOT NULL REFERENCES inboxes(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  topic TEXT NOT NULL,
  auth_key TEXT,
  message_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_inbox_id ON messages(inbox_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_topic ON messages(topic);
CREATE INDEX IF NOT EXISTS idx_messages_source ON messages(source);

-- Row Level Security
ALTER TABLE inboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access on inboxes"
  ON inboxes
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on messages"
  ON messages
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Helper function: increment message count
CREATE OR REPLACE FUNCTION increment_message_count(inbox_id_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE inboxes
  SET message_count = message_count + 1
  WHERE id = inbox_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: decrement message count
CREATE OR REPLACE FUNCTION decrement_message_count(inbox_id_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE inboxes
  SET message_count = GREATEST(message_count - 1, 0)
  WHERE id = inbox_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
