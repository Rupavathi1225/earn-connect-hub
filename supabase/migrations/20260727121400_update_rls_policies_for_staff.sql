-- Promote existing admin user to both admin and super_admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'rupavathivoosa2003@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::public.app_role FROM auth.users WHERE email = 'rupavathivoosa2003@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Drop old policies checking only 'admin'
DROP POLICY IF EXISTS admin_profiles_select ON public.profiles;
DROP POLICY IF EXISTS lf_read ON public.locked_funds;
DROP POLICY IF EXISTS own_w_read ON public.withdrawals;
DROP POLICY IF EXISTS own_ledger ON public.points_ledger;
DROP POLICY IF EXISTS t_read ON public.tickets;
DROP POLICY IF EXISTS tm_read ON public.ticket_messages;
DROP POLICY IF EXISTS tm_update ON public.ticket_messages;
DROP POLICY IF EXISTS tm_delete ON public.ticket_messages;
DROP POLICY IF EXISTS ann_admin_write ON public.announcements;
DROP POLICY IF EXISTS promo_read ON public.promocodes;
DROP POLICY IF EXISTS promo_admin_write ON public.promocodes;
DROP POLICY IF EXISTS c_admin_write ON public.contests;
DROP POLICY IF EXISTS pl_admin ON public.postback_logs;
DROP POLICY IF EXISTS settings_write ON public.app_settings;
DROP POLICY IF EXISTS methods_write ON public.withdraw_methods;

-- Recreate policies using public.is_staff(auth.uid())
-- 1. profiles
CREATE POLICY admin_profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- 2. locked_funds
CREATE POLICY lf_read ON public.locked_funds FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- 3. withdrawals
CREATE POLICY own_w_read ON public.withdrawals FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- 4. points_ledger
CREATE POLICY own_ledger ON public.points_ledger FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- 5. tickets
CREATE POLICY t_read ON public.tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

-- 6. ticket_messages
CREATE POLICY tm_read ON public.ticket_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR public.is_staff(auth.uid()))));

CREATE POLICY tm_update ON public.ticket_messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (sender_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY tm_delete ON public.ticket_messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid() OR public.is_staff(auth.uid()));

-- 7. announcements
CREATE POLICY ann_admin_write ON public.announcements FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- 8. promocodes
CREATE POLICY promo_read ON public.promocodes FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR active);

CREATE POLICY promo_admin_write ON public.promocodes FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- 9. contests
CREATE POLICY c_admin_write ON public.contests FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- 10. postback_logs
CREATE POLICY pl_admin ON public.postback_logs FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- 11. settings
CREATE POLICY settings_write ON public.app_settings FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- 12. withdraw_methods
CREATE POLICY methods_write ON public.withdraw_methods FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
