-- 1) flag por conteúdo
ALTER TABLE public.section_contents
  ADD COLUMN IF NOT EXISTS allow_user_upload boolean NOT NULL DEFAULT false;

-- 2) tabela de envios do usuário
CREATE TABLE IF NOT EXISTS public.user_content_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES public.section_contents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_url text NOT NULL,
  file_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_id, user_id)
);

ALTER TABLE public.user_content_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own uploads"
  ON public.user_content_uploads FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all uploads"
  ON public.user_content_uploads FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users insert own uploads"
  ON public.user_content_uploads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own uploads"
  ON public.user_content_uploads FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own uploads"
  ON public.user_content_uploads FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins delete uploads"
  ON public.user_content_uploads FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_user_content_uploads_updated_at
  BEFORE UPDATE ON public.user_content_uploads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) bucket privado
INSERT INTO storage.buckets (id, name, public)
  VALUES ('user-uploads', 'user-uploads', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "User uploads: user reads own folder"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "User uploads: admins read all"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'user-uploads' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "User uploads: user writes own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "User uploads: user updates own folder"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "User uploads: user deletes own folder"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
