-- Table to store icon grid order
CREATE TABLE public.icon_grid_order (
  id TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.icon_grid_order ENABLE ROW LEVEL SECURITY;

-- Everyone can read the order
CREATE POLICY "Anyone can read icon grid order"
ON public.icon_grid_order
FOR SELECT
USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert icon grid order"
ON public.icon_grid_order
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update icon grid order"
ON public.icon_grid_order
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete icon grid order"
ON public.icon_grid_order
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed with default order
INSERT INTO public.icon_grid_order (id, sort_order) VALUES
  ('trilha', 0),
  ('vendas', 1),
  ('ferramentas', 2),
  ('treinamentos', 3),
  ('carreira', 4),
  ('apresentacao', 5),
  ('sorteios', 6),
  ('credito', 7),
  ('jornada', 8),
  ('equipe', 9),
  ('cliente', 10),
  ('analise', 11),
  ('loja', 12),
  ('locacao', 13),
  ('presenca', 14);