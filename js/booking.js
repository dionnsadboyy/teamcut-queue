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
    const branchProfiles = hairstylists.filter((profile) => profile.cabang_id === branchId);
    const currentValue = stylistSelect.value;
    setOptions(stylistSelect, branchProfiles, "PILIH HAIRSTYLIST", (profile) => profile.nama);
    if (branchProfiles.some((profile) => profile.id === currentValue)) stylistSelect.value = currentValue;
    updateSubmitState();
  }

  function updateSubmitState() {
    submit.disabled = !branches.length || !hairstylists.length || !services.length;
  }

  updateMinimumDate();
  setOptions(branchSelect, branches, "PILIH CABANG", (branch) => branch.nama);
  setOptions(serviceSelect, services, "PILIH LAYANAN", (service) => service.nama);
  setOptions(stylistSelect, [], "PILIH HAIRSTYLIST", (profile) => profile.nama);
  updateSubmitState();
  branchSelect.addEventListener("change", updateStylists);
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
  form.querySelectorAll("select, button[type='submit']").forEach((control) => {
    control.disabled = true;
  });
  const feedback = form.querySelector("#booking-feedback");
  if (feedback) {
    feedback.textContent = message;
    feedback.hidden = false;
    feedback.classList.add("is-error");
  }
}
