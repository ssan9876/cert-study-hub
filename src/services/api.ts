// Thin client for the CertStudyHub backend API. All requests send the auth
// cookie (credentials: 'include'). Errors surface the server's message.

import type { CertId } from '../types/Cert';

export interface AuthUser {
  id: number;
  username: string;
}

/** The per-(user, cert) progress blob synced to the server. */
export interface ProgressBlob {
  history?: unknown[];
  flashProgress?: Record<string, unknown>;
  activeSession?: unknown;
  lastResult?: unknown;
}

const BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  register: (username: string, password: string) =>
    request<{ user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  login: (username: string, password: string) =>
    request<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),

  me: () => request<{ user: AuthUser }>('/auth/me'),

  getProgress: (cert: CertId) =>
    request<{ data: ProgressBlob | null; updatedAt: number | null }>(`/progress/${cert}`),

  putProgress: (cert: CertId, data: ProgressBlob) =>
    request<{ ok: true; updatedAt: number }>(`/progress/${cert}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    }),
};
