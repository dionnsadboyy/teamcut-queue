const galleryBranches = [
  {
    id: "cikedokan",
    name: "CIKEDOKAN",
    photos: [
      {
        src: "./assets/images/gallery/cikedokan/01-exterior-sign.jpeg",
        alt: "Tampak depan TEAMCUT Cikedokan dengan papan nama di atas pintu masuk.",
        caption: "Tampak depan cabang Cikedokan.",
      },
      {
        src: "./assets/images/gallery/cikedokan/02-exterior.jpeg",
        alt: "Bagian luar TEAMCUT Cikedokan dan pintu masuk barbershop.",
        caption: "Bagian luar dan pintu masuk cabang Cikedokan.",
      },
      {
        src: "./assets/images/gallery/cikedokan/03-barber-at-work.jpeg",
        alt: "Barber sedang melayani pelanggan di TEAMCUT Cikedokan.",
        caption: "Barber melayani pelanggan.",
      },
    ],
  },
  {
    id: "jatiwangi",
    name: "JATIWANGI",
    photos: [
      {
        src: "./assets/images/gallery/jatiwangi/01-main-floor.jpeg",
        alt: "Area utama TEAMCUT Jatiwangi dengan kursi layanan dan barber.",
        caption: "Area utama cabang Jatiwangi.",
      },
      {
        src: "./assets/images/gallery/jatiwangi/02-barber-and-shopfront.jpeg",
        alt: "Barber melayani pelanggan di dalam TEAMCUT Jatiwangi.",
        caption: "Barber melayani pelanggan.",
      },
      {
        src: "./assets/images/gallery/jatiwangi/03-barber-at-work.jpeg",
        alt: "Proses potong rambut di TEAMCUT Jatiwangi.",
        caption: "Proses potong rambut.",
      },
      {
        src: "./assets/images/gallery/jatiwangi/04-wash-area.jpeg",
        alt: "Area cuci rambut di TEAMCUT Jatiwangi.",
        caption: "Area cuci rambut.",
      },
    ],
  },
  {
    id: "jarakosta",
    name: "JARAKOSTA",
    photos: [
      {
        src: "./assets/images/gallery/jarakosta/01-exterior.jpeg",
        alt: "Tampak depan TEAMCUT Jarakosta.",
        caption: "Tampak depan cabang Jarakosta.",
      },
      {
        src: "./assets/images/gallery/jarakosta/02-interior-wide.jpeg",
        alt: "Area interior TEAMCUT Jarakosta dengan kursi dan cermin barber.",
        caption: "Area interior cabang Jarakosta.",
      },
      {
        src: "./assets/images/gallery/jarakosta/03-barber-at-work.jpeg",
        alt: "Barber sedang melayani pelanggan di TEAMCUT Jarakosta.",
        caption: "Barber melayani pelanggan.",
      },
    ],
  },
];

function setupGallery() {
  const tabs = Array.from(document.querySelectorAll("[data-gallery-branch]"));
  const stage = document.querySelector("[data-gallery-stage]");
  const image = document.querySelector("[data-gallery-image]");
  const emptyMessage = document.querySelector("[data-gallery-empty]");
  const branchName = document.querySelector("[data-gallery-branch-name]");
  const counter = document.querySelector("[data-gallery-count]");
  const caption = document.querySelector("[data-gallery-caption]");
  const previousButton = document.querySelector("[data-gallery-prev]");
  const nextButton = document.querySelector("[data-gallery-next]");
  if (!tabs.length || !stage || !image || !emptyMessage || !branchName || !counter || !caption || !previousButton || !nextButton) return;

  let activeBranch = galleryBranches[0];
  let activePhotoIndex = 0;
  let pointerStart = null;

  function render() {
    tabs.forEach((tab, index) => {
      const selected = galleryBranches[index].id === activeBranch.id;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    branchName.textContent = activeBranch.name;
    const photoCount = activeBranch.photos.length;
    const photo = activeBranch.photos[activePhotoIndex];
    previousButton.disabled = photoCount < 2;
    nextButton.disabled = photoCount < 2;

    if (!photo) {
      image.classList.remove("is-changing");
      image.hidden = true;
      image.removeAttribute("src");
      image.alt = "";
      emptyMessage.textContent = "FOTO CABANG BELUM TERSEDIA.";
      emptyMessage.hidden = false;
      counter.textContent = "00 / 00";
      caption.textContent = "Foto cabang ini belum tersedia.";
      return;
    }

    const missingPhoto = () => {
      if (image.getAttribute("src") !== photo.src) return;
      image.classList.remove("is-changing");
      image.hidden = true;
      emptyMessage.textContent = "FOTO TIDAK DAPAT DIMUAT.";
      emptyMessage.hidden = false;
      console.error(`Foto galeri TEAMCUT tidak dapat dimuat: ${photo.src}`);
    };
    image.onerror = missingPhoto;
    image.onload = () => {
      if (image.getAttribute("src") === photo.src) {
        image.hidden = false;
        emptyMessage.hidden = true;
        window.requestAnimationFrame(() => image.classList.remove("is-changing"));
      }
    };
    image.alt = photo.alt;
    image.classList.add("is-changing");
    image.src = photo.src;
    image.hidden = false;
    emptyMessage.hidden = true;
    counter.textContent = `${String(activePhotoIndex + 1).padStart(2, "0")} / ${String(photoCount).padStart(2, "0")}`;
    caption.textContent = photo.caption;
  }

  function showPhoto(index) {
    const photoCount = activeBranch.photos.length;
    if (photoCount < 2) return;
    activePhotoIndex = (index + photoCount) % photoCount;
    render();
  }

  function selectBranch(branchId) {
    const branch = galleryBranches.find((item) => item.id === branchId);
    if (!branch) return;
    activeBranch = branch;
    activePhotoIndex = 0;
    document.querySelector("#gallery-panel")?.setAttribute("aria-labelledby", `gallery-tab-${branch.id}`);
    render();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectBranch(tab.dataset.galleryBranch));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      tabs[nextIndex].focus();
      selectBranch(tabs[nextIndex].dataset.galleryBranch);
    });
  });

  previousButton.addEventListener("click", () => showPhoto(activePhotoIndex - 1));
  nextButton.addEventListener("click", () => showPhoto(activePhotoIndex + 1));
  stage.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showPhoto(activePhotoIndex - 1);
    if (event.key === "ArrowRight") showPhoto(activePhotoIndex + 1);
  });
  stage.addEventListener("pointerdown", (event) => {
    if (event.isPrimary) pointerStart = { x: event.clientX, y: event.clientY };
  });
  stage.addEventListener("pointerup", (event) => {
    if (!pointerStart) return;
    const deltaX = event.clientX - pointerStart.x;
    const deltaY = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    showPhoto(activePhotoIndex + (deltaX < 0 ? 1 : -1));
  });
  stage.addEventListener("pointercancel", () => {
    pointerStart = null;
  });

  render();
}

document.addEventListener("DOMContentLoaded", setupGallery);
