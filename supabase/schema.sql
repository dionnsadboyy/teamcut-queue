-- TEAMCUT V1: schema konten dan antrean realtime.
-- Tidak ada tabel pemesanan atau pembayaran.

create table if not exists public.cabang (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  alamat text,
  tautan_maps text,
  jam_buka time,
  jam_tutup time,
  foto text,
  status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.capsten (
  id uuid primary key default gen_random_uuid(),
  cabang_id uuid not null references public.cabang(id) on delete cascade,
  nama text not null,
  foto text,
  bio text,
  nomor_whatsapp text,
  status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cabang_id, nama)
);

-- Layanan berlaku global dan tidak memiliki cabang_id.
create table if not exists public.layanan (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  deskripsi text,
  harga integer not null check (harga >= 0),
  foto text,
  status boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Satu antrean per cabang, dikelola dari perangkat operator.
create table if not exists public.antrean (
  id uuid primary key default gen_random_uuid(),
  cabang_id uuid not null unique references public.cabang(id) on delete cascade,
  jumlah integer not null default 0 check (jumlah >= 0),
  diperbarui_pada timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portofolio (
  id uuid primary key default gen_random_uuid(),
  capsten_id uuid not null references public.capsten(id) on delete cascade,
  foto text not null,
  judul text,
  deskripsi text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sertifikat (
  id uuid primary key default gen_random_uuid(),
  capsten_id uuid not null references public.capsten(id) on delete cascade,
  foto text,
  nama text not null,
  penerbit text,
  tahun integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Data awal yang diketahui saja. Field lainnya sengaja dibiarkan kosong.
insert into public.cabang (nama) values
  ('Cikedokan'), ('Jati Wangi'), ('Jarakosta')
on conflict (nama) do nothing;

insert into public.capsten (cabang_id, nama)
select c.id, seed.nama
from (values
  ('Cikedokan', 'Babel'), ('Cikedokan', 'Qinoy'),
  ('Jati Wangi', 'Amir'), ('Jati Wangi', 'Iyong'), ('Jati Wangi', 'Ilham'),
  ('Jarakosta', 'Kiki'), ('Jarakosta', 'Aldo')
) as seed(cabang_nama, nama)
join public.cabang c on c.nama = seed.cabang_nama
on conflict (cabang_id, nama) do nothing;

insert into public.layanan (nama, harga) values
  ('Haircut', 40000), ('Perming', 250000)
on conflict (nama) do nothing;

insert into public.antrean (cabang_id)
select id from public.cabang
on conflict (cabang_id) do nothing;
