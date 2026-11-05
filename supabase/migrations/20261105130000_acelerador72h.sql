-- Acelerador de Vendas 72h: progresso semanal interativo por usuário
create table if not exists public.acelerador72h_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text,
  data_inicio date,
  week_start date not null,
  steps jsonb not null default '[]'::jsonb,
  day1 jsonb not null default '[]'::jsonb,
  day2 jsonb not null default '[]'::jsonb,
  day3 jsonb not null default '[]'::jsonb,
  essenciais jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table public.acelerador72h_progress enable row level security;

drop policy if exists "Users manage own acelerador72h progress" on public.acelerador72h_progress;
create policy "Users manage own acelerador72h progress"
  on public.acelerador72h_progress
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins view all acelerador72h progress" on public.acelerador72h_progress;
create policy "Admins view all acelerador72h progress"
  on public.acelerador72h_progress
  for select
  using (has_role(auth.uid(), 'admin'::app_role));

create or replace function public.set_acelerador72h_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_acelerador72h_updated_at on public.acelerador72h_progress;
create trigger trg_acelerador72h_updated_at
  before update on public.acelerador72h_progress
  for each row execute function public.set_acelerador72h_updated_at();
