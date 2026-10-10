create table if not exists public.mywalk_sync (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 1,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.mywalk_sync enable row level security;
revoke all on public.mywalk_sync from anon, authenticated;
grant select on public.mywalk_sync to authenticated;
create policy "Read own devotional data" on public.mywalk_sync
  for select to authenticated using ((select auth.uid()) = user_id);

-- Compare-and-swap prevents a stale device from overwriting a newer save.
create or replace function public.mywalk_save(expected_revision bigint, new_data jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare next_revision bigint;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if jsonb_typeof(new_data) <> 'object' or octet_length(new_data::text) > 5000000 then
    raise exception 'Invalid devotional data';
  end if;
  if expected_revision = 0 then
    insert into public.mywalk_sync(user_id, data) values(auth.uid(), new_data)
      on conflict do nothing returning revision into next_revision;
  else
    update public.mywalk_sync set data = new_data, revision = revision + 1, updated_at = now()
      where user_id = auth.uid() and revision = expected_revision
      returning revision into next_revision;
  end if;
  return next_revision;
end $$;
revoke all on function public.mywalk_save(bigint, jsonb) from public, anon;
grant execute on function public.mywalk_save(bigint, jsonb) to authenticated;
