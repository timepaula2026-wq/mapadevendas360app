
-- QUIZZES
CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view quizzes" ON public.quizzes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners insert quizzes" ON public.quizzes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update quizzes" ON public.quizzes FOR UPDATE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Owners delete quizzes" ON public.quizzes FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));

CREATE TRIGGER quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- QUESTIONS
CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'multiple',
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  time_limit int NOT NULL DEFAULT 20,
  points int NOT NULL DEFAULT 100,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_quiz_questions_quiz ON public.quiz_questions(quiz_id, sort_order);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view questions" ON public.quiz_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners manage questions" ON public.quiz_questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND (q.user_id = auth.uid() OR has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND (q.user_id = auth.uid() OR has_role(auth.uid(),'admin'))));

-- SESSIONS
CREATE TABLE public.quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  host_id uuid NOT NULL,
  pin text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'lobby',
  current_question_index int NOT NULL DEFAULT -1,
  question_started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);
CREATE INDEX idx_quiz_sessions_pin ON public.quiz_sessions(pin) WHERE status <> 'ended';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_sessions TO authenticated;
GRANT ALL ON public.quiz_sessions TO service_role;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view sessions" ON public.quiz_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Hosts insert sessions" ON public.quiz_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts update sessions" ON public.quiz_sessions FOR UPDATE TO authenticated USING (auth.uid() = host_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Hosts delete sessions" ON public.quiz_sessions FOR DELETE TO authenticated USING (auth.uid() = host_id OR has_role(auth.uid(),'admin'));

-- PARTICIPANTS (track who joined)
CREATE TABLE public.quiz_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  display_name text NOT NULL,
  score int NOT NULL DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);
CREATE INDEX idx_participants_session ON public.quiz_participants(session_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_participants TO authenticated;
GRANT ALL ON public.quiz_participants TO service_role;
ALTER TABLE public.quiz_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view participants" ON public.quiz_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users join sessions" ON public.quiz_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Self or host update participants" ON public.quiz_participants FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.quiz_sessions s WHERE s.id = session_id AND s.host_id = auth.uid()));

-- RESPONSES
CREATE TABLE public.quiz_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  answer jsonb NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  points int NOT NULL DEFAULT 0,
  answered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_id, user_id)
);
CREATE INDEX idx_responses_session_q ON public.quiz_responses(session_id, question_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_responses TO authenticated;
GRANT ALL ON public.quiz_responses TO service_role;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Self or host view responses" ON public.quiz_responses FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.quiz_sessions s WHERE s.id = session_id AND (s.host_id = auth.uid() OR has_role(auth.uid(),'admin'))));
CREATE POLICY "Users insert own responses" ON public.quiz_responses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_responses;
