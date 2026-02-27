-- Migration 06: Add Target Price to Requests
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS target_price NUMERIC;
