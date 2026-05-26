CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_cpf text;
  is_auto_approved boolean;
BEGIN
  user_cpf := NEW.raw_user_meta_data->>'cpf';
  is_auto_approved := COALESCE((NEW.raw_user_meta_data->>'auto_approved')::boolean, false);

  INSERT INTO public.profiles (user_id, display_name, phone, unit, unit_start_date, last_active_at, cpf, email, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'unit',
    COALESCE((NEW.raw_user_meta_data->>'unit_start_date')::date, CURRENT_DATE),
    now(),
    user_cpf,
    NEW.email,
    is_auto_approved
  );
  RETURN NEW;
END;
$function$;