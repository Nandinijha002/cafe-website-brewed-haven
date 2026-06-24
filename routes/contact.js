/* ══════════════════════════════════════════════
   routes/contact.js
   POST   /api/contact         — submit a contact message (public)
   GET    /api/contact         — list messages (admin only)
   DELETE /api/contact/:id     — delete a message (admin only)
══════════════════════════════════════════════ */
const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db/jsonStore');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').trim().isEmail().withMessage('Enter a valid email address.'),
    body('message').trim().notEmpty().withMessage('Message cannot be empty.'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, message } = req.body;
    const entry = db.insert('contacts', { name, email, message, read: false });
    res.status(201).json({ message: 'Thanks for reaching out — we will get back to you soon!', entry });
  }
);

router.get('/', requireAuth, (req, res) => {
  const items = db.all('contacts').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(items);
});

router.delete('/:id', requireAuth, (req, res) => {
  const deleted = db.remove('contacts', req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Message not found.' });
  res.json({ message: 'Message deleted.' });
});

module.exports = router;