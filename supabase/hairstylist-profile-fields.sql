alter table public.hairstylist
  add column if not exists instagram text,
  add column if not exists keunggulan text;

update public.hairstylist as hairstylist
set bio = profile.bio,
    instagram = profile.instagram,
    keunggulan = profile.keunggulan
from (
  values
    (
      'aldo',
      'Setiap orang punya karakter dan style yang berbeda. Tugas saya adalah membantu menemukan potongan yang paling cocok untuk penampilan kamu.',
      '@uciwio_saskeh69',
      'Clean • Classic • Modern'
    ),
    (
      'amir',
      'Potongan rambut bukan hanya tentang terlihat rapi, tetapi juga tentang bagaimana kamu merasa lebih nyaman dan percaya diri dengan penampilan sendiri.',
      '@amirdisiniiii',
      'Bentuk wajah • Detail • Kualitas'
    ),
    (
      'babel',
      'Saya siap membantu kamu mendapatkan potongan rambut yang rapi, fresh, dan sesuai dengan karakter serta gaya yang kamu inginkan.',
      '@irfan_angga14',
      'Detail • Kenyamanan • Sesuai karakter'
    ),
    (
      'ilham',
      'Saya percaya haircut yang bagus adalah haircut yang sesuai dengan karakter dan kebutuhan setiap customer.',
      '@Ilhamfchrurrzi_',
      'Bentuk wajah • Detail • Konsultasi style'
    ),
    (
      'iyong',
      'Siap membantu kamu mendapatkan tampilan rambut yang lebih fresh, clean, dan sesuai dengan kebutuhan sehari-hari.',
      '@diorandalus',
      'Teliti • Fresh • Clean'
    ),
    (
      'kiki',
      'Memberikan pengalaman haircut yang nyaman dengan hasil yang rapi, clean, dan sesuai dengan style setiap customer.',
      '@q_kied',
      'Nyaman • Rapi • Sesuai style'
    ),
    (
      'qinoy',
      'Penampilan yang baik dimulai dari detail yang tepat. Saya siap membantu kamu mendapatkan haircut yang clean, fresh, dan sesuai dengan karakter serta gaya pribadi kamu.',
      '@qiii_noy',
      'Detail • Clean • Mudah diatur'
    )
) as profile(nama, bio, instagram, keunggulan)
where lower(btrim(hairstylist.nama)) = profile.nama;
