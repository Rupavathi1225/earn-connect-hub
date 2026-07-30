-- 1. Ensure rupavathivoosa2003@gmail.com is only 'admin' and NOT 'super_admin'
DELETE FROM public.user_roles
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'rupavathivoosa2003@gmail.com')
  AND role::text = 'super_admin';

-- Make sure rupavathivoosa2003@gmail.com has the 'admin' role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'rupavathivoosa2003@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Ensure fowadyxu@forexzig.com is 'super_admin' and NOT 'admin'
DELETE FROM public.user_roles
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'fowadyxu@forexzig.com')
  AND role::text = 'admin';

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::public.app_role FROM auth.users WHERE email = 'fowadyxu@forexzig.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Update handle_new_user trigger to handle these emails automatically upon signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s public.app_settings;
  referrer_uid UUID;
  ref_code TEXT;
BEGIN
  SELECT * INTO s FROM public.app_settings WHERE id = 1;

  ref_code := NEW.raw_user_meta_data->>'referral_code';
  IF ref_code IS NOT NULL AND length(ref_code) > 0 THEN
    SELECT id INTO referrer_uid FROM public.profiles WHERE referral_code = ref_code;
  END IF;

  INSERT INTO public.profiles (id, email, name, phone, country, currency, referred_by, points_balance)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'country',
    COALESCE((NEW.raw_user_meta_data->>'currency')::public.currency_type, 'USD'::public.currency_type),
    referrer_uid,
    s.signup_bonus_points
  );

  -- Assign role: super_admin for fowadyxu@forexzig.com, admin for rupavathivoosa2003@gmail.com, else user
  IF NEW.email = 'fowadyxu@forexzig.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin');
  ELSIF NEW.email = 'rupavathivoosa2003@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  -- Signup bonus ledger entry
  IF s.signup_bonus_points > 0 THEN
    INSERT INTO public.points_ledger (user_id, points, type, description)
    VALUES (NEW.id, s.signup_bonus_points, 'signup_bonus', 'Welcome bonus');
  END IF;

  -- Referral commission
  IF referrer_uid IS NOT NULL AND s.referral_commission_points > 0 THEN
    INSERT INTO public.referrals (referrer_id, referred_id, commission_points)
    VALUES (referrer_uid, NEW.id, s.referral_commission_points);
    UPDATE public.profiles SET points_balance = points_balance + s.referral_commission_points WHERE id = referrer_uid;
    INSERT INTO public.points_ledger (user_id, points, type, description, reference_id)
    VALUES (referrer_uid, s.referral_commission_points, 'referral', 'Referral bonus', NEW.id::text);
  END IF;

  -- Chat feed
  INSERT INTO public.chat_feed (user_id, event_type, display_name, message)
  VALUES (NEW.id, 'user_joined', COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)) || ' just joined!');

  RETURN NEW;
END; $$;
