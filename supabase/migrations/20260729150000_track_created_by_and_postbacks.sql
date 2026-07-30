-- Add created_by to profiles to track who created the account
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create generated_postbacks table to store postbacks created by admins
CREATE TABLE IF NOT EXISTS public.generated_postbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  network_name TEXT NOT NULL,
  secret TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and set grants on generated_postbacks
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_postbacks TO authenticated;
GRANT ALL ON public.generated_postbacks TO service_role;
ALTER TABLE public.generated_postbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff manage generated_postbacks" ON public.generated_postbacks 
  FOR ALL TO authenticated 
  USING (public.is_staff(auth.uid())) 
  WITH CHECK (public.is_staff(auth.uid()));

-- Add created_by_admin_id to postback_logs to link incoming postbacks with the admin who created the link
ALTER TABLE public.postback_logs ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
