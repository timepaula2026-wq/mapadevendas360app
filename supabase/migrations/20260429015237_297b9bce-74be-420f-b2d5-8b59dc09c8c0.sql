ALTER TABLE public.icon_grid_order
  ADD COLUMN IF NOT EXISTS icon_name text,
  ADD COLUMN IF NOT EXISTS route text,
  ADD COLUMN IF NOT EXISTS is_custom boolean NOT NULL DEFAULT false;

-- Garantir que admins consigam inserir novas linhas (caso ainda não exista política)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'icon_grid_order' AND policyname = 'Admins can insert icon_grid_order'
  ) THEN
    CREATE POLICY "Admins can insert icon_grid_order"
    ON public.icon_grid_order
    FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;