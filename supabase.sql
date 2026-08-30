-- Таблица прогресса тренажёра. Выполнить один раз в SQL Editor проекта Supabase.
create table if not exists public.yoko_progress (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  known      jsonb not null default '{}'::jsonb,
  cleared    jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.yoko_progress enable row level security;

drop policy if exists "yoko own select" on public.yoko_progress;
drop policy if exists "yoko own insert" on public.yoko_progress;
drop policy if exists "yoko own update" on public.yoko_progress;

create policy "yoko own select" on public.yoko_progress
  for select using (auth.uid() = user_id);
create policy "yoko own insert" on public.yoko_progress
  for insert with check (auth.uid() = user_id);
create policy "yoko own update" on public.yoko_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- Отсканированные чеки. Нужны, чтобы заказ, снятый на телефоне,
-- открывался на планшете. Фото не хранится — только разобранный
-- состав, это несколько сотен байт на заказ.
-- ---------------------------------------------------------------
create table if not exists public.yoko_orders (
  user_id    uuid not null references auth.users(id) on delete cascade,
  id         text not null,
  payload    jsonb not null,
  mt         bigint not null,
  deleted    boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.yoko_orders enable row level security;

drop policy if exists "yoko orders select" on public.yoko_orders;
drop policy if exists "yoko orders insert" on public.yoko_orders;
drop policy if exists "yoko orders update" on public.yoko_orders;

create policy "yoko orders select" on public.yoko_orders
  for select using (auth.uid() = user_id);
create policy "yoko orders insert" on public.yoko_orders
  for insert with check (auth.uid() = user_id);
create policy "yoko orders update" on public.yoko_orders
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
