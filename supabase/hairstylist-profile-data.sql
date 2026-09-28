begin;

alter table public.hairstylist
  add column if not exists instagram text,
  add column if not exists keunggulan text;

do $$
declare
  updated_rows integer;
begin
  update public.hairstylist as hairstylist
  set instagram = profile.instagram,
      keunggulan = profile.keunggulan
  from (
    values
      ('babel', '@irfan_angga14', 'Detail • Kenyamanan • Sesuai karakter'),
      ('aldo', '@uciwio_saskeh69', 'Clean • Classic • Modern'),
      ('amir', '@amirdisiniiii', 'Bentuk wajah • Detail • Kualitas'),
      ('iyong', '@diorandalus', 'Teliti • Fresh • Clean'),
      ('ilham', '@Ilhamfchrurrzi_', 'Bentuk wajah • Detail • Konsultasi style'),
      ('kiki', '@q_kied', 'Nyaman • Rapi • Sesuai style'),
      ('qinoy', '@qiii_noy', 'Detail • Clean • Mudah diatur')
  ) as profile(nama, instagram, keunggulan)
  where lower(btrim(hairstylist.nama)) = profile.nama;

  get diagnostics updated_rows = row_count;
  if updated_rows <> 7 then
    raise exception 'Diharapkan memperbarui 7 profil hairstylist, tetapi hanya % baris cocok. Transaksi dibatalkan.', updated_rows;
  end if;
end;
$$;

commit;

select nama, instagram, keunggulan
from public.hairstylist
where lower(btrim(nama)) in ('babel', 'aldo', 'amir', 'iyong', 'ilham', 'kiki', 'qinoy')
order by nama;
