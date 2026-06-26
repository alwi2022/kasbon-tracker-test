create type public.debt_type as enum ('owed_to_me', 'i_owe');

create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.debt_type not null,
  counterpart_name text not null,
  amount bigint not null,
  note text,
  due_date date,
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint debts_amount_positive check (amount > 0),
  constraint debts_counterpart_name_not_empty check (length(btrim(counterpart_name)) > 0),
  constraint debts_note_max_length check (note is null or char_length(note) <= 200)
);

create index debts_user_id_idx on public.debts(user_id);
create index debts_user_status_type_idx on public.debts(user_id, settled_at, type);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger debts_set_updated_at
before update on public.debts
for each row
execute function public.set_updated_at();

alter table public.debts enable row level security;

create policy "User bisa lihat kasbon sendiri"
on public.debts
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "User bisa tambah kasbon sendiri"
on public.debts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "User bisa update kasbon sendiri"
on public.debts
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "User bisa hapus kasbon sendiri"
on public.debts
for delete
to authenticated
using ((select auth.uid()) = user_id);