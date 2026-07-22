UPDATE public.app_settings SET admin_email = 'rupavathivoosa2003@gmail.com' WHERE id = 1;
-- Promote existing user if already signed up
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'rupavathivoosa2003@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;