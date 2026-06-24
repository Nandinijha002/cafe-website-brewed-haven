/* ══════════════════════════════════════════════
   BREWED HAVEN — script.js
   Handles: mobile menu, menu tab switching,
   form validation, active nav highlight on scroll
══════════════════════════════════════════════ */

/* ── MOBILE MENU TOGGLE ─────────────────────── */
function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}

function closeMenu() {
  document.getElementById('mobileMenu').classList.remove('open');
}

/* ── MENU TAB SWITCHING ─────────────────────── */
function switchTab(btn, tabId) {
  // Remove active class from all tab buttons and sections
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.menu-section').forEach(s => s.classList.remove('active'));

  // Activate the clicked tab and matching section
  btn.classList.add('active');
  document.getElementById('tab-' + tabId).classList.add('active');
}

/* ── RESERVATION FORM: VALIDATE + SEND TO BACKEND ── */

// Change this if your backend runs on a different URL
const API_BASE_URL = 'http://localhost:5000';

async function submitForm() {
  let valid = true;

  const fields = [
    { id: 'fname',  err: 'err-fname',  check: v => v.trim().length > 1 },
    { id: 'fphone', err: 'err-fphone', check: v => /^[+\d\s]{7,}$/.test(v.trim()) },
    { id: 'femail', err: 'err-femail', check: v => /\S+@\S+\.\S+/.test(v.trim()) },
    { id: 'fdate',  err: 'err-fdate',  check: v => v !== '' },
    { id: 'ftime',  err: 'err-ftime',  check: v => v !== '' },
  ];

  fields.forEach(f => {
    const el = document.getElementById(f.id);
    const errEl = document.getElementById(f.err);

    if (!f.check(el.value)) {
      errEl.style.display = 'block';
      el.style.borderColor = '#c0392b';
      valid = false;
    } else {
      errEl.style.display = 'none';
      el.style.borderColor = '#4CAF50';
    }
  });

  if (!valid) return; // stop here if any field failed validation

  // Collect form data to send to the backend
  const payload = {
    name: document.getElementById('fname').value.trim(),
    phone: document.getElementById('fphone').value.trim(),
    email: document.getElementById('femail').value.trim(),
    date: document.getElementById('fdate').value,
    time: document.getElementById('ftime').value,
    guests: document.getElementById('fguests').value,
    message: document.getElementById('fmsg').value.trim(),
  };

  const btn = document.querySelector('.fsub');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Submitting...';

  try {
    const res = await fetch(`${API_BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      // Backend validation failed (e.g. bad email format caught server-side too)
      const msg = data.errors?.[0]?.msg || data.error || 'Something went wrong. Please try again.';
      alert(msg);
      btn.disabled = false;
      btn.textContent = originalText;
      return;
    }

    // Success — show confirmation message
    document.getElementById('formSuccess').style.display = 'block';
    btn.textContent = '✓ Reservation Confirmed';
    btn.style.background = '#4CAF50';

  } catch (err) {
    // Network error — backend server not running or unreachable
    alert('Could not reach the server. Please check your connection and try again, or call us directly.');
    btn.disabled = false;
    btn.textContent = originalText;
    console.error('Reservation submission failed:', err);
  }
}

/* ── ACTIVE NAV LINK HIGHLIGHT ON SCROLL ─────── */
const sections = document.querySelectorAll('section[id]');
const navAs = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';

  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 100) {
      current = sec.id;
    }
  });

  navAs.forEach(a => {
    a.style.color = a.getAttribute('href') === '#' + current ? 'var(--latte)' : '';
  });
});