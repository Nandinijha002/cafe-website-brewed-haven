/* ══════════════════════════════════════════════
   routes/reservations.js
   POST   /api/reservations         — create reservation (public, from website form)
   GET    /api/reservations         — list all reservations (admin only)
   GET    /api/reservations/:id     — get single reservation (admin only)
   PUT    /api/reservations/:id     — update status (admin only)
   DELETE /api/reservations/:id     — delete reservation (admin only)
══════════════════════════════════════════════ */
const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db/jsonStore');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

/* ── PUBLIC: submit a reservation from the website form ── */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('phone').trim().matches(/^[+\d\s]{7,15}$/).withMessage('Enter a valid phone number.'),
    body('email').trim().isEmail().withMessage('Enter a valid email address.'),
    body('date').notEmpty().withMessage('Date is required.'),
    body('time').notEmpty().withMessage('Time is required.'),
    body('guests').optional().trim(),
    body('message').optional().trim(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, phone, email, date, time, guests, message } = req.body;
    const reservation = db.insert('reservations', {
      name,
      phone,
      email,
      date,
      time,
      guests: guests || '',
      message: message || '',
      status: 'pending',
    });

    res.status(201).json({
      message: 'Reservation received! We will contact you shortly to confirm.',
      reservation,
    });
  }
);

/* ── ADMIN: list all reservations, optional ?status= filter ── */
router.get('/', requireAuth, (req, res) => {
  const { status } = req.query;
  let items = db.all('reservations');
  if (status) items = items.filter(r => r.status === status);
  // newest first
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(items);
});

/* ── ADMIN: get single reservation ── */
router.get('/:id', requireAuth, (req, res) => {
  const item = db.findById('reservations', req.params.id);
  if (!item) return res.status(404).json({ error: 'Reservation not found.' });
  res.json(item);
});

/* ── ADMIN: update reservation status ── */
router.put(
  '/:id',
  requireAuth,
  [body('status').isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}`)],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const updated = db.update('reservations', req.params.id, { status: req.body.status });
    if (!updated) return res.status(404).json({ error: 'Reservation not found.' });
    res.json(updated);
  }
);

/* ── ADMIN: delete reservation ── */
router.delete('/:id', requireAuth, (req, res) => {
  const deleted = db.remove('reservations', req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Reservation not found.' });
  res.json({ message: 'Reservation deleted.' });
});

module.exports = router;