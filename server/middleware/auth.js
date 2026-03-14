const { createClerkClient } = require('@clerk/backend');

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

module.exports = async (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No token' });

  const token = header.split(' ')[1];
  try {
    const payload = await clerk.verifyToken(token);
    req.user = {
      id: payload.sub,
      clerkId: payload.sub,
    };
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};