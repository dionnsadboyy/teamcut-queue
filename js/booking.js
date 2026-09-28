export function normalizeWhatsAppNumber(value) {
  const digits = String(value || "").replace(/\D/gu, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

export function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isBookingDatePast(value, today = getLocalDateValue()) {
  return Boolean(value) && value < today;
}

export function formatBookingDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function buildBookingMessage({ branch, hairstylist, service, date, time, name, note }) {
  return [
    "Halo TEAMCUT, saya ingin membuat pemesanan.",
    "",
    `Cabang: ${branch}`,
    `Hairstylist: ${hairstylist}`,
    `Layanan: ${service}`,
    `Tanggal: ${formatBookingDate(date)}`,
    `Jam: ${time.replace(":", ".")}`,
    `Nama: ${name.trim()}`,
    `Catatan: ${note.trim() || "-"}`,
  ].join("\n");
}

export function createBookingWhatsAppUrl(phone, message) {
  const normalizedPhone = normalizeWhatsAppNumber(phone);
  if (!normalizedPhone) return "";
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

function setOptions(select, records, placeholder, getLabel) {
  const options = [new Option(placeholder, "")];
  records.forEach((record) => options.push(new Option(getLabel(record), record.id)));
  select.replaceChildren(...options);
  select.disabled = records.length === 0;
}

let closeActiveBookingDropdown = null;

function createCustomSelect(select) {
  const container = select.closest("[data-booking-select]");
  const trigger = container?.querySelector("[data-booking-select-trigger]");
  const value = container?.querySelector("[data-booking-select-value]");
  const menu = container?.querySelector("[data-booking-select-menu]");
  if (!container || !trigger || !value || !menu) return { refresh() {} };

  function getOptions() {
    return Array.from(menu.querySelectorAll("[role='option']:not(:disabled)"));
  }

  function close(restoreFocus = false) {
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (closeActiveBookingDropdown === close) closeActiveBookingDropdown = null;
    if (restoreFocus) trigger.focus();
  }

  function choose(option) {
    select.value = option.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    refresh();
    close(true);
  }

  function focusOption(index) {
    const options = getOptions();
    if (!options.length) return;
    options[(index + options.length) % options.length].focus();
  }

  function open(last = false) {
    if (trigger.disabled) return;
    const options = getOptions();
    if (!options.length) return;
    if (closeActiveBookingDropdown && closeActiveBookingDropdown !== close) {
      closeActiveBookingDropdown();
    }
    menu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    closeActiveBookingDropdown = close;
    const selectedIndex = options.findIndex((option) => option.value === select.value);
    focusOption(last ? options.length - 1 : Math.max(selectedIndex, 0));
  }

  function refresh() {
    const selectedOption = select.selectedOptions[0];
    value.textContent = selectedOption?.textContent || select.options[0]?.textContent || "";
    trigger.disabled = select.disabled;
    menu.replaceChildren(...Array.from(select.options)
      .filter((option) => option.value && !option.disabled)
      .map((option) => {
        const item = document.createElement("button");
        item.className = "booking-select-option";
        item.type = "button";
        item.setAttribute("role", "option");
        item.setAttribute("aria-selected", String(option.value === select.value));
        item.value = option.value;
        item.textContent = option.textContent;
        item.addEventListener("click", () => choose(item));
        return item;
      }));
    if (menu.hidden === false && !getOptions().some((option) => option.value === select.value)) close();
  }

  trigger.addEventListener("click", () => {
    if (menu.hidden) open();
    else close();
  });
  trigger.addEventListener("keydown", (event) => {
    if (["ArrowDown", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      open();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      open(true);
    } else if (event.key === "Escape" && !menu.hidden) {
      event.preventDefault();
      close();
    }
  });
  menu.addEventListener("keydown", (event) => {
    const options = getOptions();
    const activeIndex = options.indexOf(document.activeElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption(activeIndex + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusOption(activeIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusOption(options.length - 1);
    } else if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "Tab") {
      close();
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (!container.contains(event.target)) close();
  });
  select.addEventListener("change", refresh);
  refresh();
  return { refresh };
}

export function setupBookingForm({ branches = [], hairstylists = [], services = [] }) {
  const form = document.querySelector("#booking-form");
  if (!form) return;

  const branchSelect = form.querySelector("#booking-branch");
  const stylistSelect = form.querySelector("#booking-hairstylist");
  const serviceSelect = form.querySelector("#booking-service");
  const dateInput = form.querySelector("#booking-date");
  const feedback = form.querySelector("#booking-feedback");
  const submit = form.querySelector("#booking-submit");
  if (!branchSelect || !stylistSelect || !serviceSelect || !dateInput || !feedback || !submit) return;
  const branchDropdown = createCustomSelect(branchSelect);
  const stylistDropdown = createCustomSelect(stylistSelect);
  const serviceDropdown = createCustomSelect(serviceSelect);

  function updateMinimumDate() {
    dateInput.min = getLocalDateValue();
  }

  function showFeedback(message, isError = false) {
    feedback.textContent = message;
    feedback.hidden = !message;
    feedback.classList.toggle("is-error", isError);
  }

  function updateStylists() {
    const branchId = branchSelect.value;
    const selectedService = services.find((service) => service.id === serviceSelect.value);
    const isCondrow = selectedService?.nama.trim().toLowerCase() === "condrow";
    const branchProfiles = hairstylists.filter((profile) =>
      profile.cabang_id === branchId && (!isCondrow || profile.nama.trim().toLowerCase() === "ilham"));
    const currentValue = stylistSelect.value;
    setOptions(stylistSelect, branchProfiles, "PILIH HAIRSTYLIST", (profile) => profile.nama);
    if (branchProfiles.some((profile) => profile.id === currentValue)) stylistSelect.value = currentValue;
    stylistDropdown.refresh();
    if (isCondrow && branchProfiles.length === 0) {
      showFeedback("Condrow hanya tersedia dengan Ilham. Pilih cabang tempat Ilham bertugas.", true);
    } else if (feedback.classList.contains("is-error")) {
      showFeedback("");
    }
    updateSubmitState();
  }

  function updateSubmitState() {
    const branch = branches.find((item) => item.id === branchSelect.value);
    const stylist = hairstylists.find((item) => item.id === stylistSelect.value);
    const service = services.find((item) => item.id === serviceSelect.value);
    const requiredFieldsReady = Array.from(form.querySelectorAll("[required]"))
      .every((field) => field.value.trim() && field.validity.valid);
    const condrowStylistAllowed = service?.nama.trim().toLowerCase() !== "condrow"
      || stylist?.nama.trim().toLowerCase() === "ilham";
    submit.disabled = !branches.length
      || !hairstylists.length
      || !services.length
      || !requiredFieldsReady
      || !branch
      || !stylist
      || stylist.cabang_id !== branch.id
      || !stylist.nomor_whatsapp
      || !service
      || !condrowStylistAllowed;
  }

  updateMinimumDate();
  setOptions(branchSelect, branches, "PILIH CABANG", (branch) => branch.nama);
  branchDropdown.refresh();
  setOptions(serviceSelect, services, "PILIH LAYANAN", (service) => {
    const price = service.harga == null
      ? ""
      : new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(service.harga);
    return `${service.nama.toUpperCase()}${price ? ` — ${price}` : ""}`;
  });
  serviceDropdown.refresh();
  setOptions(stylistSelect, [], "PILIH HAIRSTYLIST", (profile) => profile.nama);
  stylistDropdown.refresh();
  updateSubmitState();
  branchSelect.addEventListener("change", updateStylists);
  serviceSelect.addEventListener("change", updateStylists);
  form.addEventListener("input", updateSubmitState);
  form.addEventListener("change", updateSubmitState);
  dateInput.addEventListener("input", () => {
    updateMinimumDate();
    dateInput.setCustomValidity(isBookingDatePast(dateInput.value) ? "Pilih tanggal hari ini atau setelahnya." : "");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    updateMinimumDate();
    dateInput.setCustomValidity(isBookingDatePast(dateInput.value) ? "Pilih tanggal hari ini atau setelahnya." : "");
    if (!form.reportValidity()) return;

    const branch = branches.find((item) => item.id === branchSelect.value);
    const stylist = hairstylists.find((item) => item.id === stylistSelect.value);
    const service = services.find((item) => item.id === serviceSelect.value);
    const phone = stylist?.nomor_whatsapp;
    if (service?.nama.trim().toLowerCase() === "condrow" && stylist?.nama.trim().toLowerCase() !== "ilham") {
      showFeedback("Condrow hanya dapat dipesan dengan hairstylist Ilham.", true);
      return;
    }
    if (!branch || !stylist || stylist.cabang_id !== branch.id || !service || !phone) {
      showFeedback("Data hairstylist atau nomor WhatsApp belum tersedia. Silakan pilih ulang atau hubungi admin.", true);
      return;
    }

    const message = buildBookingMessage({
      branch: branch.nama,
      hairstylist: stylist.nama,
      service: service.nama,
      date: dateInput.value,
      time: form.querySelector("#booking-time").value,
      name: form.querySelector("#booking-name").value,
      note: form.querySelector("#booking-note").value,
    });
    const url = createBookingWhatsAppUrl(phone, message);
    if (!url) {
      showFeedback("Nomor WhatsApp hairstylist belum valid. Silakan hubungi admin TEAMCUT.", true);
      return;
    }

    showFeedback("Permintaan pemesanan dibuka di WhatsApp hairstylist pilihan Anda.");
    window.open(url, "_blank", "noopener,noreferrer");
  });
}

export function setBookingFormUnavailable(message) {
  const form = document.querySelector("#booking-form");
  if (!form) return;
  form.querySelectorAll("select, button[type='submit'], [data-booking-select-trigger]").forEach((control) => {
    control.disabled = true;
  });
  const feedback = form.querySelector("#booking-feedback");
  if (feedback) {
    feedback.textContent = message;
    feedback.hidden = false;
    feedback.classList.add("is-error");
  }
}
