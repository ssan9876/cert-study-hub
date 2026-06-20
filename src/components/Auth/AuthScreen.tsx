// AuthScreen — the unauthenticated landing view. Toggles between Login and
// Register, both backed by the store's auth actions (which call the API and set
// the httpOnly session cookie). Shown by App whenever there is no logged-in user.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';

export function AuthScreen() {
  const login = useAppStore((s) => s.login);
  const register = useAppStore((s) => s.register);
  const authError = useAppStore((s) => s.authError);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (mode === 'register' && password !== confirm) {
      setLocalError('Passwords do not match.');
      return;
    }
    setBusy(true);
    if (mode === 'login') await login(username.trim(), password);
    else await register(username.trim(), password);
    setBusy(false);
  };

  const error = localError ?? authError;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-navy-950">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm"
      >
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-azure-500 text-xl font-bold text-white">
            CS
          </span>
          <div className="leading-tight">
            <p className="text-lg font-bold text-slate-900 dark:text-white">CertStudyHub</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Certification study platform</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-fluent dark:border-navy-700 dark:bg-navy-800">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-navy-900">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setLocalError(null);
                }}
                className={`rounded-md py-2 text-sm font-semibold capitalize transition-colors ${
                  mode === m
                    ? 'bg-white text-azure-600 shadow-sm dark:bg-navy-700 dark:text-azure-300'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Username
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-azure-500 dark:border-navy-600 dark:bg-navy-900 dark:text-white"
                placeholder="3–32 characters"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-azure-500 dark:border-navy-600 dark:bg-navy-900 dark:text-white"
                placeholder={mode === 'register' ? 'At least 8 characters' : ''}
              />
            </div>
            {mode === 'register' && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-azure-500 dark:border-navy-600 dark:bg-navy-900 dark:text-white"
                />
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || !username || !password}
              className="w-full rounded-lg bg-azure-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-azure-500 disabled:opacity-50"
            >
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
          Your progress syncs to your account and is available on any device.
        </p>
      </motion.div>
    </div>
  );
}
