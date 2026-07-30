-- Drop old policies checking only 'admin' role
DROP POLICY IF EXISTS surveys_read ON public.surveys;
DROP POLICY IF EXISTS surveys_admin_write ON public.surveys;

-- Recreate policies using public.is_staff(auth.uid())
CREATE POLICY surveys_read ON public.surveys FOR SELECT TO authenticated, anon
  USING (active OR public.is_staff(auth.uid()));

CREATE POLICY surveys_admin_write ON public.surveys FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
