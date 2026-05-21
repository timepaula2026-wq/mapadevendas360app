
-- Storage bucket for training files
INSERT INTO storage.buckets (id, name, public) VALUES ('training-files', 'training-files', true);

-- Storage policies
CREATE POLICY "Admins can upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'training-files' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update files" ON storage.objects FOR UPDATE USING (bucket_id = 'training-files' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete files" ON storage.objects FOR DELETE USING (bucket_id = 'training-files' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view training files" ON storage.objects FOR SELECT USING (bucket_id = 'training-files');

-- Add approved column to profiles
ALTER TABLE public.profiles ADD COLUMN approved boolean NOT NULL DEFAULT false;

-- Update RLS: admins can update any profile (for approval)
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
