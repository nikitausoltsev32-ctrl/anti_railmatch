-- Migration 11: Deal Documents — document tracking and gating
-- Adds deal_documents table for storing generated PDF metadata,
-- signing status, and form data for re-generation.

-- ============================================
-- 1. DEAL DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.deal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bid_id UUID NOT NULL REFERENCES public.bids(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL CHECK (doc_type IN ('contract', 'gu12', 'waybill', 'upd', 'act')),
    version INT DEFAULT 1,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'signed_one', 'signed_both', 'archived')),
    signed_by_shipper BOOLEAN DEFAULT FALSE,
    signed_by_owner BOOLEAN DEFAULT FALSE,
    signer_shipper_name TEXT,
    signer_owner_name TEXT,
    file_path TEXT,
    form_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    signed_at TIMESTAMPTZ
);

-- ============================================
-- 2. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_deal_documents_bid_id ON public.deal_documents(bid_id);
CREATE INDEX IF NOT EXISTS idx_deal_documents_doc_type ON public.deal_documents(doc_type);

-- ============================================
-- 3. RLS POLICIES
-- ============================================
ALTER TABLE public.deal_documents ENABLE ROW LEVEL SECURITY;

-- Participants can view their deal documents
CREATE POLICY "Deal participants can view documents" ON public.deal_documents
    FOR SELECT USING (
        bid_id::text IN (
            SELECT id::text FROM public.bids
            WHERE "ownerId" = auth.uid()::text
               OR "requestId"::text IN (SELECT id::text FROM public.requests WHERE "shipperInn" = (SELECT inn FROM public.profiles WHERE id = auth.uid()))
        )
    );

-- Participants can insert documents
CREATE POLICY "Deal participants can insert documents" ON public.deal_documents
    FOR INSERT WITH CHECK (true);

-- Participants can update documents
CREATE POLICY "Deal participants can update documents" ON public.deal_documents
    FOR UPDATE USING (true);

-- ============================================
-- 4. STORAGE BUCKET (run in Supabase dashboard)
-- ============================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
