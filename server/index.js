// CertStudyHub API server.
//
// Exposes auth (register/login/logout/me) and per-user, per-certification
// progress storage. It listens only on localhost; nginx reverse-proxies /api to
// it. The React SPA is served separately by nginx as static files.

import express from 'express';
import cookieParser from 'cookie-parser';
import { db } from './db.js';
import {
  hashPassword,
  verifyPassword,
  signToken,
  authMiddleware,
  cookieOptions,
} from './auth.js';

const app = express();
app.use(express.json({ limit: '4mb' }));
app.use(cookieParser());

// Certifications the API will accept progress for. Keep in sync with the client.
const VALID_CERTS = new Set(['az104', 'secplus']);
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/;

// ---- prepared statements ----
const findUserByName = db.prepare('SELECT * FROM users WHERE username = ?');
const insertUser = db.prepare(
  'INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)',
);
const getProgress = db.prepare(
  'SELECT data, updated_at FROM progress WHERE user_id = ? AND cert = ?',
);
const upsertProgress = db.prepare(`
  INSERT INTO progress (user_id, cert, data, updated_at)
  VALUES (@userId, @cert, @data, @updatedAt)
  ON CONFLICT(user_id, cert) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
`);

function issueSession(res, user) {
  res.cookie('token', signToken(user), cookieOptions);
}

// ---- auth routes ----
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!USERNAME_RE.test(username || '')) {
    return res
      .status(400)
      .json({ error: 'Username must be 3–32 characters: letters, numbers, dot, dash, underscore.' });
  }
  if (!password || String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (findUserByName.get(username)) {
    return res.status(409).json({ error: 'That username is already taken.' });
  }
  const hash = await hashPassword(String(password));
  const info = insertUser.run(username, hash, Date.now());
  const user = { id: Number(info.lastInsertRowid), username };
  issueSession(res, user);
  res.json({ user });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  const row = findUserByName.get(username || '');
  // Always run a comparison to reduce username-enumeration timing differences.
  const ok = row ? await verifyPassword(String(password || ''), row.password_hash) : false;
  if (!row || !ok) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }
  const user = { id: row.id, username: row.username };
  issueSession(res, user);
  res.json({ user });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ ok: true });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: { id: req.user.id, username: req.user.username } });
});

// ---- progress routes ----
app.get('/api/progress/:cert', authMiddleware, (req, res) => {
  const { cert } = req.params;
  if (!VALID_CERTS.has(cert)) return res.status(400).json({ error: 'Unknown certification.' });
  const row = getProgress.get(req.user.id, cert);
  res.json({ data: row ? JSON.parse(row.data) : null, updatedAt: row?.updated_at ?? null });
});

app.put('/api/progress/:cert', authMiddleware, (req, res) => {
  const { cert } = req.params;
  if (!VALID_CERTS.has(cert)) return res.status(400).json({ error: 'Unknown certification.' });
  const data = JSON.stringify(req.body?.data ?? {});
  const updatedAt = Date.now();
  upsertProgress.run({ userId: req.user.id, cert, data, updatedAt });
  res.json({ ok: true, updatedAt });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '127.0.0.1';
app.listen(PORT, HOST, () => {
  console.log(`CertStudyHub API listening on http://${HOST}:${PORT}`);
});
