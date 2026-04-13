CREATE TABLE chat_violations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id        uuid NOT NULL REFERENCES matches(id)  ON DELETE CASCADE,
  detector        text NOT NULL,
  severity        text NOT NULL DEFAULT 'medium',
  snippet         text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  notion_synced_at timestamptz
);

CREATE INDEX chat_violations_unsynced
  ON chat_violations (created_at)
  WHERE notion_synced_at IS NULL;

CREATE INDEX chat_violations_user
  ON chat_violations (user_id, created_at DESC);

ALTER TABLE chat_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_violations_admin_read"
  ON chat_violations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));
