
CREATE OR REPLACE FUNCTION public.add_app_role(p_value text, p_label text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_value text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  v_value := lower(regexp_replace(trim(p_value), '[^a-z0-9_]+', '_', 'g'));
  IF v_value IS NULL OR length(v_value) = 0 THEN
    RAISE EXCEPTION 'Valor inválido';
  END IF;

  -- Adiciona ao enum se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = v_value
  ) THEN
    EXECUTE format('ALTER TYPE public.app_role ADD VALUE %L', v_value);
  END IF;

  INSERT INTO public.role_catalog(value, label)
  VALUES (v_value, COALESCE(NULLIF(trim(p_label), ''), v_value))
  ON CONFLICT (value) DO UPDATE SET label = EXCLUDED.label;
END;
$$;

REVOKE ALL ON FUNCTION public.add_app_role(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_app_role(text, text) TO authenticated;
