const ADMIN_PASSWORD = "Admin@123"; // demo password only

function setupAdminPage() {
  const loginCard = document.getElementById("loginCard");
  const dashboard = document.getElementById("dashboard");
  const adminLoginForm = document.getElementById("adminLoginForm");
  const adminAlert = document.getElementById("adminAlert");

  const requestsList = document.getElementById("requestsList");
  const logoutBtn = document.getElementById("logoutBtn");
  const clearDataBtn = document.getElementById("clearDataBtn");

  const announcementForm = document.getElementById("announcementForm");
  const announcementList = document.getElementById("announcementList");

  function showAdminAlert(type, text) {
    adminAlert.className = `alert alert-${type}`;
    adminAlert.textContent = text;
    adminAlert.classList.remove("d-none");
  }

  function setAdminSession(isLoggedIn) {
    localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify({ loggedIn: isLoggedIn }));
  }

  function getAdminSession() {
    const s = load(STORAGE_KEYS.ADMIN_SESSION, { loggedIn: false });
    return !!s.loggedIn;
  }

  function openDashboard() {
    loginCard.classList.add("d-none");
    dashboard.classList.remove("d-none");
    renderRequests();
    renderAnnouncementsAdmin();
  }

  function openLogin() {
    dashboard.classList.add("d-none");
    loginCard.classList.remove("d-none");
  }

  // --- LOGIN FLOW ---
  if (getAdminSession()) openDashboard();

  adminLoginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const pwd = document.getElementById("adminPassword").value;

    if (pwd === ADMIN_PASSWORD) {
      setAdminSession(true);
      openDashboard();
    } else {
      showAdminAlert("danger", "Incorrect password.");
    }
  });

  logoutBtn?.addEventListener("click", () => {
    setAdminSession(false);
    openLogin();
  });

  clearDataBtn?.addEventListener("click", () => {
    if (!confirm("Clear all demo data (requests + announcements)?")) return;
    localStorage.removeItem(STORAGE_KEYS.REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.ANNOUNCEMENTS);
    renderRequests();
    renderAnnouncementsAdmin();
  });

  // --- REQUESTS ---
  function renderRequests() {
    const requests = getRequests();

    if (!requests.length) {
      requestsList.innerHTML = `<div class="text-muted">No requests submitted yet.</div>`;
      return;
    }

    requestsList.innerHTML = requests.map(r => `
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="fw-bold">${escapeHtml(r.name)} (${escapeHtml(r.studentNo)})</div>
              <div class="text-muted small">${escapeHtml(r.email)}</div>
              <div class="text-muted small">Created: ${formatDate(r.createdAt)}</div>
              ${r.updatedAt ? `<div class="text-muted small">Updated: ${formatDate(r.updatedAt)}</div>` : ""}
              <div class="mt-2">${statusBadge(r.status)} <span class="ms-2 small-muted">Type: ${escapeHtml(r.type)}</span></div>
            </div>
            <div class="text-end">
              <div class="small text-muted">Ref</div>
              <code>${r.id}</code>
            </div>
          </div>

          <hr>
          <div class="small">${escapeHtml(r.description)}</div>

          <div class="d-flex gap-2 mt-3 flex-wrap">
            <button class="btn btn-sm btn-outline-warning" data-action="IN_PROGRESS" data-id="${r.id}">Mark In Progress</button>
            <button class="btn btn-sm btn-outline-success" data-action="RESOLVED" data-id="${r.id}">Mark Resolved</button>
            <button class="btn btn-sm btn-outline-danger" data-action="REJECTED" data-id="${r.id}">Reject</button>
          </div>
        </div>
      </div>
    `).join("");

    // attach handlers
    requestsList.querySelectorAll("button[data-action]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const status = btn.getAttribute("data-action");

        const updated = updateRequestStatus(id, status);
        renderRequests();

        // Send email update to student
        if (updated) {
          try {
            await sendNotificationEmail({
              to_email: updated.email,
              to_name: updated.name,
              subject: `CampusConnect: Status Updated (${status})`,
              type: updated.type,
              request_id: updated.id,
              description: updated.description, // ✅ reused
              status: status
            });
            alert(`Status updated and email sent to ${updated.email}`);
          } catch (err) {
            console.error(err);
            alert("Status updated, but email failed. Check EmailJS config.");
          }
        }
      });
    });
  }

  // --- ANNOUNCEMENTS ---
  function renderAnnouncementsAdmin() {
    const items = getAnnouncements();
    if (!items.length) {
      announcementList.innerHTML = `<div class="text-muted">No announcements.</div>`;
      return;
    }

    announcementList.innerHTML = items.map(a => `
      <div class="card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div class="fw-bold">${escapeHtml(a.title)}</div>
            <div class="small-muted">${formatDate(a.createdAt)}</div>
          </div>
          <div class="text-muted small mt-1">${escapeHtml(a.body)}</div>
        </div>
      </div>
    `).join("");
  }

  announcementForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = announcementForm.elements.title.value.trim();
    const body = announcementForm.elements.body.value.trim();

    addAnnouncement({
      id: uid(),
      title,
      body,
      createdAt: Date.now()
    });

    announcementForm.reset();
    renderAnnouncementsAdmin();
  });
}
