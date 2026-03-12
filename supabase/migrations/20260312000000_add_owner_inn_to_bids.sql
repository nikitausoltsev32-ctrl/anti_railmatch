-- Add ownerInn column to bids table
-- This column is required by the bid submission form and referenced in
-- MyRequestsView, DocumentSigningModal, and ChatWindow components.
ALTER TABLE bids ADD COLUMN IF NOT EXISTS "ownerInn" text;
