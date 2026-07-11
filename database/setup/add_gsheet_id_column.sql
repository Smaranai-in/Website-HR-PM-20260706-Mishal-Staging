-- ==============================================================================
-- 🚀 ADD GSHEET_ID COLUMN TO public.w_internship_applications
-- ==============================================================================
-- Run this in your Supabase SQL Editor to support Google Sheet ID sync.
-- ==============================================================================

ALTER TABLE public.w_internship_applications
ADD COLUMN IF NOT EXISTS gsheet_id TEXT;
