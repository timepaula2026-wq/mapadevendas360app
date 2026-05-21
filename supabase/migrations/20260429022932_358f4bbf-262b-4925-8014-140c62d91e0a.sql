-- 1. Adicionar novos valores ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'iniciante';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'autorizado';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'supervisor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'secretaria';

-- 2. Permitir admin gerenciar user_roles
CREATE POLICY "Admins can view all user_roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert user_roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user_roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user_roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Coluna allowed_roles em icon_grid_order
ALTER TABLE public.icon_grid_order
ADD COLUMN IF NOT EXISTS allowed_roles text[] NOT NULL DEFAULT ARRAY[]::text[];

-- 4. Tabela app_settings (singleton)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id text PRIMARY KEY DEFAULT 'default',
  primary_color text NOT NULL DEFAULT '348 70% 35%',
  background_color text NOT NULL DEFAULT '0 0% 7%',
  text_color text NOT NULL DEFAULT '0 0% 98%',
  header_title text NOT NULL DEFAULT 'Mapa de Vendas',
  header_logo_url text,
  header_alignment text NOT NULL DEFAULT 'center',
  show_header boolean NOT NULL DEFAULT true,
  display_mode text NOT NULL DEFAULT 'grid',
  favicon_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app_settings"
ON public.app_settings FOR SELECT USING (true);

CREATE POLICY "Admins can insert app_settings"
ON public.app_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update app_settings"
ON public.app_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insere linha singleton padrão
INSERT INTO public.app_settings (id) VALUES ('default')
ON CONFLICT (id) DO NOTHING;