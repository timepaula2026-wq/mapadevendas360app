-- Atualiza a função de revogação por inatividade:
-- 1. Aplica a todos os papéis (não só iniciante)
-- 2. Prazo reduzido para 10 dias (antes era 15)
-- 3. Exclui admins e secretarias (papel de gestão não perde acesso por inatividade)

CREATE OR REPLACE FUNCTION public.revoke_inactive_iniciantes()
RETURNS TABLE(revoked_user_id uuid, display_name text, last_active_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  policy_start_date timestamptz := '2026-06-15 00:00:00+00';
BEGIN
  IF now() < policy_start_date THEN RETURN; END IF;

  RETURN QUERY
  UPDATE public.profiles p
     SET approved = false, updated_at = now()
   WHERE p.approved = true
     AND p.last_active_at IS NOT NULL
     AND GREATEST(p.last_active_at, policy_start_date) < (now() - interval '10 days')
     -- Exclui admins, secretarias e gestores (papéis de gestão não perdem acesso por inatividade)
     AND NOT EXISTS (
       SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = p.user_id
          AND ur.role IN ('admin'::app_role, 'secretaria'::app_role, 'gestor'::app_role)
     )
  RETURNING p.user_id, p.display_name, p.last_active_at;
END;
$$;
