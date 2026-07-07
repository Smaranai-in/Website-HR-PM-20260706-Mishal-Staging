-- ==============================================================================
-- 🚀 AUDIT LOGGING SETUP FOR INTERNSHIP APPLICATIONS
-- ==============================================================================
-- Automatically logs all changes (updates) on internship applications.
-- ==============================================================================

-- 1. Create Audit Log Table
CREATE TABLE IF NOT EXISTS public.w_internship_applications_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.w_internship_applications(id) ON DELETE CASCADE,
    old_values JSONB,
    new_values JSONB,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance queries
CREATE INDEX IF NOT EXISTS idx_w_internship_apps_audit_app_id 
    ON public.w_internship_applications_audit_log(application_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.w_internship_applications_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins only policy
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.w_internship_applications_audit_log;
CREATE POLICY "Admins can view all audit logs" ON public.w_internship_applications_audit_log 
FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.w_users WHERE id = auth.uid() AND role = 'admin'));


-- 2. Create Trigger Function
CREATE OR REPLACE FUNCTION public.log_internship_application_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.w_internship_applications_audit_log (
        application_id, 
        old_values, 
        new_values, 
        changed_at
    )
    VALUES (
        NEW.id,
        to_jsonb(OLD),
        to_jsonb(NEW),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Bind Trigger (runs AFTER UPDATE only)
DROP TRIGGER IF EXISTS trg_log_internship_application_changes ON public.w_internship_applications;
CREATE TRIGGER trg_log_internship_application_changes
    AFTER UPDATE ON public.w_internship_applications
    FOR EACH ROW
    EXECUTE FUNCTION public.log_internship_application_changes();
