"use strict";

const MOCK_SESSION_KEY = "teamcut-admin-demo-session";

function hasMockSession() {
  try {
    return window.sessionStorage.getItem(MOCK_SESSION_KEY) === "active";
  } catch {
    return false;
  }
}

function setupMockLogin() {
  const form = document.querySelector("#login-form");
  if (!form) return;

  if (hasMockSession()) {
    window.location.replace("./admin.html");
    return;
  }

  const emailInput = document.querySelector("#admin-email");
  const passwordInput = document.querySelector("#admin-password");
  const errorMessage = document.querySelector("#login-error");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    let message = "";

    if (!email) {
      message = "Masukkan email admin.";
    } else if (!emailInput.validity.valid) {
      message = "Format email belum benar.";
    } else if (!password) {
      message = "Masukkan password.";
    }

    if (message) {
      errorMessage.textContent = message;
      errorMessage.hidden = false;
      (email && emailInput.validity.valid ? passwordInput : emailInput).focus();
      return;
    }

    try {
      // Mock lokal: hanya penanda sesi tab yang disimpan, bukan email/password.
      window.sessionStorage.setItem(MOCK_SESSION_KEY, "active");
      window.location.replace("./admin.html");
    } catch {
      errorMessage.textContent = "Sesi demo tidak dapat dimulai di browser ini.";
      errorMessage.hidden = false;
    }
  });
}

function setupMockAdmin() {
  const dashboard = document.querySelector("#dashboard-screen");
  if (!dashboard) return;

  if (!hasMockSession()) {
    window.location.replace("./login.html");
    return;
  }

  document.body.classList.remove("is-locked");

  const branches = [
    { id: "cikedokan", name: "Cikedokan", isOpen: true, queue: 6 },
    { id: "jati-wangi", name: "Jati Wangi", isOpen: true, queue: 0 },
    { id: "jarakosta", name: "Jarakosta", isOpen: true, queue: 0 },
  ].map((branch) => ({ ...branch, updatedAt: new Date() }));

  const branchSelect = document.querySelector("#branch-select");
  const branchName = document.querySelector("#active-branch-name");
  const statusToggle = document.querySelector("#status-toggle");
  const statusLabel = document.querySelector("#status-label");
  const queueNumber = document.querySelector("#queue-number");
  const queueMinus = document.querySelector("#queue-minus");
  const queuePlus = document.querySelector("#queue-plus");
  const updatedAt = document.querySelector("#updated-at");
  const logoutButton = document.querySelector("#logout-button");

  function getSelectedBranch() {
    return branches.find((branch) => branch.id === branchSelect.value) || branches[0];
  }

  function formatTimestamp(date) {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(date);
  }

  function renderBranch() {
    const branch = getSelectedBranch();

    branchName.firstChild.textContent = branch.name.toUpperCase();
    statusLabel.textContent = branch.isOpen ? "BUKA" : "TUTUP";
    statusToggle.classList.toggle("is-open", branch.isOpen);
    statusToggle.setAttribute("aria-pressed", String(branch.isOpen));
    statusToggle.setAttribute(
      "aria-label",
      `Status cabang ${branch.isOpen ? "buka" : "tutup"}. Tekan untuk mengubah.`,
    );
    queueNumber.textContent = String(branch.queue).padStart(2, "0");
    queueMinus.disabled = branch.queue === 0;
    updatedAt.textContent = formatTimestamp(branch.updatedAt);
    updatedAt.dateTime = branch.updatedAt.toISOString();
  }

  function changeQueue(amount) {
    const branch = getSelectedBranch();
    branch.queue = Math.max(0, branch.queue + amount);
    branch.updatedAt = new Date();
    renderBranch();
  }

  branchSelect.addEventListener("change", renderBranch);
  statusToggle.addEventListener("click", () => {
    const branch = getSelectedBranch();
    branch.isOpen = !branch.isOpen;
    branch.updatedAt = new Date();
    renderBranch();
  });
  queueMinus.addEventListener("click", () => changeQueue(-1));
  queuePlus.addEventListener("click", () => changeQueue(1));
  logoutButton.addEventListener("click", () => {
    window.sessionStorage.removeItem(MOCK_SESSION_KEY);
    window.location.replace("./login.html");
  });

  renderBranch();
  document.querySelector("#dashboard-title").focus({ preventScroll: true });
}

setupMockLogin();
setupMockAdmin();
