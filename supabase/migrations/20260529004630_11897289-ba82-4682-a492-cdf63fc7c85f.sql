
CREATE TABLE public.deleted_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  display_name text,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  deleted_by uuid,
  reason text
);

CREATE INDEX idx_deleted_accounts_email ON public.deleted_accounts (lower(email));

GRANT SELECT, INSERT ON public.deleted_accounts TO authenticated;
GRANT ALL ON public.deleted_accounts TO service_role;

ALTER TABLE public.deleted_accounts ENABLE ROW LEVEL SECURITY;

-- Admins can view full history
CREATE POLICY "Admins view deleted accounts"
  ON public.deleted_accounts FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Public RPC to check if an email was previously deleted (does not expose data)
CREATE OR REPLACE FUNCTION public.was_email_deleted(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.deleted_accounts
    WHERE lower(email) = lower(trim(_email))
  );
$$;

GRANT EXECUTE ON FUNCTION public.was_email_deleted(text) TO anon, authenticated;
