-- Progresso por conteúdo
CREATE TABLE public.trilha_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  section_id text NOT NULL,
  content_id uuid NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_id)
);

CREATE INDEX idx_trilha_progress_user_section ON public.trilha_progress(user_id, section_id);

ALTER TABLE public.trilha_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
  ON public.trilha_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.trilha_progress FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
  ON public.trilha_progress FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all progress"
  ON public.trilha_progress FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Certificados emitidos
CREATE TABLE public.trilha_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  section_id text NOT NULL,
  -- scope: 'tab' (uma aba) ou 'section' (seção inteira) ou 'global' (toda a trilha)
  scope text NOT NULL DEFAULT 'tab',
  scope_ref text,
  title text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, section_id, scope, scope_ref)
);

CREATE INDEX idx_trilha_certificates_user ON public.trilha_certificates(user_id);

ALTER TABLE public.trilha_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own certificates"
  ON public.trilha_certificates FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own certificates"
  ON public.trilha_certificates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all certificates"
  ON public.trilha_certificates FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));