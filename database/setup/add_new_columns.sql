-- Migration to add new form fields to public.w_internship_applications
-- Run this in the Supabase SQL Editor

ALTER TABLE public.w_internship_applications
ADD COLUMN IF NOT EXISTS how_heard_about_us TEXT,
ADD COLUMN IF NOT EXISTS apply_confirmation TEXT,
ADD COLUMN IF NOT EXISTS role_rating TEXT,
ADD COLUMN IF NOT EXISTS skills_description TEXT,
ADD COLUMN IF NOT EXISTS native_state TEXT,
ADD COLUMN IF NOT EXISTS highest_stipend TEXT,
ADD COLUMN IF NOT EXISTS experience_months TEXT,
ADD COLUMN IF NOT EXISTS duration_stay TEXT,
ADD COLUMN IF NOT EXISTS remarks TEXT,
ADD COLUMN IF NOT EXISTS days_timings TEXT,
ADD COLUMN IF NOT EXISTS major_specialization TEXT;
