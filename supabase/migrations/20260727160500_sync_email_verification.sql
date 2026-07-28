-- 1. Update existing verified users in profiles
UPDATE public.profiles p
SET verified = true
FROM auth.users u
WHERE p.id = u.id AND u.email_confirmed_at IS NOT NULL;

-- 2. Modify handle_new_user to set initial verification status
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 AS $function$
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

  -- Create profile with initial verified status based on email_confirmed_at
  INSERT INTO public.profiles (id, email, name, phone, country, currency, referred_by, points_balance, verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'country',
    COALESCE((NEW.raw_user_meta_data->>'currency')::public.currency_type, 'USD'::public.currency_type),
    referrer_uid,
    0,
    (NEW.email_confirmed_at IS NOT NULL)
  );

  IF NEW.email = s.admin_email THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'super_admin')
      ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
      ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Award signup bonus
  IF s.signup_bonus_points > 0 THEN
    PERFORM public.award_points(NEW.id, s.signup_bonus_points, 'signup_bonus', 'Welcome bonus');
  END IF;

  -- Award referral commission
  IF referrer_uid IS NOT NULL AND s.referral_commission_points > 0 THEN
    INSERT INTO public.referrals (referrer_id, referred_id, commission_points)
    VALUES (referrer_uid, NEW.id, s.referral_commission_points);
    PERFORM public.award_points(referrer_uid, s.referral_commission_points, 'referral', 'Referral bonus', NEW.id::text);
  END IF;

  -- Chat feed event
  INSERT INTO public.chat_feed (user_id, event_type, display_name, message)
  VALUES (NEW.id, 'user_joined', COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)) || ' just joined!');

  RETURN NEW;
END; $function$;

-- 3. Create function to handle email verification updates on auth.users
CREATE OR REPLACE FUNCTION public.handle_auth_user_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.profiles
    SET verified = true
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Create trigger to run after auth.users updates
CREATE OR REPLACE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_update();
