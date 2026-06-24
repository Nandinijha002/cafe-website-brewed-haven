/* ══════════════════════════════════════════════
   public/admin/admin.js
   Talks to the Express API using fetch + JWT stored
   in localStorage. Handles login, dashboard stats,
   reservations table, menu CRUD, and messages.
══════════════════════════════════════════════ */

const API = ''; // same origin — change to e.g. 'http://localhost:5000' if hosted separately

/* ── AUTH HELPERS ── */
function getToken() { return localStorage.getItem('bh_token'); }
function setToken(t) { localStorage.setItem('bh_token', t); }
function clearToken() { localStorage.removeItem('bh_token'); }

function authHeaders() {
  return { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' };
}

async function apiFetch(path, options = {}) {
  const res = await fetch(API + path, options);
  if (res.status === 401) {
    clearToken();
    showLogin();
    throw new Error('Session expired. Please log in again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || (data.errors && data.errors[0]?.msg) || 'Request failed.';
    throw new Error(msg);
  }
  return data;
}

/* ── LOGIN / LOGOUT ── */
function showLogin() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('dashboard').classList.add('hidden');
}
function showDashboard() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  loadOverview();
}

async function login() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginErr');
  errEl.textContent = '';

  try {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    setToken(data.token);
    showDashboard();
  } catch (e) {
    errEl.textContent = e.message;
  }
}

function logout() {
  clearToken();
  showLogin();
}

/* ── SIDEBAR NAVIGATION ── */
function switchSection(btn, tab) {
  document.querySelectorAll('.sb-link').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('sec-' + tab).classList.add('active');

  if (tab === 'overview') loadOverview();
  if (tab === 'reservations') loadReservations();
  if (tab === 'menu') loadMenuAdmin();
  if (tab === 'messages') loadMessages();
}

/* ── OVERVIEW ── */
async function loadOverview() {
  try {
    const [reservations, menu, messages] = await Promise.all([
      apiFetch('/api/reservations', { headers: authHeaders() }),
      apiFetch('/api/menu'),
      apiFetch('/api/contact', { headers: authHeaders() }),
    ]);

    document.getElementById('statReservations').textContent = reservations.length;
    document.getElementById('statPending').textContent = reservations.filter(r => r.status === 'pending').length;
    document.getElementById('statMenu').textContent = menu.length;
    document.getElementById('statMessages').textContent = messages.length;

    const tbody = document.querySelector('#recentResTable tbody');
    tbody.innerHTML = '';
    reservations.slice(0, 5).forEach(r => {
      tbody.innerHTML += `<tr><td>${esc(r.name)}</td><td>${esc(r.date)}</td><td>${esc(r.time)}</td><td>${esc(r.guests || '—')}</td>
        <td><span class="status-badge status-${r.status}">${r.status}</span></td></tr>`;
    });
    if (reservations.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No reservations yet.</td></tr>`;
    }
  } catch (e) {
    alert(e.message);
  }
}

/* ── RESERVATIONS ── */
async function loadReservations() {
  const status = document.getElementById('resFilter').value;
  try {
    const url = '/api/reservations' + (status ? `?status=${status}` : '');
    const items = await apiFetch(url, { headers: authHeaders() });
    const tbody = document.querySelector('#resTable tbody');
    tbody.innerHTML = '';

    if (items.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="9">No reservations found.</td></tr>`;
      return;
    }

    items.forEach(r => {
      tbody.innerHTML += `
        <tr>
          <td>${esc(r.name)}</td>
          <td>${esc(r.phone)}</td>
          <td>${esc(r.email)}</td>
          <td>${esc(r.date)}</td>
          <td>${esc(r.time)}</td>
          <td>${esc(r.guests || '—')}</td>
          <td>${esc(r.message || '—')}</td>
          <td>
            <select class="status-select" onchange="updateReservationStatus(${r.id}, this.value)">
              ${['pending','confirmed','completed','cancelled'].map(s =>
                `<option value="${s}" ${s === r.status ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </td>
          <td><button class="row-btn delete" onclick="deleteReservation(${r.id})">Delete</button></td>
        </tr>`;
    });
  } catch (e) {
    alert(e.message);
  }
}

async function updateReservationStatus(id, status) {
  try {
    await apiFetch(`/api/reservations/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
  } catch (e) {
    alert(e.message);
  }
}

async function deleteReservation(id) {
  if (!confirm('Delete this reservation?')) return;
  try {
    await apiFetch(`/api/reservations/${id}`, { method: 'DELETE', headers: authHeaders() });
    loadReservations();
  } catch (e) {
    alert(e.message);
  }
}

/* ── MENU ADMIN ── */
let currentMenuItems = [];

async function loadMenuAdmin() {
  try {
    currentMenuItems = await apiFetch('/api/menu');
    const grid = document.getElementById('menuAdminGrid');
    grid.innerHTML = '';

    currentMenuItems.forEach(item => {
      grid.innerHTML += `
        <div class="ma-card ${item.available ? '' : 'ma-unavailable'}">
          <div class="ma-img" style="background-image:url('${esc(item.image)}')"></div>
          <div class="ma-body">
            <h4>${esc(item.name)}</h4>
            <div class="ma-cat">${esc(item.category)}</div>
            <p class="ma-desc">${esc(item.description)}</p>
            <div class="ma-foot">
              <span class="ma-price">₹${item.price}</span>
              ${!item.available ? '<span class="ma-badge">Unavailable</span>' : ''}
            </div>
            <div style="margin-top:.7rem">
              <button class="row-btn edit" onclick="openMenuModal(${item.id})">Edit</button>
              <button class="row-btn delete" onclick="deleteMenuItem(${item.id})">Delete</button>
            </div>
          </div>
        </div>`;
    });

    if (currentMenuItems.length === 0) {
      grid.innerHTML = `<p style="color:var(--text-light)">No menu items yet. Click "Add Item" to create one.</p>`;
    }
  } catch (e) {
    alert(e.message);
  }
}

function openMenuModal(id) {
  const modal = document.getElementById('menuModal');
  document.getElementById('menuModalErr').textContent = '';
  modal.classList.remove('hidden');

  if (id) {
    const item = currentMenuItems.find(i => i.id === id);
    document.getElementById('menuModalTitle').textContent = 'Edit Menu Item';
    document.getElementById('menuItemId').value = item.id;
    document.getElementById('mName').value = item.name;
    document.getElementById('mCategory').value = item.category;
    document.getElementById('mDescription').value = item.description;
    document.getElementById('mPrice').value = item.price;
    document.getElementById('mAvailable').value = String(item.available);
    document.getElementById('mImage').value = item.image;
  } else {
    document.getElementById('menuModalTitle').textContent = 'Add Menu Item';
    document.getElementById('menuItemId').value = '';
    document.getElementById('mName').value = '';
    document.getElementById('mCategory').value = 'coffee';
    document.getElementById('mDescription').value = '';
    document.getElementById('mPrice').value = '';
    document.getElementById('mAvailable').value = 'true';
    document.getElementById('mImage').value = '';
  }
}

function closeMenuModal() {
  document.getElementById('menuModal').classList.add('hidden');
}

async function saveMenuItem() {
  const id = document.getElementById('menuItemId').value;
  const payload = {
    name: document.getElementById('mName').value.trim(),
    category: document.getElementById('mCategory').value,
    description: document.getElementById('mDescription').value.trim(),
    price: Number(document.getElementById('mPrice').value),
    available: document.getElementById('mAvailable').value === 'true',
    image: document.getElementById('mImage').value.trim(),
  };

  const errEl = document.getElementById('menuModalErr');
  if (!payload.name || !payload.description || !payload.price) {
    errEl.textContent = 'Please fill in name, description, and price.';
    return;
  }

  try {
    if (id) {
      await apiFetch(`/api/menu/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(payload) });
    } else {
      await apiFetch('/api/menu', { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
    }
    closeMenuModal();
    loadMenuAdmin();
  } catch (e) {
    errEl.textContent = e.message;
  }
}

async function deleteMenuItem(id) {
  if (!confirm('Delete this menu item?')) return;
  try {
    await apiFetch(`/api/menu/${id}`, { method: 'DELETE', headers: authHeaders() });
    loadMenuAdmin();
  } catch (e) {
    alert(e.message);
  }
}

/* ── MESSAGES ── */
async function loadMessages() {
  try {
    const items = await apiFetch('/api/contact', { headers: authHeaders() });
    const tbody = document.querySelector('#msgTable tbody');
    tbody.innerHTML = '';

    if (items.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="5">No messages yet.</td></tr>`;
      return;
    }

    items.forEach(m => {
      tbody.innerHTML += `
        <tr>
          <td>${esc(m.name)}</td>
          <td>${esc(m.email)}</td>
          <td>${esc(m.message)}</td>
          <td>${new Date(m.createdAt).toLocaleString()}</td>
          <td><button class="row-btn delete" onclick="deleteMessage(${m.id})">Delete</button></td>
        </tr>`;
    });
  } catch (e) {
    alert(e.message);
  }
}

async function deleteMessage(id) {
  if (!confirm('Delete this message?')) return;
  try {
    await apiFetch(`/api/contact/${id}`, { method: 'DELETE', headers: authHeaders() });
    loadMessages();
  } catch (e) {
    alert(e.message);
  }
}

/* ── UTIL ── */
function esc(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── INIT ── */
(function init() {
  if (getToken()) {
    showDashboard();
  } else {
    showLogin();
  }

  // Allow Enter key to submit login form
  document.getElementById('loginPassword').addEventListener('keydown', e => {
    if (e.key === 'Enter') login();
  });
})();