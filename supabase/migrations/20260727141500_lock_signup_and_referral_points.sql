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

  -- Create profile with 0 starting points (points will be awarded via award_points to apply lock rules)
  INSERT INTO public.profiles (id, email, name, phone, country, currency, referred_by, points_balance)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'country',
    COALESCE((NEW.raw_user_meta_data->>'currency')::public.currency_type, 'USD'::public.currency_type),
    referrer_uid,
    0
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

  -- Award signup bonus via award_points (so it locks a portion based on lock settings)
  IF s.signup_bonus_points > 0 THEN
    PERFORM public.award_points(NEW.id, s.signup_bonus_points, 'signup_bonus', 'Welcome bonus');
  END IF;

  -- Award referral commission via award_points (so it locks a portion based on lock settings)
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
