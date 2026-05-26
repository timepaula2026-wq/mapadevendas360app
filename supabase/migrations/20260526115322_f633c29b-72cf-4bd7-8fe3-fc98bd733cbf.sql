ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

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
    CASE WHEN user_cpf IS NOT NULL AND length(regexp_replace(user_cpf, '\D', '', 'g')) = 11 THEN true ELSE false END
  );
  RETURN NEW;
END;
$function$;

-- Backfill emails from auth.users for existing profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND p.email IS NULL;