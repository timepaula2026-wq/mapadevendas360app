CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_cpf text;
BEGIN
  user_cpf := NEW.raw_user_meta_data->>'cpf';

  INSERT INTO public.profiles (user_id, display_name, phone, unit, unit_start_date, last_active_at, cpf, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'unit',
    COALESCE((NEW.raw_user_meta_data->>'unit_start_date')::date, CURRENT_DATE),
    now(),
    user_cpf,
    -- Auto-approve if CPF was provided (validated against Mapadevendas360 before signup)
    CASE WHEN user_cpf IS NOT NULL AND length(regexp_replace(user_cpf, '\D', '', 'g')) = 11 THEN true ELSE false END
  );
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();