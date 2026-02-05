-- Add thread_id column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_id INT;

-- Update existing messages to have their own ID as thread_id
UPDATE messages SET thread_id = id WHERE thread_id IS NULL;

-- Add index for better thread query performance
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
