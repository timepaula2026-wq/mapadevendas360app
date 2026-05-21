
-- Allow admins to delete notifications
CREATE POLICY "Admins can delete notifications"
ON public.notifications FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));
