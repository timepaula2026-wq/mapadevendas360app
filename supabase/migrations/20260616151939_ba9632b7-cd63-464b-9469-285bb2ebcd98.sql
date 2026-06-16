
-- 1) Add escola_lideres to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'escola_lideres';

-- 2) Roles catalog table (labels for roles)
CREATE TABLE IF NOT EXISTS public.role_catalog (
  value text PRIMARY KEY,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.role_catalog TO authenticated, anon;
GRANT ALL ON public.role_catalog TO service_role;

ALTER TABLE public.role_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_catalog_read_all" ON public.role_catalog
  FOR SELECT USING (true);

CREATE POLICY "role_catalog_admin_write" ON public.role_catalog
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed defaults
INSERT INTO public.role_catalog(value, label) VALUES
  ('iniciante','Iniciante'),
  ('autorizado','Autorizado'),
  ('supervisor','Supervisor'),
  ('gestor','Gestor'),
  ('secretaria','Secretaria'),
  ('admin','Admin'),
  ('escola_lideres','Escola de Líderes')
ON CONFLICT (value) DO NOTHING;
