
-- 1. super_admin role value
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- helper that avoids the new enum literal (not usable in this tx)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text IN ('admin','super_admin'));
$$;

-- 2. domains
CREATE TABLE public.domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  owner_id uuid,
  ssl_status text NOT NULL DEFAULT 'pending',
  theme text NOT NULL DEFAULT 'dark',
  currency text NOT NULL DEFAULT 'USD',
  language text NOT NULL DEFAULT 'en',
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domains TO authenticated;
GRANT ALL ON public.domains TO service_role;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read domains" ON public.domains FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "super admin manage domains" ON public.domains FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- 3. roles / permissions
CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roles TO authenticated;
GRANT ALL ON public.roles TO service_role;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read roles" ON public.roles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "super admin manage roles" ON public.roles FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource text NOT NULL,
  action text NOT NULL,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resource, action)
);
GRANT SELECT ON public.permissions TO authenticated;
GRANT ALL ON public.permissions TO service_role;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read permissions" ON public.permissions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role_id, permission_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "super admin manage role_permissions" ON public.role_permissions FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- 4. admins
CREATE TABLE public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role_key text NOT NULL DEFAULT 'admin',
  status text NOT NULL DEFAULT 'active',
  revenue_share numeric(6,2) NOT NULL DEFAULT 0,
  notes text,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admins TO authenticated;
GRANT ALL ON public.admins TO service_role;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read admins" ON public.admins FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "super admin manage admins" ON public.admins FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TABLE public.admin_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  domain_id uuid NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (admin_id, domain_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_domains TO authenticated;
GRANT ALL ON public.admin_domains TO service_role;
ALTER TABLE public.admin_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read admin_domains" ON public.admin_domains FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "super admin manage admin_domains" ON public.admin_domains FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- 5. publishers
CREATE TABLE public.publishers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  website text,
  country text,
  domain_id uuid REFERENCES public.domains(id) ON DELETE SET NULL,
  total_clicks bigint NOT NULL DEFAULT 0,
  total_conversions bigint NOT NULL DEFAULT 0,
  revenue numeric(14,4) NOT NULL DEFAULT 0,
  postback_status text NOT NULL DEFAULT 'not_configured',
  iframe_status text NOT NULL DEFAULT 'not_configured',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.publishers TO authenticated;
GRANT ALL ON public.publishers TO service_role;
ALTER TABLE public.publishers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read publishers" ON public.publishers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "super admin manage publishers" ON public.publishers FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- 6. networks + requests
CREATE TABLE public.networks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tracking_url text,
  category text,
  revenue numeric(14,4) NOT NULL DEFAULT 0,
  conversions bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.networks TO authenticated;
GRANT ALL ON public.networks TO service_role;
ALTER TABLE public.networks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read networks" ON public.networks FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "super admin manage networks" ON public.networks FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TABLE public.network_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by uuid,
  admin_name text,
  domain_id uuid REFERENCES public.domains(id) ON DELETE SET NULL,
  network_name text NOT NULL,
  tracking_url text NOT NULL,
  offer_id text,
  offer_name text,
  user_variable text NOT NULL DEFAULT 'aff_sub2',
  payout_variable text NOT NULL DEFAULT 'payout',
  status_variable text NOT NULL DEFAULT 'status',
  transaction_variable text NOT NULL DEFAULT 'trans_id',
  callback_url text,
  points bigint NOT NULL DEFAULT 0,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.network_requests TO authenticated;
GRANT ALL ON public.network_requests TO service_role;
ALTER TABLE public.network_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read network_requests" ON public.network_requests FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff create network_requests" ON public.network_requests FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()) AND requested_by = auth.uid());
CREATE POLICY "super admin manage network_requests" ON public.network_requests FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TABLE public.network_request_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.network_requests(id) ON DELETE CASCADE,
  actor_id uuid,
  actor_name text,
  action text NOT NULL,
  from_status text,
  to_status text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.network_request_history TO authenticated;
GRANT ALL ON public.network_request_history TO service_role;
ALTER TABLE public.network_request_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read nrh" ON public.network_request_history FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert nrh" ON public.network_request_history FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

-- 7. offerwall extensions
ALTER TABLE public.offerwalls
  ADD COLUMN IF NOT EXISTS domain_id uuid REFERENCES public.domains(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS api_url text,
  ADD COLUMN IF NOT EXISTS api_key text,
  ADD COLUMN IF NOT EXISTS secret_key text,
  ADD COLUMN IF NOT EXISTS iframe_url text,
  ADD COLUMN IF NOT EXISTS postback_url text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue_share numeric(6,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revenue numeric(14,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_postback_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS domain_id uuid REFERENCES public.domains(id) ON DELETE SET NULL;
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS domain_id uuid REFERENCES public.domains(id) ON DELETE SET NULL;

-- 8. api keys
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  environment text NOT NULL DEFAULT 'production',
  key_value text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admin manage api_keys" ON public.api_keys FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- 9. notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  body text,
  severity text NOT NULL DEFAULT 'info',
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read notifications" ON public.notifications FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "super admin manage notifications" ON public.notifications FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- 10. logs
CREATE TABLE public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL DEFAULT 'info',
  category text NOT NULL DEFAULT 'system',
  actor_name text,
  actor_id uuid,
  action text NOT NULL,
  detail text,
  domain text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_system_logs_created ON public.system_logs (created_at DESC);
GRANT SELECT, INSERT ON public.system_logs TO authenticated;
GRANT ALL ON public.system_logs TO service_role;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read system_logs" ON public.system_logs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert system_logs" ON public.system_logs FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_name text,
  entity text NOT NULL,
  entity_id text,
  action text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  user_agent text,
  domain text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_created ON public.audit_logs (created_at DESC);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read audit_logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert audit_logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

-- 11. postbacks received
CREATE TABLE public.postbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network text,
  offerwall_id uuid REFERENCES public.offerwalls(id) ON DELETE SET NULL,
  domain_id uuid REFERENCES public.domains(id) ON DELETE SET NULL,
  user_id uuid,
  offer_id text,
  transaction_id text,
  payout numeric(14,4),
  points bigint,
  status text,
  signature_valid boolean NOT NULL DEFAULT false,
  processed boolean NOT NULL DEFAULT false,
  error text,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_postbacks_created ON public.postbacks (created_at DESC);
GRANT SELECT, INSERT ON public.postbacks TO authenticated;
GRANT ALL ON public.postbacks TO service_role;
ALTER TABLE public.postbacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read postbacks" ON public.postbacks FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

-- 12. cron jobs, backups, revenue reports
CREATE TABLE public.cron_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  schedule text,
  last_run_at timestamptz,
  last_status text NOT NULL DEFAULT 'idle',
  last_duration_ms integer,
  last_error text,
  queued integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cron_jobs TO authenticated;
GRANT ALL ON public.cron_jobs TO service_role;
ALTER TABLE public.cron_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read cron_jobs" ON public.cron_jobs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "super admin manage cron_jobs" ON public.cron_jobs FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TABLE public.backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'database',
  trigger_type text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'running',
  size_bytes bigint,
  location text,
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.backups TO authenticated;
GRANT ALL ON public.backups TO service_role;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admin manage backups" ON public.backups FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TABLE public.revenue_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day date NOT NULL,
  domain_id uuid REFERENCES public.domains(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  network_id uuid REFERENCES public.networks(id) ON DELETE SET NULL,
  offerwall_id uuid REFERENCES public.offerwalls(id) ON DELETE SET NULL,
  publisher_id uuid REFERENCES public.publishers(id) ON DELETE SET NULL,
  country text,
  revenue numeric(14,4) NOT NULL DEFAULT 0,
  payout numeric(14,4) NOT NULL DEFAULT 0,
  conversions bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_revenue_reports_day ON public.revenue_reports (day DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.revenue_reports TO authenticated;
GRANT ALL ON public.revenue_reports TO service_role;
ALTER TABLE public.revenue_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read revenue_reports" ON public.revenue_reports FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "super admin manage revenue_reports" ON public.revenue_reports FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- 13. updated_at triggers
CREATE TRIGGER trg_domains_updated BEFORE UPDATE ON public.domains FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_roles_updated BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_admins_updated BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_publishers_updated BEFORE UPDATE ON public.publishers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_networks_updated BEFORE UPDATE ON public.networks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_network_requests_updated BEFORE UPDATE ON public.network_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_api_keys_updated BEFORE UPDATE ON public.api_keys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_cron_jobs_updated BEFORE UPDATE ON public.cron_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 14. seed roles + permissions
INSERT INTO public.roles (key,label,description,is_system) VALUES
  ('super_admin','Super Admin','Full platform control',true),
  ('admin','Admin','Manages assigned domains',true),
  ('finance','Finance','Revenue and withdrawals',true),
  ('support','Support','Tickets and users',true),
  ('moderator','Moderator','Content moderation',true),
  ('read_only','Read Only','View-only access',true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.permissions (resource,action,label)
SELECT r, a, initcap(a)||' '||initcap(replace(r,'_',' '))
FROM (VALUES
  ('users','view'),('users','create'),('users','edit'),('users','delete'),
  ('admins','view'),('admins','create'),('admins','edit'),('admins','delete'),
  ('offerwalls','view'),('offerwalls','create'),('offerwalls','edit'),('offerwalls','delete'),
  ('networks','view'),('networks','create'),('networks','edit'),('networks','delete'),
  ('revenue','view'),('revenue','export'),
  ('settings','view'),('settings','edit'),
  ('logs','view'),
  ('domains','view'),('domains','manage')
) AS t(r,a)
ON CONFLICT (resource,action) DO NOTHING;

-- super admin gets everything
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT ro.id, p.id FROM public.roles ro CROSS JOIN public.permissions p WHERE ro.key='super_admin'
ON CONFLICT DO NOTHING;

-- read_only gets all view perms
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT ro.id, p.id FROM public.roles ro JOIN public.permissions p ON p.action='view' WHERE ro.key='read_only'
ON CONFLICT DO NOTHING;

INSERT INTO public.cron_jobs (name, schedule) VALUES
  ('api_sync','*/15 * * * *'),
  ('offer_sync','0 * * * *'),
  ('locked_funds_release','0 2 * * *'),
  ('revenue_rollup','5 0 * * *')
ON CONFLICT (name) DO NOTHING;
