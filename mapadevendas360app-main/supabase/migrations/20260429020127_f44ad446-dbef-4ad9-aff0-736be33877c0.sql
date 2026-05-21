ALTER TABLE public.icon_grid_order
ADD COLUMN IF NOT EXISTS icon_name text,
ADD COLUMN IF NOT EXISTS route text,
ADD COLUMN IF NOT EXISTS is_custom boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_label text;

INSERT INTO public.icon_grid_order (id, sort_order, visible, custom_label, icon_name, route, is_custom)
VALUES
  ('trilha', 0, true, 'Trilha do Iniciante', 'Rocket', '/trilha', false),
  ('vendas', 1, true, 'Central de Vendas & CRM', 'BarChart3', '/vendas', false),
  ('ferramentas', 2, true, 'Acessos de Ferramentas', 'Wrench', '/ferramentas', false),
  ('treinamentos', 3, true, 'Treinamentos', 'GraduationCap', '/trainings', false),
  ('carreira', 4, true, 'Plano de Carreira', 'Trophy', '/carreira', false),
  ('apresentacao', 5, true, 'Apresentação de Produtos', 'FileText', '/apresentacao', false),
  ('sorteios', 6, true, 'Sorteios & Comunicados', 'Gift', '/sorteios', false),
  ('credito', 7, true, 'Liberação de Crédito', 'CreditCard', '/credito', false),
  ('jornada', 8, true, 'Jornada Impacto', 'MapPin', '/jornada', false),
  ('equipe', 9, true, 'Gestão de Equipe', 'Users', '/equipe', false),
  ('cliente', 10, true, 'Área do Cliente', 'Globe', '/cliente', false),
  ('administrativo', 11, true, 'Gestão de Performance 360', 'Briefcase', '/administrativo', false),
  ('agenda', 12, true, 'Agenda Online', 'CalendarDays', '/agenda', false),
  ('paula', 13, true, 'Fale com a Paula', 'MessageCircleHeart', '/fale-com-paula', false),
  ('comissao', 14, true, 'Comissão', 'DollarSign', '/comissao', false),
  ('lideres', 15, true, 'Escola de Líderes', 'School', '/lideres', false)
ON CONFLICT (id) DO UPDATE SET
  icon_name = COALESCE(public.icon_grid_order.icon_name, EXCLUDED.icon_name),
  route = COALESCE(public.icon_grid_order.route, EXCLUDED.route),
  is_custom = false,
  custom_label = COALESCE(public.icon_grid_order.custom_label, EXCLUDED.custom_label),
  updated_at = now();

UPDATE public.icon_grid_order
SET sort_order = ranked.new_order,
    updated_at = now()
FROM (
  SELECT id, row_number() OVER (ORDER BY sort_order, id) - 1 AS new_order
  FROM public.icon_grid_order
) ranked
WHERE public.icon_grid_order.id = ranked.id;