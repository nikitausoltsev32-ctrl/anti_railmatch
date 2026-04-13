-- Lock direct INSERT on messages to service_role only.
-- All user messages must go through the send-chat-message edge function.
-- System messages (sender_id = 'system') are also written by the edge function.
DROP POLICY IF EXISTS "messages_insert_participants" ON messages;
DROP POLICY IF EXISTS "messages insert" ON messages;

CREATE POLICY "messages_insert_service_only"
  ON messages FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
