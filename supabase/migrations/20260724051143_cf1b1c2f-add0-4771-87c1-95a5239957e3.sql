
CREATE POLICY tm_update ON public.ticket_messages FOR UPDATE
  USING (sender_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (sender_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY tm_delete ON public.ticket_messages FOR DELETE
  USING (sender_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
