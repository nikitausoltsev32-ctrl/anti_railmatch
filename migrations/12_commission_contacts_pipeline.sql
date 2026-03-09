-- Migration 12: Commission-based contact reveal pipeline
-- Replaces escrow model with commission payment gateway.
-- After both parties agree on terms, they pay a 2.5% commission
-- to unlock each other's contact details.

-- ============================================
-- 1. BIDS: Update status constraint
-- ============================================
ALTER TABLE public.bids DROP CONSTRAINT IF EXISTS bids_status_check;

-- First, map any existing 'contacts_unlocked' statuses to the new 'contacts_revealed' status
UPDATE public.bids SET status = 'contacts_revealed' WHERE status = 'contacts_unlocked';

ALTER TABLE public.bids ADD CONSTRAINT bids_status_check
    CHECK (status IN (
        'pending',              -- Negotiating
        'pending_payment',      -- Legacy (backwards compat)
        'commission_pending',   -- Both confirmed, awaiting commission payment
        'escrow_held',          -- Legacy (backwards compat)
        'loading',              -- Legacy (backwards compat)
        'in_transit',           -- Legacy (backwards compat)
        'contacts_revealed',    -- Commission paid, contacts unlocked
        'accepted',             -- Legacy / completed
        'rejected',
        'canceled'
    ));

-- ============================================
-- 2. BIDS: Commission tracking fields
-- ============================================
ALTER TABLE public.bids
ADD COLUMN IF NOT EXISTS deal_amount        BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_amount  BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipper_paid       BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS owner_paid         BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS shipper_paid_at    TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS owner_paid_at      TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS split_deadline     TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contacts_revealed  BOOLEAN DEFAULT FALSE;

-- ============================================
-- 3. Index for faster commission status queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_bids_contacts_revealed ON public.bids (contacts_revealed);
CREATE INDEX IF NOT EXISTS idx_bids_commission_pending ON public.bids (status) WHERE status = 'commission_pending';
