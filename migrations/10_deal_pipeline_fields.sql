-- Migration 10: Deal Pipeline — Full cycle support
-- Adds commission acceptance fields, stage confirmation fields,
-- document upload tracking, expanded status values, and system messages support.

-- ============================================
-- 1. BIDS: Expand status CHECK constraint
-- ============================================
-- Remove old constraint and add new one with all pipeline statuses
ALTER TABLE public.bids DROP CONSTRAINT IF EXISTS bids_status_check;
ALTER TABLE public.bids ADD CONSTRAINT bids_status_check 
    CHECK (status IN ('pending', 'pending_payment', 'escrow_held', 'loading', 'in_transit', 'accepted', 'rejected', 'canceled'));

-- ============================================
-- 2. BIDS: Commission acceptance fields
-- ============================================
ALTER TABLE public.bids
ADD COLUMN IF NOT EXISTS commission_accepted_shipper BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS commission_accepted_owner BOOLEAN DEFAULT FALSE;

-- ============================================
-- 3. BIDS: Stage confirmation fields (per-stage, per-role)
-- ============================================
ALTER TABLE public.bids
ADD COLUMN IF NOT EXISTS escrow_confirmed_shipper BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS escrow_confirmed_owner BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS loading_confirmed_shipper BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS loading_confirmed_owner BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS transit_confirmed_shipper BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS transit_confirmed_owner BOOLEAN DEFAULT FALSE;

-- ============================================
-- 4. BIDS: Document upload tracking
-- ============================================
ALTER TABLE public.bids
ADD COLUMN IF NOT EXISTS payment_doc_uploaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS loading_doc_uploaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS transit_doc_uploaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS act_doc_uploaded BOOLEAN DEFAULT FALSE;

-- ============================================
-- 5. BIDS: Add tons column if not present
-- ============================================
ALTER TABLE public.bids
ADD COLUMN IF NOT EXISTS tons INTEGER DEFAULT 0;

-- ============================================
-- 6. MESSAGES: Allow system messages (sender_id can be NULL for system)
-- ============================================
-- Drop the FK constraint on sender_id to allow 'system' sender
-- We change sender_id to TEXT to support both UUID and 'system'
ALTER TABLE public.messages ALTER COLUMN sender_id DROP NOT NULL;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages ALTER COLUMN sender_id TYPE TEXT USING sender_id::TEXT;

-- Update INSERT policy to allow system messages
DROP POLICY IF EXISTS "Participants can insert messages" ON public.messages;
CREATE POLICY "Participants can insert messages" ON public.messages
    FOR INSERT WITH CHECK (
    auth.uid()::text = sender_id OR sender_id = 'system'
);

-- ============================================
-- 7. REQUESTS: Expand status constraint
-- ============================================
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_status_check;
ALTER TABLE public.requests ADD CONSTRAINT requests_status_check 
    CHECK (status IN ('open', 'completed', 'closed'));
