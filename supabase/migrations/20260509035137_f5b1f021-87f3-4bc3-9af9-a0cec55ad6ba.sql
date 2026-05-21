CREATE TABLE public.planejamento_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  meta_prospec integer NOT NULL DEFAULT 0,
  meta_atendimentos integer NOT NULL DEFAULT 0,
  meta_vendas_lar integer NOT NULL DEFAULT 0,
  meta_vendas_motors integer NOT NULL DEFAULT 0,
  meta_faturamento numeric NOT NULL DEFAULT 0,
  realizado_prospec integer NOT NULL DEFAULT 0,
  realizado_atendimentos integer NOT NULL DEFAULT 0,
  realizado_vendas_lar integer NOT NULL DEFAULT 0,
  realizado_vendas_motors integer NOT NULL DEFAULT 0,
  realizado_faturamento numeric NOT NULL DEFAULT 0,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

ALTER TABLE public.planejamento_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own planejamento"
ON public.planejamento_entries FOR SELECT TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users insert own planejamento"
ON public.planejamento_entries FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own planejamento"
ON public.planejamento_entries FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users delete own planejamento"
ON public.planejamento_entries FOR DELETE TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER planejamento_entries_updated_at
BEFORE UPDATE ON public.planejamento_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_planejamento_user_week ON public.planejamento_entries (user_id, week_start DESC);