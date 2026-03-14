require('dotenv').config();
const express = require('express');
const router = express.Router();
const { createClerkClient } = require('@clerk/backend');
const auth = require('../middleware/auth');

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// GET /api/auth/me (protected) — returns the Clerk user for the current session
router.get('/me', auth, async (req, res) => {
  try {
    const clerkUser = await clerkClient.users.getUser(req.user.id);
    res.json({
      id: clerkUser.id,
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
      email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
    });
  } catch (err) {
    res.status(404).json({ error: 'User not found' });
  }
});

module.exports = router;