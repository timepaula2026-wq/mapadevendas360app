CREATE TABLE public.planejamento_form_drafts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  form_key text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, form_key)
);

ALTER TABLE public.planejamento_form_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own planejamento drafts"
ON public.planejamento_form_drafts FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users insert own planejamento drafts"
ON public.planejamento_form_drafts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own planejamento drafts"
ON public.planejamento_form_drafts FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users delete own planejamento drafts"
ON public.planejamento_form_drafts FOR DELETE TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER planejamento_form_drafts_updated_at
BEFORE UPDATE ON public.planejamento_form_drafts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_planejamento_form_drafts_user_key ON public.planejamento_form_drafts (user_id, form_key);