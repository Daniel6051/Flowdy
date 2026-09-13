-- Plan del Día. Pegar en SQL Editor de Supabase si no usás CLI.
-- Data API ya está habilitada; si la tabla no aparece en REST: NOTIFY pgrst, 'reload schema';

create table if not exists public.plan_del_dia (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  fecha date not null,
  hora text not null,
  titulo text not null,
  descripcion text not null default '',
  color text not null,
  created_at timestamptz not null default now()
);

create index if not exists plan_del_dia_user_fecha_idx
  on public.plan_del_dia (user_id, fecha);

alter table public.plan_del_dia enable row level security;

drop policy if exists "plan_del_dia_select" on public.plan_del_dia;
drop policy if exists "plan_del_dia_insert" on public.plan_del_dia;
drop policy if exists "plan_del_dia_update" on public.plan_del_dia;
drop policy if exists "plan_del_dia_delete" on public.plan_del_dia;

create policy "plan_del_dia_select"
  on public.plan_del_dia for select
  using (auth.uid() = user_id);

create policy "plan_del_dia_insert"
  on public.plan_del_dia for insert
  with check (auth.uid() = user_id);

create policy "plan_del_dia_update"
  on public.plan_del_dia for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "plan_del_dia_delete"
  on public.plan_del_dia for delete
  using (auth.uid() = user_id);
