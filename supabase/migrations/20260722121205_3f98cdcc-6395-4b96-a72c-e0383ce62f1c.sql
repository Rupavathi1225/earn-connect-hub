
-- =========================================
-- Enums
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.currency_type AS ENUM ('INR', 'USD');
CREATE TYPE public.withdraw_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'closed');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.lock_status AS ENUM ('locked', 'released');
CREATE TYPE public.chat_event_type AS ENUM ('user_joined', 'survey_completed', 'points_earned', 'withdrawal_requested', 'withdrawal_approved');

-- =========================================
-- Timestamp trigger
-- =========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =========================================
-- Profiles
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  country TEXT,
  city TEXT,
  state TEXT,
  ip_address TEXT,
  currency public.currency_type NOT NULL DEFAULT 'USD',
  referral_code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  cash_balance NUMERIC(12,4) NOT NULL DEFAULT 0,
  points_balance BIGINT NOT NULL DEFAULT 0,
  locked_balance NUMERIC(12,4) NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  banned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_profile_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own_profile_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- User roles
-- =========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_roles_read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- =========================================
-- Signup: create profile + assign role + signup bonus + referral
-- =========================================
CREATE TABLE public.app_settings (
  id INT PRIMARY KEY DEFAULT 1,
  signup_bonus_points BIGINT NOT NULL DEFAULT 100,
  referral_commission_points BIGINT NOT NULL DEFAULT 50,
  lock_percentage NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  lock_days INT NOT NULL DEFAULT 7,
  points_per_inr NUMERIC(10,4) NOT NULL DEFAULT 100,
  points_per_usd NUMERIC(10,4) NOT NULL DEFAULT 100,
  admin_email TEXT NOT NULL DEFAULT 'rupavathivoosa2003@gmail.com',
  CONSTRAINT one_row CHECK (id = 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.app_settings (id) VALUES (1);
GRANT SELECT ON public.app_settings TO authenticated, anon;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_read" ON public.app_settings FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "settings_admin_update" ON public.app_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================
-- Points ledger
-- =========================================
CREATE TABLE public.points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points BIGINT NOT NULL,
  cash_delta NUMERIC(12,4) NOT NULL DEFAULT 0,
  type TEXT NOT NULL,
  description TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.points_ledger(user_id, created_at DESC);
GRANT SELECT ON public.points_ledger TO authenticated;
GRANT ALL ON public.points_ledger TO service_role;
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_ledger" ON public.points_ledger FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- =========================================
-- Surveys
-- =========================================
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_name TEXT NOT NULL,
  network_url TEXT NOT NULL,
  points BIGINT NOT NULL DEFAULT 0,
  user_variable TEXT NOT NULL DEFAULT 'aff_sub',
  banner_url TEXT,
  offer_id TEXT,
  description TEXT,
  countries TEXT[] DEFAULT ARRAY[]::TEXT[],
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.surveys TO authenticated, anon;
GRANT ALL ON public.surveys TO service_role;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "surveys_read" ON public.surveys FOR SELECT TO authenticated, anon USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "surveys_admin_write" ON public.surveys FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER surveys_updated BEFORE UPDATE ON public.surveys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- Offerwalls
-- =========================================
CREATE TABLE public.offerwalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  url_template TEXT NOT NULL,
  logo_url TEXT,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.offerwalls TO authenticated, anon;
GRANT ALL ON public.offerwalls TO service_role;
ALTER TABLE public.offerwalls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ow_read" ON public.offerwalls FOR SELECT TO authenticated, anon USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ow_admin_write" ON public.offerwalls FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER ow_updated BEFORE UPDATE ON public.offerwalls FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.offerwalls (provider, display_name, url_template) VALUES
('cpx_research','CPX Research','https://offers.cpx-research.com/?app_id=YOUR_APP&ext_user_id={user_id}'),
('bitlabs','BitLabs','https://web.bitlabs.ai/?token=YOUR_TOKEN&uid={user_id}'),
('pollfish','Pollfish','https://wall.pollfish.com/quick-app?api_key=YOUR_KEY&user_id={user_id}'),
('adscend','AdscendMedia','https://asmclk.com/adwall/pub/PUB/pro/PRO/?subid1={user_id}'),
('lootably','Lootably','https://wall.lootably.com/?placementID=YOUR_ID&sid={user_id}'),
('monlix','Monlix','https://offers.monlix.com/?appid=YOUR&userid={user_id}'),
('gemiads','GemiAds','https://gemiads.com/offerwall?apikey=YOUR&user_id={user_id}'),
('primewall','PrimeWall','https://primewall.io/wall?api=YOUR&sub={user_id}');

-- =========================================
-- Withdraw methods
-- =========================================
CREATE TABLE public.withdraw_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  min_amount NUMERIC(12,4) NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.withdraw_methods TO authenticated, anon;
GRANT ALL ON public.withdraw_methods TO service_role;
ALTER TABLE public.withdraw_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wm_read" ON public.withdraw_methods FOR SELECT TO authenticated, anon USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "wm_admin_write" ON public.withdraw_methods FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.withdraw_methods (code, display_name, fields, min_amount) VALUES
('upi','UPI','[{"key":"upi_id","label":"UPI ID"}]',1),
('paytm','Paytm','[{"key":"paytm_number","label":"Paytm Number"}]',1),
('paypal','PayPal','[{"key":"paypal_email","label":"PayPal Email"}]',1),
('payoneer','Payoneer','[{"key":"payoneer_email","label":"Payoneer Email"}]',1),
('bank','Bank Transfer','[{"key":"account_name","label":"Account Name"},{"key":"account_number","label":"Account Number"},{"key":"ifsc","label":"IFSC / SWIFT"},{"key":"bank_name","label":"Bank Name"}]',5);

-- =========================================
-- Withdrawals
-- =========================================
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method_code TEXT NOT NULL,
  amount NUMERIC(12,4) NOT NULL,
  currency public.currency_type NOT NULL,
  points_used BIGINT NOT NULL,
  payment_details JSONB NOT NULL,
  status public.withdraw_status NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX ON public.withdrawals(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_w_read" ON public.withdrawals FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own_w_insert" ON public.withdrawals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin_w_update" ON public.withdrawals FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================
-- Locked funds
-- =========================================
CREATE TABLE public.locked_funds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_source TEXT NOT NULL,
  amount NUMERIC(12,4) NOT NULL,
  points BIGINT NOT NULL DEFAULT 0,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  release_at TIMESTAMPTZ NOT NULL,
  status public.lock_status NOT NULL DEFAULT 'locked',
  released_at TIMESTAMPTZ
);
CREATE INDEX ON public.locked_funds(user_id);
GRANT SELECT ON public.locked_funds TO authenticated;
GRANT ALL ON public.locked_funds TO service_role;
ALTER TABLE public.locked_funds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lf_read" ON public.locked_funds FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "lf_admin_write" ON public.locked_funds FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================
-- Referrals
-- =========================================
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commission_points BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ref_read" ON public.referrals FOR SELECT TO authenticated USING (auth.uid() = referrer_id OR auth.uid() = referred_id OR public.has_role(auth.uid(),'admin'));

-- =========================================
-- Tickets
-- =========================================
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  priority public.ticket_priority NOT NULL DEFAULT 'medium',
  status public.ticket_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "t_read" ON public.tickets FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "t_insert" ON public.tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "t_update" ON public.tickets FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER tickets_updated BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ticket_messages TO authenticated;
GRANT ALL ON public.ticket_messages TO service_role;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tm_read" ON public.ticket_messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
);
CREATE POLICY "tm_insert" ON public.ticket_messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
);

-- =========================================
-- Announcements
-- =========================================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO authenticated, anon;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann_read" ON public.announcements FOR SELECT TO authenticated, anon USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ann_admin_write" ON public.announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================
-- Chat feed (live activity)
-- =========================================
CREATE TABLE public.chat_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type public.chat_event_type NOT NULL,
  display_name TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.chat_feed(created_at DESC);
GRANT SELECT ON public.chat_feed TO authenticated, anon;
GRANT ALL ON public.chat_feed TO service_role;
ALTER TABLE public.chat_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_read" ON public.chat_feed FOR SELECT TO authenticated, anon USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_feed;

-- =========================================
-- Promocodes
-- =========================================
CREATE TABLE public.promocodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  points BIGINT NOT NULL,
  expires_at TIMESTAMPTZ,
  usage_limit INT NOT NULL DEFAULT 1,
  used_count INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.promocodes TO authenticated;
GRANT ALL ON public.promocodes TO service_role;
ALTER TABLE public.promocodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promo_read" ON public.promocodes FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR active);
CREATE POLICY "promo_admin_write" ON public.promocodes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.promocode_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promocode_id UUID NOT NULL REFERENCES public.promocodes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(promocode_id, user_id)
);
GRANT SELECT ON public.promocode_redemptions TO authenticated;
GRANT ALL ON public.promocode_redemptions TO service_role;
ALTER TABLE public.promocode_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pr_read" ON public.promocode_redemptions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- =========================================
-- Contests
-- =========================================
CREATE TABLE public.contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  prize TEXT NOT NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.contests TO authenticated, anon;
GRANT ALL ON public.contests TO service_role;
ALTER TABLE public.contests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "c_read" ON public.contests FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "c_admin_write" ON public.contests FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================
-- Postback logs
-- =========================================
CREATE TABLE public.postback_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  transaction_id TEXT,
  points BIGINT,
  amount NUMERIC(12,4),
  raw_payload JSONB NOT NULL,
  ip_address TEXT,
  signature_valid BOOLEAN NOT NULL DEFAULT false,
  processed BOOLEAN NOT NULL DEFAULT false,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, transaction_id)
);
CREATE INDEX ON public.postback_logs(created_at DESC);
GRANT SELECT ON public.postback_logs TO authenticated;
GRANT ALL ON public.postback_logs TO service_role;
ALTER TABLE public.postback_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pl_admin" ON public.postback_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- =========================================
-- Handle new user (create profile, assign role, signup bonus, referral)
-- =========================================
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

  -- Assign role: admin if matches admin_email, else user
  IF NEW.email = s.admin_email THEN
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- Award points (used by postbacks and admin)
-- =========================================
CREATE OR REPLACE FUNCTION public.award_points(
  _user_id UUID, _points BIGINT, _type TEXT, _description TEXT, _reference_id TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s public.app_settings;
  lock_pts BIGINT;
  avail_pts BIGINT;
  cur public.currency_type;
  release_date TIMESTAMPTZ;
  cash_val NUMERIC(12,4);
  lock_cash NUMERIC(12,4);
  uname TEXT;
BEGIN
  SELECT * INTO s FROM public.app_settings WHERE id = 1;
  SELECT currency, COALESCE(name, email) INTO cur, uname FROM public.profiles WHERE id = _user_id;

  lock_pts := FLOOR(_points * s.lock_percentage / 100.0);
  avail_pts := _points - lock_pts;
  release_date := now() + (s.lock_days || ' days')::interval;

  cash_val := CASE WHEN cur = 'INR' THEN avail_pts / s.points_per_inr ELSE avail_pts / s.points_per_usd END;
  lock_cash := CASE WHEN cur = 'INR' THEN lock_pts / s.points_per_inr ELSE lock_pts / s.points_per_usd END;

  UPDATE public.profiles
    SET points_balance = points_balance + avail_pts,
        cash_balance = cash_balance + cash_val,
        locked_balance = locked_balance + lock_cash
    WHERE id = _user_id;

  INSERT INTO public.points_ledger (user_id, points, cash_delta, type, description, reference_id)
  VALUES (_user_id, avail_pts, cash_val, _type, _description, _reference_id);

  IF lock_pts > 0 THEN
    INSERT INTO public.locked_funds (user_id, offer_source, amount, points, release_at)
    VALUES (_user_id, _type, lock_cash, lock_pts, release_date);
  END IF;

  INSERT INTO public.chat_feed (user_id, event_type, display_name, message)
  VALUES (_user_id, 'points_earned', uname, uname || ' earned ' || _points || ' points from ' || _type);
END; $$;

-- =========================================
-- Release locked funds (admin manual or cron)
-- =========================================
CREATE OR REPLACE FUNCTION public.release_locked_fund(_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  lf public.locked_funds;
BEGIN
  SELECT * INTO lf FROM public.locked_funds WHERE id = _id AND status = 'locked';
  IF NOT FOUND THEN RETURN; END IF;
  UPDATE public.profiles
    SET locked_balance = locked_balance - lf.amount,
        cash_balance = cash_balance + lf.amount,
        points_balance = points_balance + lf.points
    WHERE id = lf.user_id;
  UPDATE public.locked_funds SET status = 'released', released_at = now() WHERE id = _id;
  INSERT INTO public.points_ledger (user_id, points, cash_delta, type, description, reference_id)
  VALUES (lf.user_id, lf.points, lf.amount, 'lock_released', 'Locked funds released', _id::text);
END; $$;
