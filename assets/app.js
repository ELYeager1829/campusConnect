// ---------- STORAGE KEYS ----------
const STORAGE_KEYS = {
  REQUESTS: "cc_requests_v1",
  ANNOUNCEMENTS: "cc_announcements_v1",
  ADMIN_SESSION: "cc_admin_session_v1",
};

// ---------- UTIL ----------
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + "_" + Math.random().toString(16).slice(2);
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString();
}

function statusBadge(status) {
  const map = {
    SUBMITTED: "secondary",
    IN_PROGRESS: "warning",
    RESOLVED: "success",
    REJECTED: "danger",
  };
  const cls = map[status] || "secondary";
  return `<span class="badge text-bg-${cls}">${status}</span>`;
}

// ---------- REQUESTS ----------
function getRequests() {
  return load(STORAGE_KEYS.REQUESTS, []);
}

function setRequests(requests) {
  save(STORAGE_KEYS.REQUESTS, requests);
}

function addRequest(r) {
  const requests = getRequests();
  requests.unshift(r);
  setRequests(requests);
}

function updateRequestStatus(id, newStatus) {
  const requests = getRequests();
  const idx = requests.findIndex(r => r.id === id);
  if (idx >= 0) {
    requests[idx].status = newStatus;
    requests[idx].updatedAt = Date.now();
    setRequests(requests);
    return requests[idx];
  }
  return null;
}

// ---------- ANNOUNCEMENTS ----------
function getAnnouncements() {
  return load(STORAGE_KEYS.ANNOUNCEMENTS, [
    {
      id: uid(),
      title: "Welcome to CampusConnect Lite",
      body: "This is a demo build using HTML, CSS, and JavaScript.",
      createdAt: Date.now()
    }
  ]);
}

function setAnnouncements(items) {
  save(STORAGE_KEYS.ANNOUNCEMENTS, items);
}

function addAnnouncement(a) {
  const items = getAnnouncements();
  items.unshift(a);
  setAnnouncements(items);
}

// ---------- HOME PAGE RENDER ----------
function renderAnnouncements() {
  const el = document.getElementById("announcements");
  if (!el) return;

  const items = getAnnouncements();
  el.innerHTML = items.slice(0, 6).map(a => `
    <div class="col-md-6">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <h3 class="h6 fw-bold mb-1">${escapeHtml(a.title)}</h3>
            <span class="small-muted">${formatDate(a.createdAt)}</span>
          </div>
          <p class="text-muted mb-0">${escapeHtml(a.body)}</p>
        </div>
      </div>
    </div>
  `).join("");
}

// ---------- REQUEST PAGE ----------
function setupRequestPage() {
  const form = document.getElementById("requestForm");
  const alertBox = document.getElementById("alertBox");
  const myRequests = document.getElementById("myRequests");
  const viewBtn = document.getElementById("viewMyRequestsBtn");

  function showAlert(type, text) {
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = text;
    alertBox.classList.remove("d-none");
  }

  function renderMyRequests(email) {
    const requests = getRequests().filter(r => r.email.toLowerCase() === email.toLowerCase());
    if (!requests.length) {
      myRequests.innerHTML = `<div class="text-muted">No requests found for ${escapeHtml(email)}.</div>`;
      return;
    }

    myRequests.innerHTML = requests.map(r => `
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="fw-bold">${escapeHtml(r.type)} request</div>
              <div class="text-muted small">Created: ${formatDate(r.createdAt)}</div>
              ${r.updatedAt ? `<div class="text-muted small">Updated: ${formatDate(r.updatedAt)}</div>` : ""}
            </div>
            <div>${statusBadge(r.status)}</div>
          </div>
          <hr>
          <div class="small">${escapeHtml(r.description)}</div>
          <div class="text-muted small mt-2">Ref: <code>${r.id}</code></div>
        </div>
      </div>
    `).join("");
  }

  viewBtn?.addEventListener("click", () => {
    const email = form?.elements?.email?.value?.trim();
    if (!email) {
      showAlert("warning", "Enter your email above, then click “View my requests”.");
      return;
    }
    renderMyRequests(email);
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const studentNo = form.elements.studentNo.value.trim();
    const type = form.elements.type.value;
    const description = form.elements.description.value.trim();

    const requestObj = {
      id: uid(),
      name,
      email,
      studentNo,
      type,
      description,
      status: "SUBMITTED",
      createdAt: Date.now(),
      updatedAt: null
    };

    addRequest(requestObj);

    // Send an actual email notification (EmailJS)
    try {
      await sendNotificationEmail({
        to_email: email,
        to_name: name,
        subject: "CampusConnect: Request Received ✅",
        message:
`Hi ${name},

We received your ${type} request (Ref: ${requestObj.id}).
Status: SUBMITTED

Description:
${description}

We will notify you when the status changes.

CampusConnect Lite`
      });

      showAlert("success", "Request submitted and email sent successfully!");
    } catch (err) {
      console.error(err);
      showAlert("warning", "Request saved, but email failed. Check EmailJS keys/config.");
    }

    renderMyRequests(email);
    form.reset();
  });
}

// ---------- ESCAPE HTML (basic safety) ----------
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
