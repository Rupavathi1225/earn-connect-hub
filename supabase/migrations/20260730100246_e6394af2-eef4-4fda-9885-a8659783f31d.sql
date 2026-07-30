CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  tracking_url TEXT,
  payout NUMERIC(12,4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  payout_model TEXT NOT NULL DEFAULT 'CPA',
  points BIGINT NOT NULL DEFAULT 0,
  countries TEXT[] NOT NULL DEFAULT '{}',
  platform TEXT,
  device TEXT,
  category TEXT DEFAULT 'GENERAL',
  expiry_date DATE,
  percent NUMERIC(6,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  traffic_sources TEXT,
  description TEXT,
  user_variable TEXT NOT NULL DEFAULT 'aff_sub',
  active BOOLEAN NOT NULL DEFAULT true,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view live offers"
  ON public.offers FOR SELECT TO authenticated
  USING (active AND is_public);

CREATE POLICY "Staff can view all offers"
  ON public.offers FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff manage offers"
  ON public.offers FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

GRANT INSERT, UPDATE, DELETE ON public.offers TO authenticated;

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();