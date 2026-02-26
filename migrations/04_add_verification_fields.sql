-- Migration 04: Add verification status and documents to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS verification_status TEXT CHECK (verification_status IN ('unverified', 'pending', 'verified')) DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS documents TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
