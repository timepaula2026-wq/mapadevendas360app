
CREATE TABLE IF NOT EXISTS public.signup_error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  cpf TEXT,
  phone TEXT,
  unit TEXT,
  atividade TEXT,
  stage TEXT NOT NULL,
  status TEXT,
  message TEXT,
  details JSONB,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.signup_error_logs TO authenticated;
GRANT INSERT ON public.signup_error_logs TO anon, authenticated;
GRANT ALL ON public.signup_error_logs TO service_role;
ALTER TABLE public.signup_error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert signup error logs"
  ON public.signup_error_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Admins can view signup error logs"
  ON public.signup_error_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS idx_signup_error_logs_created_at ON public.signup_error_logs(created_at DESC);
