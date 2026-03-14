const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const store = require('../data/store');
const auth = require('../middleware/auth');

const JWT_SECRET = 'coreinventory_secret_2024';

// POST /api/auth/signup
// Body: { name, email, password }
// Validate: email unique, password min 6 chars
// Hash password with bcryptjs
// Return: { token, user: { id, name, email } }
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Check unique email
    const existing = store.users.find(u => u.email === email);
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const newUser = {
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash,
      createdAt: new Date().toISOString()
    };
    
    store.users.push(newUser);
    
    const userRet = { id: newUser.id, name: newUser.name, email: newUser.email };
    const token = jwt.sign(userRet, JWT_SECRET);
    
    res.json({ token, user: userRet });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
// Body: { email, password }
// Return: { token, user: { id, name, email } }
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = store.users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const userRet = { id: user.id, name: user.name, email: user.email };
    const token = jwt.sign(userRet, JWT_SECRET);
    
    res.json({ token, user: userRet });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me (protected)
// Return: current user object (no passwordHash)
router.get('/me', auth, (req, res) => {
  const user = store.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const { passwordHash, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

module.exports = router;
