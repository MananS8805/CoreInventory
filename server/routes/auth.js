require('dotenv').config();
const express = require('express');
const router = express.Router();
const { createClerkClient } = require('@clerk/backend');
const auth = require('../middleware/auth');
const store = require('../data/store');

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// GET /api/auth/me (protected) — returns the Clerk user for the current session
router.get('/me', auth, async (req, res) => {
  try {
    const clerkUser = await clerkClient.users.getUser(req.user.clerkId);
    res.json({
      id: clerkUser.id,
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
      email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
    });
  } catch (err) {
    res.status(404).json({ error: 'User not found' });
  }
});

// POST /api/auth/clerk-sync
// Called automatically after Clerk login — creates/finds user, returns success
router.post('/clerk-sync', async (req, res) => {
  const { email, name, clerkId } = req.body;
  if (!email || !clerkId) return res.status(400).json({ error: 'Email and clerkId required' });

  try {
    // Verify the Clerk token is valid
    const clerkUser = await clerkClient.users.getUser(clerkId);
    if (clerkUser.emailAddresses?.[0]?.emailAddress !== email) {
      return res.status(400).json({ error: 'Email mismatch' });
    }

    // Find existing user by clerkId or email
    let user = store.users.find(u => u.clerkId === clerkId) || store.users.find(u => u.email === email);

    if (!user) {
      // Auto-create user from Clerk data
      user = {
        id: clerkId,
        clerkId,
        name: name || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email.split('@')[0],
        email,
        passwordHash: 'clerk-managed',
        createdAt: new Date().toISOString()
      };
      store.users.push(user);
    } else if (!user.clerkId) {
      // Update existing user with clerkId
      user.clerkId = clerkId;
      store.updateUser ? store.updateUser(user.id, { clerkId }) : null;
    }

    res.json({ user, message: 'Sync successful' });
  } catch (err) {
    console.error('Clerk sync error:', err);
    res.status(400).json({ error: 'Invalid Clerk token' });
  }
});

module.exports = router;