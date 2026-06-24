/* ══════════════════════════════════════════════
   routes/auth.js
   POST /api/auth/login   — admin login, returns JWT
══════════════════════════════════════════════ */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db/jsonStore');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const admin = db.findOne('admins', a => a.username === username);

    if (!admin || !bcrypt.compareSync(password, admin.passwordHash)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, username: admin.username });
  }
);

module.exports = router;