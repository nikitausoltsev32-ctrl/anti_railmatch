-- Migration 12: Developer Dashboard
-- Creates error_logs table and supports 'developer' role in profiles

-- Create error_logs table for tracking site errors and issues
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    error_type TEXT CHECK (error_type IN ('js_error', 'api_error', 'auth_error', 'manual')),
    message TEXT,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    url TEXT,
    stack TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Enable Row-Level Security
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Only developers can read error logs
CREATE POLICY "developers_can_read_errors" ON error_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'developer'
        )
    );

-- Anyone (including unauthenticated) can insert error logs
CREATE POLICY "anyone_can_insert_errors" ON error_logs
    FOR INSERT WITH CHECK (true);

-- Only developers can delete old error logs
CREATE POLICY "developers_can_delete_errors" ON error_logs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'developer'
        )
    );

-- Only developers can update profiles role to 'developer'
-- (managed via application logic; no additional migration needed since role is TEXT)
