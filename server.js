/* ══════════════════════════════════════════════
   server.js
   Brewed Haven — Cafe Website Backend
   Entry point: wires up middleware, routes, and
   starts the Express server.
══════════════════════════════════════════════ */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const menuRoutes = require('./routes/menu');
const reservationRoutes = require('./routes/reservations');
const contactRoutes = require('./routes/contact');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

/* ── GLOBAL MIDDLEWARE ── */
app.use(cors());
app.use(express.json());

/* ── SERVE THE ADMIN PANEL (static HTML/CSS/JS) ── */
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

/* ── API ROUTES ── */
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/contact', contactRoutes);

/* ── HEALTH CHECK ── */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Brewed Haven API is running.' });
});

/* ── 404 HANDLER ── */
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

/* ── GLOBAL ERROR HANDLER ── */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`🍵 Brewed Haven API running at http://localhost:${PORT}`);
  console.log(`🔐 Admin panel available at  http://localhost:${PORT}/admin`);
});