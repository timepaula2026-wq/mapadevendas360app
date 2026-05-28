CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_cpf text;
  is_auto_approved boolean;
  user_atividade text;
  has_matricula boolean;
BEGIN
  user_cpf := NEW.raw_user_meta_data->>'cpf';
  is_auto_approved := COALESCE((NEW.raw_user_meta_data->>'auto_approved')::boolean, false);
  user_atividade := NEW.raw_user_meta_data->>'atividade';
  has_matricula := length(trim(coalesce(user_cpf, ''))) > 0;

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

  -- Atribuição automática de papéis no cadastro
  IF user_atividade = 'iniciante' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'iniciante'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    IF has_matricula THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'autorizado'::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  ELSIF user_atividade = 'autorizado' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'autorizado'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Garante o trigger no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();