grant usage on schema public to anon, authenticated;

alter table public.cabang enable row level security;
alter table public.hairstylist enable row level security;
alter table public.layanan enable row level security;
alter table public.antrean enable row level security;

revoke all on table public.cabang from public, anon, authenticated;
revoke all on table public.hairstylist from public, anon, authenticated;
revoke all on table public.layanan from public, anon, authenticated;
revoke all on table public.antrean from public, anon, authenticated;

grant select on table public.cabang, public.hairstylist, public.layanan, public.antrean
  to anon, authenticated;
grant update (status) on table public.cabang to authenticated;
grant update (jumlah) on table public.antrean to authenticated;

drop policy if exists "Public can read cabang" on public.cabang;
create policy "Public can read cabang"
  on public.cabang for select to anon, authenticated
  using (true);

drop policy if exists "Public can read hairstylist" on public.hairstylist;
create policy "Public can read hairstylist"
  on public.hairstylist for select to anon, authenticated
  using (true);

drop policy if exists "Public can read layanan" on public.layanan;
create policy "Public can read layanan"
  on public.layanan for select to anon, authenticated
  using (true);

drop policy if exists "Public can read antrean" on public.antrean;
create policy "Public can read antrean"
  on public.antrean for select to anon, authenticated
  using (true);

drop policy if exists "Admins can update cabang status" on public.cabang;
create policy "Admins can update cabang status"
  on public.cabang for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can update antrean" on public.antrean;
create policy "Admins can update antrean"
  on public.antrean for update to authenticated
  using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

comment on policy "Admins can update cabang status" on public.cabang is
  'Admin claim must be set in auth.users.app_metadata as {"role":"admin"}.';
comment on policy "Admins can update antrean" on public.antrean is
  'Admin claim must be set in auth.users.app_metadata as {"role":"admin"}.';

do $$
begin
  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) and not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'antrean'
  ) then
    execute 'alter publication supabase_realtime add table public.antrean';
  end if;

  if exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) and not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'cabang'
  ) then
    execute 'alter publication supabase_realtime add table public.cabang';
  end if;
end;
$$;
