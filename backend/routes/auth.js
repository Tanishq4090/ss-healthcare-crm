import express from 'express';

const router = express.Router();

router.post('/admin-login', (req, res) => {
  const { username, password } = req.body || {};
  const fallbackUser = process.env.ADMIN_FALLBACK_USERNAME;
  const fallbackPass = process.env.ADMIN_FALLBACK_PASSWORD;
  const sessionToken = process.env.ADMIN_FALLBACK_SESSION_TOKEN;

  if (!fallbackUser || !fallbackPass || !sessionToken) {
    return res.status(503).json({ ok: false, error: 'Admin fallback is not configured' });
  }

  if (username !== fallbackUser || password !== fallbackPass) {
    return res.status(401).json({ ok: false, error: 'Invalid username or password' });
  }

  return res.json({
    ok: true,
    token: sessionToken,
    user: {
      id: 'admin-fallback',
      username: fallbackUser,
      name: 'System Admin',
      role: 'admin',
    },
  });
});

export default router;
