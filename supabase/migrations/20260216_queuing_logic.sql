-- Migration for message queuing and processing logic
-- 1. Update messages table statuses
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_status_check;
ALTER TABLE messages ADD CONSTRAINT messages_status_check 
  CHECK (status IN ('draft', 'scheduled', 'pending', 'sending', 'sent', 'failed', 'cancelled'));

-- 2. Add error tracking to messages and recipients
ALTER TABLE messages ADD COLUMN IF NOT EXISTS error_details text;
ALTER TABLE message_recipients ADD COLUMN IF NOT EXISTS error_message text;

-- 3. (Optional) Indexes for queuing performance
CREATE INDEX IF NOT EXISTS idx_messages_status_pending ON messages (status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_message_recipients_pending ON message_recipients (status) WHERE status = 'pending';
