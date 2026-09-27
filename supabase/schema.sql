-- TEAMCUT: skema inti untuk cabang, hairstylist, layanan global, dan antrean.

create table public.cabang (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  alamat text,
  tautan_maps text,
  jam_buka time,
  jam_tutup time,
  foto text,
  status boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.hairstylist (
  id uuid primary key default gen_random_uuid(),
  cabang_id uuid not null references public.cabang(id),
  nama text not null,
  foto text,
  bio text,
  nomor_whatsapp text,
  status boolean not null default true,
  created_at timestamptz not null default now()
);

create index hairstylist_cabang_id_idx
  on public.hairstylist (cabang_id);

create table public.layanan (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  deskripsi text,
  harga integer check (harga is null or harga >= 0),
  status boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.antrean (
  id uuid primary key default gen_random_uuid(),
  cabang_id uuid not null unique references public.cabang(id),
  jumlah integer not null default 0 check (jumlah >= 0),
  created_at timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);

create function public.perbarui_waktu_antrean()
returns trigger
language plpgsql
as $$
begin
  new.diperbarui_pada := now();
  return new;
end;
$$;

create trigger antrean_perbarui_waktu
before update of jumlah on public.antrean
for each row
when (old.jumlah is distinct from new.jumlah)
execute function public.perbarui_waktu_antrean();

-- Publikasikan perubahan antrean untuk Supabase Realtime bila publikasinya tersedia.
do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'antrean'
  ) then
    execute 'alter publication supabase_realtime add table public.antrean';
  end if;
end;
$$;
