/* ══════════════════════════════════════════════
   routes/menu.js
   GET    /api/menu              — list all menu items (public)
   GET    /api/menu/:id          — get single item (public)
   POST   /api/menu              — create item (admin only)
   PUT    /api/menu/:id          — update item (admin only)
   DELETE /api/menu/:id          — delete item (admin only)
══════════════════════════════════════════════ */
const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db/jsonStore');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const CATEGORIES = ['coffee', 'fastfood', 'desserts', 'beverages', 'specials'];

/* ── PUBLIC: list menu items, optional ?category= filter ── */
router.get('/', (req, res) => {
  const { category } = req.query;
  let items = db.all('menu');
  if (category) {
    items = items.filter(i => i.category === category);
  }
  res.json(items);
});

/* ── PUBLIC: get single item ── */
router.get('/:id', (req, res) => {
  const item = db.findById('menu', req.params.id);
  if (!item) return res.status(404).json({ error: 'Menu item not found.' });
  res.json(item);
});

/* ── ADMIN: create item ── */
router.post(
  '/',
  requireAuth,
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('category').isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
    body('description').trim().notEmpty().withMessage('Description is required.'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number.'),
    body('image').optional().isURL().withMessage('Image must be a valid URL.'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, category, description, price, image, available } = req.body;
    const item = db.insert('menu', {
      name,
      category,
      description,
      price: Number(price),
      image: image || '',
      available: available !== undefined ? Boolean(available) : true,
    });
    res.status(201).json(item);
  }
);

/* ── ADMIN: update item ── */
router.put(
  '/:id',
  requireAuth,
  [
    body('name').optional().trim().notEmpty(),
    body('category').optional().isIn(CATEGORIES),
    body('description').optional().trim().notEmpty(),
    body('price').optional().isFloat({ min: 0 }),
    body('image').optional().isURL(),
    body('available').optional().isBoolean(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const updated = db.update('menu', req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Menu item not found.' });
    res.json(updated);
  }
);

/* ── ADMIN: delete item ── */
router.delete('/:id', requireAuth, (req, res) => {
  const deleted = db.remove('menu', req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Menu item not found.' });
  res.json({ message: 'Menu item deleted.' });
});

module.exports = router;