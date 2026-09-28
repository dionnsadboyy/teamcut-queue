import {
  getSupabaseConfigError,
  isSupabaseConfigured,
  supabase,
} from "./supabase.js";

const ADMIN_ROLE = "admin";

function isAdmin(user) {
  return user?.app_metadata?.role === ADMIN_ROLE;
}

function showLoginError(message, error) {
  if (error) console.error("TEAMCUT Supabase Auth:", error);
  const errorMessage = document.querySelector("#login-error");
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  }
}

async function setupLogin() {
  const form = document.querySelector("#login-form");
  if (!form) return;
  const emailInput = document.querySelector("#admin-email");
  const passwordInput = document.querySelector("#admin-password");
  const submitButton = form.querySelector("[type=submit]");

  if (!isSupabaseConfigured) {
    showLoginError(getSupabaseConfigError());
    return;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) showLoginError("Sesi admin gagal diperiksa. Coba lagi.", error);
  if (data?.session && isAdmin(data.session.user)) {
    window.location.replace("./admin.html");
    return;
  }
  if (data?.session) {
    await supabase.auth.signOut();
    showLoginError("Akun ini tidak memiliki akses admin.");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !emailInput.validity.valid) {
      showLoginError("Masukkan alamat email yang valid.");
      emailInput.focus();
      return;
    }
    if (!password) {
      showLoginError("Masukkan password admin.");
      passwordInput.focus();
      return;
    }

    submitButton.disabled = true;
    document.querySelector("#login-error").hidden = true;
    try {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginError) throw loginError;
      if (!isAdmin(loginData.user)) {
        await supabase.auth.signOut();
        showLoginError("Akun ini tidak memiliki akses admin.");
        return;
      }
      window.location.replace("./admin.html");
    } catch (error) {
      showLoginError(error.message || "Login gagal. Periksa koneksi Supabase.", error);
    } finally {
      submitButton.disabled = false;
    }
  });
}

function showAdminError(message, error) {
  if (error) console.error("TEAMCUT Supabase Admin:", error);
  const errorMessage = document.querySelector("#admin-data-error");
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.hidden = false;
  }
}

function clearAdminError() {
  const errorMessage = document.querySelector("#admin-data-error");
  if (errorMessage) {
    errorMessage.textContent = "";
    errorMessage.hidden = true;
  }
}

async function setupAdmin() {
  const dashboard = document.querySelector("#dashboard-screen");
  if (!dashboard) return;
  if (!isSupabaseConfigured) {
    document.body.classList.remove("is-locked");
    showAdminError(getSupabaseConfigError());
    return;
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    showAdminError("Sesi admin gagal diperiksa. Silakan login kembali.", sessionError);
    window.location.replace("./login.html");
    return;
  }
  if (!sessionData.session || !isAdmin(sessionData.session.user)) {
    if (sessionData.session) await supabase.auth.signOut();
    window.location.replace("./login.html");
    return;
  }

  document.body.classList.remove("is-locked");
  const branchSelect = document.querySelector("#branch-select");
  const branchName = document.querySelector("#active-branch-name");
  const statusToggle = document.querySelector("#status-toggle");
  const statusLabel = document.querySelector("#status-label");
  const queueNumber = document.querySelector("#queue-number");
  const queueMinus = document.querySelector("#queue-minus");
  const queuePlus = document.querySelector("#queue-plus");
  const updatedAt = document.querySelector("#updated-at");
  const logoutButton = document.querySelector("#logout-button");
  const accountEmail = document.querySelector("#account-email");
  let branches = [];
  let busy = false;
  let queueChannel;

  if (accountEmail) accountEmail.textContent = sessionData.session.user.email || "ADMIN";

  function getSelectedBranch() {
    return branches.find((branch) => branch.id === branchSelect.value) || null;
  }

  function formatTimestamp(value) {
    if (!value) return "—";
    const timestamp = new Date(value);
    if (Number.isNaN(timestamp.getTime())) return "—";
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(timestamp);
  }

  function renderBranch() {
    branchSelect.disabled = busy || branches.length === 0;
    const branch = getSelectedBranch();
    if (!branch) {
      branchName.firstChild.textContent = "DATA CABANG";
      statusToggle.disabled = true;
      queueMinus.disabled = true;
      queuePlus.disabled = true;
      queueNumber.textContent = "—";
      updatedAt.textContent = "—";
      updatedAt.removeAttribute("datetime");
      return;
    }

    branchName.firstChild.textContent = branch.nama.toUpperCase();
    statusLabel.textContent = branch.status ? "BUKA" : "TUTUP";
    statusToggle.classList.toggle("is-open", branch.status);
    statusToggle.setAttribute("aria-pressed", String(branch.status));
    statusToggle.setAttribute("aria-label", `Status cabang ${branch.status ? "buka" : "tutup"}. Tekan untuk mengubah.`);
    statusToggle.disabled = busy;

    const queue = branch.queue;
    queueNumber.textContent = queue ? String(queue.jumlah).padStart(2, "0") : "—";
    queueMinus.disabled = busy || !queue || queue.jumlah <= 0;
    queuePlus.disabled = busy || !queue;
    updatedAt.textContent = formatTimestamp(queue?.diperbarui_pada);
    if (queue?.diperbarui_pada) updatedAt.dateTime = queue.diperbarui_pada;
    else updatedAt.removeAttribute("datetime");
  }

  async function loadBranchData() {
    const [branchResult, queueResult] = await Promise.all([
      supabase.from("cabang").select("*").order("created_at", { ascending: true }),
      supabase.from("antrean").select("*"),
    ]);
    if (branchResult.error) throw branchResult.error;
    if (queueResult.error) throw queueResult.error;

    const selectedId = branchSelect.value;
    const queueMap = new Map(queueResult.data.map((queue) => [queue.cabang_id, queue]));
    branches = branchResult.data.map((branch) => ({
      ...branch,
      queue: queueMap.get(branch.id) || null,
    }));
    branchSelect.replaceChildren(...branches.map((branch) => {
      const option = document.createElement("option");
      option.value = branch.id;
      option.textContent = branch.nama;
      return option;
    }));
    if (branches.some((branch) => branch.id === selectedId)) branchSelect.value = selectedId;
    else if (branches[0]) branchSelect.value = branches[0].id;
    branchSelect.disabled = branches.length === 0;
    renderBranch();
    if (branches.some((branch) => !branch.queue)) {
      showAdminError("Belum ada antrean di salah satu cabang. Periksa data public.antrean.");
    } else {
      clearAdminError();
    }
  }

  function setBranchRow(row) {
    const index = branches.findIndex((branch) => branch.id === row.id);
    if (index < 0) return;
    branches[index] = { ...branches[index], ...row };
    if (branches[index].id === branchSelect.value) renderBranch();
  }

  function setQueueRow(row) {
    const index = branches.findIndex((branch) => branch.id === row.cabang_id);
    if (index < 0) return;
    branches[index].queue = row;
    if (branches[index].id === branchSelect.value) renderBranch();
  }

  async function changeQueue(amount) {
    const branch = getSelectedBranch();
    if (!branch?.queue || busy) return;
    const jumlah = Math.max(0, branch.queue.jumlah + amount);
    if (jumlah === branch.queue.jumlah) return;
    busy = true;
    renderBranch();
    try {
      const { data, error } = await supabase
        .from("antrean")
        .update({ jumlah })
        .eq("cabang_id", branch.id)
        .select("id,cabang_id,jumlah,diperbarui_pada")
        .single();
      if (error) throw error;
      setQueueRow(data);
      clearAdminError();
    } catch (error) {
      showAdminError("Jumlah antrean gagal disimpan. Periksa policy RLS dan koneksi.", error);
    } finally {
      busy = false;
      renderBranch();
    }
  }

  async function toggleBranchStatus() {
    const branch = getSelectedBranch();
    if (!branch || busy) return;
    busy = true;
    renderBranch();
    try {
      const { data, error } = await supabase
        .from("cabang")
        .update({ status: !branch.status })
        .eq("id", branch.id)
        .select("id,nama,status")
        .single();
      if (error) throw error;
      setBranchRow(data);
      clearAdminError();
    } catch (error) {
      showAdminError("Status cabang gagal disimpan. Periksa policy RLS dan koneksi.", error);
    } finally {
      busy = false;
      renderBranch();
    }
  }

  branchSelect.addEventListener("change", renderBranch);
  statusToggle.addEventListener("click", toggleBranchStatus);
  queueMinus.addEventListener("click", () => changeQueue(-1));
  queuePlus.addEventListener("click", () => changeQueue(1));
  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    if (queueChannel) await supabase.removeChannel(queueChannel);
    const { error } = await supabase.auth.signOut();
    if (error) {
      logoutButton.disabled = false;
      showAdminError("Logout gagal. Coba lagi.", error);
      return;
    }
    window.location.replace("./login.html");
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || (session && !isAdmin(session.user))) {
      window.location.replace("./login.html");
    }
  });

  try {
    await loadBranchData();
    queueChannel = supabase
      .channel("teamcut-admin-data")
      .on("postgres_changes", { event: "*", schema: "public", table: "antrean" }, (payload) => {
        if (payload.new?.cabang_id) setQueueRow(payload.new);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "cabang" }, (payload) => {
        if (payload.new?.id) setBranchRow(payload.new);
      })
      .subscribe((status, error) => {
        if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
          showAdminError("Koneksi realtime admin terputus.", error);
        }
      });
  } catch (error) {
    showAdminError("Data cabang dan antrean gagal dimuat dari Supabase.", error);
  }

  document.querySelector("#dashboard-title").focus({ preventScroll: true });
}

if (document.querySelector("#login-form")) setupLogin();
if (document.querySelector("#dashboard-screen")) setupAdmin();
