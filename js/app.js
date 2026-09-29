import {
  getSupabaseConfigError,
  isSupabaseConfigured,
  supabase,
} from "./supabase.js";
import {
  setBookingFormUnavailable,
  setupBookingForm,
} from "./booking.js";

const BRANCH_PHOTO_FALLBACKS = {
  cikedokan: "./assets/images/gallery/cikedokan/01-exterior-sign.jpeg",
  jatiwangi: "./assets/images/gallery/jatiwangi/01-main-floor.jpeg",
  jarakosta: "./assets/images/gallery/jarakosta/02-interior-wide.jpeg",
};

let branches = [];
let hairstylists = [];
let services = [];
let queuesByBranch = new Map();
let branchSlidesById = new Map();
let activeBranchId = null;

function setCurrentYear() {
  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function setupSiteMenu() {
  const header = document.querySelector(".site-header");
  const toggle = header?.querySelector(".menu-toggle");
  const menu = header?.querySelector("#site-nav");
  if (!header || !toggle || !menu) return;

  let closeTimer = 0;
  function setMenuOpen(isOpen, returnFocus = false) {
    window.clearTimeout(closeTimer);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Tutup menu" : "Buka menu");
    menu.setAttribute("aria-hidden", String(!isOpen));
    menu.inert = !isOpen;
    if (isOpen) {
      menu.hidden = false;
      window.requestAnimationFrame(() => menu.classList.add("is-open"));
    } else {
      menu.classList.remove("is-open");
      closeTimer = window.setTimeout(() => { menu.hidden = true; }, 240);
    }
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener("click", () => {
    setMenuOpen(toggle.getAttribute("aria-expanded") !== "true");
  });
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.classList.contains("is-open")) setMenuOpen(false, true);
  });
  document.addEventListener("click", (event) => {
    if (menu.classList.contains("is-open") && !header.contains(event.target)) setMenuOpen(false);
  });
}

function setupMobileBottomNavigation() {
  const navigation = document.querySelector("[data-mobile-bottom-nav]");
  const links = Array.from(navigation?.querySelectorAll("[data-mobile-nav-link]") || []);
  const sections = links
    .map((link) => document.getElementById(link.hash.slice(1)))
    .filter(Boolean);
  if (!navigation || !links.length || !sections.length) return;

  let updateScheduled = false;
  function updateActiveLink() {
    updateScheduled = false;
    const activationLine = window.innerHeight * 0.42;
    let activeSection = sections[0];
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= activationLine) activeSection = section;
    });
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      activeSection = sections[sections.length - 1];
    }

    links.forEach((link) => {
      const isActive = link.hash === `#${activeSection.id}`;
      link.classList.toggle("is-active", isActive);
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  function scheduleActiveLinkUpdate() {
    if (updateScheduled) return;
    updateScheduled = true;
    window.requestAnimationFrame(updateActiveLink);
  }

  window.addEventListener("scroll", scheduleActiveLinkUpdate, { passive: true });
  window.addEventListener("resize", scheduleActiveLinkUpdate);
}

function setupSectionReveal() {
  const sections = document.querySelectorAll("main > section:not(.hero)");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  sections.forEach((section) => {
    section.classList.add("section-reveal");
    observer.observe(section);
  });
}

function reportSiteError(message, error) {
  if (error) console.error("TEAMCUT Supabase:", error);
  const notice = document.querySelector("#site-data-error");
  if (!notice) return;
  notice.textContent = message;
  notice.hidden = false;
}

function clearSiteError() {
  const notice = document.querySelector("#site-data-error");
  if (notice) {
    notice.textContent = "";
    notice.hidden = true;
  }
}

function formatQueueCount(value) {
  return value == null ? "—" : String(value).padStart(2, "0");
}

function setStatus(element, isOpen) {
  if (!element) return;
  element.textContent = isOpen ? "BUKA" : "TUTUP";
  const statusLine = element.closest(".open-status, .branch-open-status");
  [element, statusLine].filter(Boolean).forEach((target) => {
    target.classList.toggle("is-unavailable", !isOpen);
    target.classList.toggle("is-open", Boolean(isOpen));
  });
}

function getQueueForBranch(branchId) {
  return queuesByBranch.get(branchId) || null;
}

function updateHero(branchId = activeBranchId) {
  const branch = branches.find((item) => item.id === branchId);
  if (!branch) return;
  const queue = getQueueForBranch(branch.id);
  const strip = document.querySelector(".queue-strip");
  const status = document.querySelector("[data-hero-status]");
  const count = document.querySelector("[data-hero-queue]");
  const mapLink = document.querySelector("[data-hero-map-link]");

  if (strip) strip.setAttribute("aria-label", `Informasi cabang dan antrean ${branch.nama}`);
  setStatus(status, branch.status);
  if (count) count.textContent = formatQueueCount(queue?.jumlah);
  if (mapLink) {
    mapLink.href = branch.tautan_maps || "#cabang";
    if (branch.tautan_maps) {
      mapLink.target = "_blank";
      mapLink.rel = "noopener noreferrer";
    } else {
      mapLink.removeAttribute("target");
      mapLink.removeAttribute("rel");
    }
  }

  document.querySelectorAll(".hero-branch-tab").forEach((tab) => {
    const isSelected = tab.dataset.branchId === branch.id;
    tab.setAttribute("aria-selected", String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;
    if (isSelected) {
      document.querySelector("#hero-branch-panel")?.setAttribute("aria-labelledby", tab.id);
    }
  });
}

function activateHeroBranch(branchId) {
  if (!branches.some((branch) => branch.id === branchId)) return;
  const panel = document.querySelector("#hero-branch-panel");
  panel?.classList.add("is-changing");
  window.setTimeout(() => panel?.classList.remove("is-changing"), 180);
  activeBranchId = branchId;
  updateHero(branchId);
}

function getBranchPhotoFallback(branch) {
  const branchKey = branch.nama.toLowerCase().replace(/[^a-z]/gu, "");
  return BRANCH_PHOTO_FALLBACKS[branchKey] || "";
}

function renderHeroBranchTabs() {
  const tabs = document.querySelector("#hero-branch-tabs");
  if (!tabs) return;

  tabs.replaceChildren(...branches.map((branch, index) => {
    const tab = document.createElement("button");
    tab.className = "hero-branch-tab";
    tab.type = "button";
    tab.id = `hero-branch-tab-${branch.id}`;
    tab.dataset.branchId = branch.id;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", "hero-branch-panel");
    tab.textContent = branch.nama.toUpperCase();
    tab.addEventListener("click", () => activateHeroBranch(branch.id));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === "Home"
        ? 0
        : event.key === "End"
          ? branches.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + branches.length) % branches.length;
      const nextBranch = branches[nextIndex];
      tabs.querySelector(`[data-branch-id="${nextBranch.id}"]`)?.focus();
      activateHeroBranch(nextBranch.id);
    });
    return tab;
  }));

  const defaultBranch = branches.find((branch) => branch.nama.trim().toLowerCase() === "cikedokan")
    || branches[0];
  if (defaultBranch) activateHeroBranch(defaultBranch.id);
}

function updateBranchSlide(branch) {
  const slide = branchSlidesById.get(branch.id);
  if (!slide) return;

  const name = slide.querySelector("[data-branch-name]");
  const status = slide.querySelector("[data-branch-status]");
  const mapLink = slide.querySelector("[data-branch-map]");
  const photo = slide.querySelector("[data-branch-photo]");
  const title = slide.querySelector("h3");

  if (name) name.textContent = branch.nama.toUpperCase();
  const gallery = slide.querySelector("[data-hairstylist-list]");
  if (gallery) gallery.setAttribute("aria-label", `Hairstylist ${branch.nama}`);
  if (title) {
    title.id = `branch-title-${branch.id}`;
    slide.setAttribute("aria-labelledby", title.id);
  }
  setStatus(status, branch.status);

  if (mapLink) {
    if (branch.tautan_maps) {
      mapLink.href = branch.tautan_maps;
      mapLink.hidden = false;
    } else {
      mapLink.removeAttribute("href");
      mapLink.hidden = true;
    }
    mapLink.setAttribute("aria-label", `Lihat ${branch.nama} di Google Maps`);
  }

  if (photo) {
    const fallbackPhoto = getBranchPhotoFallback(branch);
    const photoSources = [...new Set([branch.foto, fallbackPhoto].filter(Boolean))];
    photo.setAttribute(
      "aria-label",
      photoSources.length ? `Foto cabang ${branch.nama}` : `Foto cabang ${branch.nama} belum tersedia`,
    );
    photo.replaceChildren();
    if (photoSources.length) {
      const image = document.createElement("img");
      image.alt = "";
      let sourceIndex = 0;
      const loadNextPhoto = () => {
        if (sourceIndex >= photoSources.length) {
          image.remove();
          console.error(`Foto cabang TEAMCUT tidak dapat dimuat: ${photoSources.join(", ")}`);
          return;
        }
        image.src = photoSources[sourceIndex++];
      };
      image.addEventListener("error", () => {
        loadNextPhoto();
      });
      photo.append(image);
      loadNextPhoto();
    } else {
      const fallback = document.createElement("span");
      fallback.textContent = "FOTO CABANG BELUM TERSEDIA";
      photo.append(fallback);
    }
  }
}

function updateQueueDisplays(branchId) {
  const queue = getQueueForBranch(branchId);
  const slide = branchSlidesById.get(branchId);
  const count = slide?.querySelector("[data-queue]");
  if (count) count.textContent = formatQueueCount(queue?.jumlah);
  if (activeBranchId === branchId) updateHero(branchId);
}

function createBranchSlides() {
  const track = document.querySelector("#branch-track");
  const template = document.querySelector("#branch-slide-template");
  if (!track || !template) return;

  branchSlidesById = new Map();
  const slides = branches.map((branch) => {
    const fragment = template.content.cloneNode(true);
    const slide = fragment.querySelector("[data-branch-slide]");
    slide.dataset.branchId = branch.id;
    const gallery = slide.querySelector("[data-hairstylist-list]");
    gallery.dataset.hairstylistList = branch.id;
    gallery.setAttribute("aria-label", `Hairstylist ${branch.nama}`);
    slide.querySelector("[data-branch-name]").textContent = branch.nama.toUpperCase();
    slide.querySelector("[data-hairstylist-count]").textContent = "00";
    slide.querySelector("[data-queue]").textContent = "—";
    updateBranchSlide(branch);
    const queue = getQueueForBranch(branch.id);
    const queueCount = slide.querySelector("[data-queue]");
    if (queueCount) queueCount.textContent = formatQueueCount(queue?.jumlah);
    branchSlidesById.set(branch.id, slide);
    return fragment;
  });
  track.replaceChildren(...slides);

  const pagination = document.querySelector(".branch-pagination");
  if (pagination) {
    pagination.replaceChildren(...branches.map((branch, index) => {
      const marker = document.createElement("button");
      marker.className = "branch-marker";
      marker.type = "button";
      marker.dataset.slideTo = String(index);
      marker.setAttribute("aria-label", `Tampilkan cabang ${branch.nama}`);
      return marker;
    }));
  }
}

function createHairstylistAvatar(name) {
  const avatar = document.createElement("span");
  avatar.className = "hairstylist-avatar";
  avatar.setAttribute("aria-hidden", "true");
  if (name) {
    const words = name.trim().split(/\s+/);
    avatar.textContent = (words.length > 1
      ? words.map((word) => word[0]).join("")
      : name.slice(0, 2)).toUpperCase();
    return avatar;
  }

  avatar.classList.add("is-generic");
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 64 64");
  icon.setAttribute("focusable", "false");
  const head = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  head.setAttribute("cx", "32");
  head.setAttribute("cy", "22");
  head.setAttribute("r", "12");
  const shoulders = document.createElementNS("http://www.w3.org/2000/svg", "path");
  shoulders.setAttribute("d", "M8 60c1-15 10-23 24-23s23 8 24 23H8Z");
  icon.append(head, shoulders);
  avatar.append(icon);
  return avatar;
}

function addPhoto(container, photo, altText) {
  if (!photo) return;
  const image = document.createElement("img");
  image.src = photo;
  image.alt = altText;
  image.loading = "lazy";
  image.addEventListener("error", () => {
    console.error(`Foto TEAMCUT tidak dapat dimuat: ${photo}`);
    image.remove();
  }, { once: true });
  image.addEventListener("load", () => {
    container.querySelector(".hairstylist-avatar")?.remove();
  }, { once: true });
  container.append(image);
}

function createHairstylistCard(profile) {
  const card = document.createElement("button");
  card.className = "hairstylist-card";
  card.type = "button";
  card.dataset.hairstylistId = profile.id;
  card.setAttribute("aria-label", `Lihat detail hairstylist ${profile.nama}`);

  const photo = document.createElement("span");
  photo.className = "hairstylist-card-photo";
  photo.setAttribute("aria-hidden", "true");
  photo.append(createHairstylistAvatar(profile.nama));
  if (profile.foto) addPhoto(photo, profile.foto, "");

  const caption = document.createElement("span");
  caption.className = "hairstylist-card-caption";
  const name = document.createElement("strong");
  name.textContent = profile.nama;
  const role = document.createElement("small");
  role.textContent = "HAIRSTYLIST";
  const arrow = document.createElement("i");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "→";
  caption.append(name, role, arrow);
  card.append(photo, caption);
  return card;
}

function renderHairstylists() {
  document.querySelectorAll("[data-hairstylist-list]").forEach((gallery) => {
    const branchId = gallery.dataset.hairstylistList;
    const profiles = hairstylists.filter((profile) => profile.cabang_id === branchId);
    gallery.replaceChildren(...profiles.map(createHairstylistCard));
    const count = gallery.closest(".branch-slide")?.querySelector("[data-hairstylist-count]");
    if (count) count.textContent = String(profiles.length).padStart(2, "0");
  });
}

function renderServices(services) {
  const list = document.querySelector(".service-list");
  if (!list) return;
  const items = services.map((service, index) => {
    const item = document.createElement("li");
    item.className = "service-item";
    const number = document.createElement("span");
    number.className = "service-number";
    number.textContent = String(index + 1).padStart(2, "0");

    const copy = document.createElement("div");
    copy.className = "service-copy";
    const title = document.createElement("h3");
    title.textContent = service.nama;
    copy.append(title);
    if (service.deskripsi) {
      const description = document.createElement("p");
      description.textContent = service.deskripsi;
      copy.append(description);
    }
    if (service.nama.trim().toLowerCase() === "condrow") {
      const note = document.createElement("p");
      note.className = "service-note";
      note.textContent = "Hanya tersedia dengan hairstylist Ilham.";
      copy.append(note);
    }

    const price = document.createElement("div");
    price.className = "service-price";
    const label = document.createElement("span");
    label.className = "service-price-label";
    label.textContent = "HARGA";
    const amount = document.createElement("strong");
    amount.textContent = service.harga == null
      ? "—"
      : new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(service.harga);
    if (service.harga == null) price.classList.add("is-unavailable");
    price.append(label, amount);

    const arrow = document.createElement("span");
    arrow.className = "service-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    item.append(number, copy, price, arrow);
    return item;
  });
  list.replaceChildren(...items);
}

function setupBranchSwitching() {
  const track = document.querySelector("#branch-track");
  if (!track) return;
  const slides = Array.from(track.querySelectorAll("[data-branch-slide]"));
  const markers = Array.from(document.querySelectorAll("[data-slide-to]")).filter((marker) => !marker.hidden);
  if (!slides.length) return;

  const currentPage = document.querySelector("[data-branch-current]");
  const previousButton = document.querySelector("[data-branch-prev]");
  const nextButton = document.querySelector("[data-branch-next]");
  let activeIndex = 0;

  function updateNavigation() {
    if (currentPage) currentPage.textContent = String(activeIndex + 1).padStart(2, "0");
    markers.forEach((marker, index) => {
      if (index === activeIndex) marker.setAttribute("aria-current", "true");
      else marker.removeAttribute("aria-current");
    });
    if (previousButton) previousButton.disabled = activeIndex === 0;
    if (nextButton) nextButton.disabled = activeIndex === slides.length - 1;
  }

  function goToSlide(index) {
    activeIndex = Math.max(0, Math.min(index, slides.length - 1));
    track.scrollTo({
      left: slides[activeIndex].offsetLeft - slides[0].offsetLeft,
      behavior: "smooth",
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

  markers.forEach((marker, index) => marker.addEventListener("click", () => goToSlide(index)));
  previousButton?.addEventListener("click", () => goToSlide(activeIndex - 1));
  nextButton?.addEventListener("click", () => goToSlide(activeIndex + 1));
  track.addEventListener("scroll", () => {
    window.requestAnimationFrame(() => {
      activeIndex = getNearestSlideIndex();
      updateNavigation();
    });
  }, { passive: true });
  track.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") goToSlide(activeIndex + 1);
    if (event.key === "ArrowLeft") goToSlide(activeIndex - 1);
  });
  document.querySelectorAll("[data-roster-more]").forEach((button) => {
    button.addEventListener("click", () => {
      button.closest("[data-branch-slide]")
        ?.querySelector(".hairstylist-gallery")
        ?.scrollTo({ left: button.closest("[data-branch-slide]").querySelector(".hairstylist-gallery").scrollWidth, behavior: "smooth" });
    });
  });
  updateNavigation();
}

function setProfilePhoto(container, profile) {
  container.replaceChildren();
  container.append(createHairstylistAvatar(profile.nama));
  container.setAttribute("aria-label", `Avatar ${profile.nama}`);
  if (!profile.foto) return;

  const image = document.createElement("img");
  image.src = profile.foto;
  image.alt = "";
  image.addEventListener("load", () => {
    container.querySelector(".hairstylist-avatar")?.remove();
    container.setAttribute("aria-label", `Foto ${profile.nama}`);
  }, { once: true });
  image.addEventListener("error", () => {
    console.error(`Foto TEAMCUT tidak dapat dimuat: ${profile.foto}`);
    image.remove();
  }, { once: true });
  container.append(image);
}

function setupHairstylistDetails() {
  const dialog = document.querySelector("#hairstylist-dialog");
  if (!dialog) return;
  const nameField = dialog.querySelector("[data-detail-name]");
  const branchField = dialog.querySelector("[data-detail-branch]");
  const photoField = dialog.querySelector("[data-detail-photo]");
  const bioField = dialog.querySelector("[data-detail-bio]");
  const strengthsField = dialog.querySelector("[data-detail-keunggulan]");
  const instagramField = dialog.querySelector("[data-detail-instagram]");
  const bookingLink = dialog.querySelector("[data-detail-booking]");
  let selectedProfileForBooking = null;

  bookingLink.addEventListener("click", (event) => {
    event.preventDefault();
    const profile = selectedProfileForBooking;
    const branchSelect = document.querySelector("#booking-branch");
    const stylistSelect = document.querySelector("#booking-hairstylist");
    if (!profile || !branchSelect || !stylistSelect) return;

    branchSelect.value = profile.cabang_id;
    branchSelect.dispatchEvent(new Event("change", { bubbles: true }));
    if (Array.from(stylistSelect.options).some((option) => option.value === profile.id)) {
      stylistSelect.value = profile.id;
      stylistSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
    dialog.close();
    document.querySelector("#cta-whatsapp")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelectorAll("[data-hairstylist-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const profile = hairstylists.find((item) => item.id === button.dataset.hairstylistId);
      if (!profile) return;
      const branch = branches.find((item) => item.id === profile.cabang_id);
      const branchName = branch?.nama || "";
      nameField.textContent = profile.nama;
      branchField.textContent = branchName.toUpperCase();
      setProfilePhoto(photoField, profile);
      const bioLines = (profile.bio || "")
        .split(/\r?\n/u)
        .map((line) => line.replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F\u200D]/gu, "").trim())
        .filter(Boolean);
      bioField.textContent = bioLines[0] || "Bio belum tersedia.";
      strengthsField.textContent = profile.keunggulan || "Belum tersedia.";
      const instagramUsername = (profile.instagram || "").trim().replace(/^@/u, "");
      instagramField.textContent = instagramUsername ? `@${instagramUsername}` : "Belum tersedia.";
      if (instagramUsername) {
        instagramField.href = `https://www.instagram.com/${encodeURIComponent(instagramUsername)}/`;
        instagramField.target = "_blank";
        instagramField.rel = "noopener noreferrer";
      } else {
        instagramField.removeAttribute("href");
        instagramField.removeAttribute("target");
        instagramField.removeAttribute("rel");
      }
      selectedProfileForBooking = profile;
      bookingLink.hidden = !branch;
      bookingLink.href = "#cta-whatsapp";
      dialog.showModal();
    });
  });

  dialog.querySelector("[data-hairstylist-close]")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

async function refreshQueues() {
  const { data, error } = await supabase.from("antrean").select("*");
  if (error) throw error;
  queuesByBranch = new Map(data.map((queue) => [queue.cabang_id, queue]));
  branches.forEach((branch) => updateQueueDisplays(branch.id));
}

function subscribeToRealtime() {
  supabase
    .channel("teamcut-public-site")
    .on("postgres_changes", { event: "*", schema: "public", table: "antrean" }, (payload) => {
      if (payload.new?.cabang_id) {
        queuesByBranch.set(payload.new.cabang_id, payload.new);
        updateQueueDisplays(payload.new.cabang_id);
      } else {
        refreshQueues().catch((error) => reportSiteError("Data antrean gagal diperbarui.", error));
      }
      clearSiteError();
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "cabang" }, (payload) => {
      if (payload.new?.id) {
        const index = branches.findIndex((branch) => branch.id === payload.new.id);
        if (index !== -1) {
          branches[index] = payload.new;
          updateBranchSlide(payload.new);
          if (activeBranchId === payload.new.id) updateHero(payload.new.id);
        }
      }
    })
    .subscribe((status, error) => {
      if (status === "SUBSCRIBED") {
        refreshQueues().catch((queueError) => reportSiteError("Data antrean gagal diperbarui.", queueError));
      } else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
        reportSiteError("Koneksi realtime antrean terputus. Muat ulang halaman untuk mencoba lagi.", error);
      }
    });
}

async function loadSiteData() {
  const [branchResult, stylistResult, serviceResult, queueResult] = await Promise.all([
    supabase.from("cabang").select("*").order("created_at", { ascending: true }),
    supabase.from("hairstylist").select("*").eq("status", true).order("nama", { ascending: true }),
    supabase.from("layanan").select("*").eq("status", true).order("nama", { ascending: true }),
    supabase.from("antrean").select("*"),
  ]);
  const failed = [branchResult, stylistResult, serviceResult, queueResult].find((result) => result.error);
  if (failed) throw failed.error;

  branches = branchResult.data;
  hairstylists = stylistResult.data;
  services = serviceResult.data;
  queuesByBranch = new Map(queueResult.data.map((queue) => [queue.cabang_id, queue]));
  createBranchSlides();
  branches.forEach((branch) => updateBranchSlide(branch));
  renderHairstylists();
  renderServices(services);
  setupBookingForm({ branches, hairstylists, services });
  renderHeroBranchTabs();
  setupBranchSwitching();
  setupHairstylistDetails();
  if (branches.length === 0) {
    reportSiteError("Data cabang belum tersedia di Supabase.");
  } else {
    clearSiteError();
  }
  if (queueResult.data.length !== branches.length) {
    console.error("TEAMCUT Supabase: jumlah data antrean tidak sama dengan jumlah cabang.");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  setCurrentYear();
  setupSiteMenu();
  setupMobileBottomNavigation();
  setupSectionReveal();
  if (!isSupabaseConfigured) {
    reportSiteError(getSupabaseConfigError());
    setBookingFormUnavailable("Koneksi data pemesanan belum tersedia. Silakan coba lagi nanti.");
    return;
  }

  try {
    await loadSiteData();
    subscribeToRealtime();
  } catch (error) {
    reportSiteError("Data TEAMCUT gagal dimuat dari Supabase. Coba muat ulang halaman.", error);
    setBookingFormUnavailable("Data pemesanan gagal dimuat. Muat ulang halaman untuk mencoba kembali.");
  }
});
