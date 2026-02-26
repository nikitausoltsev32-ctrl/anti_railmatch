-- Migration 03: Support dual-party deal confirmation inside the messenger

ALTER TABLE public.bids
ADD COLUMN IF NOT EXISTS shipper_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS owner_confirmed BOOLEAN DEFAULT FALSE;
