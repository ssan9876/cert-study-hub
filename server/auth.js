// Authentication helpers: password hashing (bcryptjs — pure JS, no native build),
// JWT issuance/verification, and an Express middleware that authenticates a
// request from the httpOnly `token` cookie.

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

// The signing secret should be provided via the JWT_SECRET env var in
// production. If absent we generate a random ephemeral secret (which invalidates
// existing sessions on restart) and warn loudly.
const SECRET =
  process.env.JWT_SECRET ||
  (() => {
    console.warn('[auth] JWT_SECRET not set — using an ephemeral random secret. Set JWT_SECRET to persist sessions across restarts.');
    return crypto.randomBytes(48).toString('hex');
  })();

const TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export const hashPassword = (plain) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

export function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, SECRET, {
    expiresIn: TOKEN_TTL_SECONDS,
  });
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  // Set COOKIE_SECURE=true once the app is served over HTTPS so the session
  // cookie is only sent over TLS. Left false for plain-HTTP local development.
  secure: process.env.COOKIE_SECURE === 'true',
  maxAge: TOKEN_TTL_SECONDS * 1000,
  path: '/',
};

export function authMiddleware(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}
