CREATE OR REPLACE FUNCTION public.log_login_event()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uname TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  SELECT COALESCE(NULLIF(name,''), split_part(email,'@',1)) INTO uname FROM public.profiles WHERE id = auth.uid();
  IF uname IS NULL THEN uname := 'Member'; END IF;
  INSERT INTO public.chat_feed (user_id, event_type, display_name, message)
  VALUES (auth.uid(), 'user_login', uname, uname || ' is online now');
END; $$;

REVOKE ALL ON FUNCTION public.log_login_event() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_login_event() TO authenticated;