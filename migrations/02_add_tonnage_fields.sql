-- Migration 02: Add in-app support for cargo tonnage (weight) tracking

-- Add tonnage to requests
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS totalTons NUMERIC,
ADD COLUMN IF NOT EXISTS fulfilledTons NUMERIC DEFAULT 0;

-- Add tonnage to bids
ALTER TABLE public.bids
ADD COLUMN IF NOT EXISTS tons NUMERIC;
