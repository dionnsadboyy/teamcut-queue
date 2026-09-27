'use strict';

const ADMIN_WHATSAPP = '6285212034230';
const SHOW_HAIRSTYLIST_PHOTOS = true;
// Kapasitas roster delapan orang; satu nama Cikedokan masih menunggu konfirmasi.
const BRANCH_HAIRSTYLIST_SLOTS = Object.freeze({
  cikedokan: 3,
  'jati-wangi': 3,
  jarakosta: 2
});

// Data profil awal; foto tersedia sebagian, detail lain dapat diisi saat sudah diberikan.
const HAIRSTYLIST_DATA = [
  { id: 'babel', branch: 'cikedokan', name: 'Babel', photo: './assets/images/hairstylist-babel.png', bio: null, whatsapp: null, certificates: [], portfolio: [] },
  { id: 'qinoy', branch: 'cikedokan', name: 'Qinoy', photo: './assets/images/hairstylist-qinoy.png', bio: null, whatsapp: null, certificates: [], portfolio: [] },
  { id: 'amir', branch: 'jati-wangi', name: 'Amir', photo: './assets/images/hairstylist-amir.png', bio: null, whatsapp: null, certificates: [], portfolio: [] },
  { id: 'iyong', branch: 'jati-wangi', name: 'Iyong', photo: './assets/images/hairstylist-iyong.png', bio: null, whatsapp: null, certificates: [], portfolio: [] },
  { id: 'ilham', branch: 'jati-wangi', name: 'Ilham', photo: './assets/images/hairstylist-ilham.png', bio: null, whatsapp: null, certificates: [], portfolio: [] },
  { id: 'kiki', branch: 'jarakosta', name: 'Kiki', photo: null, bio: null, whatsapp: null, certificates: [], portfolio: [] },
  { id: 'aldo', branch: 'jarakosta', name: 'Aldo', photo: './assets/images/hairstylist-aldo.png', bio: null, whatsapp: null, certificates: [], portfolio: [] }
];

const BRANCH_NAMES = Object.freeze({
  cikedokan: 'Cikedokan',
  'jati-wangi': 'Jati Wangi',
  jarakosta: 'Jarakosta'
});

function setCurrentYear() {
  const year = document.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());
}

function setupSiteMenu() {
  const header = document.querySelector('.site-header');
  const toggle = header?.querySelector('.menu-toggle');
  const menu = header?.querySelector('#site-nav');
  if (!header || !toggle || !menu) return;

  function setMenuOpen(isOpen, returnFocus = false) {
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Tutup menu' : 'Buka menu');
    menu.hidden = !isOpen;
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => {
    setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenuOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !menu.hidden) {
      setMenuOpen(false, true);
    }
  });

  document.addEventListener('click', (event) => {
    if (!menu.hidden && !header.contains(event.target)) setMenuOpen(false);
  });
}

// TODO: Sambungkan Supabase Realtime untuk memperbarui antrean per cabang.
function subscribeToRealtimeQueue() {
  // Satu antrean berlaku untuk setiap cabang, bukan untuk setiap hairstylist.
}

function setupBranchSwitching() {
  const track = document.querySelector('#branch-track');
  if (!track) return;

  const slides = Array.from(track.querySelectorAll('[data-branch-slide]'));
  const markers = Array.from(document.querySelectorAll('[data-slide-to]'));
  const currentPage = document.querySelector('[data-branch-current]');
  const previousButton = document.querySelector('[data-branch-prev]');
  const nextButton = document.querySelector('[data-branch-next]');
  let activeIndex = 0;

  function updateNavigation() {
    if (currentPage) currentPage.textContent = String(activeIndex + 1).padStart(2, '0');
    markers.forEach((marker, index) => {
      if (index === activeIndex) marker.setAttribute('aria-current', 'true');
      else marker.removeAttribute('aria-current');
    });
    if (previousButton) previousButton.disabled = activeIndex === 0;
    if (nextButton) nextButton.disabled = activeIndex === slides.length - 1;
  }

  function goToSlide(index) {
    activeIndex = Math.max(0, Math.min(index, slides.length - 1));
    track.scrollTo({
      left: slides[activeIndex].offsetLeft - slides[0].offsetLeft,
      behavior: 'smooth'
    });
    updateNavigation();
  }

  function getNearestSlideIndex() {
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    const firstSlideOffset = slides[0].offsetLeft;

    slides.forEach((slide, index) => {
      const distance = Math.abs(track.scrollLeft - (slide.offsetLeft - firstSlideOffset));
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  }

  markers.forEach((marker) => {
    marker.addEventListener('click', () => goToSlide(Number(marker.dataset.slideTo)));
  });
  if (previousButton) previousButton.addEventListener('click', () => goToSlide(activeIndex - 1));
  if (nextButton) nextButton.addEventListener('click', () => goToSlide(activeIndex + 1));

  track.addEventListener('scroll', () => {
    window.requestAnimationFrame(() => {
      activeIndex = getNearestSlideIndex();
      updateNavigation();
    });
  }, { passive: true });

  track.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') goToSlide(activeIndex + 1);
    if (event.key === 'ArrowLeft') goToSlide(activeIndex - 1);
  });

  document.querySelectorAll('[data-roster-more]').forEach((button) => {
    button.addEventListener('click', () => {
      const gallery = button.closest('[data-branch-slide]')?.querySelector('.hairstylist-gallery');
      if (gallery) gallery.scrollTo({ left: gallery.scrollWidth, behavior: 'smooth' });
    });
  });

  updateNavigation();
}

function createHairstylistAvatar(name) {
  const avatar = document.createElement('span');
  avatar.className = 'hairstylist-avatar';
  avatar.setAttribute('aria-hidden', 'true');

  if (name) {
    const words = name.trim().split(/\s+/);
    const initials = words.length > 1
      ? words.map((word) => word[0]).join('')
      : name.slice(0, 2);
    avatar.textContent = initials.toUpperCase();
    return avatar;
  }

  avatar.classList.add('is-generic');
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('viewBox', '0 0 64 64');
  icon.setAttribute('focusable', 'false');
  const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  head.setAttribute('cx', '32');
  head.setAttribute('cy', '22');
  head.setAttribute('r', '12');
  const shoulders = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  shoulders.setAttribute('d', 'M8 60c1-15 10-23 24-23s23 8 24 23H8Z');
  icon.append(head, shoulders);
  avatar.append(icon);
  return avatar;
}

function addPhoto(container, photo, altText) {
  if (!photo) return;

  const image = document.createElement('img');
  image.src = photo;
  image.alt = altText;
  image.loading = 'lazy';
  image.addEventListener('load', () => {
    container.querySelector('.hairstylist-avatar')?.remove();
  }, { once: true });
  image.addEventListener('error', () => image.remove(), { once: true });
  container.append(image);
}

function createHairstylistCard(profile) {
  const card = document.createElement('button');
  card.className = 'hairstylist-card';
  card.type = 'button';
  card.dataset.hairstylistId = profile.id;
  card.setAttribute('aria-label', `Lihat detail hairstylist ${profile.name}`);

  const photo = document.createElement('span');
  photo.className = 'hairstylist-card-photo';
  photo.setAttribute('aria-hidden', 'true');
  photo.append(createHairstylistAvatar(profile.name));
  if (SHOW_HAIRSTYLIST_PHOTOS && profile.photo) addPhoto(photo, profile.photo, '');

  const caption = document.createElement('span');
  caption.className = 'hairstylist-card-caption';

  const name = document.createElement('strong');
  name.textContent = profile.name;

  const role = document.createElement('small');
  role.textContent = 'HAIRSTYLIST';

  const arrow = document.createElement('i');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '→';

  caption.append(name, role, arrow);
  card.append(photo, caption);
  return card;
}

function createUnlistedSlot() {
  const slot = document.createElement('div');
  slot.className = 'hairstylist-card is-placeholder';
  slot.setAttribute('aria-hidden', 'true');
  const photo = document.createElement('span');
  photo.className = 'hairstylist-card-photo';
  photo.append(createHairstylistAvatar(null));
  slot.append(photo);
  return slot;
}

// Roster awal lokal; nantinya dapat diganti dengan data tabel hairstylist di Supabase.
function loadHairstylistData() {
  document.querySelectorAll('[data-hairstylist-list]').forEach((gallery) => {
    const branch = gallery.dataset.hairstylistList;
    const profiles = HAIRSTYLIST_DATA.filter((profile) => profile.branch === branch);
    const slots = BRANCH_HAIRSTYLIST_SLOTS[branch] || profiles.length;

    gallery.replaceChildren(...profiles.map(createHairstylistCard));
    for (let index = profiles.length; index < slots; index += 1) {
      gallery.append(createUnlistedSlot());
    }
  });
}

function setProfilePhoto(container, profile) {
  container.replaceChildren();
  container.append(createHairstylistAvatar(profile.name));
  container.setAttribute('aria-label', `Avatar ${profile.name}`);

  if (!SHOW_HAIRSTYLIST_PHOTOS || !profile.photo) return;

  const image = document.createElement('img');
  image.src = profile.photo;
  image.alt = '';
  image.addEventListener('load', () => {
    container.querySelector('.hairstylist-avatar')?.remove();
    container.setAttribute('aria-label', `Foto ${profile.name}`);
  }, { once: true });
  image.addEventListener('error', () => image.remove(), { once: true });
  container.append(image);
}

function renderProfileCollection(container, entries, emptyMessage, makeEntry) {
  container.replaceChildren();
  if (!Array.isArray(entries) || entries.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = emptyMessage;
    container.append(empty);
    return;
  }

  const list = document.createElement('ul');
  list.className = 'hairstylist-detail-list';
  entries.forEach((entry) => list.append(makeEntry(entry)));
  container.append(list);
}

function createCertificateEntry(certificate) {
  const item = document.createElement('li');
  item.className = 'hairstylist-detail-entry';
  const title = document.createElement('strong');
  title.textContent = certificate.name || 'Sertifikat';
  item.append(title);

  const details = [certificate.issuer, certificate.year].filter(Boolean).join(' · ');
  if (details) {
    const description = document.createElement('span');
    description.textContent = details;
    item.append(description);
  }
  return item;
}

function createPortfolioEntry(work) {
  const item = document.createElement('li');
  item.className = 'hairstylist-detail-entry';
  if (work.photo) addPhoto(item, work.photo, work.title || 'Foto portfolio');

  if (work.title) {
    const title = document.createElement('strong');
    title.textContent = work.title;
    item.append(title);
  }
  if (work.description) {
    const description = document.createElement('span');
    description.textContent = work.description;
    item.append(description);
  }
  return item;
}

function setupHairstylistDetails() {
  const dialog = document.querySelector('#hairstylist-dialog');
  if (!dialog) return;

  const nameField = dialog.querySelector('[data-detail-name]');
  const branchField = dialog.querySelector('[data-detail-branch]');
  const photoField = dialog.querySelector('[data-detail-photo]');
  const bioField = dialog.querySelector('[data-detail-bio]');
  const certificatesField = dialog.querySelector('[data-detail-certificates]');
  const portfolioField = dialog.querySelector('[data-detail-portfolio]');
  const bookingLink = dialog.querySelector('[data-detail-booking]');

  document.querySelectorAll('[data-hairstylist-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const profile = HAIRSTYLIST_DATA.find((item) => item.id === button.dataset.hairstylistId);
      if (!profile) return;

      const branchName = BRANCH_NAMES[profile.branch] || '';
      nameField.textContent = profile.name;
      branchField.textContent = branchName.toUpperCase();
      setProfilePhoto(photoField, profile);
      bioField.textContent = profile.bio || 'Bio belum tersedia.';
      renderProfileCollection(certificatesField, profile.certificates, 'Sertifikat belum tersedia.', createCertificateEntry);
      renderProfileCollection(portfolioField, profile.portfolio, 'Portfolio belum tersedia.', createPortfolioEntry);

      const phone = (profile.whatsapp || ADMIN_WHATSAPP).replace(/\D/g, '');
      const message = `Halo TEAMCUT, saya ingin bertanya tentang booking dengan hairstylist ${profile.name} di cabang ${branchName}.`;
      bookingLink.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      dialog.showModal();
    });
  });

  const closeButton = dialog.querySelector('[data-hairstylist-close]');
  if (closeButton) closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setCurrentYear();
  setupSiteMenu();
  subscribeToRealtimeQueue();
  setupBranchSwitching();
  loadHairstylistData();
  setupHairstylistDetails();
});
